const mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost:27017/websites")
  .then(console.log("MongoDB Connected"));

const userWebsiteSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Assuming you have a unique user ID system
  username: { type: String },
  templateName: { type: String },
  siteData: { type: Object },
  siteId: { type: String },
  liveUrl: { type: String },
});

const UserWebsite = mongoose.model("UserWebsite", userWebsiteSchema);

const createWebsiteEntry = async (userData) => {
  const newWebsite = new UserWebsite(userData);
  return await newWebsite.save();
};

const updateWebsiteEntry = async (siteId, updatedData) => {
  return await UserWebsite.findOneAndUpdate({ siteId }, updatedData, {
    new: true,
  });
};

const deleteWebsiteEntry = async (siteId) => {
  return await UserWebsite.findOneAndDelete({ siteId });
};

const getAllWebsitesByUserId = async (userId) => {
  return await UserWebsite.find({ userId });
};

module.exports = {
  createWebsiteEntry,
  updateWebsiteEntry,
  deleteWebsiteEntry,
  getAllWebsitesByUserId,
};
