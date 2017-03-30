var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('wimsport');
var moment = require('moment');
var tz = require('moment-timezone');
var INI = require('../util/ini-parser');
//var PlayerMgr = require('./init-player');
var QueMgr = require('./QueMgr');
var gr = require('../util/gr');
var FetchData = require('./fetchData');
//var ImsportHelper = require('./imsport_helper');
var config = require('../config/config'), REGEX_ACPID = /^(0)+/, USERREGEX = /^[0-9a-z]{4,12}$/i, ACPREGEX = /^[0-9a-z]{2,3}$/i;
var TIMEZONE = 'Asia/Shanghai', GMT = '-04:00';
var TIMEOUT = 60000, LTIMEOUT = 60000 * 2, QUICK_TIMEOUT = 1000, isec = 60 * 5,
	DATE_PATTERN = 'YYYY-MM-DD HH:mm:ss', ANHOUR = isec * 12;

function leftPadMins(str, len) {
	str += '';
	if (str.length >= len)
		return str;
	if (str.length === 1 && len === 4)
		return '000' + str;
	if (str.length === 1 && len === 2)
		return '0' + str;
	if (str.length === 2)
		return '00' + str;
	if (str.length === 3)
		return '0' + str;
}

function ImSport() {
	EventEmitter.call(this);
	this._iniPath = __dirname + '/Imsport.ini';
	this.App = null;
	this.fetch = new FetchData();
	this.bets = [];
	this.parlays = [];

	this.freq = QUICK_TIMEOUT;
	this.rscount = 0;

	this.fromTime = null;
	this.toTime = null;
	this.toT = null;

	this.manualOb = null;
	this.inmanual = false;
	this.manualc = false;

	this.loopok = true;

	this.on('startReq', this._startFetchData.bind(this));
	this.on('emitData', this._doData.bind(this));
	this.on('nextReq', this.nextReq.bind(this));
	this.on('startBets', this._startBets.bind(this));
}
util.inherits(ImSport, EventEmitter);

ImSport.prototype.start = function(app) {
	this.App = app;
	this._iniFile = INI.loadIniFileSync(this._iniPath);
	this.fileCfg = this._iniFile.getOrCreateSection('piece');

	this.fromTime = this.fileCfg['year'] + '-' + this.fileCfg['month'] + '-' + this.fileCfg['day'] + ' '
			+ this.fileCfg['hh'] + ':' + this.fileCfg['mm'] + ':' + this.fileCfg['ss'];
	this.toT = moment(this.fromTime);

	//ImsportHelper.start(app); // unsettled check
	console.log('before fetch');
	this.fetch.init(this);console.log('after fetch');
	this._startFetchData();
};

ImSport.prototype.setManual = function(dt) {
	if (this.manualOb != null) return;
	try {
		if (dt.start.length == 19 && dt.end.length == 19) {
			var da = new Date(dt.start), da1 = new Date(dt.end), name = dt.user, acpid = dt.acpid;
			if (!isNaN(da.getDate()) && !isNaN(da1.getDate()) && da.getTime() <= da1.getTime()) {
				this.manualc = false;
				// if (dt.user && USERREGEX.test(dt.user)) name = dt.user;
				if (!acpid || !ACPREGEX.test(acpid) || !name || !USERREGEX.test(name)) {
					name = '';
				} else {
					name = name + leftPadMins(acpid, 4);
				}
				this.manualOb = {
					start: dt.start,
					end: dt.end,
					sunix: moment(dt.start).unix(),
					eunix: moment(dt.end).unix(),
					user: name
				};
			}
		}
	} catch (e) {
		logger.error('[ImSport Service] set manual error %s, %s', dt.start, String(e));
	}
};

ImSport.prototype._startFetchData = function() {console.log('fetch data');
	if (this.loopok && this.manualOb) {console.log('fetch data1');
		this.inmanual = true;
		this._getManualSE();
		this.loopok = false;
		this._loopget();
	} else {console.log('fetch ');
		if (!this.loopok) {console.log('fetch data3');
			this._loopget();
			return;
		}
		this.loopok = false;
		this.toTime = this.toT.format(DATE_PATTERN);
		this._loopget();
	}
};

ImSport.prototype._loopget = function() {
	this.rscount = 0;

	if (this.inmanual) {console.log('manual');
		this.fetch.get(this.manualOb.stime, this.manualOb.etime, this.manualOb.user, '');
	} else {console.log('auto');
		this.fetch.get(this.fromTime, this.toTime, '', '');
	}
};

ImSport.prototype._getManualSE = function() {
	var o = this.manualOb, nu;
	if (o.eunix - o.sunix <= ANHOUR) {
		this.manualc = true;
		this.manualOb.stime = moment(o.sunix * 1000).format(DATE_PATTERN);
		this.manualOb.etime = o.end;
	} else {
		nu = o.sunix + ANHOUR;
		this.manualOb.stime = moment(o.sunix * 1000).format(DATE_PATTERN);
		this.manualOb.etime = moment(nu * 1000).format(DATE_PATTERN);
		this.manualOb.sunix = nu;
	}
};

