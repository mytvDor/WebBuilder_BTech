// template_func/createTemplate1.js
const fs = require('fs');
const path = require('path');

const createTemplate1 = (userDir, data) => {
  const templatePath = path.join(__dirname, '../templates/t1');
  const templateFiles = fs.readdirSync(templatePath);
console.log(data, "creating site ...")
  templateFiles.forEach((file) => {
    const template = fs.readFileSync(path.join(templatePath, file), 'utf8');
    const content = template
      .replace(/{{title}}/g, data.subTitle)
      .replace(/{{content}}/g, data.description);

    fs.writeFileSync(path.join(userDir, file), content);
  });

  return userDir;
};

module.exports = createTemplate1;


