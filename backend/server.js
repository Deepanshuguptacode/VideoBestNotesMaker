const express = require('express');
const mongoose = require('mongoose');
const notesRoute = require('./routes/notesRoute');
const app = express();

app.use(express.json());

// Routes
app.use('/notes', notesRoute);
// MongoDB Connection
mongoose
  .connect('mongodb://localhost:27017/Notes', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () => console.log("Server running on port 3000"));
  })
  .catch((error) => console.log("MongoDB connection failed:", error.message));
