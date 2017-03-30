var crypto = require('crypto');
var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
var domainRegex = /.*\.(?=.*\.)/ig;
 
function des(param) {
	var key;
    if (param.hexbuff) {
        key = new Buffer(param.key, 'hex');
    } else {
        key = new Buffer(param.key);
    }  
    var iv = new Buffer(param.iv ? param.iv : 0);
    var alg = param.alg;
    var autoPad = param.autoPad; 
      
    var cipher = crypto.createCipheriv(alg, key, iv);  
    cipher.setAutoPadding(autoPad);
    var ciph = cipher.update(param.content, 'utf8', 'base64');  
    ciph += cipher.final('base64');  
    return ciph; 
}

function md5(str) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(str + "");
    str = md5sum.digest('hex');
    return str;
}

function time() {
    var unixtime_ms = new Date().getTime();
    return parseInt(unixtime_ms / 1000);
}

function microtime(get_as_float) {
    var unixtime_ms = new Date().getTime();
    var sec = parseInt(unixtime_ms / 1000);
    return get_as_float ? (unixtime_ms / 1000) : (unixtime_ms - (sec * 1000)) / 1000 + ' ' + sec;
}

function authcode(str, operation, key, expiry) {
    operation = operation || 'DECODE';
    key = key || '';
    expiry = expiry || 0;

    var ckey_length = 4;
    key = md5(key);

    // 密匙a会参与加解密
    var keya = md5(key.substr(0, 16));
    // 密匙b会用来做数据完整性验证
    var keyb = md5(key.substr(16, 16));
    // 密匙c用于变化生成的密文
    var keyc = ckey_length ? (operation == 'DECODE' ? str.substr(0, ckey_length) : md5(microtime()).substr(-ckey_length)) : '';
    // 参与运算的密匙
    var cryptkey = keya + md5(keya + keyc);

    var strbuf;
    if (operation == 'DECODE') {
        str = str.substr(ckey_length);
        strbuf = new Buffer(str, 'base64');
        //string = b.toString();
    } else {
        expiry = expiry ? expiry + time() : 0;
        tmpstr = expiry.toString();
        if (tmpstr.length >= 10)
            str = tmpstr.substr(0, 10) + md5(str + keyb).substr(0, 16) + str;
        else {
            var count = 10 - tmpstr.length;
            for (var i = 0; i < count; i++) {
                tmpstr = '0' + tmpstr;
            }
            str = tmpstr + md5(str + keyb).substr(0, 16) + str;
        }
        strbuf = new Buffer(str);
    }

    var box = new Array(256);
    for (var i = 0; i < 256; i++) {
        box[i] = i;
    }
    var rndkey = new Array();
    // 产生密匙簿
    for (var i = 0; i < 256; i++) {
        rndkey[i] = cryptkey.charCodeAt(i % cryptkey.length);
    }
    // 用固定的算法，打乱密匙簿，增加随机性，好像很复杂，实际上对并不会增加密文的强度
    for (var j = i = 0; i < 256; i++) {
        j = (j + box[i] + rndkey[i]) % 256;
        tmp = box[i];
        box[i] = box[j];
        box[j] = tmp;
    }

    // 核心加解密部分
    var s = '';
    for (var a = j = i = 0; i < strbuf.length; i++) {
        a = (a + 1) % 256;
        j = (j + box[a]) % 256;
        tmp = box[a];
        box[a] = box[j];
        box[j] = tmp;
        // 从密匙簿得出密匙进行异或，再转成字符
        //s += String.fromCharCode(string[i] ^ (box[(box[a] + box[j]) % 256]));
        strbuf[i] = strbuf[i] ^ (box[(box[a] + box[j]) % 256]);
    }

    if (operation == 'DECODE') {
        s = strbuf.toString();
        if ((s.substr(0, 10) == 0 || s.substr(0, 10) - time() > 0) && s.substr(10, 16) == md5(s.substr(26) + keyb).substr(0, 16)) {
            s = s.substr(26);
        } else {
            s = '';
        }
    } else {
        s = strbuf.toString('base64');

        var regex = new RegExp('=', "g");
        s = s.replace(regex, '');
        s = keyc + s;
    }

    return s;
}

module.exports = {
	md5: md5,
	des: des,
    authcode: authcode,
	getClientIp: function(req) {
		var ipAddress;  
	    var forwardedIpsStr = req.header('x-forwarded-for');   
	    if (forwardedIpsStr) {  
	        var forwardedIps = forwardedIpsStr.split(',');  
	        ipAddress = forwardedIps[0];  
	    }  
	    if (!ipAddress) {  
	        ipAddress = req.connection.remoteAddress;  
	    }  
	    return ipAddress; 
	},
    getRandomString : function(len) {
        len = len || 4;
        var maxPos = $chars.length, str = '', i;
        for ( i = 0; i < len; i++) {
            str += $chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return str;
    },
    format : function(date, fmt) {
        var o = {
            "M+" : date.getMonth() + 1, //月份
            "d+" : date.getDate(), //日
            "h+" : date.getHours(), //小时
            "m+" : date.getMinutes(), //分
            "s+" : date.getSeconds(), //秒
            "q+" : Math.floor((date.getMonth() + 3) / 3), //季度
            "S" : date.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }

        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }

        return fmt;
    },
    getDomain: function(req) {
        var hostname = req.headers.host;
        if (!hostname) return null;
        return hostname.replace(domainRegex, '');
    }
};