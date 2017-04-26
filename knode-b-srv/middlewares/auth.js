var logger = require('../util/log4js').getLogger('knbs');
var RedisMgr = require('../comp/redisService');
var DomainMgr = require('../comp/domainService');
var config = require('../config/config');
var moment = require('moment');
var util = require('../util/util');
var Mpackage = require('../comp/mpackage');
var flagKey = config.redis_rbKey + ':normal';
var CSOTOKEN_KEY = 'csotoken';
var request = require('request');
var SESSION_TIMEOUT = 1800, REGEX_TOKEN = /_/g, REGEX_ADMINNAME = /^[0-9a-z]{4,12}$/, THREEMIN = 180;

function interceptor(req, res, next) {
	var domain = util.getDomain(req), ip = util.getClientIp(req),
		acpid = DomainMgr.getAcpid(domain);

	if (!domain || !ip || !acpid) {
		logger.error('auth interceptor domain=%s, ip=%s, acpid=%s', domain, ip, acpid);
		return res.send({c: 403, code: 403, data: null});
	}
	req._mpkg_ = new Mpackage();
	req._mpkg_.setReqInfo(acpid, domain, ip);
	next();
}

var CHECKLOGINED_STR = '/kzb/logined?__s=';
function ckLoginedRemote(_pline, req, res, next) {
	var url = req.protocol + '://' + req.hostname + CHECKLOGINED_STR,
		_auth = _pline + config.pline + moment().unix();
	_auth = util.authcode(_auth, 'ENCODE', config.CS_SFKEY_AUTH);
	_auth = _auth.replace(/\+/g, '_');

	request({
		method: 'POST',
		url: url + _auth,
		headers: {cookie: (req.headers !=null ? req.headers.cookie : null )}
	}, function(error, response, body) {
		var str = '-1';
		if (response && response.statusCode === 200) {
			var data = JSON.parse(body);
			if (data.code == 0) {
				try {
					var hash = data.data, tmpp, nowt;
					hash = hash.replace(/\_/g, '+');
					hash = util.authcode(hash, 'DECODE', config.CS_SFKEY_AUTH);
					hash = hash.split('|');
					if (hash.length != 6) {
						return res.send({c: 999, code: 999, data: 0});
					} else {
						tmpp = '|' + hash[1] + '|';
						if (tmpp != config.pline) {
							return res.send({c: 999, code: 999, data: -2});
						}
						nowt = parseInt(hash[3], 10);
						if (moment().unix() - nowt >= THREEMIN) {
							return res.send({c: 999, code: 999, data: -3});
						}
						var player = JSON.parse(hash[4]), admin = JSON.parse(hash[5]);
						req._mpkg_.setPlayerIdG(player.playerid, player.playername, player.gpn);
						req._mpkg_.setAdmin(admin.adminid, admin.adminname);
						next();
					}
				} catch (e) {
					logger.error('check cs remote logined error url=' + url);
					return res.send({c: 999, code: 999, data: -1});
				}
			} else {
				return res.send({c: data.code, code: data.code, data: data.data});
			}
		} else {
			if (response) str = response.statusCode;
			return res.send({c: 999, code: 999, data: str});
		}
	});
}

