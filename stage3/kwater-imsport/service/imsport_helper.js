var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('wimsport');
var moment = require('moment');
var tz = require('moment-timezone');
var TIMEZONE = 'Asia/Shanghai', GMT = '-04:00';
var gr = require('../util/gr');
var FetchData = require('./fetchData');
var QueMgr = require('./QueMgr');
var PlayerMgr = require('./init-player');
var config = require('../config/config'), REGEX_ACPID = /^(0)+/;
var TIMEOUT = 2000, LTIMEOUT = 5000, TIMEOUT_IDLE = 15000, PATTERN = 'YYYY-MM-DD HH:mm:ss';

function leftPadAcpid(acpid) {
	var s;
	if (acpid.length === 1) {
		s = '00' + acpid;
	} else if (acpid.length === 2) {
		s = '0' + acpid;
	} else if (acpid.length === 3) {
		s = acpid;
	} else {
		throw new Error('invalid acpid');
	}
	s = '0' + s;
	return s;
}

function ImsportHelp() {
	EventEmitter.call(this);
	this.App = null;
	this.on('unsettled', this._unsettled.bind(this));
	this.on('emitData', this._doData.bind(this));
	this.on('startReq', this._req.bind(this));
	this.on('nextReq', this.nextReq.bind(this));
	this.on('startBets', this._startBets.bind(this));

	this.freq = TIMEOUT;
	this.fetch = new FetchData();
	this.sq = {};
	this.que = [];

	this.rscount = 0;

	this.parlays = [];
	this.parlayObj = null;

	this.freqtp = 0;
	this.nowtag = null;
	this.stag = null;
}
util.inherits(ImsportHelp, EventEmitter);

ImsportHelp.prototype.start = function(app) {
	this.App = app;
	var self = this;
	this.fetch.init(this);
	QueMgr.getUnsettled(function(err, docs) {
		if (err) {
			logger.error('[Imsport Service] init imsport unsettled err %s', String(err));
			return;
		}
		self.doMap(docs);
	});
};

ImsportHelp.prototype.doMap = function(rows) {
	var cfg, item;
	for (var i = 0, len = rows.length; i < len; ++i) {
		item = rows[i];
		this.sq[item.wagerno] = 1;
		this.que.push(item);
	}
	this.digest();
};

ImsportHelp.prototype._unsettled = function(wagerno, acpid, playername, sportname, bettime) {
	if (!this.sq[wagerno]) {
		this.sq[wagerno] = 1;
		this.que.push({wagerno: wagerno, acpid: acpid, playername: playername, sportname: sportname, bettime: bettime});
	}
};

ImsportHelp.prototype.digest = function() {
	var item = this.que.shift();
	this.freqtp = 0;
	this.rscount = 0;
	this.parlays = [];
	this.parlayObj = null;

	if (item) {
		this.nowtag = item;
		this.stag = item.acpid + '_' + item.playername;
		this.emit('startReq');
	} else {
		this.freqtp = 3;
		this.nextReq(true, '');
	}
};

ImsportHelp.prototype._startBets = function() {
	var bet = this.parlays.shift();
	if (bet) {
		this._doParlayQue(bet);
		return;
	}
	// digest parlay end
	if (this.parlayObj) {
		this.betDetailOk(this.parlayObj.acpid, this.parlayObj.playername, this.parlayObj.bet, this.parlayObj.transtime, this.parlayObj.stat);
	} else {
		this.nextReq(true, '');
	}
};

ImsportHelp.prototype._req = function() {
	var _date = moment(this.nowtag.bettime*1000), dfmt = _date.format(PATTERN),
		dfmte = _date.add(1, 's').format(PATTERN),
		uname = this.nowtag.playername + leftPadAcpid(this.nowtag.acpid);

	this.fetch.get(dfmt, dfmte, uname, this.nowtag.sportname);
};

