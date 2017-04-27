var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterKG() {
	this.gpid = '520723134101';
}

WaterKG.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
    sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(validbetamount),sum(validbetamount+netamount),sum(validbetamount) from kg_wagered';
    sql += ' where status=1 and bettime>='+item.cstart+' and bettime<=' + item.cend;
    sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterKG getWater %s', acpid, String(err));
            callback(new Error('kg'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterKG getWater query %s', acpid, String(e));
                    callback(new Error('kg1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterKG();

module.exports = w;
