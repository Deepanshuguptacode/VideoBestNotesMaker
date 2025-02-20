const express = require('express');
const {makeVideoNotes} = require('../controllers/makeVideoNotes');
const makeBatter = require('../controllers/betterNotes');
const convertToHtml = require('../controllers/convertHtml');
const router = express.Router();

router.get('/make', makeVideoNotes, makeBatter, convertToHtml);

module.exports = router;