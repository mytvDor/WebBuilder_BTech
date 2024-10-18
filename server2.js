
// const express = require("express");
// const bodyParser = require("body-parser");
// const fs = require("fs");
// const path = require("path");
// const axios = require("axios");
// const archiver = require("archiver");
// require("dotenv").config();

// const app = express();
// const PORT = process.env.PORT || 8000;
// const TEMPLATE_DIR = path.join(__dirname, "templates/t1");
// const USER_WEBSITES_DIR = path.join(__dirname, "user-websites");

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// const createWebsite = (username, data) => {
//   const userDir = path.join(USER_WEBSITES_DIR, username);

//   if (!fs.existsSync(userDir)) {
//     fs.mkdirSync(userDir, { recursive: true });
//   }

//   const files = fs.readdirSync(TEMPLATE_DIR);
//   files.forEach((file) => {
//     const template = fs.readFileSync(path.join(TEMPLATE_DIR, file), "utf8");
//     const content = template
//       .replace(/{{title}}/g, data.title)
//       .replace(/{{content}}/g, data.content)

//     fs.writeFileSync(path.join(userDir, file), content);
//   });

//   return userDir;
// };

// const createZipFile = async (sourceDir) => {
//   const zipPath = `${sourceDir}.zip`;
//   const output = fs.createWriteStream(zipPath);
//   const archive = archiver("zip");

//   return new Promise((resolve, reject) => {
//     output.on("close", () => resolve(zipPath));
//     archive.on("error", (err) => reject(err));

//     archive.pipe(output);
//     archive.directory(sourceDir, false);
//     archive.finalize();
//   });
// };

// const deleteFolderRecursive = (folderPath) => {
//   if (fs.existsSync(folderPath)) {
//     fs.readdirSync(folderPath).forEach((file) => {
//       const curPath = path.join(folderPath, file);
//       if (fs.lstatSync(curPath).isDirectory()) {
//         deleteFolderRecursive(curPath); 
//       } else {
//         fs.unlinkSync(curPath); 
//       }
//     });
//     fs.rmdirSync(folderPath); 
//   }
// };

// const createNetlifySite = async () => {
//   try {
//     const response = await axios.post(
//       "https://api.netlify.com/api/v1/sites",
//       {},
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`,
//         },
//       }
//     );
//     console.log("Netlify site created:", response.data.url);
//     return response.data;
//   } catch (error) {
//     console.error("Error creating Netlify site:", error.message);
//     throw error;
//   }
// };

// const deployToNetlify = async (zipPath, siteId) => {
//   try {
//     const readStream = fs.createReadStream(zipPath);
//     const response = await axios.post(
//       `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
//       readStream,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`,
//           "Content-Type": "application/zip",
//         },
//       }
//     );
//     console.log(
//       "Netlify deployment triggered for site:",
//       response.data.deploy_ssl_url
//     );
//     return response.data.deploy_ssl_url;
//   } catch (error) {
//     console.error("Error deploying to Netlify:", error.message);
//     throw error;
//   }
// };
// const updateNetlifySite = async (zipPath, siteId) => {
//   try {
//     const readStream = fs.createReadStream(zipPath);
    
//     const response = await axios.post(
//       `https://api.netlify.com/api/v1/sites/${siteId}/deploys`, // Correct endpoint for new deployments
//       readStream,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`,
//           "Content-Type": "application/zip",
//         },
//       }
//     );

//     console.log(`Netlify deployment updated for site: ${response.data.deploy_ssl_url}`);
//     return response.data.deploy_ssl_url;
//   } catch (error) {
//     console.error(`Error updating Netlify site with ID ${siteId}:`, error.message);
//     throw error;
//   }
// };

// const getNetlifySiteById = async (siteId) => {
//   try {
//     const response = await axios.get(
//       `https://api.netlify.com/api/v1/sites/${siteId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`,
//         },
//       }
//     );
//     return response.data;
//   } catch (error) {
//     console.error(`Error fetching site details for ID ${siteId}:`, error.message);
//     throw error;
//   }
// };
// const deleteNetlifySite = async (siteId) => {
//   try {
//     const response = await axios.delete(
//       `https://api.netlify.com/api/v1/sites/${siteId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`,
//         },
//       }
//     );
//     console.log(`Netlify site with ID ${siteId} has been deleted.`);
//     return response.data;
//   } catch (error) {
//     console.error(`Error deleting Netlify site with ID ${siteId}:`, error.message);
//     throw error;
//   }
// };



//  app.post("/generate-sites", async (req, res) => {
//   console.log("Received request to /generate-sites");
//   const users = [{ username: req.body.username, title: req.body.title, content: req.body.content }];

//   try {
//     console.log("Pass 1: Creating websites...");
//     for (const user of users) {
//       const userDir = createWebsite(user.username, {
//         title: user.title,
//         content: user.content,
//       });
//       const zipPath = await createZipFile(userDir);
//       console.log(
//         `Website created and zipped for ${user.username} at ${zipPath}`
//       );

