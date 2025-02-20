const mongoose=require('mongoose');

const videoNotesSchema=new mongoose.Schema({
    title:{
        type:String,
        default:"Untitled"
    },
    videoNotes:{
        type:String,
        required:true
    },
});

const videoNotesModel=mongoose.model('videoNotes',videoNotesSchema);

module.exports=videoNotesModel;