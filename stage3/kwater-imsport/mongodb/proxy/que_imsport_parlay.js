var models = require('../model/index'),
    queOfImSportParlay = models.QueOfImSportParlay;

exports.update = function(bet, sqltext, dt, callback) {
	var _stat = bet.detail.ParlayBetCancelled, data = {
		pid: bet.betId + '-' + bet.detail.MatchId,
		acpid: bet.acpid,
		sqltext: sqltext,
		created: dt,
		stat: _stat,
		takew: 0
	};
	if (_stat == 1) {
		queOfImSportParlay.findOneAndUpdate({'pid': data.pid}, 
		data, {upsert: true}, callback);
		return;
	}
	queOfImSportParlay.findOne({'pid': data.pid, stat: 1}, function(err, doc) {
		if (err) {
			callback(err, null);
		} else if (!doc) { // insert or update
			queOfImSportParlay.findOneAndUpdate({'pid': data.pid}, 
				data, {upsert: true}, callback);
		} else {
			callback(null, true);
		}
	});
	
};