ImSport.prototype._updatePiece = function() {
	this.toT = moment(this.toTime);
	var dateP = moment(), punix = dateP.unix(), xunix = this.toT.unix(), ds, flag = false;
	ds = punix - xunix;
	console.log(punix);
	console.log(xunix);
	if (ds >= isec) {console.log('more than 5 minutes');
		this.toT.add(5, 'm');
		this.freq = QUICK_TIMEOUT;
		flag = true;
	} else {
		console.log('within 5 minutes ' + this.fromTime);
		console.log('within 5 minutes ' + this.toT);
		this.freq = (isec - ds + 60) * QUICK_TIMEOUT;
	}

	if (flag) {
		this.fromTime = this.toTime;

		var toTs = moment(this.toTime);
		this.fileCfg['year'] = toTs.get('year');
		this.fileCfg['month'] = leftPadMins(toTs.get('month') + 1, 2);
		this.fileCfg['day'] = leftPadMins(toTs.get('date'), 2);
		this.fileCfg['hh'] = leftPadMins(toTs.get('hours'), 2);
		this.fileCfg['mm'] = leftPadMins(toTs.get('minutes'), 2);
		this.fileCfg['ss'] = leftPadMins(toTs.get('seconds'), 2);
		INI.saveIniFileAsync(this._iniPath, this._iniFile);
	}
};

// callback
ImSport.prototype._doData = function(bets) {console.log('dodata');
	this.rscount = bets.length;
	this.bets = bets;
	this.parlays = [];
	this._startBets();
};

ImSport.prototype._startBets = function() {console.log('startbet');
	var bet = this.bets.shift();
	if (bet) { console.log('dobetque');console.log(this.bets.length);
		this._doBetQue(bet);
		return;
	}
	bet = this.parlays.shift();
	if (bet) {console.log('_doParlayQue');console.log(this.parlays.length);
		this._doParlayQue(bet);
		return;
	}
	// digest end
	this.nextReq(true, '');
};

ImSport.prototype._doBetQue = function(bet) {
	var acpid, playername, tmp, _stat = 1, self = this, settled = 1, t, betarr = [], parlay = [], m,
		oddtype;

	playername = bet.memberCode;
	if (!playername) {
		this.emit('startBets');
		return;
	}
	acpid = playername.substr(playername.length - 3);
	playername = playername.substr(0, playername.length - 4);
	acpid = acpid.replace(REGEX_ACPID, '');
	playername = playername.split('_');
	playername = playername[1];

	bet.sportsName = bet.sportsName + '';
	bet.odds = bet.odds || 0;
	oddtype = bet.oddsType.toLowerCase();
	if ((bet.settled == 1 && bet.betCancelled == 1)
		|| ((bet.result||0)*1 == 0)
		|| (oddtype == 'euro' && bet.odds>0 && bet.odds < 1.7)
		|| (oddtype == 'hk' && bet.odds>0 && bet.odds < 0.7)
		|| (oddtype == 'malay' && bet.odds>0 && bet.odds < 0.7)) {
		_stat = 0;
	}
	if (bet.settled == 0) {
		_stat = 0;
		settled = 0;
	}
	if (typeof bet.BTBuyBack != 'undefined' && bet.BTBuyBack > 0) _stat = 0;
	t = moment(bet.betTime).tz(TIMEZONE).unix();
	if (bet.ParlayBetDetails) {
		betarr = bet.ParlayBetDetails;
		if (gr.isPlainObject(betarr)) { // single
			betarr = [betarr];
		}
		// detail
		m = betarr.length;
		for (var j = 0; j < m; ++j) {
			parlay.push({acpid: acpid, betid: bet.betId, transtime: t, detail: betarr[j], stat: _stat});
		}
	}

	//  PlayerMgr.getPlayer(acpid, playername, function(err, user) {
	// 	 if (err || !user) {
			var user = {
				acpid: acpid,
				playerid: '|kz|PLAYERID|kz|',
				playername: playername,
				playertype: '|kz|PLAYERTYPE|kz|',
				agentcode: '|kz|AGENTCODE|kz|',
			};
	// 	 }

		var dt = moment().tz(TIMEZONE).unix();
		if (settled == 0) { // unsettled
			QueMgr.updateUnsettled(String(bet.betId), acpid, playername, bet.sportsName, t, function(err, doc) {
				if (err) {
					self._doBetQueFail(bet);
				} else {
					self._doSaveBet(bet, user, _stat, dt, t, true, 0, parlay);
				}
			});
		} else {
			self._doSaveBet(bet, user, _stat, dt, t, false, 1, parlay);
		}
	//  });
};

ImSport.prototype._doSaveBet = function(bet, user, _stat, dt, transtime, toUnsettled, settled, parlay) {
	var self = this;
	QueMgr.findAndUpdateSettled(bet, user, genS(bet, user, transtime, _stat, dt), settled, dt, function(err, rs) {
		if (toUnsettled) ImsportHelper.emit('unsettled', String(bet.betId), user.acpid, user.playername, bet.sportsName, transtime);
		if (err) {
			self._doBetQueFail(bet);
		} else {
			if (parlay.length) self.parlays = self.parlays.concat(parlay);
			self.emit('startBets');
		}
	});
};

