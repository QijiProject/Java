var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterPtR() {
	this.gpid = '420987656202';
}

WaterPtR.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
    sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(realmoneybets),sum(realmoneywins),sum(realmoneybets) from npt_regular_wagered';
    sql += ' where status=1 and gamedate>='+item.cstart+' and gamedate<=' + item.cend;
    sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterNewPtR getWater %s', acpid, String(err));
            callback(new Error('nptregular'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterNewPtR getWater query %s', acpid, String(e));
                    callback(new Error('nptregular1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterPtR();

module.exports = w;
