var redis = require("redis");

function Nedis(redisCfg, seed, callback) {
	this._ready = false;
	this._client = null;
	this._cfg = redisCfg;
	this._seed = seed;
	this.errc = 0;
	this.callback = callback;
	this.isOncreate = true;
	this._gen();
}

Nedis.prototype._gen = function() {
	var self = this;
	this.errc = 0;
	if (this._cfg.dbcporp) {
		try {
			this._cfg.dbcporp = JSON.parse(this._cfg.dbcporp);
		} catch (e) {
			this._cfg.dbcporp = {};
		}
	}
	this._client = redis.createClient(parseInt(this._cfg.dbport, 10), 
		this._cfg.dbip, this._cfg.dbcporp);

	this._client.on('ready', function(err) {
		self.errc = 0;
		self._ready = true;
		if (self.callback) 
			self.callback('connected', self._client, self._seed, self.errc, self.isOncreate);
		self.isOncreate = false;
	});

	this._client.on('error', function(err) {
		self._ready = false;
		self.errc++;
		if (self.callback) self.callback('error', self._client, self._seed, self.errc, self.isOncreate);
		self.isOncreate = false;
	});
};

Nedis.prototype.check = function(newConfig) {
	if (!newConfig) return;
	if (newConfig.dbip != this._cfg.dbip || newConfig.dbport != this._cfg.dbport) {
		this._cfg = newConfig;
		this.destroy();
		this.isOncreate = true;
		this._gen();
	}
};

Nedis.prototype.isReady = function() {
	return this._ready;
};

Nedis.prototype.getConn = function() {
	return this._client;
};

Nedis.prototype.destroy = function() {
	this._ready = false;
	this._client && this._client.end();
};

module.exports = Nedis;
