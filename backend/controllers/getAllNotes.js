const htmlModel = require("../models/htmlModel");



const getAllNotes = async (req, res) => {
    //get all title of all the notes from the database
    const notes = await htmlModel.find({}, 'title');
    res.status(200).json(notes);
}

module.exports = getAllNotes;