const fs = require("fs");
const path = require("path");

// // console.log(__dirname)
// // const uploadDir = path.join(__dirname, "..", "..", "videoAI");
// // console.log(uploadDir)
// // if (!fs.existsSync(uploadDir)) {
// //     fs.mkdirSync(uploadDir, { recursive: true });
// // }
// // const files = fs.readdirSync("./videoAI")
// // console.log(files[1])
// // for (const file of files) {
//     // }
    
// // fs.unlinkSync(path.join(uploadDir, files[1])); 
// fs.writeFileSync("analysis"+1+".txt", firstChunkPromise);

// fs.rmdirSync("./videoAI", { recursive: true });
//         console.log("Deleted videoAI directory");
const htmlPath = path.join(__dirname, "..", "..", "frontend");
console.log(htmlPath)
