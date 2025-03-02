// template_func/createTemplate2.js
const fs = require("fs");
const path = require("path");

const createTemplate2 = (userDir, data) => {
  const templatePath = path.join(__dirname, "../templates/t2");
  const templateFiles = fs.readdirSync(templatePath);

  templateFiles.forEach((file) => {
    const template = fs.readFileSync(path.join(templatePath, file), "utf8");
    console.log(data);
    const content = template
      .replace(/{{Complete Daily}}/g, data.sectionTitle)
      .replace(/{{description}}/g, data.description);

    fs.writeFileSync(path.join(userDir, file), content);
  });

  return userDir;
};

module.exports = createTemplate2;
