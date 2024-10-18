// database.js
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/websites').then(console.log("MongoDB Connected"));

// Define the UserWebsite Schema
const userWebsiteSchema = new mongoose.Schema({
  userId: { type: String, required: true },  // Assuming you have a unique user ID system
  username: { type: String },
  templateName: { type: String },
  siteData: { type: Object},
  siteId: { type: String},
  liveUrl: { type: String }
});

// Create the UserWebsite model
const UserWebsite = mongoose.model('UserWebsite', userWebsiteSchema);

// Function to create a new website entry in the database
const createWebsiteEntry = async (userData) => {
  const newWebsite = new UserWebsite(userData);
  return await newWebsite.save();
};

// Function to update a website entry in the database
const updateWebsiteEntry = async (siteId, updatedData) => {
  return await UserWebsite.findOneAndUpdate({ siteId }, updatedData, { new: true });
};

// Function to delete a website entry from the database
const deleteWebsiteEntry = async (siteId) => {
  return await UserWebsite.findOneAndDelete({ siteId });
};

// Function to get all websites of a user by userId
const getAllWebsitesByUserId = async (userId) => {
  return await UserWebsite.find({ userId });
};

module.exports = {
  createWebsiteEntry,
  updateWebsiteEntry,
  deleteWebsiteEntry,
  getAllWebsitesByUserId
};
