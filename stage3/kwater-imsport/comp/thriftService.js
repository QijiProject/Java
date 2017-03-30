var logger = require('../util/log4js').getLogger('wimsport');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var thrift = require('thrift');
var PullSyncService = require('../thrift/PullSyncService');
var config = require('../config/config');
var RedisService = require('./redisService');
var GpService = require('./gpService');
var MongoService = require('./mongoService');
var moment = require('moment');

function ThriftServ() {
    EventEmitter.call(this);
    this.App = null;
    this.nowpos = 0;
    this.connection = null;
    this.client = null;
    this.trycount = 0;
    this.lastup = 0;
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

ThriftServ.prototype.pullData = function(tkey, tp, stype, isFirst) {
    if (this.processing) return;
    var self = this, t = moment().unix(), keys = tkey.split(':');

    this.client.pullData(t, this.lastup, config.appname, tp, stype, -1, -1, keys[0], function(err, message) {
        var _data = null;
        if (err) {
            logger.error('[Thrift Service] pull data Error key:' + tkey, String(err));
        } else {
            self.lastup = t;
            try {
                var d = JSON.parse(message);
                _data = d[0];
            } catch (e) {
                logger.error('[Thrift Service] parse json error', e);
                _data = null;
            }
        }
        if (tp == config.thriftKey.dbs) {
            if (stype == 3) {
                RedisService.emit('check', tkey, _data, isFirst);
            } else if (stype == 2) {
                MongoService.emit('check', tkey, _data, isFirst);
            }
        } else if (tp == config.thriftKey.gpaccount) {
            GpService.emit('check', tkey, _data, isFirst);
        }
    });
};

ThriftServ.prototype.invokeRefresh = function() {
    setTimeout(function() {
        MongoService.poll();
        GpService.poll();
    }, 1);
};

ThriftServ.prototype.destroy = function() {
    if (this.connection) this.connection.end();
    this.client = null;
    RedisService.destroy();
    GpService.destroy();
    // RedisServ.destroy();
};

module.exports = new ThriftServ;
