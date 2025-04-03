const fs = require("fs");
const path = require("path");
const fsExtra = require("fs-extra");

const createTemplate1 = require("./template_func/createTemplate1");
const createTemplate2 = require("./template_func/createTemplate2");
const createTemplate3 = require("./template_func/createTemplate3");

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

  // Call the appropriate template function based on the template name
  // These functions will handle the specific replacements for each template
  switch (templateName) {
    case "t1":
      createTemplate1(userDir, data.customData);
      break;
    case "t2":
      createTemplate2(userDir, data.customData);
      break;
    case "t3":
      createTemplate3(userDir, data.customData);
      break;
    default:
      throw new Error(`No function defined for template ${templateName}`);
  }

  return userDir;
};

module.exports = createWebsite;
