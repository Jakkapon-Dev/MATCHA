const express = require('express');
const lookbookRoutes = require('./lookbookRoutes');
const mediaRoutes = require('./mediaRoutes');
const errorHandler = require('../middleware/errorHandler');

const router = express.Router();

router.use(lookbookRoutes);
router.use(mediaRoutes);
router.use(errorHandler);

module.exports = router;

