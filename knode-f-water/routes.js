var router = require('express').Router();
var auth = require('./middlewares/auth');
var water = require('./controllers/water');

// 玩家流水
router.get('/kz/water/player/:date', auth.simpleLoginRequired,
		water.sumByDate);

module.exports = router;