var PlayerMgr = require('./playerService');
var async = require('async');
var gpObj = {};

function genGpWater(gp) {
	if (!gpObj[gp.gpid]) {
		gpObj[gp.gpid] = require('../water/' + gp.gpid);
	}
}

function getGPWaterFn(gpid, gpname, o) {
	return function(callback) {
		o._gpname = gpname;
		gpObj[gpid].getWater(callback, o, []);
	};
}

function getGPAgentWaterFn(gpid, o) {

}

function getPlayerWater(o, gps, cb) {
	var gpd, arr = [];
	for (var i = 0, len = gps.length; i < len; ++i) {
		gpd = gps[i];
		genGpWater(gpd);
		arr.push(getGPWaterFn(gpd.gpid, gpd.gpname, o));
	}
	async.auto(arr, function(err, results) {
		cb(err, results);
	});
}

exports.playerWater = function(o, cb) {
	PlayerMgr.getPlayerGpById(o.acpid, o.uid, function(err, data) {
		if (err) {
			cb(err, []);
		} else if (data.length == 0) {
			cb(null, {});
		} else {
			var gpd, arr = [];
			for (var i = 0, len = data.length; i < len; ++i) {
				gpd = data[i];
				arr.push(gpd.gpid);
			}
			PlayerMgr.getGpHall(o.acpid, arr.join(','), function(ex, gps) {
				if (ex) {
					cb(ex, []);
				} else if (gps.length === 0) {
					cb(null, {});
				} else {
					getPlayerWater(o, gps, cb);
				}
			});
		}
	});
};

exports.agentWater = function(o, cb) {
	cb(new Error('unknown'), {});
};
