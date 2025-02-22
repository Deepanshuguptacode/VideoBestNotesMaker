const express = require('express');
const {makeVideoNotes} = require('../controllers/makeVideoNotes');
const makeBatter = require('../controllers/betterNotes');
const convertToHtml = require('../controllers/convertHtml');
const getAllNotes = require('../controllers/getAllNotes');
const renameTitle = require('../controllers/renameTitle');
const getNotesHtml = require('../controllers/getNotesHtml');
const storeResultAndDelete = require('../controllers/storeResult');
const router = express.Router();

// router.post("/upload",uploadVideo)
router.get('/make', makeVideoNotes,storeResultAndDelete, makeBatter, convertToHtml);
router.get('/get/allnotes', getAllNotes);
router.get('/get/notes/:id', getNotesHtml);

router.post('/rename/notes/:id', renameTitle);


module.exports = router;