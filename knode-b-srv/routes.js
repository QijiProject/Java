var auth = require('./middlewares/auth');
var gp = require('./controllers/gp-account');
var water = require('./controllers/water');
var paccount = require('./controllers/player-account');
var router = require('express').Router();

// 获取玩家参与投注的平台大厅
router.get('/kzb/player/gps', auth.simpleLoginRequired, gp.getPlayerGps);

router.get('/kzb/gp/unsettled', auth.simpleLoginRequired, gp.getUnsettledBalance);

// check transaction
router.post('/kzb/gp/transfer/status', auth.loginRequired, gp.checkTransfer);


// 获取主账户及冻结金额
router.get('/kzb/player/mcbalance', auth.simpleLoginRequired, paccount.getMcBalance);

// 获取玩家转账过的平台列表
router.get('/kzb/player/transfer_gps', auth.simpleLoginRequired, paccount.getPlayerTransferGps);

// 
router.post('/kzb/player/changeagent', auth.loginRequired, paccount.changePlayerAgent);


// 玩家流水
router.get('/kzb/water/player/:uid/:date', auth.simpleLoginRequired, water.sumByDate);
// 代理流水
router.get('/kzb/water/agent/:agentcode/:date', auth.simpleLoginRequired, water.sumOfAgentByDate);

module.exports = router;