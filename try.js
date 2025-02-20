const fs = require("fs");
const path = require("path");
const { GoogleAIFileManager, FileState } = require("@google/generative-ai/server");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;
const ffmpeg = require("fluent-ffmpeg");

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
//write the command to install the required packages
//npm install @google/generative-ai ffmpeg-static ffprobe-static fluent-ffmpeg
// API keys
const API_KEYS = [
    "AIzaSyDgflhQJ2v0VxGCpDdbtP6wBiOX92oQgeg", // Odd key
    "AIzaSyBni_55HwsH-KRd9j8_XhK-PDRReUjtgdE",  // Even key
];

// Paths and configurations
const chunkDuration = 1900; // 20 minutes in seconds
const videoPrompt=`Write down detailed notes for this video, focusing on simplifying complex concepts for better understanding. Include clear definitions, structured explanations, and must all code snippets as presented. Arrange the content to make it feel like a teacher is walking the reader through each topic step by step.`;
// const videoPrompt=`Imagine you're a student learning through this video. Write down concise notes on what you learned from it. Include definitions, detailed explanations, and code snippets exactly as shown in the video.`;
const videoAIPath = "./videoAI";
const supportedVideoFormats = ["mp4", "mpeg", "mov", "avi", "x-flv", "mpg", "webm", "wmv", "3gpp"];
const supportedImageFormats = ["jpeg", "jpg", "png", "gif", "bmp", "tiff", "webp"];

// Utility function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to split videos into 20-minute chunks
const splitVideo = (filePath, baseOutputDir,chunkDuration) => {
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

// Function to analyze a single file
const analyzeFile = async (filePath, apiKey,videoPrompt) => {
    const fileManager = new GoogleAIFileManager(apiKey);
    const genAI = new GoogleGenerativeAI(apiKey);
    const mimeType = supportedImageFormats.includes(path.extname(filePath).toLowerCase().slice(1)) 
        ? "image/jpeg" 
        : "video/mp4";

    try {
        const uploadResponse = await fileManager.uploadFile(filePath, {
            mimeType,
            displayName: path.basename(filePath),
        });

        const fileUri = uploadResponse?.file?.uri;
        if (!fileUri) {
            throw new Error(`Failed to upload file: ${filePath}`);
        }

        const fileId = fileUri.split("/").pop();
        let file = await fileManager.getFile(fileId);

        while (file.state === FileState.PROCESSING) {
            await wait(10000);
            file = await fileManager.getFile(fileId);
        }

        if (file.state === FileState.FAILED) {
            throw new Error(`Processing failed for file: ${filePath}`);
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = mimeType === "video/mp4"
            ? `${videoPrompt}`
            : "Describe this image in detail as if explaining to a visually impaired person. Include objects, background, and any visible text.";

        const result = await model.generateContent([prompt, {
            fileData: {
                fileUri: file.uri,
                mimeType,
            },
        }]);

        const markdownText = result?.response?.text?.();
        if (!markdownText) {
            throw new Error(`Failed to retrieve result for file: ${filePath}`);
        }

        return {
            fileName: path.basename(filePath),
            analysis: markdownText
        };
    } catch (error) {
        console.error(`Error analyzing file ${filePath}:`, error.message);
        throw error;
    }
};

// Function to process video chunks concurrently
const processVideoChunks = async (chunks,videoPrompt) => {
    const results = [];
    
    for (let i = 0; i < chunks.length; i += 2) {
        try {
            // Process first chunk with first API key
            const firstChunkPromise = analyzeFile(chunks[i], API_KEYS[0],videoPrompt);
            
            // Process second chunk with second API key (if exists)
            const secondChunkPromise = i + 1 < chunks.length 
                ? analyzeFile(chunks[i + 1], API_KEYS[1],videoPrompt) 
                : null;
            
            // Wait for both chunk analyses to complete
            const chunkResults = await Promise.all([
                firstChunkPromise, 
                secondChunkPromise
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

        // Process each file
        for (const file of files) {
            console.log(`Processing file: ${path.basename(file)}`);
            
            if (supportedVideoFormats.includes(path.extname(file).toLowerCase().slice(1))) {
                // Split video into chunks if needed
                const chunks = await splitVideo(file, outputBaseDir,chunkDuration);
                // Process video chunks
                const videoResults = await processVideoChunks(chunks);
                allResults.push(...videoResults);
            } else if (supportedImageFormats.includes(path.extname(file).toLowerCase().slice(1))) {
                // Process image
                const imageResult = await analyzeFile(file, API_KEYS[0]);
                console.log(`Analysis for ${imageResult.fileName}:`);
                console.log(imageResult.analysis);
                console.log('---');
                allResults.push(imageResult);
            }
        }

        // Save results to a file
        const outputPath = path.resolve(__dirname, "output", "media_analysis_results.txt");
        fs.writeFileSync(outputPath, 
            allResults.map(result => 
                `Analysis for ${result.fileName}:\n${result.analysis}`
            ).join('\n\n'), 
            'utf-8'
        );

        console.log("All media processing completed.");
    } catch (error) {
        console.error("Error during media processing:", error);
    }
};

// Start processing
processMediaFiles();

