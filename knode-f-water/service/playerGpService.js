var logger = require('../util/log4js').getLogger('kfwater');
var MongoMgr = require('../comp/mongoService');
var DbMgr = require('../comp/dbService');
var moment = require('moment');
var TIMEOUT = 60000 * 2, LTIMEOUT = 60000 * 5, diff = 240;

function PlayerGp() {
    this.pgp = {};

    this.cachetime = {};

    this.lastsync = 0;

    this.tm = 0;
}

PlayerGp.prototype.start = function() {
    var self =  this;
    setTimeout(function() {
        self.checkExpire();
    }, 60000);
};

PlayerGp.prototype.getPlayerGpById = function(acpid, playerid, callback) {
    if (!MongoMgr.getProxy()) {
        callback(1408, 981);
        return;
    }
    var self = this;
    MongoMgr.getProxy().PlayerGpProxy.getPlayerGpsById(acpid, playerid, function(err, docs) {
        if (err) {
            logger.error('[Knode-F-Water] get player gp by id error %s', String(err));
            callback(1408, 980);
        } else {
            var i = 0, len = docs.length, item, key = null;
            for (; i < len; i++) {
                item = docs[i];
                if (key == null) key = item.acpid + '_' + item.playerid;
                if (!self.pgp[key]) self.pgp[key] = {};
                self.pgp[key][item.gpid] = true;
            }
            if (key != null) self.cachetime[key] = moment().unix();
            callback(0, key == null ? null : self.pgp[key]);
        }
    });
};

PlayerGp.prototype.checkExpire = function() {
    var nt = moment().unix(), dt, c = 0, total = 0;
    for (var key in this.cachetime) {
        dt = this.cachetime[key];
        total++;
        if (dt && nt - dt >= diff && this.pgp[key]) {
            this.pgp[key] = undefined;
            delete this.pgp[key];

            this.cachetime[key] = undefined;
            delete this.cachetime[key];

            c++;
        }
    }

    this.tm++;

    if (this.tm >= 2) {
        this.tm = 0;
        logger.info('[check expire] expire nums = ' + c + ' / ' + total);
    }

    this._checkExpRefresh();
};

PlayerGp.prototype._checkExpRefresh = function() {
    var self =  this;
    setTimeout(function() {
        self.checkExpire();
    }, 60000);
};

PlayerGp.prototype.getPlayerGpList = function() {
    var self = this;
    MongoMgr.getProxy().PlayerGpProxy.getPlayerGps(this.lastsync, function(err, docs) {
        if (err) {
            logger.error('[Knode-F-Water] query player gp list fail', String(err));
            self._refresh(true);
        } else {
            process.nextTick(function() {
                self._mapData(docs);
            });
        }
    });
};

PlayerGp.prototype._refresh = function(flag) {
    var self =  this;
    setTimeout(function() {
        self.getPlayerGpList();
    }, flag ? TIMEOUT : LTIMEOUT);
};

PlayerGp.prototype._mapData = function(data) {
    var i = 0, len = data.length, item, key;
    for (; i < len; i++) {
        item = data[i];
        key = item.acpid + '_' + item.playerid;
        if (!this.pgp[key]) this.pgp[key] = {};
        this.pgp[key][item.gpid] = true;
        if (item.updated > this.lastsync) this.lastsync = item.updated;
    }

    if (len > 0) {
        logger.info('at %s map ok len = ' + len, this.lastsync);
    }

    this._refresh(false);
};

// 获取玩家参与投注的游戏平台大厅
PlayerGp.prototype.getGpHall = function(acpid, gpids, cb) {
    var self = this,
        sql = 'select gpid,gpname,gpaccountid from iplay_gameplatform where gpid in('+gpids+')';
    DbMgr.execSql(acpid, sql, function(err, rows) {
        if (err) {
            logger.error('mysql getconnection on %s getGpHall %s', acpid, String(err));
            cb(new Error('get gp hall error'), null);
        } else {
            cb(null, rows);
        }
    });
};

PlayerGp.prototype.getPlayerGps = function(acpid, uid, cb) {
    var key = acpid + '_' + uid, o = this.pgp[key], rs = [];
    if (!o) {
        this.getPlayerGpById(acpid, uid, cb);
    } else {
        cb(0, o);
    }
};

module.exports = new PlayerGp();
