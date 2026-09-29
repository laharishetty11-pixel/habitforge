const express = require("express");
const Habit = require("../models/Habit");
const Activity = require("../models/Activity");
const auth = require("../middleware/auth");

const router = express.Router();

// Every habit route requires a valid login token
router.use(auth);

// Finds a habit only if it belongs to the logged-in user
const findOwnHabit = (habitId, userId) =>
  Habit.findOne({ _id: habitId, user: userId });

// GET all habits for the logged-in user
router.get("/:userId", async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }
    const habits = await Habit.find({ user: req.user.id });
    res.status(200).json(habits);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// CREATE a new habit
router.post("/", async (req, res) => {
  try {
    const { name, category, note } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Habit name cannot be empty" });
    }

    const newHabit = new Habit({
      name: name.trim(),
      user: req.user.id,
      category,
      note,
    });
    await newHabit.save();

    await Activity.create({
      user: req.user.id,
      type: "added",
      message: `Added new habit "${newHabit.name}"`,
    });

    res.status(201).json(newHabit);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// UPDATE a habit (toggle today's completion)
router.put("/:id", async (req, res) => {
  try {
    const habit = await findOwnHabit(req.params.id, req.user.id);
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    // Get today's date in local (IST) format, matching the frontend
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC+5:30
    const istNow = new Date(now.getTime() + istOffset);
    const todayStr = istNow.toISOString().split("T")[0];

    const dateIndex = habit.completedDates.indexOf(todayStr);

    if (dateIndex === -1) {
      habit.completedDates.push(todayStr);
      await Activity.create({
        user: req.user.id,
        type: "completed",
        message: `Completed "${habit.name}" 🎉`,
      });
    } else {
      habit.completedDates.splice(dateIndex, 1);
    }

    await habit.save();
    res.status(200).json(habit);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// RENAME a habit
router.patch("/:id/rename", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Habit name cannot be empty" });
    }

    const habit = await findOwnHabit(req.params.id, req.user.id);
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const oldName = habit.name;
    habit.name = name.trim();
    await habit.save();

    await Activity.create({
      user: req.user.id,
      type: "renamed",
      message: `Renamed "${oldName}" to "${habit.name}"`,
    });

    res.status(200).json(habit);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// UPDATE a habit's category
router.patch("/:id/category", async (req, res) => {
  try {
    const { category } = req.body;
    const allowed = ["Health", "Work", "Learning", "Personal", "Other"];

    if (!allowed.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const habit = await findOwnHabit(req.params.id, req.user.id);
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    habit.category = category;
    await habit.save();

    res.status(200).json(habit);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// UPDATE a habit's reminder note
router.patch("/:id/note", async (req, res) => {
  try {
    const { note } = req.body;

    if (note && note.length > 200) {
      return res.status(400).json({ message: "Note must be 200 characters or fewer" });
    }

    const habit = await findOwnHabit(req.params.id, req.user.id);
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    habit.note = note ? note.trim() : "";
    await habit.save();

    res.status(200).json(habit);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE a habit
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Habit.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Habit not found" });
    }
    res.status(200).json({ message: "Habit deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;