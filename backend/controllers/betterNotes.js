const betterNotesModel = require("../models/betterNotesModel");
const fs = require("fs");
const path = require("path");
const { GoogleAIFileManager, FileState } = require("@google/generative-ai/server");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharedState = require("../utils/sharedState");
const wait = require("../utils/wait");

const makeBatter = async (req, res, next) => {
    const notes = sharedState.allResultsString;
    console.log("Notes:", notes);
    console.log("Video Notes ID:", sharedState.videoNotesId);
    const apiKey = "AIzaSyBni_55HwsH-KRd9j8_XhK-PDRReUjtgdE";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    wait(30000);

    const prompt = `You are my tutor. Teach me the concepts in simple language with real-life examples. I am giving you the notes – explain all the topics and must make them visually appealing . 
    *   Include a clear definition of [TOPIC].
    *   Provide a real-life example or analogy to make the concept easier to understand.
    *   Give a code example in [LANGUAGE] that demonstrates how to use [TOPIC].  Explain each line of code.
    *   If applicable, describe common use cases or scenarios where [TOPIC] is used.
    *   Use bullet points to summarize key concepts and provide explanations.
    *   Where appropriate, explain the impact of different parameters or options .
    *   Format the output to include visual cues, such as headings, subheadings, code blocks, and real-life examples.\n\n${notes}`;
    const result = await model.generateContent([prompt]);

    const markdownText = result?.response?.text?.();
    console.log("Markdown response:", markdownText);

    const betterNotes = new betterNotesModel({
        betterNotes: markdownText,
        videoNotesId: sharedState.videoNotesId
    });
    await betterNotes.save();
    sharedState.betterNotes=markdownText;
    sharedState.betterNotesId=betterNotes._id;
    console.log("Better Notes created successfully");
    // res.status(201).json({ "message": "Notes created successfully" });
    next();
};

module.exports = makeBatter;