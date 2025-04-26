const express = require("express");
const bodyParser = require("body-parser");
// const { uploadToFirebase } = require("./firebaseConfig");
const {
  createWebsiteEntry,
  updateWebsiteEntry,
  deleteWebsiteEntry,
  getAllWebsitesByUserId,
} = require("./database");
const {
  signup,
  verifyEmail,
  signin,
  forgotPassword,
  resetPassword,
  authenticateToken,
  protectedRoute,
  signout,
} = require("./UserAuth");

const createWebsite = require("./createWebsite");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const fsv = require("fs-extra");
const FormDataNode = require("form-data"); // Renamed FormData
const AdmZip = require("adm-zip");
require("dotenv").config();
const {
  createZipFile,
  deleteFolderRecursive,
  createNetlifySite,
  deployToNetlify,
  updateNetlifySite,
  getNetlifySiteById,
  deleteNetlifySite,
} = require("./utils");
const app = express();
const PORT = process.env.PORT || 8000;
const { GoogleGenerativeAI } = require("@google/generative-ai");

// const USER_WEBSITES_DIR = path.join(__dirname, "user-websites");
// const TEMPLATE_DIR = path.join(__dirname, "templates");
// const USER_WEBSITES_DIR = path.join(__dirname, "user-websites");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(cors());
app.use(
  cors({
    origin: "*",
  })
);

const genAI = new GoogleGenerativeAI(`${process.env.GEMINI_TOKEN}`);

app.post("/generate-sites", async (req, res) => {
  const { username, templateName, siteData, userId } = req.body;
  console.log("Generating site with data:", req.body);

  try {
    // Create website directory with all template files and updated HTML
    const userDir = createWebsite(username, templateName, siteData);

    // Create zip file from the directory
    const zipPath = await createZipFile(userDir);
    console.log("ZIP file created:", zipPath);

    // Deploy to Netlify
    const netlifySite = await createNetlifySite();
    const liveUrl = await deployToNetlify(zipPath, netlifySite.site_id);

    // Save the website details in the database
    const websiteData = {
      userId,
      username,
      templateName,
      siteData,
      siteId: netlifySite.site_id,
      liveUrl: liveUrl,
    };
    await createWebsiteEntry(websiteData);

    // Clean up temporary files
    fs.unlinkSync(zipPath);
    deleteFolderRecursive(userDir);

    console.log(
      `Website for ${websiteData.username}\n\n  netlify site id: ${netlifySite.site_id} \n\n\t is live at: ${liveUrl} \n\n`
    );

    res.status(200).json({
      site_id: netlifySite.site_id,
      liveUrl: liveUrl,
    });
  } catch (error) {
    console.error("Error generating site:", error.message);
    res.status(500).send(`Failed to deploy website. Error: ${error.message}`);
  }
});

app.put("/update-site", async (req, res) => {
  const { siteId, username, templateName, siteData, userId } = req.body;

  try {
    // Check if the site exists
    console.log(`Checking if site with ID: ${siteId} exists...`);
    const site = await getNetlifySiteById(siteId);
    if (!site) {
      return res.status(404).send(`Site with ID ${siteId} not found.`);
    }

    console.log(`Site found. Updating site for ${username}...`);

    // Create the updated website content with all template files
    const userDir = createWebsite(username, templateName, siteData);
    const zipPath = await createZipFile(userDir);

    console.log(
      `Deploying updated content to Netlify site with ID: ${siteId}...`
    );
    const liveUrl = await updateNetlifySite(zipPath, siteId);
    console.log(`Website for ${username} updated and live at: ${liveUrl}`);

    // Clean up the files
    fs.unlinkSync(zipPath);
    deleteFolderRecursive(userDir);

    await updateWebsiteEntry(siteId, {
      username,
      templateName,
      siteData,
      liveUrl,
      userId,
    });

    res.status(200).json({
      site_id: siteId,
      liveUrl: liveUrl,
    });
  } catch (error) {
    console.error(`Error updating site for ${username}:`, error.message);
    res.status(500).send(`Failed to update site. Error: ${error.message}`);
  }
});
app.delete("/delete-site", async (req, res) => {
  const { siteId } = req.body;

  try {
    await deleteNetlifySite(siteId);
    await deleteWebsiteEntry(siteId);
    res.send(`Netlify site with ID ${siteId} deleted successfully.`);
  } catch (error) {
    res.status(500).send(`Failed to delete site. Error: ${error.message}`);
  }
});

app.get("/user-sites/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const websites = await getAllWebsitesByUserId(userId);
    if (!websites.length) {
      return res.status(404).send("No websites found for this user.");
    }

    res.status(200).json(websites);
  } catch (error) {
    res
      .status(500)
      .send(`Failed to retrieve websites. Error: ${error.message}`);
  }
});
app.post("/api/auth/signup", signup);
app.post("/api/auth/verify-email", verifyEmail);
app.post("/api/auth/signin", signin);
app.post("/api/auth/forgot-password", forgotPassword);
app.post("/api/auth/reset-password", resetPassword);
app.post("/api/auth/protected", authenticateToken, protectedRoute);
app.post("/api/auth/signout", signout);

