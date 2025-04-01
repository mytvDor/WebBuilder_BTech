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
const app = express();
const PORT = process.env.PORT || 8000;
const { GoogleGenerativeAI } = require("@google/generative-ai");

// const USER_WEBSITES_DIR = path.join(__dirname, "user-websites");
// const TEMPLATE_DIR = path.join(__dirname, "templates");
// const USER_WEBSITES_DIR = path.join(__dirname, "user-websites");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// const genAI = new GoogleGenerativeAI("AIzaSyB_q_4nVwcmGsn9mpJEGmnd2cc7RlFnaMk");
// AIzaSyD99S4PL8DTSFu4FyCnWi3jp7iQCi - RQtk
const genAI = new GoogleGenerativeAI("AIzaSyD99S4PL8DTSFu4FyCnWi3jp7iQCi-RQtk");

// const axios = require('axios');

// async function attachCustomDomain(siteId, accessToken, domainName) {
//   try {
//     const response = await axios({
//       method: 'post',
//       url: `https://api.netlify.com/api/v1/sites/${siteId}/domains`,
//       headers: {
//         'Authorization': `Bearer ${accessToken}`,
//         'Content-Type': 'application/json'
//       },
//       data: {
//         domain: domainName
//       }
//     });

//     return response.data;
//   } catch (error) {
//     console.error('Error attaching custom domain:', error.response ? error.response.data : error.message);
//     throw error;
//   }
// }

// // Example usage
// const SITE_ID = '8623cbe5-37d9-4ee8-a6c1-f3f10b9b5a59';
// // const ACCESS_TOKEN = 'your_netlify_access_token';
// const CUSTOM_DOMAIN = 'www.collabvision.com';

// attachCustomDomain(SITE_ID, process.env.NETLIFY_AUTH_TOKEN, CUSTOM_DOMAIN)
//   .then(result => {
//     console.log('Custom domain attached successfully:', result);
//   })
//   .catch(error => {
//     console.error('Failed to attach custom domain', error);
//   });

const createZipFile = async (sourceDir) => {
  const zipPath = `${sourceDir}.zip`;
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip");

  return new Promise((resolve, reject) => {
    output.on("close", () => resolve(zipPath));
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
};

const deleteFolderRecursive = (folderPath) => {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
};

const createNetlifySite = async () => {
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

const deployToNetlify = async (zipPath, siteId) => {
  try {
    const readStream = fs.createReadStream(zipPath);
    const response = await axios.post(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      readStream,
      {
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`,
          "Content-Type": "application/zip",
        },
      }
    );
    console.log(
      "Netlify deployment triggered for site:",
      response.data.deploy_ssl_url
    );
    return response.data.deploy_ssl_url;
  } catch (error) {
    console.error("Error deploying to Netlify:", error.message);
    throw error;
  }
};

const updateNetlifySite = async (zipPath, siteId) => {
  try {
    const readStream = fs.createReadStream(zipPath);

    const response = await axios.post(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      readStream,
      {
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`,
          "Content-Type": "application/zip",
        },
      }
    );

    console.log(
      `Netlify deployment updated for site: ${response.data.deploy_ssl_url}`
    );
    return response.data.deploy_ssl_url;
  } catch (error) {
    console.error(
      `Error updating Netlify site with ID ${siteId}:`,
      error.message
    );
    throw error;
  }
};

const getNetlifySiteById = async (siteId) => {
  try {
    const response = await axios.get(
      `https://api.netlify.com/api/v1/sites/${siteId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching site details for ID ${siteId}:`,
      error.message
    );
    throw error;
  }
};

const deleteNetlifySite = async (siteId) => {
  try {
    const response = await axios.delete(
      `https://api.netlify.com/api/v1/sites/${siteId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`,
        },
      }
    );
    console.log(`Netlify site with ID ${siteId} has been deleted.`);
    return response.data;
  } catch (error) {
    console.error(
      `Error deleting Netlify site with ID ${siteId}:`,
      error.message
    );
    throw error;
  }
};

// app.post("/generate-sites", async (req, res) => {
//   const { username, templateName, siteData, userId } = req.body;
//   console.log(req.body);
//   try {
//     const userDir = createWebsite(username, templateName, siteData);
//     const zipPath = await createZipFile(userDir);

//     const netlifySite = await createNetlifySite();
//     const liveUrl = await deployToNetlify(zipPath, netlifySite.site_id);

