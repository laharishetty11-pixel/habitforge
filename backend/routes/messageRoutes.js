const express = require("express");
const Message = require("../models/Message");
const Group = require("../models/Group");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Every message route requires a valid login token
router.use(auth);

// True if the user is a member of the group
const isMember = (groupId, userId) =>
  Group.exists({ _id: groupId, members: userId });

// GET all messages for a group (members only, oldest to newest)
router.get("/:groupId", async (req, res) => {
  try {
    if (!(await isMember(req.params.groupId, req.user.id))) {
      return res.status(403).json({ message: "You're not a member of this group" });
    }

    const messages = await Message.find({ group: req.params.groupId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST a new message to a group (members only)
router.post("/", async (req, res) => {
  try {
    const { group, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({ message: "Message must be 500 characters or fewer" });
    }

    if (!(await isMember(group, req.user.id))) {
      return res.status(403).json({ message: "You're not a member of this group" });
    }

    const user = await User.findById(req.user.id).select("name profilePic");
    if (!user) {
      return res.status(401).json({ message: "Account not found" });
    }

    const newMessage = new Message({
      group,
      sender: req.user.id,
      senderName: user.name,
      senderPic: user.profilePic || "",
      text: text.trim(),
    });
    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE a message (only the person who sent it can delete it)
router.delete("/:id", async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await message.deleteOne();
    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;