var crypto = require('crypto');

function encode(cryptkey, iv, cleardata) {
	var encipher = crypto.createCipheriv('aes-128-cbc', cryptkey, iv), encoded = encipher
			.update(cleardata, 'utf8', 'base64');
	encoded += encipher.final('base64');
	return encoded;
}

function decode(cryptkey, iv, cleardata) {
	var decipher = crypto.createDecipheriv('aes-128-cbc', cryptkey, iv), decoded = decipher
			.update(cleardata, 'base64', 'utf8');
	decoded += decipher.final('utf8');
	return decoded;
}

function kvlen(kv, len) {
	var buf = new Buffer(kv + '\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0');
	buf = buf.slice(0, len);
	return buf.toString();
}

module.exports = {
	kvlen: kvlen,
	encode: encode,
	decode: decode
};