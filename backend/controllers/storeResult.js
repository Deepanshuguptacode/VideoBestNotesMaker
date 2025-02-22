//read all analysis .txt files and store them in the database and then delete them
const path = require("path");
const fs = require("fs");
const videoNotesModel = require("../models/videoNotesModel");
const sharedState = require("../utils/sharedState");

const analysisPath = path.join(__dirname, "..", "..");
console.log(analysisPath);
const analysisFiles = fs.readdirSync(analysisPath).filter(file => file.startsWith("analysis"));

console.log(analysisFiles);

// Read all analysis .txt files and merge their contents into a single string
let allResultsString = "";
let videoNotesId = "";

const storeResultAndDelete = async (req, res, next) => {
    try {
        analysisFiles.forEach((file) => {
            const analysisData = fs.readFileSync(path.join(analysisPath, file), "utf8");
            fs.unlinkSync(path.join(analysisPath, file));
            console.log(`Deleted analysis file: ${file}`);
            allResultsString += analysisData;
        });

        // If no video notes were found, throw an error.
        if (!allResultsString.trim()) {
            throw new Error("No video notes found to store.");
        }

        const videoNote = new videoNotesModel({
            videoNotes: allResultsString
        });

        await videoNote.save();
        console.log("Stored video notes in the database");
        videoNotesId = videoNote._id;
        sharedState.videoNotesId = videoNotesId;
        sharedState.allResultsString = allResultsString;

        fs.rmdirSync("./videoAI", { recursive: true });
        console.log("Deleted videoAI directory");

        next();
    } catch (err) {
        console.error("Error storing video notes:", err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = storeResultAndDelete;