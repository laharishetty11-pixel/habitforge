import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

const CATEGORIES = ["Health", "Work", "Learning", "Personal", "Other"];

const CATEGORY_COLORS = {
  Health: { bg: "#d1fae5", text: "#059669" },
  Work: { bg: "#e0e7ff", text: "#4338ca" },
  Learning: { bg: "#fef3c7", text: "#b45309" },
  Personal: { bg: "#fce7f3", text: "#be185d" },
  Other: { bg: "#e2e8f0", text: "#475569" },
};

function Habits() {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState("");
  const [newCategory, setNewCategory] = useState("Other");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [noteEditingId, setNoteEditingId] = useState(null);
  const [noteValue, setNoteValue] = useState("");

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (userId) {
      fetchHabits();
    }
    // eslint-disable-next-line
  }, [userId]);

  const fetchHabits = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/habits/${userId}`);
      setHabits(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const addHabit = async () => {
    if (newHabit.trim() === "") return;
    if (!userId) {
      setMessage("Please login first to add habits.");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/habits`, {
        name: newHabit,
        user: userId,
        category: newCategory,
      });
      setHabits([...habits, res.data]);
      setNewHabit("");
      setNewCategory("Other");
    } catch (error) {
      setMessage("Something went wrong");
    }
  };

  const toggleComplete = async (id) => {
    try {
      const res = await axios.put(`${API_URL}/api/habits/${id}`);
      setHabits(habits.map((h) => (h._id === id ? res.data : h)));
    } catch (error) {
      console.log(error);
    }
  };

  const deleteHabit = async (id, name) => {
    const confirmed = window.confirm(`Delete "${name}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/api/habits/${id}`);
      setHabits(habits.filter((h) => h._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  const startEditing = (habit) => {
    setEditingId(habit._id);
    setEditValue(habit.name);
    setMessage("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveRename = async (id) => {
    if (editValue.trim() === "") {
      setMessage("Habit name cannot be empty");
      return;
    }
    try {
      const res = await axios.patch(`${API_URL}/api/habits/${id}/rename`, {
        name: editValue,
      });
      setHabits(habits.map((h) => (h._id === id ? res.data : h)));
      setEditingId(null);
      setEditValue("");
    } catch (error) {
      setMessage("Something went wrong while renaming");
    }
  };

  const handleEditKeyDown = (e, id) => {
    if (e.key === "Enter") {
      saveRename(id);
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const changeCategory = async (id, category) => {
    try {
      const res = await axios.patch(`${API_URL}/api/habits/${id}/category`, {
        category,
      });
      setHabits(habits.map((h) => (h._id === id ? res.data : h)));
    } catch (error) {
      console.log(error);
    }
  };

  const startNoteEditing = (habit) => {
    setNoteEditingId(habit._id);
    setNoteValue(habit.note || "");
  };

  const cancelNoteEditing = () => {
    setNoteEditingId(null);
    setNoteValue("");
  };

  const saveNote = async (id) => {
    try {
      const res = await axios.patch(`${API_URL}/api/habits/${id}/note`, {
        note: noteValue,
      });
      setHabits(habits.map((h) => (h._id === id ? res.data : h)));
      setNoteEditingId(null);
      setNoteValue("");
    } catch (error) {
      setMessage("Something went wrong while saving the note");
    }
  };

  // Calculate current streak from completedDates
  const calculateStreak = (completedDates) => {
    if (!completedDates || completedDates.length === 0) return 0;

    const dateSet = new Set(completedDates);
    let streak = 0;
    let checkDate = new Date();

    // If today isn't completed, start checking from yesterday instead
    if (!dateSet.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (dateSet.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  return (
    <div className="habits-page">
      <h1>My Habits</h1>

      {!userId && (
        <div className="dashboard-alert">
          You're not logged in. Please <Link to="/login">login</Link> to manage your habits.
        </div>
      )}

      <div className="habit-form-row">
        <input
          type="text"
          placeholder="Enter a new habit"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="habit-category-select"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button onClick={addHabit} className="btn btn-primary">
          ➕ Add Habit
        </button>
      </div>

      {message && <p className="auth-message error">{message}</p>}

      {habits.length === 0 ? (
        <p className="habits-empty">No habits yet — add your first one above.</p>
      ) : (
        <div className="habits-container">
          {habits.map((habit) => {
            const isDoneToday = habit.completedDates?.includes(todayStr);
            const streak = calculateStreak(habit.completedDates);
            const isEditing = editingId === habit._id;
            const isNoteEditing = noteEditingId === habit._id;
            const category = habit.category || "Other";
            const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;

            return (
              <div
                key={habit._id}
                className={`habit-card ${isDoneToday ? "completed" : ""}`}
              >
                <div className="habit-card-main">
                  <div className="habit-info">
                    <span className="habit-icon">🎯</span>
                    <div>
                      <div className="habit-name-row">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, habit._id)}
                            autoFocus
                            className="habit-edit-input"
                          />
                        ) : (
                          <span className={`habit-name ${isDoneToday ? "done" : ""}`}>
                            {habit.name}
                          </span>
                        )}
                        <span
                          className="habit-category-badge"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {category}
                        </span>
                      </div>
                      <span className="habit-streak">
                        🔥 {streak} day{streak !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="habit-actions">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveRename(habit._id)}
                          className="btn btn-toggle"
                        >
                          💾 Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="btn btn-secondary"
                        >
                          ✖️ Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <select
                          value={category}
                          onChange={(e) => changeCategory(habit._id, e.target.value)}
                          className="habit-category-select-small"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => toggleComplete(habit._id)}
                          className="btn btn-toggle"
                        >
                          {isDoneToday ? "↩️ Undo" : "✅ Done"}
                        </button>
                        <button
                          onClick={() => startEditing(habit)}
                          className="btn btn-secondary"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteHabit(habit._id, habit.name)}
                          className="btn btn-danger"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Reminder note section */}
                <div className="habit-note-section">
                  {isNoteEditing ? (
                    <div className="habit-note-edit-row">
                      <textarea
                        value={noteValue}
                        onChange={(e) => setNoteValue(e.target.value)}
                        placeholder="Add a reminder note (e.g. 'Do this right after breakfast')"
                        maxLength={200}
                        className="habit-note-textarea"
                        autoFocus
                      />
                      <div className="habit-note-actions">
                        <button
                          onClick={() => saveNote(habit._id)}
                          className="btn btn-toggle"
                        >
                          💾 Save Note
                        </button>
                        <button
                          onClick={cancelNoteEditing}
                          className="btn btn-secondary"
                        >
                          ✖️ Cancel
                        </button>
                      </div>
                    </div>
                  ) : habit.note ? (
                    <div
                      className="habit-note-display"
                      onClick={() => startNoteEditing(habit)}
                      title="Click to edit note"
                    >
                      📝 {habit.note}
                    </div>
                  ) : (
                    <button
                      onClick={() => startNoteEditing(habit)}
                      className="habit-note-add-btn"
                    >
                      📝 Add reminder note
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Habits;