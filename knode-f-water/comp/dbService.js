var logger = require('../util/log4js').getLogger('kfwater');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var mysql = require('mysql');
var config = require('../config/config');
var AcpService = require('./acpService');
var FIRST_TIMEOUT = 5000, REFRESH_TIMEOUT = 120000;

function DbServ() {
	EventEmitter.call(this);
	this.thriftServ = null;
	this.mcdb = null;

	this.dbmap = {};

	this.lastup = 0;

	this.inited = false;

	this.timeHandle = null;

	this.on('check', this.checkDbs.bind(this));
}
util.inherits(DbServ, EventEmitter);

DbServ.prototype.start = function(thriftServ) {
	this.thriftServ = thriftServ;
	
	this.pull();
};

DbServ.prototype.pull = function() {
	this.thriftServ.emit('pulldata', this.lastup, config.thriftKey.dbs, 1, -1, 0, '', this.inited);
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
			if (db.status == 2 && this.dbmap[db.id]) { // abort
				this._removeDbs(db);
			} else {
				if (AcpService.acpExists(db.acpid) || this.inited) {
					dc++;
					var pline = db.pline + '|', oip;
					if (pline.indexOf(config.pline) == -1) { // out
						oip = db.dboip;
						if (oip && oip.length > 0) {
							db.dbip = db.dboip;
						}
					}
					this.dbmap[db.id] = db;
				}
			}

			if (db.acpid == config.mcdbkey) this.mcdb = db;
			if (this.inited) logger.info('[DB Service] update db ' + db.id);
			if (this.lastup < db.updated) this.lastup = db.updated;
		}
	}

	if (!inited) {
		this.inited = true;
		logger.info('[DB Service] start db service ok, attach=' + dc);
		require('./domainService').start(this.thriftServ);
	}

	this.refresh();
};

DbServ.prototype.refresh = function() {
	if (this.timeHandle) clearTimeout(this.timeHandle);
	var self = this;
	this.timeHandle = setTimeout(function() {
		self.pull();
	}, this.inited ? REFRESH_TIMEOUT : FIRST_TIMEOUT);
};

DbServ.prototype.removeDbs = function(acpid) {
	if (!this.inited) return;
	var wdb = this.getDbMaster(acpid);
	if (wdb) this._removeDbs(wdb);
	wdb = this.getDbWater(acpid);
	if (wdb) this._removeDbs(wdb);
};

DbServ.prototype._removeDbs = function(db) {
	this.dbmap[db.id] = undefined;
	delete this.dbmap[db.id];
};

DbServ.prototype.poll = function() {
	if (!this.inited) return;
	var self = this;
	process.nextTick(function() {
		self.refresh();
	});
};

DbServ.prototype.getDbWater = function(acpid) {
	if (acpid == config.mcdbkey) return this.mcdb;
	return this.dbmap['1000_' + acpid + '_1_1000_00_2'];
};

DbServ.prototype.getConnection = function(acpid, callback) {
	var dbcfg = this.getDbWater(acpid), strErr = '';
	if (!dbcfg) {
		strErr = 'lost db config of ' + acpid;
		logger.error(strErr);
		callback(new Error(strErr), null);
		return;
	}
	var connection = mysql.createConnection({
		host: dbcfg.dbip,
		port: parseInt(dbcfg.dbport, 10),
	  	user: dbcfg.dbu,
	  	password: dbcfg.dbw,
	  	database: dbcfg.dbn,
	  	supportBigNumbers: true,
        bigNumberStrings: true
	});
	callback(null, connection);
};

DbServ.prototype.getDbMaster = function(acpid) {
	if (acpid == config.mcdbkey) return this.mcdb;
	return this.dbmap['1000_' + acpid + '_1_1000_00_1'];
};

DbServ.prototype.execSql = function(acpid, sql, callback) {
	var dbcfg = this.getDbMaster(acpid), strErr = '';
	if (!dbcfg) {
		strErr = 'lost db config of ' + acpid;
		logger.error(strErr);
		callback(new Error(strErr), null);
		return;
	}
	var connection = mysql.createConnection({
		host: dbcfg.dbip,
		port: parseInt(dbcfg.dbport, 10),
	  	user: dbcfg.dbu,
	  	password: dbcfg.dbw,
	  	database: dbcfg.dbn,
	  	supportBigNumbers: true,
        bigNumberStrings: true
	});
	connection.query(sql, function(err, rows) {
		connection.end(function(errc) {
			if (errc) logger.error('close db connection error %s', String(errc));
		});
		if (err) {
			strErr = 'exec ' + acpid + ' sql fail, SQL: ' + sql;
			logger.error(strErr);
		}
		callback(strErr.length > 0 ? new Error(strErr) : null, rows);
	})
};

DbServ.prototype.destroy = function() {
};

module.exports = new DbServ;
