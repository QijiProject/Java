var crypto = require("crypto");

module.exports = {
    generate: function (plainText) {
        return encrypt({
            alg: 'des-ede', //3des-ecb  
            autoPad: true,
            key: '2feb7a397f1ef052',
            plaintext: (function(){
				var moment = require('moment');
				return moment.utc().format("ddd, D MMM YYYY HH:mm:ss ") + 'GMT';
			})(),
            iv: null
        });
    }
};

function encrypt(param) {
	
    var key = new Buffer(param.key);
    var iv = new Buffer(param.iv ? param.iv : 0);
    var plaintext = new Buffer(param.plaintext);
    var alg = param.alg;
    var autoPad = param.autoPad;

    //encrypt  
    var cipher = crypto.createCipher(alg, key);
    cipher.setAutoPadding(autoPad);  //default true  
    var ciph = cipher.update(plaintext, 'utf8', 'hex');
    ciph += cipher.final('hex');

    return new Buffer(ciph, "hex").toString('base64') ;
}