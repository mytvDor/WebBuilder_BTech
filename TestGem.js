// const { GoogleGenerativeAI } = require("@google/generative-ai");

// // Replace with your actual API key
// // const API_KEY = "YOUR_API_KEY";

// // Initialize Gemini AI
// const genAI = new GoogleGenerativeAI("AIzaSyD99S4PL8DTSFu4FyCnWi3jp7iQCi-RQtk");

// // Function to generate text using Gemini
// async function generateText(prompt) {
//   try {
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     console.log("AI Response:", response.text());
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// // Example usage
// generateText("What is Node.js?");
const axios = require("axios");

const siteId = ""; // Replace with your Netlify site ID
const authToken = ""; // Replace with your Netlify authentication token
const customDomain = "hrelew.tech"; // Replace with your custom domain name

async function attachDomain() {
  try {
    const response = await axios.post(
      `https://api.netlify.com/api/v1/sites/${siteId}/domains`,
      { name: customDomain }, // Request body containing the domain name
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Domain attached successfully:", response.data);
  } catch (error) {
    if (error.response) {
      console.error(
        "Error attaching domain:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error("Error:", error.message);
    }
  }
}

attachDomain();
