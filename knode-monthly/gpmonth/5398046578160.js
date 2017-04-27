var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterImSport() {
	this.gpid = '5398046578160';
}

WaterImSport.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
    sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(betamt),sum(betamt+winlost),sum(betamt) from imsport_wagered';
    sql += ' where settled=1 and betcancelled=0 and btbuyback=0 and transtime>='+item.cstart+' and transtime<=' + item.cend;
    sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterImSport getWater %s', acpid, String(err));
            callback(new Error('imsport'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterImSport getWater query %s', acpid, String(e));
                    callback(new Error('imsport1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterImSport();

module.exports = w;
