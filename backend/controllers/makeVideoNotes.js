const fs = require("fs");
const path = require("path");
const { GoogleAIFileManager, FileState } = require("@google/generative-ai/server");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;
const ffmpeg = require("fluent-ffmpeg");
const videoNotesModel = require("../models/videoNotesModel");
const sharedState = require("../utils/sharedState");
const analyzeFile2 = require("../utils/analysis2");
const analyzeFile1 = require("../utils/analysis1");
const analyzeFile3 = require("../utils/analysis3");
const analyzeFile4 = require("../utils/analysis4");

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// const API_KEYS = [
//     "AIzaSyBQUFzjCgMixPE13Hz4h_XLDtu0Gj2NCeo", // Even key
//     "AIzaSyAyb9Emp_CCLCSFbP0AXB17pSOtFU3DciI", // Odd key
//     "AIzaSyBni_55HwsH-KRd9j8_XhK-PDRReUjtgdE",  // Even key
//     "AIzaSyDgflhQJ2v0VxGCpDdbtP6wBiOX92oQgeg" // Odd key
// ];

const API_KEYS = [
    "AIzaSyBQUFzjCgMixPE13Hz4h_XLDtu0Gj2NCeo", // Even key
    null, // Odd key
    null,  // Even key
    "AIzaSyDgflhQJ2v0VxGCpDdbtP6wBiOX92oQgeg" // Odd key
];

// Paths and configurations
const chunkDuration =305; 
const videoPrompt = `Write down detailed notes for this video, focusing on simplifying complex concepts for better understanding. Include clear definitions, structured explanations, and must all code snippets as presented. Arrange the content to make it feel like a teacher is walking the reader through each topic step by step.`;
const videoAIPath = "./videoAI";
const supportedVideoFormats = ["mp4", "mpeg", "mov", "avi", "x-flv", "mpg", "webm", "wmv", "3gpp"];
const supportedImageFormats = ["jpeg", "jpg", "png", "gif", "bmp", "tiff", "webp"];
let allResultsString = "";
let videoNotesId = "";

const makeVideoNotes = async (req, res, next) => {
    try {
        // Utility function to wait
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Function to split videos into 20-minute chunks
        const splitVideo = (filePath, baseOutputDir, chunkDuration) => {
            return new Promise((resolve, reject) => {
                const videoName = path.basename(filePath, path.extname(filePath));
                const outputDir = path.join(baseOutputDir, `${videoName}_chunks`);

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                ffmpeg(filePath)
                    .outputOptions("-c copy")
                    .outputOptions("-f segment")
                    .outputOptions(`-segment_time ${chunkDuration}`)
                    .output(path.join(outputDir, "chunk_%03d.mp4"))
                    .on("end", () => {
                        const files = fs
                            .readdirSync(outputDir)
                            .filter(file => file.startsWith("chunk_") && file.endsWith(".mp4"))
                            .sort()
                            .map(file => path.join(outputDir, file));
                        resolve(files);
                    })
                    .on("error", error => {
                        console.error(`Error splitting video ${filePath}:`, error.message);
                        reject(error);
                    })
                    .run();
            });
        };

        // Function to process video chunks concurrently
        const processVideoChunks = async (chunks, videoPrompt) => {
            const results = [];
            for (let i = 0; i < chunks.length; i += 4) {
                try {
                    const promiseObjects = [];
            if (i < chunks.length) {
                promiseObjects.push({
                    index: i,
                    promise: analyzeFile1(chunks[i], API_KEYS[0], videoPrompt)
                });
            }
            if (i + 1 < chunks.length) {
                promiseObjects.push({
                    index: i + 1,
                    promise: analyzeFile2(chunks[i + 1], API_KEYS[1], videoPrompt)
                });
            }
            if (i + 2 < chunks.length) {
                promiseObjects.push({
                    index: i + 2,
                    promise: analyzeFile3(chunks[i + 2], API_KEYS[2], videoPrompt)
                });
            }
            if (i + 3 < chunks.length) {
                promiseObjects.push({
                    index: i + 3,
                    promise: analyzeFile4(chunks[i + 3], API_KEYS[3], videoPrompt)
                });
            }

            // Wait for all promises to settle.
            const chunkResults = await Promise.allSettled(
                promiseObjects.map(item => item.promise)
            );

            // Process each result based on its status.
            chunkResults.forEach((result, idx) => {
                const chunkIndex = promiseObjects[idx].index;
                if (result.status === "fulfilled") {
                    // Successfully analyzed; delete the chunk and write the analysis to a file.
                    fs.unlinkSync(chunks[chunkIndex]);
                    console.log(`Deleted chunk: ${chunks[chunkIndex]}`);
                    fs.writeFileSync(`analysis${chunkIndex}.txt`, result.value.analysis);
                    console.log(`Wrote analysis to file: analysis${chunkIndex}.txt`);
                    results.push(result.value);
                } else {
                    // Log error but continue processing other chunks.
                    console.error(
                        `Error processing chunk ${chunks[chunkIndex]}:`,
                        result.reason
                    );
                }
            });
            } catch (error) {
                console.error("Error processing chunk group:", error);
            }
            }
            return results;
        };

        // Main processing function
        const processMediaFiles = async () => {
            try {
                // Get list of files (videos and images)
                const files = fs.readdirSync(videoAIPath)
                    .filter(file =>
                        supportedVideoFormats.includes(path.extname(file).toLowerCase().slice(1)) ||
                        supportedImageFormats.includes(path.extname(file).toLowerCase().slice(1))
                    )
                    .map(file => path.join(videoAIPath, file));

                const outputBaseDir = path.resolve(videoAIPath, "processed");
                const allResults = [];

                // Process each file
                for (const file of files) {
                    console.log(`Processing file: ${path.basename(file)}`);

                    if (supportedVideoFormats.includes(path.extname(file).toLowerCase().slice(1))) {
                        // Split video into chunks if needed
                        console.log("Splitting video into chunks...");
                        console.log("outputBaseDir", outputBaseDir);
                        const chunks = await splitVideo(file, outputBaseDir, chunkDuration);
                        console.log("Chunks : ", chunks); 
                        // Process video chunks
                        const videoResults = await processVideoChunks(chunks, videoPrompt);
                        allResults.push(...videoResults);
                    }
                }

                // res.status(200).json({ message: "Video notes created successfully.", videoNotes: allResultsString });

                // Update shared state
                //finding the videoName
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
                //checking the folder is empty or not.If not then only process those video
                const processedFolder = `./videoAI/processed/${videoName1}`;
                if(fs.readdirSync(processedFolder).length !== 0){
                    const processedChunks = fs.readdirSync(processedFolder)
                    .filter(file => file.startsWith("chunk_") && file.endsWith(".mp4"))
                    .map(file => path.join(processedFolder, file));
                    console.log('Existing video paths:', processedChunks);
                    await wait(30000);
                    videoResults = await processVideoChunks(processedChunks, videoPrompt);
                }

                console.log("All media processing completed.");
                // const deleteVideoPath = "./videoAI";
                // console.log(deleteVideoPath[1])
                // fs.unlinkSync(`./videoAI/${deleteVideoPath[1]}`);
                
                
            } catch (error) {
                console.error("Error during media processing:", error);
            }
        };

        // Start processing
        await processMediaFiles();
        
        next();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { makeVideoNotes, allResultsString, videoNotesId };