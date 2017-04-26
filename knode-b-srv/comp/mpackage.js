function MPackage() {
	this.acpid = null;
	this.domain = null;
	this.ip = null;

	this.playerid = null;
	this.playername = null;
	this.playertype = null;
	this.agentcode = null;
	this.gpn = null;

	this.adminid = null;
	this.adminname = null;
}

MPackage.prototype.setReqInfo = function(acpid, domain, ip) {
	this.acpid = acpid;
	this.domain = domain;
	this.ip = ip;
};

MPackage.prototype.setPlayerId = function(playerid, playername) {
	this.playerid = playerid;
	this.playername = playername;
};

MPackage.prototype.setPlayerIdG = function(playerid, playername, gpn) {
	this.playerid = playerid;
	this.playername = playername;
	this.gpn = gpn;
};

MPackage.prototype.getPlayerId = function() {
	return this.playerid;
};

MPackage.prototype.setPlayer = function(playerid, playername, playertype, agentcode) {
	this.playerid = playerid;
	this.playername = playername;
	this.playertype = playertype;
	this.agentcode = agentcode;
};

MPackage.prototype.setPlayerG = function(playerid, playername, playertype, agentcode, gpn) {
	this.playerid = playerid;
	this.playername = playername;
	this.playertype = playertype;
	this.agentcode = agentcode;
	this.gpn = gpn;
};

MPackage.prototype.setAdmin = function(adminid, adminname) {
	this.adminid = adminid;
	this.adminname = adminname;
};

MPackage.prototype.getAdmin = function() {
	return {adminid: this.adminid, adminname: this.adminname};
};

MPackage.prototype.getPlayer = function() {
	return {playerid: this.playerid, playername: this.playername,
					playertype: this.playertype, agentcode: this.agentcode, gpn: this.gpn};
};

MPackage.prototype.getReqInfo = function() {
	return {domain: this.domain, ip: this.ip, acpid: this.acpid};
};

module.exports = MPackage;
