var mongoMgr = require('../../comp/mongoService');

// models
require('./player');
require('./player_gp');
require('./player_changeagent');

exports.Player = mongoMgr.getDB().model('player');

exports.PlayerGp = mongoMgr.getDB().model('player_gp');

exports.PlayerChangeAgent = mongoMgr.getDB().model('player_changeagent');
