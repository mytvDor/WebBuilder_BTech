// // createsite.js
// const fs = require('fs');
// const path = require('path');

// const createTemplate1 = require('./template_func/createTemplate1');
// const createTemplate2 = require('./template_func/createTemplate2');

// const TEMPLATE_DIR = path.join(__dirname, "templates");
// const USER_WEBSITES_DIR = path.join(__dirname, "user-websites");

// const createWebsite = (username, templateName, data) => {
//   const userDir = path.join(USER_WEBSITES_DIR, username);

//   // Create user directory if it doesn't exist
//   if (!fs.existsSync(userDir)) {
//     fs.mkdirSync(userDir, { recursive: true });
//   }

//   // Check if the template exists
//   const templatePath = path.join(TEMPLATE_DIR, templateName);
//   if (!fs.existsSync(templatePath)) {
//     throw new Error(`Template ${templateName} does not exist.`);
//   }

//   // Call the appropriate template function based on the template name
//   switch (templateName) {
//     case 't1':
//       return createTemplate1(userDir, data);
//     case 't2':
//       return createTemplate2(userDir, data);
//     default:
//       throw new Error(`No function defined for template ${templateName}`);
//   }
// };

// module.exports = createWebsite;
// Modified createWebsite.js
const fs = require("fs");
const path = require("path");
const fsExtra = require("fs-extra"); // Make sure fs-extra is installed

const TEMPLATE_DIR = path.join(__dirname, "templates");
const USER_WEBSITES_DIR = path.join(__dirname, "user-websites");

const createWebsite = (username, templateName, data) => {
  const userDir = path.join(USER_WEBSITES_DIR, username);

  // Create user directory if it doesn't exist
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  } else {
    // Clear the directory if it exists
    fsExtra.emptyDirSync(userDir);
  }

  // Check if the template exists
  const templatePath = path.join(TEMPLATE_DIR, templateName);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName} does not exist.`);
  }

  // Copy entire template directory to user directory
  fsExtra.copySync(templatePath, userDir);

  // Process only HTML files for replacements
  processHtmlFiles(userDir, templateName, data);

  return userDir;
};

// Function to process HTML files in the user directory
const processHtmlFiles = (directory, templateName, data) => {
  // Read all files in the directory and its subdirectories
  const processFiles = (dir) => {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Recursively process subdirectories
        processFiles(filePath);
      } else if (path.extname(file).toLowerCase() === ".html") {
        // Process only HTML files
        let content = fs.readFileSync(filePath, "utf8");

        // Apply different replacements based on template type
        if (templateName === "t1") {
          content = content
            .replace(/{{title}}/g, data.subTitle)
            .replace(/{{content}}/g, data.description);
        } else if (templateName === "t2") {
          content = content
            .replace(/{{Complete Daily}}/g, data.sectionTitle)
            .replace(/{{description}}/g, data.description);
        }

        // Write the modified content back to the file
        fs.writeFileSync(filePath, content);
      }
    });
  };

  processFiles(directory);
};

module.exports = createWebsite;
