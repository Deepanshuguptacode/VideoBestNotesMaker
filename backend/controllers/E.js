const fs = require("fs");
const path = require("path");

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
                console.log(fs.readdirSync(`./videoAI/processed/${videoName1}`).length === 0)
                console.log(fs.readdirSync(`./videoAI/processed/${videoName1}`))
