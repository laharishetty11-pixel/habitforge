import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

function Groups() {
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");
  const [joinMessage, setJoinMessage] = useState("");

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  useEffect(() => {
    if (userId) {
      fetchGroups();
    }
    // eslint-disable-next-line
  }, [userId]);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/groups/${userId}`);
      setGroups(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const addGroup = async () => {
    if (newGroup.trim() === "") return;
    if (!userId) {
      setMessage("Please login first to create groups.");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/groups`, {
        name: newGroup,
        userId: userId,
      });
      setGroups([...groups, res.data]);
      setNewGroup("");
    } catch (error) {
      setMessage("Something went wrong");
    }
  };

  const joinGroup = async () => {
    if (joinCode.trim() === "") return;
    if (!userId) {
      setJoinMessage("Please login first to join groups.");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/groups/join`, {
        code: joinCode,
        userId: userId,
      });
      setGroups([...groups, res.data]);
      setJoinCode("");
      setJoinMessage("");
    } catch (error) {
      setJoinMessage(error.response?.data?.message || "Something went wrong");
    }
  };

  const leaveGroup = async (group) => {
    const isLastMember = group.members.length <= 1;

    const confirmed = window.confirm(
      isLastMember
        ? `You're the only member of "${group.name}". Leaving will permanently delete the group and all its messages.`
        : `Leave "${group.name}"? You can rejoin later with the join code (${group.joinCode}).`
    );
    if (!confirmed) return;

    try {
      await axios.post(`${API_URL}/api/groups/${group._id}/leave`, {
        userId: userId,
      });
      setGroups(groups.filter((g) => g._id !== group._id));
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not leave the group");
    }
  };

  return (
    <div className="groups-page">
      <h1>My Groups</h1>

      {!userId && (
        <div className="dashboard-alert">
          You're not logged in. Please <Link to="/login">login</Link> to manage your groups.
        </div>
      )}

      <div className="group-form-row">
        <input
          type="text"
          placeholder="Enter a join code (e.g. AB12CD)"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={6}
        />
        <button onClick={joinGroup} className="btn btn-outline">
          🔑 Join Group
        </button>
      </div>

      {joinMessage && <p className="auth-message error">{joinMessage}</p>}

      <div className="group-form-row">
        <input
          type="text"
          placeholder="Enter a new group name"
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value)}
        />
        <button onClick={addGroup} className="btn btn-primary">
          ➕ Create Group
        </button>
      </div>

      {message && <p className="auth-message error">{message}</p>}

      {groups.length === 0 ? (
        <p className="groups-empty">You haven't joined any groups yet.</p>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => (
            <div key={group._id} className="group-card">
              <Link to={`/groups/${group._id}`} className="group-card-link">
                <h3>{group.name}</h3>
                <p className="group-members">👥 {group.members.length} members</p>
                <p className="group-join-code">
                  Join code: <span>{group.joinCode}</span>
                </p>
              </Link>
              <button onClick={() => leaveGroup(group)} className="btn btn-danger">
                🚪 Leave Group
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Groups;