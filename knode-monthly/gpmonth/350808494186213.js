var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterBBIN3D() {
	this.gpid = '350808494186213';
}

WaterBBIN3D.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
    sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(betamount),sum(betamount+payoff),sum(commissionable) from bbin_3d_wagered';
    sql += ' where result in("1","3") and bettime>='+item.cstart+' and bettime<=' + item.cend;
    sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterBBIN3D getWater %s', acpid, String(err));
            callback(new Error('bbin3d'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterBBIN3D getWater query %s', acpid, String(e));
                    callback(new Error('bbin3d1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterBBIN3D();

module.exports = w;
