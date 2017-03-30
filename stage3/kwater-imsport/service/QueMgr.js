var logger = require('../util/log4js').getLogger('wimsport');
var MongoMgr = require('../comp/mongoService');

function QueMgr() {

}

QueMgr.prototype.findAndUpdateSettled = function(bet, user, sqltext, stat, dt, callback) {
	if (!MongoMgr.getProxy()) {
		callback(true, null);
		return;
	}
	MongoMgr.getProxy().QueOfImSportProxy.update(bet, user, sqltext, stat, dt, function(err, doc) {
		if (err) {
			callback(true, null);
		} else {
			callback(null, doc);
		}
	});
};

QueMgr.prototype.findAndUpdateParlay = function(bet, sqltext, dt, callback) {
	if (!MongoMgr.getProxy()) {
		callback(true, null);
		return;
	}
	MongoMgr.getProxy().QueOfImSportParlayProxy.update(bet, sqltext, dt, function(err, doc) {
		if (err) {
			callback(true, null);
		} else {
			callback(null, doc);
		}
	});
};

QueMgr.prototype.getUnsettled = function(callback) {
	if (!MongoMgr.getProxy()) {
		callback(true, null);
		return;
	}
	MongoMgr.getProxy().QueOfImSportUnsettledProxy.getAll(function(err, docs) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, docs);
		}
	});
};

QueMgr.prototype.updateUnsettled = function(wagerno, acpid, playername, sportname, bettime, callback) {
	if (!MongoMgr.getProxy()) {
		callback(true, null);
		return;
	}
	MongoMgr.getProxy().QueOfImSportUnsettledProxy.update(wagerno, acpid, playername, sportname, bettime, function(err, doc) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, doc);
		}
	});
};

QueMgr.prototype.delUnsettled = function(wagerno, callback) {
	if (!MongoMgr.getProxy()) {
		callback(true, null);
		return;
	}
	MongoMgr.getProxy().QueOfImSportUnsettledProxy.del(wagerno, function(err, doc) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, doc);
		}
	});
};

module.exports = new QueMgr();
