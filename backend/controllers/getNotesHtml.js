const htmlModel = require("../models/htmlModel");

const getNotesHtml = async (req, res) => {
    try {
        const { id } = req.params;
        const html = await html
            .findById(id)
            .exec();
        res.status(200).json(html);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = getNotesHtml;