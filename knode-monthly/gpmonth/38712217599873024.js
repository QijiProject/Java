var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterAgLd() {
	this.gpid = '38712217599873024';
}

WaterAgLd.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
	sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(betamount),sum(betamount+netamount),sum(validbetamount) from ag_ld_wagered';
	sql += ' where flag=1 and bettime>='+item.cstart+' and bettime<=' + item.cend;
	sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterAgLd getWater %s', acpid, String(err));
            callback(new Error('ag'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterAgLd getWater query %s', acpid, String(e));
                    callback(new Error('ag1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterAgLd();

module.exports = w;
