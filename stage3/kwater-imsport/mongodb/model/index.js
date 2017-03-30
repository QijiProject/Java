var mongoMgr = require('../../comp/mongoService');

// models
require('./player');
require('./player_gp');
require('./que_imsport');
require('./que_imsport_parlay');
require('./que_imsport_unsettled');

exports.Player = mongoMgr.getDB().model('player');
exports.PlayerGp = mongoMgr.getDB().model('player_gp');
exports.QueOfImSport = mongoMgr.getDB().model('que_imsport');
exports.QueOfImSportParlay = mongoMgr.getDB().model('que_imsport_parlay');
exports.QueOfImSportUnsettled = mongoMgr.getDB().model('que_imsport_unsettled');
