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

const API_KEYS = [
    "AIzaSyBQUFzjCgMixPE13Hz4h_XLDtu0Gj2NCeo", // Even key
    "AIzaSyAyb9Emp_CCLCSFbP0AXB17pSOtFU3DciI", // Odd key
    "AIzaSyBni_55HwsH-KRd9j8_XhK-PDRReUjtgdE",  // Even key
    "AIzaSyDgflhQJ2v0VxGCpDdbtP6wBiOX92oQgeg" // Odd key
];

// Paths and configurations
const chunkDuration = 1200; 
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
                    // Process first chunk with first API key
                    const firstChunkPromise = analyzeFile1(chunks[i], API_KEYS[0], videoPrompt);
                    wait(10000);
                    // Process second chunk with second API key (if exists)
                    const secondChunkPromise = i + 1 < chunks.length
                        ? analyzeFile2(chunks[i + 1], API_KEYS[1], videoPrompt)
                        : null;
                    wait(10000);

                    // Process third chunk with second API key (if exists)
                    const thirdChunkPromise = i + 2 < chunks.length
                        ? analyzeFile3(chunks[i + 2], API_KEYS[2], videoPrompt)
                        : null;
                    wait(10000);

                    // Process fourth chunk with second API key (if exists)
                    const fourthChunkPromise = i + 3 < chunks.length
                        ? analyzeFile4(chunks[i + 3], API_KEYS[3], videoPrompt)
                        : null;

                    // Wait for both chunk analyses to complete
                    const chunkResults = await Promise.all([
                        firstChunkPromise,
                        secondChunkPromise,
                        thirdChunkPromise,
                        fourthChunkPromise
                    ].filter(Boolean));

                    // Log results for each chunk
                    chunkResults.forEach(result => {
                        console.log(`Analysis for ${result.fileName}:`);
                        console.log(result.analysis);
                        console.log('---');
                        results.push(result);
                    });
                } catch (error) {
                    console.error("Error processing chunk pair:", error);
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
                let allResultsString = ""; // Define allResultsString outside the loop

                // Process each file
                for (const file of files) {
                    console.log(`Processing file: ${path.basename(file)}`);

                    if (supportedVideoFormats.includes(path.extname(file).toLowerCase().slice(1))) {
                        // Split video into chunks if needed
                        const chunks = await splitVideo(file, outputBaseDir, chunkDuration);
                        // Process video chunks
                        const videoResults = await processVideoChunks(chunks, videoPrompt);
                        allResults.push(...videoResults);
                    }
                }

                // Convert allResults into a single string
                allResults.forEach((result) => {
                    allResultsString += result.analysis;
                });

                const videoNote = new videoNotesModel({
                    videoNotes: allResultsString
                });
                let videoNotesId = videoNote._id;

                await videoNote.save();
                // res.status(200).json({ message: "Video notes created successfully.", videoNotes: allResultsString });

                // Update shared state
                sharedState.allResultsString = allResultsString;
                sharedState.videoNotesId = videoNotesId;

                console.log("All media processing completed.");
            } catch (error) {
                console.error("Error during media processing:", error);
            }
        };

        // Start processing
        await processMediaFiles();
        // allResultsString = "Here's a summary of the video.  A man, Prince Katiyar, conducts a live online quiz on deep learning.  He starts by reminding viewers they can find the videos for this session and others on the iNeuron Tech Hindi YouTube channel.  He then reviews how to find the relevant section on the iNeuron dashboard.  He answers questions from the viewers in the chat.  There's some discussion about the best way to answer questions and the process for getting a certificate upon completion of the course."
        // videoNotesId = "67b5e3ec5b039ea0184f541d";

        // // Update shared state
        // sharedState.allResultsString = allResultsString;
        // sharedState.videoNotesId = videoNotesId;

        next();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { makeVideoNotes, allResultsString, videoNotesId };