//GEMINI AI
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt in request body" });
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`
      Create a complete website based on the following prompt:
      ${prompt}
      Respond with three code blocks:
      ---HTML--- (full HTML structure)
      ---CSS--- (styles for the website)
      ---JS--- (JavaScript functionality)
    `);

    const generatedText = result.response?.text();
    if (!generatedText) {
      throw new Error("Empty response from Generative AI");
    }

    // Splitting response into HTML, CSS, and JS
    const sections = generatedText.split("---HTML---");
    const html = sections[1]?.split("---CSS---")[0]?.trim() || "";
    const css =
      sections[1]?.split("---CSS---")[1]?.split("---JS---")[0]?.trim() || "";
    const javascript = sections[1]?.split("---JS---")[1]?.trim() || "";

    // Clean the content by removing the ```html, ```css, and ```javascript markers
    const cleanedHtml = html
      .replace(/^```[a-zA-Z]+\s*/, "")
      .replace(/```$/, "");
    const cleanedCss = css.replace(/^```[a-zA-Z]+\s*/, "").replace(/```$/, "");
    const cleanedJavascript = javascript
      .replace(/^```[a-zA-Z]+\s*/, "")
      // .replace(/```$/, "")
      .replace(/```[\s\S]*$/, ""); // Removes everything from the last triple backticks onward

    res.json({
      message: "Website generated successfully",
      html: cleanedHtml,
      css: cleanedCss,
      js: cleanedJavascript,
    });
  } catch (error) {
    console.error("Error generating website:", error);
    res
      .status(500)
      .json({ error: "Failed to generate website", details: error.message });
  }
});

const chatSessions = new Map();

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId = "default" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message in request body" });
    }

    // Get or initialize chat history for this session
    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, []);
    }

    const chatHistory = chatSessions.get(sessionId);

    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Add user message to history
    chatHistory.push({ role: "user", parts: [{ text: message }] });

    // Start a chat session
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    });

    // Generate response
    const result = await chat.sendMessage(message);
    const response = result.response;
    const responseText = response.text();

    // Add AI response to history
    chatHistory.push({ role: "model", parts: [{ text: responseText }] });

    // Keep chat history within reasonable limits (last 20 messages)
    if (chatHistory.length > 20) {
      chatSessions.set(sessionId, chatHistory.slice(-20));
    }

    res.json({
      reply: responseText,
      sessionId: sessionId,
    });
  } catch (error) {
    console.error("Error in chat:", error);
    res.status(500).json({
      error: "Failed to process chat message",
      details: error.message,
    });
  }
});

const upload = multer({ dest: "uploads/" });

app.post("/deploy-ai-site", upload.array("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  console.log("Received Files:");
  req.files.forEach((file) => {
    console.log(`- ${file.originalname}`);
  });

  const websiteFolder = path.join(__dirname, "website");

  // Ensure the website folder exists
  if (!fs.existsSync(websiteFolder)) {
    fs.mkdirSync(websiteFolder, { recursive: true });
  } else {
    // Empty the website folder by removing all existing files and subdirectories
    fs.readdirSync(websiteFolder).forEach((file) => {
      const filePath = path.join(websiteFolder, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmdirSync(filePath, { recursive: true });
      } else {
        fs.unlinkSync(filePath);
      }
    });
    console.log("Website folder emptied successfully");
  }

  // Copy uploaded files to the website folder
  try {
    for (const file of req.files) {
      const destPath = path.join(websiteFolder, file.originalname);
      await fs.promises.copyFile(file.path, destPath);
      console.log(`Copied ${file.originalname} to website folder`);
    }

    const zipFilePath = await createZipFile(websiteFolder);
    console.log("ZIP file created:", zipFilePath);

    const netlifySite = await createNetlifySite();
    const liveUrl = await deployToNetlify(zipFilePath, netlifySite.site_id);

    const websiteData = {
      userId: req.body.userId,
      username: `AI-${Date.now()}`,
      templateName: "AI",
      siteData: "AI",
      siteId: netlifySite.site_id,
      liveUrl: liveUrl,
    };
    await createWebsiteEntry(websiteData);
    res.json({
      message: "ZIP file created and deployed successfully",
      liveUrl,
    });

    // Clean up temporary uploaded files
    req.files.forEach((file) => {
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error(`Error deleting file ${file.path}:`, err);
        } else {
          console.log(`Deleted file: ${file.path}`);
        }
      });
    });
  } catch (error) {
    console.error("Error in deployment process:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
