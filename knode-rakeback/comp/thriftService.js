var logger = require('../util/log4js').getLogger('knrb');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var thrift = require('thrift');
var PullSyncService = require('../thrift/PullSyncService');
var config = require('../config/config');
var RedisService = require('./redisService');
var DbService = require('./dbService');
var AcpService = require('./acpService');
var moment = require('moment');

function ThriftServ() {
    EventEmitter.call(this);
    this.App = null;
    this.nowpos = config.nowpos;
    this.connection = null;
    this.client = null;
    this.trycount = 0;
    this.redisStarted = false;

    this.processing = false;
    this.pingHandler = null;
    this.inping = false;

    this.on('pulldata', this.pullData.bind(this));
}
util.inherits(ThriftServ, EventEmitter);

ThriftServ.prototype.start = function(app) {
    this.App = app;
    this.createConnection();
};

ThriftServ.prototype.getKscIp = function() {
    var ipList = this.App.getIpList(), rs;
    if (this.nowpos >= ipList.length) this.nowpos = 0;
    rs = ipList[this.nowpos];
    this.nowpos++;
    return rs;
};

ThriftServ.prototype.createConnection = function() {
    this.processing = true;
    var connection = thrift.createConnection(this.getKscIp(), 7800, {
        transport : thrift.TFramedTransport,
        protocol : thrift.TCompactProtocol,
        max_attempts: 0
    }), self = this;
    this.connection = connection;

    connection.on('connect', function() {
        self.processing = false;
        self.trycount = 0;
        // logger.info('[Thrift Service] thrift service connected');
        self.client = null;
        self.createClient();
    });

    connection.on('error', function(err) {
        // logger.error('[Thrift Service] connection Error', String(err));
    });

    connection.on('close', function(err) {
        if (!self.processing) {
            self.reConnect();
        }
    });
    this.processing = false;
};

ThriftServ.prototype.reConnect = function() {
    this.clearPingTimeout();
    if (this.processing) return;
    this.processing = true;
    var self = this;
    if (this.connection) this.connection.end();
    setTimeout(function() {
        self.createConnection();
    }, 5000);
};

ThriftServ.prototype.ping = function() {
    if (this.inping || this.processing) return;
    this.inping = true;
    var self = this;
    setTimeout(function() {
        self._ping();
    }, 10000);
};

ThriftServ.prototype._ping = function() {
    if (this.pingHandler) this.clearPingTimeout();
    this.pingTimeout(); // start ping 
    var self = this;
    this.client.ping(function(err, message) {
        if (err) {

        } else {
            self.clearPingTimeout();
        }
        self.inping = false;
        self.ping(); // loop
    });
};

ThriftServ.prototype.pingTimeout = function() {
    var self = this;
    this.pingHandler = setTimeout(function() {
        self.trycount++;
        self.inping = false;
        if (self.trycount >= 3) {
            self.trycount = 0;
            self.reConnect();
        } else {
            self.ping();
        }
    }, 5000);
};

ThriftServ.prototype.clearPingTimeout = function() {
    if (this.pingHandler) clearTimeout(this.pingHandler);
    this.pingHandler = null;
};

ThriftServ.prototype.createClient = function() {
    try {
        this.client = thrift.createClient(PullSyncService, this.connection);
        logger.info('[Thrift Service] thrift service client created');
        this.inping = false;
        this.ping(); // ping
        this.invokeRefresh();
    } catch (err) {
        logger.error('[Thrift Service] create client Error', String(err))
    }
    if (!this.redisStarted) {
        this.redisStarted = true;
        RedisService.start(this);
    }
};

// timeline, lastup, appname, type, s1, s2, isim, tagid
ThriftServ.prototype.pullData = function(lastup, type, s1, s2, isim, tagid, isFirst) {
    if (this.processing) return;
    var self = this, t = moment().unix();
    if (lastup == null) lastup = t;
    this.client.pullData(t, lastup, config.appname, type, s1, s2, isim, tagid, function(err, message) {
        var _data = null;
        if (err) {
            logger.error('[Thrift Service] pull data Error key %s type %s s1 %s s2 %s', tagid, type, s1, s2, String(err));
        } else {
            try {
                _data = JSON.parse(message);
            } catch (e) {
                logger.error('[Thrift Service] parse json error', e);
                _data = null;
            }
        }
        if (type == config.thriftKey.dbs) {
            if (s1 == 3) {
                RedisService.emit('check', tagid, _data == null ? _data : _data[0], isFirst);
            } else if (s1 == 1) {
                DbService.emit('check', _data, isFirst, isim);
            }
        } else if (type == config.thriftKey.acp) {
            AcpService.emit('check', _data, isFirst);
        }
    });
};

ThriftServ.prototype.invokeRefresh = function() {
    setTimeout(function() {
        AcpService.poll();
        DbService.poll();
    }, 1);
};

ThriftServ.prototype.destroy = function() {
    if (this.connection) this.connection.end();
    this.client = null;
    RedisService.destroy();
    DbService.destroy();
    AcpService.destroy();
};

module.exports = new ThriftServ;
