const htmlModel = require("../models/htmlModel");
const fs = require("fs");
const path = require("path");
const { GoogleAIFileManager, FileState } = require("@google/generative-ai/server");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharedState = require("../utils/sharedState");
const wait = require("../utils/wait");

const convertToHtml = async (req, res) => {
    const apiKey = "AIzaSyDgflhQJ2v0VxGCpDdbtP6wBiOX92oQgeg";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    wait(30000);
    const prompt = `🚀 Convert Notes into a Visually Stunning HTML Format
    🎯 Objective: Transform the given notes into a structured, engaging, and visually appealing HTML format.
    
    ✅ Key Requirements:
    🔴 1. Dark Mode Theme:
    
    Main headings (h1) → 🔥 Red Font
    Subheadings & Body Text → ⚪ White Font
    Background → 🌑 Dark Theme
    📌 2. Well-Formatted Headings & Text:
    
    Use different font sizes for clarity.
    Add bold highlights where necessary.
    🎨 3. Code Blocks with Syntax Highlighting (VS Code Style):
    
    Code should have proper indentation and different colors for keywords, functions, and variables.
    Ensure Python/JavaScript code formatting is visually distinct.
    🎭 4. Use Engaging Emojis in Headings & Points:
    
    📌 For Key Topics
    💡 For Important Insights
    🔍 For Explanations
    🎯 For Real-Life Examples
    📝 For Notes & Takeaways.
    🚀 5. Emojis: Use relevant emojis and different and more emojis to enhance engagement and clarity.
    🚀 6.Only give the Html text
     🚀${sharedState.betterNotes}`;
    const result = await model.generateContent([prompt]);
    const htmlText = result?.response?.text?.();
    console.log("HTML response:", htmlText);
    // trim the text between ``` and ``` to get the code block
    const codeBlock = htmlText.substring(htmlText.indexOf("```") + 3, htmlText.lastIndexOf("```"));    
    const htmlNotes = new htmlModel({
        html: codeBlock,
        videoNotesId: sharedState.videoNotesId,
        betterNotesId: sharedState.betterNotesId
    });
    await htmlNotes.save();
    createHtmlFile(codeBlock);
    
    res.status(201).json({ codeBlock });
}

const createHtmlFile =async(codeBlock)=>{
    const htmlPath = path.join(__dirname, "..", "..", "frontend");
    if (!fs.existsSync(htmlPath)) {
        fs.mkdirSync(htmlPath, { recursive: true });
    }
    const htmlFile = path.join(htmlPath, "notes.html");
    fs.writeFileSync(htmlFile, codeBlock);
    console.log("HTML file created successfully.");
}
    
module.exports = convertToHtml;