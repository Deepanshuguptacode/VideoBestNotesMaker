const path = require("path");
const multer = require("multer");
const fs = require("fs");

// Ensure the videoAI directory exists
const uploadDir = path.join(__dirname, "..", "..", "videoAI");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Temporary storage for uploaded chunks
const chunksStorage = {};

// Controller function to handle uploading video chunks
const uploadVideo = (req, res) => {
    const { chunkIndex, totalChunks, filename } = req.body;
    const chunkData = req.file.buffer;
    
    if (!chunksStorage[filename]) {
        chunksStorage[filename] = [];
    }
    
    chunksStorage[filename][chunkIndex] = chunkData;
    
    if (chunksStorage[filename].length === Number(totalChunks)) {
        const filePath = path.join(uploadDir, filename);
        const fileBuffer = Buffer.concat(chunksStorage[filename]);
        fs.writeFileSync(filePath, fileBuffer);
        delete chunksStorage[filename];
        return res.json({ message: "Upload complete!", filename });
    }
    
    res.json({ message: `Chunk ${chunkIndex} received` });
};

module.exports = { uploadVideo, upload };
