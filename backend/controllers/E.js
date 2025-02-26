//read all analysis .txt files and store them in the database and then delete them
const path = require("path");
const fs = require("fs");
const videoNotesModel = require("../models/videoNotesModel");
const sharedState = require("../utils/sharedState");

// const analysisPath = path.join(__dirname, "..", "..");
// console.log(analysisPath);

// const analysisFiles = fs.readdirSync(analysisPath).filter(file => file.startsWith("analysis"));
// console.log(analysisFiles);

// const analysisFilesPath = analysisFiles.map(file => path.join(analysisPath, file));
// console.log(analysisFilesPath);

// // Read all analysis .txt files and merge their contents into a single string
// let allResultsString = "";
// let videoNotesId = "";

// const analysisIndex=chunks[chunkIndex].split("_")[1].split(".")[0];
const VideoPath = fs.readdirSync("./videoAI");
                let videoName=null
                VideoPath.forEach(file => {
                    if (path.extname(file) === ".mp4") {
                        videoName = file;
                    }
                });
                console.log(videoName);
                //video chuck folder name
                let videoName1 = videoName.split(".")[0];
                console.log(videoName1);
                videoName1=videoName1+"_chunks";
                console.log(videoName1);

const processedFolder = `./videoAI/processed/${videoName1}`

console.log(fs.readdirSync(processedFolder))

let chunks=fs.readdirSync(processedFolder)
const analysisIndex=chunks[0].split("_")[1].split(".")[0];
console.log(analysisIndex);