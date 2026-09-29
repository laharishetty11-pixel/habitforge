const express = require("express");
const Activity = require("../models/Activity");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

// GET the 10 most recent activity entries for the logged-in user
router.get("/:userId", async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const activities = await Activity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;