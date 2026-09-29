import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

function GroupDetail() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myPic, setMyPic] = useState("");
  const chatEndRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = storedUser?.id;
  const userName = storedUser?.name || "User";

  useEffect(() => {
    fetchGroupAndMessages();
    fetchMyProfile();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMyProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users/${userId}`);
      setMyPic(res.data.profilePic || "");
    } catch (error) {
      console.log(error);
    }
  };

  const fetchGroupAndMessages = async () => {
    try {
      const groupsRes = await axios.get(`${API_URL}/api/groups/${userId}`);
      const currentGroup = groupsRes.data.find((g) => g._id === id);
      setGroup(currentGroup);

      const messagesRes = await axios.get(`${API_URL}/api/messages/${id}`);
      setMessages(messagesRes.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/messages/${id}`);
      setMessages(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === "" || sending) return;
    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/api/messages`, {
        group: id,
        sender: userId,
        senderName: userName,
        senderPic: myPic,
        text: newMessage,
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (error) {
      console.log(error);
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId) => {
    const confirmed = window.confirm("Delete this message? This can't be undone.");
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/api/messages/${messageId}`, {
        data: { userId },
      });
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (error) {
      console.log(error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner-sm"></div>
        Loading group...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-detail-page">
        <p className="groups-empty">Group not found.</p>
        <Link to="/groups" className="btn btn-secondary">← Back to Groups</Link>
      </div>
    );
  }

  return (
    <div className="group-detail-page">
      <Link to="/groups" className="group-detail-back">← Back to Groups</Link>

      <div className="group-detail-header">
        <h1>{group.name}</h1>
        <p className="group-detail-meta">
          👥 {group.members.length} members · Join code:{" "}
          <span className="group-join-code-inline">{group.joinCode}</span>
        </p>
      </div>

      <div className="group-chat-box">
        <div className="group-chat-messages">
          {messages.length === 0 ? (
            <p className="today-empty">No messages yet — say hello! 👋</p>
          ) : (
            messages.map((m) => {
              const isOwn = m.sender === userId;
              const initial = m.senderName ? m.senderName.charAt(0).toUpperCase() : "?";

              return (
                <div
                  key={m._id}
                  className={`chat-message ${isOwn ? "own" : ""}`}
                >
                  {!isOwn &&
                    (m.senderPic ? (
                      <img
                        src={`${API_URL}${m.senderPic}`}
                        alt={m.senderName}
                        className="chat-avatar"
                      />
                    ) : (
                      <div className="chat-avatar chat-avatar-initial">{initial}</div>
                    ))}
                  <div className="chat-message-bubble">
                    {!isOwn && (
                      <span className="chat-message-sender">{m.senderName}</span>
                    )}
                    <span className="chat-message-text">{m.text}</span>
                    <div className="chat-message-meta">
                      {isOwn && (
                        <button
                          className="chat-message-delete"
                          onClick={() => deleteMessage(m._id)}
                          title="Delete message"
                        >
                          🗑️
                        </button>
                      )}
                      <span className="chat-message-time">{formatTime(m.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef}></div>
        </div>

        <div className="group-chat-input-row">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={500}
          />
          <button onClick={sendMessage} className="btn btn-primary" disabled={sending}>
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupDetail;