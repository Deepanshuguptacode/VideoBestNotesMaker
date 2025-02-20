const fs = require("fs");
const path = require("path");
const { GoogleAIFileManager, FileState } = require("@google/generative-ai/server");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const MarkdownIt = require("markdown-it"); // npm install markdown-it

const particleNotes = async () => {
    try {
        // Read file from output folder
        const notes = fs.readFileSync('output/media_analysis_results.txt', 'utf-8');
        const apiKey = "AIzaSyBni_55HwsH-KRd9j8_XhK-PDRReUjtgdE";
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
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
        
        const prompt2=`🚀 Convert Notes into a Visually Stunning HTML Format
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
 🚀${markdownText}`;
        const result1 = await model.generateContent([prompt2]);
        const htmlText = result1?.response?.text?.();

        // let htmlText;
        // if (typeof result.response.html === "function") {
        //     htmlText = result.response.html();
        // } else if (markdownText) {
        //     // Fallback: Convert markdown to HTML using markdown-it
        //     const md = new MarkdownIt();
        //     htmlText = md.render(markdownText);
        //     //Beautify the generated HTML
        //     htmlText = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Document</title><style>body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }</style></head><body>${htmlText}</body></html>`;
        // }
        // console.log("HTML response:", htmlText);
        
        // if (!htmlText) {
        //     console.error("Error: HTML generation returned undefined");
        //     return;
        // }
        
        fs.writeFileSync('result.txt', htmlText, 'utf-8');
    } catch (error) {
        console.error("Error during media processing:", error);
    }
};

particleNotes();