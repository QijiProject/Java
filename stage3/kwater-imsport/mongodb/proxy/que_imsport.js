var models = require('../model/index'),
    queOfImSport = models.QueOfImSport;

exports.update = function(bet, user, sqltext, _stat, dt, callback) {
	var data = {
		wagerno: bet.betId,
		acpid: user.acpid,
		playerid: user.playerid.indexOf('PLAYERID') != -1 ? '' : user.playerid,
		playername: user.playername,
		sqltext: sqltext,
		created: dt,
		stat: _stat,
		takew: 0
	};
	if (_stat == 1) {
		queOfImSport.findOneAndUpdate({'wagerno': data.wagerno}, 
		data, {upsert: true}, callback);
		return;
	}
	queOfImSport.findOne({'wagerno': data.wagerno, stat: 1}, function(err, doc) {
		if (err) {
			callback(err, null);
		} else if (!doc) { // insert or update
			queOfImSport.findOneAndUpdate({'wagerno': data.wagerno}, 
				data, {upsert: true}, callback);
		} else {
			callback(null, true);
		}
	});
	
};