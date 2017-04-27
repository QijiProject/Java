var PlayerMgr = require('./playerGpService');
var async = require('async');
var DbMgr = require('../comp/dbService');
var gpObj = {};

function genGpWater(gp) {
	if (!gpObj[gp.gpid]) {
		gpObj[gp.gpid] = require('../water/' + gp.gpid);
	}
}

function getGPWaterFn(conn, gpid, gpname, o) {
	return function(callback) {
		o._gpname = gpname;
		gpObj[gpid].getWater(conn, callback, o, []);
	};
}

exports.playerWater = function(o, cb) {
	PlayerMgr.getPlayerGps(o.acpid, o.uid, function(err, rs) {
		if (err) {
			cb(err, []);
		} else if (rs == null) {
			cb(null, {});
		} else {
			var arr = [];
			for (var gpid in rs) {
				arr.push(gpid);
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

function getPlayerWater(o, gps, cb) {
	DbMgr.getConnection(o.acpid, function(err, connection) {
		if (err) {
			cb(new Error('query db fail'), []);
		} else {
			var gpd, arr = [];
			for (var i = 0, len = gps.length; i < len; ++i) {
				gpd = gps[i];
				genGpWater(gpd);
				arr.push(getGPWaterFn(connection, gpd.gpid, gpd.gpname, o));
			}
			async.auto(arr, function(err, results) {
				try {
					connection.end(function(errc) {
						if (errc) connection.end();
					});
				} catch (e) {

				}
				cb(err, results);
			});
		}
	});
};
