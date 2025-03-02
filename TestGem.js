const { GoogleGenerativeAI } = require("@google/generative-ai");

// Replace with your actual API key
// const API_KEY = "YOUR_API_KEY";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI("AIzaSyD99S4PL8DTSFu4FyCnWi3jp7iQCi-RQtk");

// Function to generate text using Gemini
async function generateText(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log("AI Response:", response.text());
  } catch (error) {
    console.error("Error:", error);
  }
}

// Example usage
generateText("What is Node.js?");
