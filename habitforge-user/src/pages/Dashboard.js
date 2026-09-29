import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

function Dashboard() {
  const [userName, setUserName] = useState("User");
  const [habits, setHabits] = useState([]);
  const [groupsCount, setGroupsCount] = useState(0);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = storedUser?.id;

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setUserName(storedUser.name || "User");

    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const habitsRes = await axios.get(`${API_URL}/api/habits/${userId}`);
        setHabits(habitsRes.data);

        const groupsRes = await axios.get(`${API_URL}/api/groups/${userId}`);
        setGroupsCount(groupsRes.data.length);

        const activityRes = await axios.get(`${API_URL}/api/activity/${userId}`);
        setActivities(activityRes.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line
  }, [userId]);

  const calculateStreak = (completedDates) => {
    if (!completedDates || completedDates.length === 0) return 0;

    const dateSet = new Set(completedDates);
    let streak = 0;
    let checkDate = new Date();

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

  const bestStreak = habits.reduce((max, h) => {
    const streak = calculateStreak(h.completedDates);
    return streak > max ? streak : max;
  }, 0);

  const missedToday = habits.filter((h) => !h.completedDates?.includes(todayStr));
  const completedToday = habits.filter((h) => h.completedDates?.includes(todayStr));

  const toggleComplete = async (id) => {
    try {
      const res = await axios.put(`${API_URL}/api/habits/${id}`);
      setHabits(habits.map((h) => (h._id === id ? res.data : h)));

      const activityRes = await axios.get(`${API_URL}/api/activity/${userId}`);
      setActivities(activityRes.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Build last 7 days (oldest to newest) with completion % across all habits
  const buildWeeklyData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });

      const completedCount = habits.filter((h) =>
        h.completedDates?.includes(dateStr)
      ).length;

      const percent =
        habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

      days.push({ dateStr, label, completedCount, percent, isToday: dateStr === todayStr });
    }
    return days;
  };

  const weeklyData = buildWeeklyData();

  // Format a timestamp as relative time (e.g. "5m ago", "2h ago", "3d ago")
  const timeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const activityIcon = (type) => {
    if (type === "completed") return "✅";
    if (type === "added") return "➕";
    if (type === "renamed") return "✏️";
    return "•";
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner-sm"></div>
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-welcome">Welcome back, {userName} 👋</p>
      </div>

      {!userId && (
        <div className="dashboard-alert">
          You're not logged in. Please <Link to="/login">login</Link> to see your dashboard.
        </div>
      )}

      <div className="dashboard-stats">
        <div className="stat-card streak">
          <div className="stat-icon">🔥</div>
          <p className="stat-label">Current Streak</p>
          <p className="stat-value">{bestStreak} Days</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <p className="stat-label">Habits</p>
          <p className="stat-value">{habits.length}</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <p className="stat-label">Groups</p>
          <p className="stat-value">{groupsCount}</p>
        </div>
      </div>

      {userId && habits.length > 0 && (
        <>
          <div className="dashboard-today">
            <div className="today-section">
              <h2 className="today-section-title">
                🕒 Missed Today <span className="today-count">{missedToday.length}</span>
              </h2>
              {missedToday.length === 0 ? (
                <p className="today-empty">Nothing missed — you're all caught up! 🎉</p>
              ) : (
                <ul className="today-list">
                  {missedToday.map((h) => (
                    <li key={h._id} className="today-item">
                      <span className="today-item-name">{h.name}</span>
                      <button
                        className="btn btn-toggle today-item-btn"
                        onClick={() => toggleComplete(h._id)}
                      >
                        ✅ Done
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="today-section">
              <h2 className="today-section-title">
                ✅ Completed Today <span className="today-count">{completedToday.length}</span>
              </h2>
              {completedToday.length === 0 ? (
                <p className="today-empty">Nothing completed yet today.</p>
              ) : (
                <ul className="today-list">
                  {completedToday.map((h) => (
                    <li key={h._id} className="today-item done">
                      <span className="today-item-name">{h.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="weekly-chart-section">
            <h2 className="today-section-title">📊 Weekly Progress</h2>
            <div className="weekly-chart">
              {weeklyData.map((day) => (
                <div className="weekly-bar-col" key={day.dateStr}>
                  <div className="weekly-bar-track">
                    <div
                      className="weekly-bar-fill"
                      style={{ height: `${day.percent}%` }}
                      title={`${day.completedCount}/${habits.length} habits`}
                    ></div>
                  </div>
                  <span className={`weekly-bar-label ${day.isToday ? "today" : ""}`}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-feed-section">
            <h2 className="today-section-title">🕘 Recent Activity</h2>
            {activities.length === 0 ? (
              <p className="today-empty">No activity yet — start completing habits!</p>
            ) : (
              <ul className="activity-feed-list">
                {activities.map((a) => (
                  <li key={a._id} className="activity-feed-item">
                    <span className="activity-feed-icon">{activityIcon(a.type)}</span>
                    <span className="activity-feed-message">{a.message}</span>
                    <span className="activity-feed-time">{timeAgo(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;