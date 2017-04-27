var logger = require('../util/log4js').getLogger('knmo');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var mysql = require('mysql');
var config = require('../config/config');
var AcpService = require('./acpService');
var FIRST_TIMEOUT = 5000, REFRESH_TIMEOUT = 15000;

function DbServ() {
	EventEmitter.call(this);
	this.thriftServ = null;
	this.mcdb = null;

	this.dbmap = {};
	this.pools = {};

	this.lastup = 0;

	this.zkchange = 0;

	this.inited = false;

	this.timeHandle = null;

	this.on('check', this.checkDbs.bind(this));
}
util.inherits(DbServ, EventEmitter);

DbServ.prototype.start = function(thriftServ) {
	this.thriftServ = thriftServ;
	
	this.pull(false);
};

DbServ.prototype.pull = function(im) {
	this.thriftServ.emit('pulldata', this.lastup, config.thriftKey.dbs, 1, -1, (im?1:0), '', this.inited);
};

DbServ.prototype.checkChange = function(newt) {
	var t = parseInt(newt, 10), self = this;
	if (isNaN(t) || this.zkchange >= t) return;
	if (this.zkchange == 0) {
		this.zkchange = t;
		return;
	}
	this.zkchange = t;
	setTimeout(function() {
		self.pull(true);
	}, 5000);
};

DbServ.prototype.checkDbs = function(data, inited) {
	if (data == null) {
		logger.error('[DB Service] get db config error');
		this.refresh();
		return;
	}
	var db, exd, dc = 0;
	for (var i = 0, len = data.length; i < len; ++i) {
		db = data[i];
		exd = this.dbmap[db.id];
		if (!exd || exd.updated < db.updated) {
			if (db.acpid == config.mcdbkey) this.mcdb = db;
			if (db.status == 2 && this.dbmap[db.id]) { // abort
				this.removeDbs(db);
			} else {
				if (AcpService.acpExists(db.acpid) || this.inited) {
					dc++;
					this.updateDbs(db, exd);
				}
			}
			if (this.inited) logger.info('[DB Service] update db ' + db.id);
			if (this.lastup < db.updated) this.lastup = db.updated;
		}
	}

	if (!inited) {
		this.inited = true;
		logger.info('[DB Service] start db service ok, attach=' + dc);
		require('../service/init').start();
	}

	this.refresh();
};

DbServ.prototype.dbOk = function() {
	return this.inited;
};

DbServ.prototype.ckDbChange = function(db, exd) {
	if (db.dbip != exd.dbip || db.dbport != exd.dbport || db.dbu != exd.dbu
		|| db.dbw != exd.dbw || db.dbn != exd.dbn) return true;
	return false;
};

DbServ.prototype.updateDbs = function(db, exd) {
	var self = this, pline = db.pline + '|', oip;
	if (pline.indexOf(config.pline) == -1) { // out
		oip = db.dboip;
		if (oip && oip.length > 0) {
			db.dbip = db.dboip;
		}
	}
	this.dbmap[db.id] = db;
	if (!exd || this.ckDbChange(db, exd)) {
		this.createPool(db);
	}
};

DbServ.prototype.removeDbs = function(db) {
	try {
		if (this.dbmap[db.id]) {
			this.dbmap[db.id] = undefined;
			delete this.dbmap[db.id];
		}
		this.endPool(db, null);
	} catch (e) {
		logger.error('[DB Service] remove db error %s', String(e));
	}
};

DbServ.prototype.createPool = function(db) {
	var self = this;
	this.endPool(db, function(dbcfg) {
		self.pools[dbcfg.id] = mysql.createPool({
			host: dbcfg.dbip,
			port: parseInt(dbcfg.dbport, 10),
		  	user: dbcfg.dbu,
		  	password: dbcfg.dbw,
		  	database: dbcfg.dbn,
		  	connectTimeout: parseInt(dbcfg.maxwait, 10),
		  	waitForConnections: false,
		  	supportBigNumbers: true,
	        bigNumberStrings: true
	    });
	});
};

DbServ.prototype.endPool = function(db, cb) {
	try {
		var self = this;
		if (this.pools[db.id]) {
			this.pools[db.id].end(function (err) {
				delete self.pools[db.id];
				if (cb) cb(db);
			});
		} else {
			if (cb) cb(db);
		}
	} catch (e) {
		logger.error('[DB Service] remove db pool error %s', String(e));
	}
};

DbServ.prototype.refresh = function() {
	if (this.timeHandle) clearTimeout(this.timeHandle);
	var self = this;
	this.timeHandle = setTimeout(function() {
		self.pull(false);
	}, this.inited ? REFRESH_TIMEOUT : FIRST_TIMEOUT);
};

DbServ.prototype.poll = function() {
	if (!this.inited) return;
	var self = this;
	process.nextTick(function() {
		self.refresh();
	});
};

DbServ.prototype.getDbMaster = function(acpid) {
	if (acpid == config.mcdbkey) return this.mcdb;
	return this.dbmap['1000_' + acpid + '_1_1000_00_1'];
};

DbServ.prototype.getDbWater = function(acpid) {
	return this.dbmap['1000_' + acpid + '_1_1000_00_2'];
};

DbServ.prototype.getConnection = function(acpid, tp, callback) {
	var dbcfg = (tp == 1 ? this.getDbMaster(acpid) : this.getDbWater(acpid)), strErr = '';
	if (!dbcfg) {
		strErr = 'lost db config of ' + acpid;
		logger.error(strErr);
		callback(new Error(strErr), 0, null);
		return;
	}
	if (this.pools[dbcfg.id]) {
		this.pools[dbcfg.id].getConnection(function(err, connection) {
			callback(err, 1, connection);
		});
	} else {
		var connection = mysql.createConnection({
			host: dbcfg.dbip,
			port: parseInt(dbcfg.dbport, 10),
		  	user: dbcfg.dbu,
		  	password: dbcfg.dbw,
		  	database: dbcfg.dbn,
		  	supportBigNumbers: true,
	        bigNumberStrings: true
		});
		connection.connect(function(err) {
			if (err) {
				callback(err, 2, null);
			} else {
				callback(null, 2, connection);
			}
		});
	}
};

DbServ.prototype.closeConn = function(ctype, connection) {
	if (!connection) return;
	try {
		if (ctype == 1) {
			connection.release();
		} else {
			connection.end(function(errc) {
				if (errc) logger.error('close db connection error %s', String(errc));
			});
		}
	} catch (e) {
		logger.error('close db connection error %s', String(e));
	}
};

DbServ.prototype.execSql = function(acpid, sql, callback) {
	var self = this;
	this.getConnection(acpid, function(e, ctype, connection) {
		var strErr = '';
		if (e) {
			strErr = 'get db connection error ' + acpid + ', ' + String(e);
			callback(strErr, null);
		} else {
			connection.query(sql, function(err, rows) {
				self.closeConn(ctype, connection);
				if (err) {
					strErr = 'exec ' + acpid + ' sql fail, SQL: ' + sql;
				}
				callback(strErr.length > 0 ? strErr : null, rows);
			});
		}
	});
};

DbServ.prototype.destroy = function() {
	try {
		for (var key in this.pools) {
			if (this.dbmap[key]) this.endPool(this.dbmap[key], null);
		}
	} catch (e) {

	}
};

module.exports = new DbServ;
