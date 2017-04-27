var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterSalonLd() {
	this.gpid = '208925621341';
}

WaterSalonLd.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
	sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(betamount),sum(betamount+resultamount),sum(betamount) from salon_ld_wagered';
	sql += ' where bstate=1 and bettime>='+item.cstart+' and bettime<=' + item.cend;
	sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterSalonLd getWater %s', acpid, String(err));
            callback(new Error('salonld'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterSalonLd getWater query %s', acpid, String(e));
                    callback(new Error('salonld1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterSalonLd();

module.exports = w;