ImsportHelp.prototype._doData = function(bets) {
	this.rscount = bets.length;
	var bet, acpid, playername, _stat = 1, t, self = this, found = false, betarr = [], m,
		oddtype;
	for (var i = 0, len = bets.length; i < len; ++i) {
		bet = bets[i];
		if (bet.betId == this.nowtag.wagerno) {
			found = true;
			break;
		}
	}
	if (!found) {
		this.nextReq(false, '');
		return;
	}
	if (bet.settled == 1) { // ok
		playername = bet.memberCode;
		acpid = playername.substr(playername.length - 3);
		playername = playername.substr(0, playername.length - 4);
		acpid = acpid.replace(REGEX_ACPID, '');
		playername = playername.split('_');
		playername = playername[1];

		bet.sportsName = bet.sportsName + '';
		bet.odds = bet.odds || 0;
		oddtype = bet.oddsType.toLowerCase();
		if (bet.betCancelled == 1 || ((bet.result||0)*1 == 0)
			|| (oddtype == 'euro' && bet.odds>0 && bet.odds < 1.7)
			|| (oddtype == 'hk' && bet.odds>0 && bet.odds < 0.7)
			|| (oddtype == 'malay' && bet.odds>0 && bet.odds < 0.7)) {
			_stat = 0;
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
				this.parlays.push({acpid: acpid, betid: bet.betId, transtime: t, detail: betarr[j], stat: _stat});
			}
			this.parlayObj = {acpid: acpid, playername: playername, bet: bet, transtime: t, stat: _stat};
			this.emit('startBets');
		} else {
			this.betDetailOk(acpid, playername, bet, t, _stat);
		}
	} else {
		this.nextReq(false, '');
	}
};

ImsportHelp.prototype.betDetailOk = function(acpid, playername, bet, transtime, _stat) {
	var self = this;
	// PlayerMgr.getPlayer(acpid, playername, function(err, user) {
		// if (err || !user) {
			var user = {
				acpid: acpid,
				playerid: '|kz|PLAYERID|kz|',
				playername: playername,
				playertype: '|kz|PLAYERTYPE|kz|',
				agentcode: '|kz|AGENTCODE|kz|',
			};
		// }
		var dt = moment().tz(TIMEZONE).unix();
		QueMgr.findAndUpdateSettled(bet, user, genS(bet, user, transtime, _stat, dt), 1, dt, function(err, rs) {
			if (err) {
				self.nextReq(false, String(err));
			} else {
				QueMgr.delUnsettled(bet.betId, function(ed, rx){ 
					if (ed) {
						self.nextReq(false, String(ed));
					} else {
						self.nextReq(true, '');
					}
				});
			}
		});
	// });
};

ImsportHelp.prototype._doParlayQue = function(bet) {
	var dt = moment().tz(TIMEZONE).unix(), self = this;
	QueMgr.findAndUpdateParlay(bet, genDetail(bet, dt), dt, function(err, rs) {
		if (err) {
			self.parlays.push(bet);
			setTimeout(function() {
				self.emit('startBets');
			}, 1000);
		} else {
			self.emit('startBets');
		}
	});
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

ImsportHelp.prototype.reqSucc = function() {
	if (!this.nowtag) return;
	this.sq[this.nowtag.wagerno] = undefined;
	delete this.sq[this.nowtag.wagerno];
	this.nowtag = null;
	this.freqtp = 0;
};

ImsportHelp.prototype.reqFail = function() {
	if (!this.nowtag) return;
	this.que.push(this.nowtag);
	this.nowtag = null;
	this.freqtp = 2;
};

ImsportHelp.prototype.nextReq = function(up, msg) {
	var self = this, tp = this.freqtp;
	if (tp === 2) {
		this.freq = LTIMEOUT;
	} else if (tp === 3) {
		this.freq = TIMEOUT_IDLE;
	} else {
		this.freq = TIMEOUT;
	}

	if (up) {
		this.reqSucc();
	} else {
		this.reqFail();
	}

	// publish req info
	this.App.emitInfo("keizak_ksc_node_water", JSON.stringify({
		gpid: config.gpid,
		tag: this.stag,
		unsettle: true,
		count : this.rscount,
		error: msg
	}));

	setTimeout(function() {
		self.digest();
	}, this.freq);
};

module.exports = new ImsportHelp();
