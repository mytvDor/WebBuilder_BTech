// template_func/createTemplate2.js
const fs = require('fs');
const path = require('path');

const createTemplate2 = (userDir, data) => {
  const templatePath = path.join(__dirname, '../templates/t2');
  const templateFiles = fs.readdirSync(templatePath);

  templateFiles.forEach((file) => {
    const template = fs.readFileSync(path.join(templatePath, file), 'utf8');
    const content = template
      .replace(/{{title}}/g, data.title)
      .replace(/{{content}}/g, data.content);

    fs.writeFileSync(path.join(userDir, file), content);
  });

  return userDir;
};

module.exports = createTemplate2;
