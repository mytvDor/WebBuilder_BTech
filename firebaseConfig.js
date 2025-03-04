const { initializeApp } = require("firebase/app");
const fs = require("fs");

const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");

const firebaseConfig = {
  apiKey: "AIzaSyB7qnTnpW6QqgaZZArGi6IV9lAvIaTw52g",
  authDomain: "webbuildaidb.firebaseapp.com",
  projectId: "webbuildaidb",
  storageBucket: "webbuildaidb.firebasestorage.app",
  messagingSenderId: "966876794468",
  appId: "1:966876794468:web:bf49ec6b63eba81f5b1971",
  measurementId: "G-CPQQXEDFD7",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function uploadToFirebase(zipPath, filename) {
  try {
    const storageRef = ref(storage, `websites/${filename}`);
    const fileBuffer = fs.readFileSync(zipPath);
    const response = await uploadBytes(storageRef, fileBuffer);
    const downloadURL = await getDownloadURL(response.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading to Firebase:", error);
    throw error;
  }
}
uploadToFirebase(
  "c:\\DEV-C\\BTECH-Project\\Test_can Delete\\website.zip",
  "website.zip"
)
  .then((url) => console.log("Upload successful, URL:", url))
  .catch((error) => console.error("Upload failed:", error));
module.exports = { uploadToFirebase };