ImSport.prototype._doBetQueFail = function(bet) {
	var self = this;
	this.bets.push(bet);
	setTimeout(function() {
		self.emit('startBets');
	}, 1000);
};

ImSport.prototype._doParlayQue = function(bet) {
	var dt = moment().tz(TIMEZONE).unix(), self = this;
	(function(err, rs) {
		if (err) {
			self.parlays.push(bet);
			setTimeout(function() {
				self.emit('startBets');
			}, 1000);
		} else {
			self.emit('startBets');
		}
	})(null, null);
};

function genS(bet, member, t, stat, dateline) {
	var str = '(' + bet.betId + ',"'+member.acpid+'",' + member.playerid + ',"' + member.playername + '",' + member.playertype + ',';
	str += member.agentcode + ',' + (bet.matchID||0) + ',"' + (bet.leagueName||'') + '","' + (bet.sportsName||'') + '","';
	str += (bet.homeTeam||'') + '","' + (bet.awayTeam||'') + '","' + (bet.matchDateTime||'') + '","' + (bet.favouriteTeamFlag||'') + '","';
	str += (bet.betType||'') + '","' + (bet.selection||'') + '","' + (bet.handicap||'')+ '","';
	str += (bet.oddsType||'') + '",' + (bet.odds||0) + ',"' + (bet.currency||'') + '",' +bet.betAmt+ ',';
	str += (bet.result||0) + ',' + t + ',"' + (bet.HTHomeScore||'') + '","' + (bet.HTAwayScore||'') + '","';
	str += (bet.FTHomeScore||'') + '","' + (bet.FTAwayScore||'') + '","' + (bet.BetHomeScore||'') + '","' + (bet.BetAwayScore||'') + '",';
	str += bet.settled + ',' + (bet.betCancelled||0) + ',"' + (bet.bettingMethod||'') + '","'+(bet.BTStatus||'')+'",'+(bet.BTBuyBack||0)+','+(bet.BTCommision||bet.betAmt)+',' + stat + ',' + dateline + ',0)';
	return str;
}

function genDetail(bet, dt) {
	var detail = bet.detail;
	var str = '(' + bet.betid + ',' + detail.MatchId + ',"'+bet.acpid+'","' + detail.ParlaySign
			+ '","' + detail.ParlayBetType + '","' + detail.ParlayBetOn + '","'
			+ detail.ParlayHandicap + '",'+ detail.ParlayOdds +',"' + (detail.ParlayFavoriteTeamFlag||'') + '","'
			+ (detail.ParlayLeagueName||'') + '",' + detail.ParlayBetCancelled + ',"' + (detail.ParlayTeamHome||'') + '","'
			+ (detail.ParlayTeamAway||'') + '",' + bet.transtime + ',"' + (detail.ParlayMatchDateTime||'') + '","'
			+ (detail.ParlaySportName||'') + '","' + (detail.ParlayHTHomeScore||'') + '","' + (detail.ParlayHTAwayScore||'') + '","'
			+ (detail.ParlayFTHomeScore||'') + '","' + (detail.ParlayFTAwayScore||'') + '","' + (detail.ParlayBetHomeScore||'') + '","'
			+ (detail.ParlayBetAwayScore||'') + '",' + bet.stat + ','+dt+')';
	return str;
}

ImSport.prototype.nextReq = function(up, msg) {console.log('nextRerquest');
	var self = this, from = this.fromTime, to = this.toTime, manual = this.inmanual,
		freqt = this.freq, user = null;
	if (this.inmanual) {
		from = this.manualOb.stime;
		to = this.manualOb.etime;
		user = this.manualOb.user;
	}

	if (!up) {console.log('up false');
		freqt = QUICK_TIMEOUT * 10;
		if (manual) { // manual ignore
			this.loopok = true;
			this.inmanual = false;
			this.manualc = false;
			this.manualOb = null;
		}
	} else {console.log('up true');
		this.loopok = true;
		if (!this.inmanual) {console.log('manual false');
			this._updatePiece();
			freqt = this.freq;
		} else {console.log('manual true');
			if (this.manualc) {
				this.inmanual = false;
				this.manualc = false;
				this.manualOb = null;
				freqt = QUICK_TIMEOUT * 5;
			} else {
				freqt = QUICK_TIMEOUT;
			}
		}
	}

	// this.App.emitInfo("keizak_ksc_node_water", JSON.stringify({
	// 	gpid: config.gpid,
	// 	from: from,
	// 	to: to,
	// 	count : this.rscount,
	// 	error: msg,
	// 	imsport: true,
	// 	user: user,
	// 	manual: manual
	// }));

	setTimeout(function() {
		self.emit('startReq');
	}, freqt);
};

ImSport.prototype.destroy = function() {
};

module.exports = new ImSport();
