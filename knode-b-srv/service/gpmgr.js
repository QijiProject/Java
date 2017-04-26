var logger = require('../util/log4js').getLogger('knbs');

function GpMgr() {

}

GpMgr.prototype.isGPAlive = function(gp) {
	if (gp == null || gp.status != 88) {
		return false;
	}
	return true;
};

module.exports = new GpMgr();
