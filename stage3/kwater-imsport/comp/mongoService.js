var logger = require('../util/log4js').getLogger('wimsport');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Nedis = require('./nedis');
var config = require('../config/config');
var mongoose = require('mongoose');

function MongoServ() {
	EventEmitter.call(this);
	this.thriftServ = null;
	this.mongo = null;

	this.db = null;
	this.mproxy = null;
	this.dbReady = false;

	this.startChecked = false;

	this.inited = false;

	this.on('check', this.checkMongo.bind(this));
}
util.inherits(MongoServ, EventEmitter);

MongoServ.prototype.start = function(thriftServ) {
	//this.thriftServ = thriftServ;

	this.PtInit = require('../service/init');
  var data = {dbu: '', dbw: '', dbip: 'localhost', dbn: 'bae', dbport: '27017'};
  this.checkMongo(null, data, false);
	//this.pull();
};

MongoServ.prototype.pull = function() {
	this.thriftServ.emit('pulldata', config.mongokey, config.thriftKey.dbs, 2, this.inited);
};

MongoServ.prototype.refresh = function() {
	var self = this;
	setTimeout(function() {
		self.pull();
	}, 10000);
};

MongoServ.prototype.checkMongo = function(mKey, data, inited) {
	this.startChecked = false;
	if (data == null) {
		logger.error('[Mongo Service] get mongo config error');
		this.refresh();
		return;
	}

	this.mongo = data;

	if (!inited) {
		this.inited = true;
	} else {
	}
	this._createDb();
};

MongoServ.prototype._createDb = function() {
	this._close();

	var mongo = this.mongo, self = this;
	var opts = { server: { auto_reconnect: false }, user: mongo.dbu, pass: mongo.dbw };
	this.db = mongoose.createConnection(mongo.dbip, mongo.dbn, parseInt(mongo.dbport, 10), opts);
	this.db.on('connected', function() {
		logger.info('[Mongo Service] mongo connected');
		self.dbReady = true;
		if (!self.mproxy) {
			self.mproxy = require('../mongodb/proxy/index');
			self.PtInit.start();
		}
	});
	this.db.on('disconnected', function() {
		self.dbReady = false;
		logger.warn('[Mongo Service] mongo disconnected');
		self._checkCreate();
	});
	this.db.on('error', function(ex) {
		self.dbReady = false;
		logger.error('[Mongo Service] init mongodb connection err', ex);
		self._checkCreate();
	});
};

MongoServ.prototype._checkCreate = function() {
	if (!this.startChecked) {
		this.startChecked = true;
		this.refresh();
	}
};

MongoServ.prototype.poll = function() {
	if (!this.inited || this.dbReady) return;
	var self = this;
	process.nextTick(function() {
		self._checkCreate();
	});
};

MongoServ.prototype._close = function() {
	try {
		if (this.db != null) {
			this.db.close();
		}
	} catch (e) {
		logger.error('[Mongo Service] close mongodb error', e)
	}
};

MongoServ.prototype.getDB = function() {
	return this.db;
};

MongoServ.prototype.getProxy = function() {
	if (!this.dbReady) return false;
	return this.mproxy;
};

MongoServ.prototype.destroy = function() {
	this._close();
	this.mongo = null;
	this.PtInit.destroy();
};

module.exports = new MongoServ;
