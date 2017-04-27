module.exports = {
	port: 20405,
    pline: '|1000|',

    appname: 'knode-f-water-01',

    nowpos: 1,

    mcdbkey: 'a',

    redis_rcKey: '1000_rc_3_1000_00_0',
    redis_rfKey: '1000_rf_3_1000_00_0',
    mongokey: '1000_m_2_1000_00_1',
    
    thriftKey: {
        acp: 'ACP',
        dbs: 'DBS',
        domain: 'DOMAIN'
    },

    PLAYER_TOKEN_COOKIE_PREFIX: 'cc',
    PLAYER_TOKEN_AUTHKEY: 'vc',
    SFKEY_AUTH: 'fad6e56f3be09200aaca65e76c',
    PLAYER_REDIS_PREFIX: ':user:',
    PLAYER_OTOKEN_KEY: ':uotoken:',
    PLAYER_OTOKEN_MOBILE_KEY: ':uotokenm:',

    cpath: 'http://localhost:9232/'
};