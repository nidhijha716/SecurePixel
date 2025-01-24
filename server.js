const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

// Backend and Frontend directories
const backendDir = "C:\\Users\\Nidhi Jha\\OneDrive\\Desktop\\final_IS_PROJECT\\backend";
const frontendDir = "C:\\Users\\Nidhi Jha\\OneDrive\\Desktop\\final_IS_PROJECT\\frontend"; // Path to frontend
const uploadDir = path.join(backendDir, "uploads"); // Directory for uploaded files

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Enable CORS for all routes
app.use(cors());

// Configure multer for image uploads (preserve original filename)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Set destination folder
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Save with original filename
    },
});
const upload = multer({ storage: storage });

// Middleware for parsing JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(frontendDir));

// Serve backend directory for generated files
app.use(express.static(backendDir)); // Allow access to backend files for download

// Helper function for cleaning up files
const cleanupFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) console.error(`Error deleting file ${filePath}:`, err);
        });
    }
};

// Serve index.html for the root URL
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
});

// Endpoint for embedding data into an image
app.post("/embed", upload.single("image"), (req, res) => {
    const { message, key, outputFilename } = req.body;
    const imagePath = req.file?.path;
    const outputImagePath = path.join(backendDir, outputFilename || "embedded.bmp");

    // Validate inputs
    if (!imagePath || !message || !key || !outputFilename) {
        console.error("Missing required parameters for embedding.");
        res.status(400).send("Missing required parameters: image, message, key, or output filename.");
        return;
    }

    console.log("Embedding Parameters:", { imagePath, message, key, outputFilename });

    // Construct the command
    const command = [
        `"${path.join(backendDir, "stegno.exe")}"`, // Wrap executable path in quotes
        "embed",
        `"${imagePath}"`, // Wrap image path in quotes
        `"${message}"`, // Wrap message in quotes
        key,
        `"${outputImagePath}"`, // Wrap output path in quotes
    ].join(" ");

    console.log("Executing Command:", command);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Embedding Error: ${stderr || error.message}`);
            res.status(500).send(`Failed to embed data: ${stderr || error.message}`);
            cleanupFile(imagePath);
            return;
        }

        console.log("Embedding Output:", stdout);

        if (fs.existsSync(outputImagePath)) {
            res.json({
                message: "Data embedded successfully!",
                outputFilePath: `/backend/${outputFilename}`, // Adjust path for browser access
                filename: outputFilename || "embedded.bmp",
            });
        } else {
            console.error("Output file not created.");
            res.status(500).send("Failed to embed data: Output file not created.");
        }

        cleanupFile(imagePath);
    });
});

// Endpoint for retrieving data from an image
app.post("/retrieve", upload.single("image"), (req, res) => {
    const { key } = req.body;
    const imagePath = req.file?.path;

    // Validate inputs
    if (!imagePath || !key) {
        console.error("Missing required parameters for retrieving.");
        res.status(400).send("Missing required parameters: image or key.");
        return;
    }

    console.log("Retrieving Parameters:", { imagePath, key });

    // Construct the command
    const command = [
        `"${path.join(backendDir, "stegno.exe")}"`, // Wrap executable path in quotes
        "retrieve",
        `"${imagePath}"`, // Wrap image path in quotes
        key,
    ].join(" ");

    console.log("Executing Command:", command);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Retrieving Error: ${stderr || error.message}`);
            res.status(500).send(`Failed to retrieve data: ${stderr || error.message}`);
            cleanupFile(imagePath);
            return;
        }

        console.log("Retrieving Output:", stdout);

        res.json({
            message: "Data retrieved successfully!",
            retrievedData: stdout.trim(), // Trim any unnecessary whitespace
        });

        cleanupFile(imagePath);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
}); 