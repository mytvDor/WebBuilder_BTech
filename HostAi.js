const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = 7000;

// Multer configuration for file uploads
const upload = multer({ dest: "uploads/" });

// Function to create a new site on Netlify
const createNetlifySiteAi = async () => {
  try {
    const response = await axios.post(
      "https://api.netlify.com/api/v1/sites",
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`,
        },
      }
    );
    console.log("Netlify site created:", response.data.url);
    return response.data;
  } catch (error) {
    console.error("Error creating Netlify site:", error.message);
    throw error;
  }
};

// Function to deploy ZIP file to Netlify
const deployToNetlifyAi = async (zipPath, siteId) => {
  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(zipPath), {
      filename: "website.zip",
      contentType: "application/zip",
    });

    const response = await axios.post(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`,
          ...formData.getHeaders(),
        },
      }
    );
    console.log("Deployment successful:", response.data.deploy_ssl_url);
    return response.data.deploy_ssl_url;
  } catch (error) {
    console.error("Error deploying to Netlify:", error.message);
    throw error;
  }
};

// API endpoint to receive ZIP file and deploy
app.post("/deploy", upload.single("zipFile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const zipPath = req.file.path;

  try {
    // Create Netlify site
    const netlifySite = await createNetlifySiteAi();
    const liveUrl = await deployToNetlifyAi(zipPath, netlifySite.site_id);

    // Clean up uploaded ZIP file
    fs.unlinkSync(zipPath);

    res.status(200).json({
      site_id: netlifySite.site_id,
      liveUrl,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
