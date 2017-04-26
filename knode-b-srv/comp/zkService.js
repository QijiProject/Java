var logger = require('../util/log4js').getLogger('knbs');
var zookeeper = require('node-zookeeper-client');
var Ap = require('./app');
var GpService = require('./gpService');
var DbService = require('./dbService');
var config = require('../config/config');

function ZooKeeperService() {
	this.zkClient = null;
	this.connected = false;
	this._destroy = false;
	this._inreconnecting = false;

	this.gpinit = false;
}

ZooKeeperService.prototype.start = function() {
	this._createClient();
};

ZooKeeperService.prototype._createClient = function() {
	var self = this;
	if (this.zkClient) this.zkClient.close();
	this.zkClient = zookeeper.createClient(Ap.getZkString());

	this.zkClient.once('connected', function () {
		self.connected = true;
	    logger.info('[ZooKeeper Service] Connected to ZooKeeper.');
	    if (!self.gpinit) {
	    	self.gpinit = true;
	    	self._getGpChange();
	    	self._getDbsChange();
	    }
	});

	this.zkClient.on('state', function (state) {
		var sname = state.getName();
		if (sname == 'SYNC_CONNECTED') {
			self.connected = true;
		} else if (sname == 'DISCONNECTED') {
			self.connected = false;
		} else if (sname == 'EXPIRED') {
			self.connected = false;
			setTimeout(function() {
				if (!self.connected) self.reConnection();
			}, 30000);
		}
		logger.info('[ZooKeeper Service] Client state is changed to ' + state);
	});
	this.zkClient.connect();
	this._inreconnecting = false;
};

ZooKeeperService.prototype.reConnection = function() {
	if (this._inreconnecting) return;
	this._inreconnecting = true;
	if (this._destroy) return;
	this._createClient();
};

ZooKeeperService.prototype.destroy = function() {
	this._destroy = true;
	this.connected = false;
	this.zkClient.close();
};

// get gp change
ZooKeeperService.prototype._getGpChange = function() {
	var self = this, pth = config.zkOfGpChange;
	this.zkClient.getData(
	    pth,
	    function (event) {
	        self._getGpChange();
	    },
	    function (error, data, stat) {
	        if (error) {
	            logger.error('[ZooKeeper Service] get gp path data %s', String(error));
	            return;
	        }
	        if (data != null) {
	        	GpService.checkChange(data.toString('utf8'));
	        }
	    }
	);
};

// get db change
ZooKeeperService.prototype._getDbsChange = function() {
	var self = this, pth = config.zkOfDbChange;
	this.zkClient.getData(
	    pth,
	    function (event) {
	        self._getDbsChange();
	    },
	    function (error, data, stat) {
	        if (error) {
	            logger.error('[ZooKeeper Service] get dbs path data %s', String(error));
	            return;
	        }
	        if (data != null) {
	        	DbService.checkChange(data.toString('utf8'));
	        }
	    }
	);
};

var _zookeeper = new ZooKeeperService();

process.on('exit', function() {
	_zookeeper.destroy();
});

module.exports = _zookeeper;
