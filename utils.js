// const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const axios = require("axios");
const fs = require("fs");
// const path = require("path");
// const archiver = require("archiver");
// const cors = require("cors");
// const axios = require("axios");

require("dotenv").config();

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

module.exports = {
  createZipFile,
  deleteFolderRecursive,
  createNetlifySite,
  deployToNetlify,
  updateNetlifySite,
  getNetlifySiteById,
  deleteNetlifySite,
};
