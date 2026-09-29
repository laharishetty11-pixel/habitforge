const express = require("express");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Every user route requires a valid login token
router.use(auth);

// Users can only access their own profile
const requireSelf = (req, res, next) => {
  if (req.params.id !== req.user.id) {
    return res.status(403).json({ message: "Not allowed" });
  }
  next();
};

// Configure where and how uploaded files are stored
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.params.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, or WEBP images are allowed"));
    }
  },
});

// Runs the upload and turns multer errors into readable JSON responses
const uploadPicture = (req, res, next) => {
  upload.single("profilePic")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "Image must be 3MB or smaller" : err.message;
      return res.status(400).json({ message });
    }
    next();
  });
};

// GET own profile
router.get("/:id", requireSelf, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// UPDATE own profile
router.put("/:id", requireSelf, async (req, res) => {
  try {
    const { name, email, bio } = req.body;

    if (!name || !name.trim() || !email || !email.trim()) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim(), email: email.trim(), bio: bio || "" },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "That email is already in use" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// UPLOAD own profile picture
router.post("/:id/picture", requireSelf, uploadPicture, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const profilePicUrl = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: profilePicUrl },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;