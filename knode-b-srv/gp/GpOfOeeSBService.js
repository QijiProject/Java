var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');
var aes = require('../util/aes');
var request = require('request');
var xml2js = require('xml2js');
var myUtil = require('../util/util');
var config = require('../config/config');
var gr = require('../util/gr');

function OeeBetSB() {
	EventEmitter.call(this);
	this.jkey = 'oee_sb';
	this.on('emitData', this._doData.bind(this));
	this.xmlparser = new xml2js.Parser({
		ignoreAttrs: true,
		explicitRoot: false,
		explicitArray: false,
		mergeAttrs: true
	});
}
util.inherits(OeeBetSB, EventEmitter);

OeeBetSB.prototype.start = function(gp) {
	this.gp = gp;
	var cfg = this.gp.cfg;
	this.aesKey = aes.kvlen(cfg.key, 16);
	this.mid = cfg.mid;
};

OeeBetSB.prototype._doData = function(err, response, body, actype, obj, callback) {
	if (response && response.statusCode === 200) {
		var self = this, data = aes.decode(this.aesKey, this.aesKey, body);
		this.xmlparser.parseString(data, function (err, result) {
	        if (result && (result.ReturnCode === '000' || result.ReturnCode === '003')) {
	        	self[actype](result, obj, callback);
	        } else {
	        	callback(1413, null);
	        }
	    });
	} else {
		callback(1413, null);
	}
};

OeeBetSB.prototype.getUnsettled = function(o, callback) {
	var acpid = o.acinfo.acpid;
	var self = this, prefix = acpid == 'ibo' ? '' : (acpid + '_');
	var gpCfg = this.gp.cfg;
	var str = '<?xml version="1.0" encoding="utf-8"?><Request Method="GetOpenBet"></Request>';
    var ivStr = myUtil.getRandomString(16);
    o.uname = prefix + o.player.playername;

    request({
		method: 'POST',
		url: gpCfg.getOpenBetSummary,
		body: aes.encode(this.aesKey, this.aesKey, str),
		proxy: config.proxy,
		headers: {
			'Charset': 'UTF-8',
			'mid': ivStr + aes.encode(this.aesKey, ivStr, this.mid)
		}
	}, function(error, response, body) {
		self.emit('emitData', error, response, body, '_unsettled', o, callback);
	});
};

OeeBetSB.prototype._unsettled = function(data, obj, callback) {
	var unsettled = '0.00', openbets;
	if (data.OpenBets && (openbets=data.OpenBets.OpenBet)) {
		if (gr.isPlainObject(openbets)) {
			openbets = [openbets];
		}
		var item;
		for (var i = 0, len = openbets.length; i < len; ++i) {
			item = openbets[i];
			if (item.MemberCode === obj.uname) {
				unsettled = item.TotalStake;
				break;
			}
		}
	}
	callback(0, {gpid: this.gp.gpid, val: unsettled});
};

OeeBetSB.prototype.checkTransfer = function(o, callback) {
	var gpCfg = this.gp.cfg;
    var str = '<?xml version="1.0" encoding="utf-8"?><Request Method="GetTransferStatus"><ReferenceNo>';
    str += o.dno + '</ReferenceNo></Request>';
    var ivStr = myUtil.getRandomString(16), self = this;

    request({
		method: 'POST',
		url: gpCfg.getTransferStatus,
		body: aes.encode(this.aesKey, this.aesKey, str),
		proxy: config.proxy,
		headers: {
			'Charset': 'UTF-8',
			'mid': ivStr + aes.encode(this.aesKey, ivStr, this.mid)
		}
	}, function(error, response, body) {
		if (response && response.statusCode === 200) {
			var data = aes.decode(self.aesKey, self.aesKey, body);
			self.xmlparser.parseString(data, function (err, result) {
				if (result) {
					var code, status = 2;
					if (result.ReturnCode === '000' && result.ReferenceNo == o.dno && result.TransactionID) {
						code = 0;
						status = 0;
					} else if (result.ReturnCode === '006') {
						code = 2;
						status = -1;
					} else {
						code = 1;
					}
					logger.info('[CheckTransfer] Oeesb dno=' + o.dno + ', c=' + code + ', s=' + status);
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

module.exports = new OeeBetSB();
