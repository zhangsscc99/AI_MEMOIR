const express = require('express');
const router = express.Router();

const { getAliyunDebugToken } = require('../controllers/aliyunDebugController');

router.get('/token', getAliyunDebugToken);

module.exports = router;

