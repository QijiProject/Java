module.exports = {
    port: 20303,
    pline: '|1000|',

    appname: 'knode-b-srv-01',
    proxy: false,
    nowpos: 1,

    mcdbkey: 'a',

    mongokey: '1000_m_2_1000_00_1',
    redis_rcKey: '1000_rc_3_1000_00_0',
    redis_rbKey: '1000_rb_3_1000_00_0',
    redis_hasrb: true,
    
    thriftKey: {
        acp: 'ACP',
        dbs: 'DBS',
        domain: 'DOMAIN',
        gpaccount: 'GPACCOUNT'
    },

    CS_TOKEN_COOKIE_PREFIX: 'ac',
    CS_TOKEN_AUTHKEY: 'xc',
    CS_SFKEY_AUTH: '2875e58ceb7cba94bba2359b2dd83791',
    CS_REDIS_PREFIX: ':cs:',
    CS_OTOKEN_KEY: ':csotoken:',

    zkOfGpChange: '/ksc/change/gpaccount',
    zkOfDbChange: '/ksc/change/dbs',
 
    cpath: 'http://localhost:9232/'
};