const mongoose = require('mongoose');

const betterNotesSchema = new mongoose.Schema({
    title: {
        type: String,
        default: "Untitled"
    },
    videoNotesId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'videoNotes',
        required: true
    },
    betterNotes: {
        type: String,
        required: true
    },
});

const betterNotesModel = mongoose.model('betterNotes', betterNotesSchema);

module.exports = betterNotesModel;