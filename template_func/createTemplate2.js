// // template_func/createTemplate2.js
// const fs = require("fs");
// const path = require("path");

// const createTemplate2 = (userDir, data) => {
//   const templatePath = path.join(__dirname, "../templates/t2");
//   const templateFiles = fs.readdirSync(templatePath);

//   templateFiles.forEach((file) => {
//     const template = fs.readFileSync(path.join(templatePath, file), "utf8");
//     console.log("from the template function", data);
//     const content = template
//       .replace(/{{cafe name}}/g, data.cafeName)
//       .replace(/{{about}}/g, data.about)
//       .replace(/{{facebook}}/g, data.facebook)
//       .replace(/{{instagram}}/g, data.instagram)
//       .replace(/{{twitter}}/g, data.twitter)
//       .replace(/{{menu1}}/g, data.menu1)
//       .replace(/{{menu2}}/g, data.menu2)
//       .replace(/{{menu3}}/g, data.menu3)
//       .replace(/{{menu4}}/g, data.menu4)
//       .replace(/{{menu5}}/g, data.menu5)
//       .replace(/{{menu6}}/g, data.menu6)
//       .replace(/{{menu1des}}/g, data.menu1Des)
//       .replace(/{{menu2des}}/g, data.menu2Des)
//       .replace(/{{menu3des}}/g, data.menu3Des)
//       .replace(/{{menu4des}}/g, data.menu4Des)
//       .replace(/{{menu5des}}/g, data.menu5Des)
//       .replace(/{{menu6des}}/g, data.menu6Des)
//       .replace(/{{test1}}/g, data.testimonial1)
//       .replace(/{{test2}}/g, data.testimonial2)
//       .replace(/{{test3}}/g, data.testimonial3)
//       .replace(/{{test4}}/g, data.testimonial4)
//       .replace(/{{address}}/g, data.address)
//       .replace(/{{email}}/g, data.email)
//       .replace(/{{phone}}/g, data.phone)
//       .replace(/{{time}}/g, data.time);

//     fs.writeFileSync(path.join(userDir, file), content);
//   });

//   return userDir;
// };

// module.exports = createTemplate2;
// Updated createTemplate2.js
const fs = require("fs");
const path = require("path");

const createTemplate2 = (userDir, data) => {
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
          .replace(/{{cafe name}}/g, data.cafeName)
          .replace(/{{about}}/g, data.about)
          .replace(/{{facebook}}/g, data.facebook)
          .replace(/{{instagram}}/g, data.instagram)
          .replace(/{{twitter}}/g, data.twitter)
          .replace(/{{menu1}}/g, data.menu1)
          .replace(/{{menu2}}/g, data.menu2)
          .replace(/{{menu3}}/g, data.menu3)
          .replace(/{{menu4}}/g, data.menu4)
          .replace(/{{menu5}}/g, data.menu5)
          .replace(/{{menu6}}/g, data.menu6)
          .replace(/{{menu1des}}/g, data.menu1Des)
          .replace(/{{menu2des}}/g, data.menu2Des)
          .replace(/{{menu3des}}/g, data.menu3Des)
          .replace(/{{menu4des}}/g, data.menu4Des)
          .replace(/{{menu5des}}/g, data.menu5Des)
          .replace(/{{menu6des}}/g, data.menu6Des)
          .replace(/{{test1}}/g, data.testimonial1)
          .replace(/{{test2}}/g, data.testimonial2)
          .replace(/{{test3}}/g, data.testimonial3)
          .replace(/{{test4}}/g, data.testimonial4)
          .replace(/{{address}}/g, data.address)
          .replace(/{{email}}/g, data.email)
          .replace(/{{phone}}/g, data.phone)
          .replace(/{{time}}/g, data.time);

        // Also support the old naming convention if present
        // if (data.sectionTitle) {
        //   content = content.replace(/{{Complete Daily}}/g, data.sectionTitle);
        // }
        // if (data.description) {
        //   content = content.replace(/{{description}}/g, data.description);
        // }

        // Write the modified content back to the file
        fs.writeFileSync(filePath, content);
      }
    });
  };

  processFiles(userDir);
  return userDir;
};

module.exports = createTemplate2;
