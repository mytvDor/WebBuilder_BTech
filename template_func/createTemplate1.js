const fs = require("fs");
const path = require("path");

const createTemplate1 = (userDir, data) => {
  // Process only HTML files for replacements
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

        // Apply replacements for template1
        content = content
          .replace(/{{title}}/g, data.subTitle)
          .replace(/{{content}}/g, data.description);

        // Write the modified content back to the file
        fs.writeFileSync(filePath, content);
      }
    });
  };

  processFiles(userDir);
  return userDir;
};

module.exports = createTemplate1;
