const express = require("express");
const bodyParser = require("body-parser");

const{createWebsiteEntry , updateWebsiteEntry , deleteWebsiteEntry , getAllWebsitesByUserId} = require('./database')
const { 
  signup, 
  verifyEmail, 
  signin, 
  forgotPassword, 
  resetPassword, 
  authenticateToken,
  protectedRoute, 
  signout 
} = require('./UserAuth');

const createWebsite = require("./createWebsite");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const cors = require("cors")
const axios = require("axios");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 8000;
// const USER_WEBSITES_DIR = path.join(__dirname, "user-websites");
// const TEMPLATE_DIR = path.join(__dirname, "templates");
// const USER_WEBSITES_DIR = path.join(__dirname, "user-websites");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());


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
  
      console.log(`Netlify deployment updated for site: ${response.data.deploy_ssl_url}`);
      return response.data.deploy_ssl_url;
    } catch (error) {
      console.error(`Error updating Netlify site with ID ${siteId}:`, error.message);
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
      console.error(`Error fetching site details for ID ${siteId}:`, error.message);
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
      console.error(`Error deleting Netlify site with ID ${siteId}:`, error.message);
      throw error;
    }
  };
app.post("/generate-sites", async (req, res) => {
  const { username, templateName, siteData, userId } = req.body;

  try {
    const userDir = createWebsite(username, templateName, siteData);
    const zipPath = await createZipFile(userDir);

    const netlifySite = await createNetlifySite();
    const liveUrl = await deployToNetlify(zipPath, netlifySite.site_id);

    // Save the website details in the database
    const websiteData = {
      userId,
      username,
      templateName,
      siteData,
      siteId: netlifySite.site_id,
      liveUrl: liveUrl
    };
    await createWebsiteEntry(websiteData);

    fs.unlinkSync(zipPath);
    deleteFolderRecursive(userDir);
    console.log(`Website for ${websiteData.username}\n\n  netlify site id : ${netlifySite.site_id} \n\n\t is live at: ${liveUrl} \n\n`);

    res.status(200).json({
      site_id: netlifySite.site_id,
      liveUrl: liveUrl
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send(`Failed to deploy website. Error: ${error.message}`);
  }
});
  app.put("/update-site", async (req, res) => {
    const { siteId, username, templateName, siteData , userId } = req.body;
  


    try {
      // Check if the site exists
      console.log(`Checking if site with ID: ${siteId} exists...`);
      const site = await getNetlifySiteById(siteId);
      if (!site) {
        return res.status(404).send(`Site with ID ${siteId} not found.`);
      }
  
      console.log(`Site found. Updating site for ${username}...`);
  
      // Create the updated website content based on form data
      const userDir = createWebsite(username, templateName, siteData);
      const zipPath = await createZipFile(userDir);
  
      console.log(`Deploying updated content to Netlify site with ID: ${siteId}...`);
      const liveUrl = await updateNetlifySite(zipPath, siteId);
      console.log(`Website for ${username} updated and live at: ${liveUrl}`);
  
      // Clean up the files
      fs.unlinkSync(zipPath);
      deleteFolderRecursive(userDir);
  
await updateWebsiteEntry(siteId ,{ username , templateName , siteData,liveUrl , userId})

      res.status(200).json({
        site_id: siteId,
        liveUrl: liveUrl,
      });    } catch (error) {
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
      res.status(500).send(`Failed to retrieve websites. Error: ${error.message}`);
    }
  });
  app.post('/api/auth/signup', signup);
app.post('/api/auth/verify-email', verifyEmail);
app.post('/api/auth/signin', signin);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password', resetPassword);
app.post('/api/auth/protected', authenticateToken,protectedRoute);
app.post('/api/auth/signout', signout);
  
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
