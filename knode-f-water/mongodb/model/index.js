var mongoMgr = require('../../comp/mongoService');

// models
require('./player_gp');

exports.PlayerGp = mongoMgr.getDB().model('player_gp');