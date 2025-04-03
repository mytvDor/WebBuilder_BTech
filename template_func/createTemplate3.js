const fs = require("fs");
const path = require("path");

const createTemplate3 = (userDir, data) => {
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

        console.log("Processing template2 with data:", data);

        // Apply all the replacements from the original createTemplate2 function
        content = content
          .replace(/{{gymname}}/g, data.gymname)
          .replace(/{{about}}/g, data.about)
          .replace(/{{address}}/g, data.address)

          .replace(/{{facebook}}/g, data.facebook)
          .replace(/{{instagram}}/g, data.instagram)
          .replace(/{{twitter}}/g, data.twitter)
          .replace(/{{yearPlan}}/g, data.yearPlan)
          .replace(/{{yearPrice}}/g, data.yearPrice)
          .replace(/{{yeardescription}}/g, data.yeardescription)
          .replace(/{{sixmonthPlan}}/g, data.sixmonthPlan)
          .replace(/{{sixmonthPrice}}/g, data.sixmonthPrice)
          .replace(/{{sixmonthdescription}}/g, data.sixmonthdescription)
          .replace(/{{threemonthPlan}}/g, data.threemonthPlan)
          .replace(/{{threemonthPrice}}/g, data.threemonthPrice)
          .replace(/{{threemonthdescription}}/g, data.threemonthdescription)
          .replace(/{{phone}}/g, data.phone)
          .replace(/{{email}}/g, data.email);

        fs.writeFileSync(filePath, content);
      }
    });
  };

  processFiles(userDir);
  return userDir;
};

module.exports = createTemplate3;
