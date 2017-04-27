var logger = require('../util/log4js').getLogger('knmo');
var request = require('request');
var config = require('../config/config');
var FREQ = 300000, QUICK_FREQ = 2000, FAIL_FREQ = 30000;

function App() {
	this.zkString = null;
	this.ipList = [];
	this.thriftstarted = false;
	this.starttime = new Date().getTime();

	this.cb = null;
}

App.prototype.init = function(cb) {
	this.cb = cb;

	this.fetchBase();
};

App.prototype.fetchBase = function() {
	var self = this;
    request({
        method: 'GET',
        url: config.cpath + '?__=' + new Date().getTime(),
        timeout: 15000
    }, function(error, response, body) {
    	var isok = true;
        if (error) {
        	logger.error('[Application Service] fetch base error', error);
        	isok = false;
        } else if (response && response.statusCode == 200) {
        	var tmp = body.split(/\r|\n/);
        	self.zkString = tmp[0];
		    tmp = tmp[1];
		    self.ipList = tmp.split(',');
		    if (!self.thriftstarted && self.cb) {
		    	self.thriftstarted = true;
		    	self.cb(self);
		    }
        } else {
        	isok = false;
        	if (response) 
        		logger.error('[Application Service] fetch base error statusCode', response.statusCode);
        }
        if (!self.thriftstarted) {
            setTimeout(function() {
            	self.fetchBase();
            }, isok ? FREQ : (self.thriftstarted ? FAIL_FREQ : QUICK_FREQ));
        }
    });
};

App.prototype.getZkString = function() {
	return this.zkString;
};

App.prototype.getIpList = function() {
	return this.ipList;
};

App.prototype.getStartTime = function() {
	return this.starttime;
};

App.prototype.destroy = function() {
};

module.exports = new App;
