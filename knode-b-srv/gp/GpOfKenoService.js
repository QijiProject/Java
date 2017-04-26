var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');
var request = require('request');
var xml2js = require('xml2js');
var config = require('../config/config');

function Keno() {
	EventEmitter.call(this);
	this.jkey = 'cp_keno';
	this.on('emitData', this._doData.bind(this));
	this.xmlparser = new xml2js.Parser({
		ignoreAttrs: true,
		explicitRoot: false,
		explicitArray: false,
		mergeAttrs: true
	});
}
util.inherits(Keno, EventEmitter);

Keno.prototype.start = function(gp) {
	this.gp = gp;
};

Keno.prototype._doData = function(err, response, body, actype, obj, callback) {
	if (response && response.statusCode === 200) {
		var self = this;
		this.xmlparser.parseString(body, function (err, result) {
	        if (result && (result.status_code === '00' || result.status_code === '60.01')) {
	        	self[actype](result, obj, callback);
	        } else {
	        	callback(1413, null);
	        }
	    });
	} else {
		callback(1413, null);
	}
};

Keno.prototype.getUnsettled = function(o, callback) {
	var acpid = o.acinfo.acpid;
	var self = this, prefix = acpid == 'ibo' ? '' : (acpid + '_');
	var gpCfg = this.gp.cfg;
	var str = 'secret_key=' + gpCfg.secretKey + '&operator_id='+gpCfg.operatorNo+'&site_code=' + gpCfg.siteCode;
	str += '&product_code='+gpCfg.productCode+'&member_id=' + (prefix+o.player.playername);

    request({
		method: 'POST',
		url: gpCfg.getUnsettledStake + '?' + str,
		proxy: config.proxy,
		headers: {
			'Charset': 'UTF-8'
		}
	}, function(error, response, body) {
		self.emit('emitData', error, response, body, '_unsettled', o, callback);
	});
};

Keno.prototype._unsettled = function(data, obj, callback) {
	callback(0, {gpid: this.gp.gpid, val: data.bet_fund||'0.00'});
};

Keno.prototype.checkTransfer = function(o, callback) {
	var acpid = o.acinfo.acpid;
	var self = this, prefix = acpid == 'ibo' ? '' : (acpid + '_');
	var gpCfg = this.gp.cfg;
    var str = 'secret_key=' + gpCfg.secretKey + '&operator_id='+gpCfg.operatorNo+'&site_code=' + gpCfg.siteCode;
	str += '&product_code='+gpCfg.productCode+'&member_id=' + (prefix+o.player.playername) + '&reference_id=' + o.dno;

    request({
		method: 'POST',
		url: gpCfg.getTransferStatus + '?' + str,
		proxy: config.proxy,
		headers: {
			'Charset': 'UTF-8'
		}
	}, function(error, response, body) {
		if (response && response.statusCode === 200) {
			self.xmlparser.parseString(body, function (err, result) {
		        if (result) {
		        	var code, status = 2;
		        	if (result.status_code === '00') {
		        		code = 0;
		        		if (result.reference_id == o.dno && result.transfer_status == 'success') {
		        			status = 0;
		        		} else if (result.transfer_status == 'failed') {
		        			status = 1;
		        		}
		        	} else if (result.status_code === '60.02') {
		        		code = 2;
		        	} else if (result.status_code === '60.01') {
		        		code = 4;
		        	} else {
		        		code = 1;
		        	}
		        	logger.info('[CheckTransfer] Keno dno=' + o.dno + ', c=' + code + ', s=' + status);
		        	callback(0, {c: code, s: status});
		        } else {
		        	callback(1414, 2);
		        }
		    });
		} else {
			callback(1414, 3);
		}
	});
};

module.exports = new Keno();