//     // Save the website details in the database
//     const websiteData = {
//       userId,
//       username,
//       templateName,
//       siteData,
//       siteId: netlifySite.site_id,
//       liveUrl: liveUrl,
//     };
//     await createWebsiteEntry(websiteData); //database

//     fs.unlinkSync(zipPath);
//     deleteFolderRecursive(userDir);
//     console.log(
//       `Website for ${websiteData.username}\n\n  netlify site id : ${netlifySite.site_id} \n\n\t is live at: ${liveUrl} \n\n`
//     );

//     res.status(200).json({
//       site_id: netlifySite.site_id,
//       liveUrl: liveUrl,
//     });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).send(`Failed to deploy website. Error: ${error.message}`);
//   }
// });
// app.put("/update-site", async (req, res) => {
//   const { siteId, username, templateName, siteData, userId } = req.body;

//   try {
//     // Check if the site exists
//     console.log(`Checking if site with ID: ${siteId} exists...`);
//     const site = await getNetlifySiteById(siteId);
//     if (!site) {
//       return res.status(404).send(`Site with ID ${siteId} not found.`);
//     }

//     console.log(`Site found. Updating site for ${username}...`);

//     // Create the updated website content based on form data
//     const userDir = createWebsite(username, templateName, siteData);
//     const zipPath = await createZipFile(userDir);

//     console.log(
//       `Deploying updated content to Netlify site with ID: ${siteId}...`
//     );
//     const liveUrl = await updateNetlifySite(zipPath, siteId);
//     console.log(`Website for ${username} updated and live at: ${liveUrl}`);

//     // Clean up the files
//     fs.unlinkSync(zipPath);
//     deleteFolderRecursive(userDir);

//     await updateWebsiteEntry(siteId, {
//       username,
//       templateName,
//       siteData,
//       liveUrl,
//       userId,
//     });

//     res.status(200).json({
//       site_id: siteId,
//       liveUrl: liveUrl,
//     });
//   } catch (error) {
//     console.error(`Error updating site for ${username}:`, error.message);
//     res.status(500).send(`Failed to update site. Error: ${error.message}`);
//   }
// });

// Modified generate-sites endpoint
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

// Modified update-site endpoint
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

// Function to create a new site on Netlify

// API endpoint to receive ZIP file and deploy
// app.post("/deploy", upload.single("zipFile"), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: "No file uploaded" });
//   }

//   const zipPath = req.file.path;

//   try {
//     // Create Netlify site
//     const netlifySite = await createNetlifySite();
//     const liveUrl = await deployToNetlify(zipPath, netlifySite.site_id);

//     // Clean up uploaded ZIP file
//     fs.unlinkSync(zipPath);

//     res.status(200).json({
//       site_id: netlifySite.site_id,
//       liveUrl,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// API to receive files, create a ZIP, and return the ZIP URL
// app.post("/deploy-ai-site", upload.array("files"), async (req, res) => {
//   if (!req.files || req.files.length === 0) {
//     return res.status(400).json({ error: "No files uploaded" });
//   }

//   console.log("Received Files:");
//   req.files.forEach((file) => {
//     console.log(`- ${file.originalname}`);
//   });

//   const websiteFolder = path.join(__dirname, "website");
//   if (!fs.existsSync(websiteFolder)) {
//     fs.mkdirSync(websiteFolder, { recursive: true });
//   }

//   try {
//     const zipFilePath = await createZipFile(websiteFolder);
//     console.log("ZIP file created:", zipFilePath);

//     const netlifySite = await createNetlifySite();
//     const liveUrl = await deployToNetlify(zipFilePath, netlifySite.site_id);

//     const websiteData = {
//       userId: req.body.userId,
//       username: `AI-${Date.now()}`,
//       templateName: "AI",
//       siteData: "AI",
//       siteId: netlifySite.site_id,
//       liveUrl: liveUrl,
//     };
//     await createWebsiteEntry(websiteData);
//     res.json({
//       message: "ZIP file created and deployed successfully",
//       liveUrl,
//     });

//     req.files.forEach((file) => {
//       fs.unlink(file.path, (err) => {
//         if (err) {
//           console.error(`Error deleting file ${file.path}:`, err);
//         } else {
//           console.log(`Deleted file: ${file.path}`);
//         }
//       });
//     });
//   } catch (error) {
//     console.error("Error creating ZIP file:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

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
