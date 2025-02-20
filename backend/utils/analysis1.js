const fs = require("fs");
const path = require("path");
const { GoogleAIFileManager, FileState } = require("@google/generative-ai/server");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const wait = require("./wait");

const supportedVideoFormats = ["mp4", "mpeg", "mov", "avi", "x-flv", "mpg", "webm", "wmv", "3gpp"];
const supportedImageFormats = ["jpeg", "jpg", "png", "gif", "bmp", "tiff", "webp"];

const analyzeFile1 = async (filePath, apiKey, videoPrompt) => {
            console.log("API KEY", apiKey);
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

                const model1 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const prompt = mimeType === "video/mp4"
                    ? `${videoPrompt}`
                    : "Describe this image in detail as if explaining to a visually impaired person. Include objects, background, and any visible text.";
                
                const result = await model1.generateContent([prompt, {
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

module.exports = analyzeFile1;