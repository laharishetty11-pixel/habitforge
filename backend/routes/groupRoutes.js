const express = require("express");
const Group = require("../models/Group");
const Message = require("../models/Message");
const auth = require("../middleware/auth");

const router = express.Router();

// Every group route requires a valid login token
router.use(auth);

// Generate a random 6-character join code (avoids confusing chars like 0/O, 1/I)
const generateJoinCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Keep generating until we get a code that isn't already in use
const generateUniqueJoinCode = async () => {
  let code;
  let exists = true;
  while (exists) {
    code = generateJoinCode();
    exists = await Group.exists({ joinCode: code });
  }
  return code;
};

// GET all groups the logged-in user belongs to
router.get("/:userId", async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const groups = await Group.find({ members: req.user.id });

    // Older groups created before join codes existed get one assigned here
    for (const group of groups) {
      if (!group.joinCode) {
        const code = await generateUniqueJoinCode();
        await Group.updateOne({ _id: group._id }, { $set: { joinCode: code } });
        group.joinCode = code;
      }
    }

    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// CREATE a new group (creator is automatically added as a member)
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name cannot be empty" });
    }

    const joinCode = await generateUniqueJoinCode();

    const newGroup = new Group({
      name: name.trim(),
      members: [req.user.id],
      createdBy: req.user.id,
      joinCode,
    });
    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// JOIN a group using its join code
router.post("/join", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Please enter a join code" });
    }

    const group = await Group.findOne({ joinCode: code.trim().toUpperCase() });

    if (!group) {
      return res.status(404).json({ message: "No group found with that code" });
    }

    if (group.members.some((m) => m.toString() === req.user.id)) {
      return res.status(400).json({ message: "You're already in this group" });
    }

    group.members.push(req.user.id);
    await group.save();

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// LEAVE a group — removes only the logged-in user.
// If they were the last member, the group and its messages are deleted.
router.post("/:id/leave", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some((m) => m.toString() === req.user.id);
    if (!isMember) {
      return res.status(400).json({ message: "You're not a member of this group" });
    }

    const updated = await Group.findByIdAndUpdate(
      req.params.id,
      { $pull: { members: req.user.id } },
      { new: true }
    );

    if (updated.members.length === 0) {
      await Message.deleteMany({ group: updated._id });
      await Group.findByIdAndDelete(updated._id);
      return res.status(200).json({ message: "Group deleted (no members left)", deleted: true });
    }

    res.status(200).json({ message: "You left the group", deleted: false });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;