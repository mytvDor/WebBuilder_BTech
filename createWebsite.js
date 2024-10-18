// createsite.js
const fs = require('fs');
const path = require('path');

const createTemplate1 = require('./template_func/createTemplate1');
const createTemplate2 = require('./template_func/createTemplate2');

const TEMPLATE_DIR = path.join(__dirname, "templates");
const USER_WEBSITES_DIR = path.join(__dirname, "user-websites");

const createWebsite = (username, templateName, data) => {
  const userDir = path.join(USER_WEBSITES_DIR, username);

  // Create user directory if it doesn't exist
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  // Check if the template exists
  const templatePath = path.join(TEMPLATE_DIR, templateName);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName} does not exist.`);
  }

  // Call the appropriate template function based on the template name
  switch (templateName) {
    case 't1':
      return createTemplate1(userDir, data);
    case 't2':
      return createTemplate2(userDir, data);
    default:
      throw new Error(`No function defined for template ${templateName}`);
  }
};

module.exports = createWebsite;