//       console.log(
//         `Pass 2: Creating a new Netlify site for ${user.username}...`
//       );
//       const netlifySite = await createNetlifySite();
//       console.log(`Deploying website for ${user.username} to Netlify...`);
//       const liveUrl = await deployToNetlify(zipPath, netlifySite.site_id);
//       console.log(`Website for ${user.username}\n\n  netlify site id : ${netlifySite.site_id} \n\n\t is live at: ${liveUrl} \n\n`);
//       console.log(`Cleaning up files for ${user.username}...`);
//       fs.unlinkSync(zipPath); // Delete the zip file
//       deleteFolderRecursive(userDir); // Delete the original directory
//     }

//     res.send("Websites generated and deployed successfully");
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).send(`Failed to deploy websites. Error: ${error.message}`);
//   }
// });


// app.put("/update-site", async (req, res) => {
//   const { siteId, username, title, content } = req.body;

//   try {
//     // Check if the site exists
//     console.log(`Checking if site with ID: ${siteId} exists...`);
//     const site = await getNetlifySiteById(siteId);
//     if (!site) {
//       return res.status(404).send(`Site with ID ${siteId} not found.`);
//     }

//     console.log(`Site found. Updating site for ${username}...`);

//     // Create the updated website content based on form data
//     const userDir = createWebsite(username, { title, content });
//     const zipPath = await createZipFile(userDir);

//     console.log(`Deploying updated content to Netlify site with ID: ${siteId}...`);
//     const liveUrl = await updateNetlifySite(zipPath, siteId);
//     console.log(`Website for ${username} updated and live at: ${liveUrl}`);

//     // Clean up the files
//     fs.unlinkSync(zipPath);
//     deleteFolderRecursive(userDir);

//     res.send(`Website updated and deployed successfully. Live URL: ${liveUrl}`);
//   } catch (error) {
//     console.error(`Error updating site for ${username}:`, error.message);
//     res.status(500).send(`Failed to update site. Error: ${error.message}`);
//   }
// });

// app.delete("/delete-site", async (req, res) => {
//   const { siteId } = req.body;

//   try {
//     await deleteNetlifySite(siteId);
//     res.send(`Netlify site with ID ${siteId} deleted successfully.`);
//   } catch (error) {
//     res.status(500).send(`Failed to delete site. Error: ${error.message}`);
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const archiver = require("archiver");
require("dotenv").config();
const cors = require('cors')

const app = express();
const PORT = process.env.PORT || 8000;
const TEMPLATE_DIR = path.join(__dirname, "templates");
const USER_WEBSITES_DIR = path.join(__dirname, "user-websites");
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const createWebsite = (username, templateName, data) => {
  const userDir = path.join(USER_WEBSITES_DIR, username);

  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  const templatePath = path.join(TEMPLATE_DIR, templateName);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName} does not exist.`);
  }

  const templateFiles = fs.readdirSync(templatePath);
  templateFiles.forEach((file) => {
    const template = fs.readFileSync(path.join(templatePath, file), "utf8");
    const content = template
      .replace(/{{title}}/g, data.title)
      .replace(/{{content}}/g, data.content);

    fs.writeFileSync(path.join(userDir, file), content);
  });

  return userDir;
};

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
  console.log("Received request to /generate-sites");
  const users = [
    {
      username: req.body.username,
      templateName: req.body.templateName,
      siteData: req.body.siteData,
      // content: req.body.content,
    },
  ];

  try {
    console.log("Pass 1: Creating websites...");
    for (const user of users) {
      const userDir = createWebsite(user.username, user.templateName,user.siteData);
      const zipPath = await createZipFile(userDir);
      console.log(`Website created and zipped for ${user.username} at ${zipPath}`);

      console.log(`Pass 2: Creating a new Netlify site for ${user.username}...`);
      const netlifySite = await createNetlifySite();
      console.log(`Deploying website for ${user.username} to Netlify...`);
      const liveUrl = await deployToNetlify(zipPath, netlifySite.site_id);
      console.log(`Website for ${user.username}\n\n  netlify site id : ${netlifySite.site_id} \n\n\t is live at: ${liveUrl} \n\n`);
      console.log(`Cleaning up files for ${user.username}...`);
      fs.unlinkSync(zipPath); // Delete the zip file
      deleteFolderRecursive(userDir); // Delete the original directory
   
   
      res.status(200).json({
        site_id: netlifySite.site_id,
        liveUrl: liveUrl,
      });
    }

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send(`Failed to deploy websites. Error: ${error.message}`);
  }
});

app.put("/update-site", async (req, res) => {
  const { siteId, username, templateName, siteData } = req.body;

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

    res.send(`Website updated and deployed successfully. Live URL: ${liveUrl}`);

    // res.status(200).json({
    //   liveUrl: liveUrl,
    // });
  } catch (error) {
    console.error(`Error updating site for ${username}:`, error.message);
    res.status(500).send(`Failed to update site. Error: ${error.message}`);
  }
});

app.delete("/delete-site", async (req, res) => {
  const { siteId } = req.body;

  try {
    await deleteNetlifySite(siteId);
    res.send(`Netlify site with ID ${siteId} deleted successfully.`);
  } catch (error) {
    res.status(500).send(`Failed to delete site. Error: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
