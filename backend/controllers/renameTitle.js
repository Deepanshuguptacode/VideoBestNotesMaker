const htmlModel = require("../models/htmlModel");


const renameTitle = async (req, res) => {
    try{
    const { id } = req.params;
    const { title } = req.body;
    const html = await htmlModel
        .findByIdAndUpdate(id, { title }, { new: true })
        .exec();
    html.save();
    res.status(200).json(html);
}
catch(err){
    res.status(500).json({message: err.message});
}
}

module.exports= renameTitle;