var logger = require('../util/log4js').getLogger('knbs');
var GpService = require('../comp/gpService');
var GpMgr = require('./gpmgr');
var PlayerMgr = require('./playerService');
var gpObj = {};

exports.getPlayerGps = function(o, callback) {
	PlayerMgr.getPlayerGp(o.acpid, o.playername, callback);
};

exports.getGpUserInfo = function(o, cb, type) {
	if (o.gpid.charAt(0) == 'o') {
		o.gpid = o.gpid.substr(1);
		o._bbinold = 1;
	}
	var gp = GpService.getGP(o.gpid), fname = gp.classN;
	if (!GpMgr.isGPAlive(gp)) {
		cb(1407, null);
		return;
	}
	if (!gpObj[fname]) {
		gpObj[fname] = require('../gp/' + fname);
		gpObj[fname].start(gp);
	}

	if (type == 2) {
		gpObj[fname].checkTransfer(o, cb);
	} else if (type == 3) {
		gpObj[fname].getUnsettled(o, cb);
	}
};
