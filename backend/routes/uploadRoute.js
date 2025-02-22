const express = require('express');
const Router = express.Router();
const { uploadVideo, upload } = require('../controllers/uploadVideo');

Router.post('/', upload.single("videoChunk"), uploadVideo);

module.exports = Router;
