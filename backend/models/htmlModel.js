const mongoose = require('mongoose');

const htmlNotes = new mongoose.Schema({
    title: {
        type: String,
        default: "Untitled"
    },
    betterNotesId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'betterNotes',
        required: true
    },
    videoNotesId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'videoNotes',
        required: true
    },
    html: {
        type: String,
        required: true
    },
});

const htmlModel = mongoose.model('htmlNotes', htmlNotes);

module.exports = htmlModel;