function ckLogined(req, res, next) {
	var _pline = req.query.__pline, tmpp;
	if (_pline && _pline.length < 10) {
		_pline = parseInt(_pline, 10);
		tmpp = '|' + _pline + '|';
		if (!isNaN(_pline) && tmpp.indexOf(config.pline) == -1) {
			ckLoginedRemote(_pline, req, res, next);
			return;
		}
	}
	var _reqinfo = req._mpkg_.getReqInfo(), token, ctoken, salt, tokenKey, keys, acpid;
	token = req.cookies[config.CS_TOKEN_COOKIE_PREFIX + _reqinfo.acpid];
	ctoken = req.cookies[config.CS_TOKEN_AUTHKEY + _reqinfo.acpid];
	if (token == null || token.length == 0 || ctoken == null
			|| ctoken.length != 50) {
		util.delmpkg(req);
		return res.send({c: 999, code: 999, data: 1});
	}
	salt = token.substring(0, 6);
	token = token.substring(6);
	tokenKey = util.authcode(token.replace(REGEX_TOKEN, '+'), 'DECODE',
			config.CS_SFKEY_AUTH + salt);
	keys = tokenKey.split('\t');

	if (keys.length != 3) {
		util.delmpkg(req);
		return res.send({c: 999, code: 999, data: 2});
	}
	acpid = keys[0];
	if (acpid != _reqinfo.acpid) {
		util.delmpkg(req);
		return res.send({c: 999, code: 999, data: 3});
	}

	RedisMgr.exec(flagKey, function(eredis, conn) {
		if (eredis || !conn) {
			util.delmpkg(req);
			return res.send({c: 970, code: 970, data: null});
		}
		
		var adminId = keys[1];
		conn.hgetall(_reqinfo.acpid + config.CS_REDIS_PREFIX + adminId, function(err, obj) {
			var _code;
			if (err || !obj) {
				util.delmpkg(req);
				_code = err ? 970 : 999;
				return res.send({c: _code, code: _code, data: null});
			}
			var ctoken1 = ctoken.substring(0, 46), ckey, adminname;
			if (obj[CSOTOKEN_KEY] != ctoken1) {
				util.delmpkg(req);
				return res.send({c: 999, code: 999, data: 4});
			}
			ckey = _reqinfo.acpid + config.CS_OTOKEN_KEY + ctoken1;
			adminname = obj['adminname'];

			conn.hgetall(ckey, function(ex, data) {
				if (ex || !data) {
					util.delmpkg(req);
					_code = ex ? 970 : 999;
					return res.send({c: _code, code: _code, data: 1});
				}
				// ip change
				if (_reqinfo.ip != data['lastip']) {
					// conn.del(ckey);
					util.delmpkg(req);
					return res.send({c: 999, code: 999, data: 5});
				}
				var actime = moment().unix();
				// session timeout
				if (keys[2] != data['lastlogin'] || (actime - parseInt(data['lastactivity'], 10)) >= SESSION_TIMEOUT) {
					conn.del(ckey);
					util.delmpkg(req);
					return res.send({c: 999, code: 999, data: 6});
				}
				// conn.hset(ckey, 'lastactivity', actime + '');
				req._mpkg_.setAdmin(adminId, adminname);
				if (typeof req.query.playerid != 'undefined') {
					req._mpkg_.setPlayerIdG(req.query.playerid, req.query.playername, req.query.gpn);
				}
				next();
			});
		});
	});
}

function simpleCkLogined(req, res, next) {
	var _reqinfo = req._mpkg_.getReqInfo(), token, ctoken, salt, tokenKey, keys, acpid, adminname;
	token = req.cookies[config.CS_TOKEN_COOKIE_PREFIX + _reqinfo.acpid];
	ctoken = req.cookies[config.CS_TOKEN_AUTHKEY + _reqinfo.acpid];
	adminname = req.cookies['c' + _reqinfo.acpid];
	if (token == null || token.length == 0 || ctoken == null
			|| ctoken.length != 50 || !REGEX_ADMINNAME.test(adminname)) {
		util.delmpkg(req);
		return res.send({c: 999, code: 999, data: 1});
	}
	salt = token.substring(0, 6);
	token = token.substring(6);
	tokenKey = util.authcode(token.replace(REGEX_TOKEN, '+'), 'DECODE',
			config.CS_SFKEY_AUTH + salt);
	keys = tokenKey.split('\t');

	if (keys.length != 3) {
		util.delmpkg(req);
		return res.send({c: 999, code: 999, data: 2});
	}
	acpid = keys[0];
	if (acpid != _reqinfo.acpid) {
		util.delmpkg(req);
		return res.send({c: 999, code: 999, data: 3});
	}
	req._mpkg_.setAdmin(keys[1], adminname);
	if (typeof req.query.playerid != 'undefined') {
		// req._mpkg_.setPlayerId(req.query.playerid, req.query.playername);
		req._mpkg_.setPlayerIdG(req.query.playerid, req.query.playername, req.query.gpn);
	}
	next();
}

// login need
module.exports.loginRequired = ckLogined;

module.exports.simpleLoginRequired = simpleCkLogined;

module.exports.interceptor = interceptor;
