import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

function Profile() {
  const [profile, setProfile] = useState({ name: "", email: "", bio: "", profilePic: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", bio: "" });
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
    // eslint-disable-next-line
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users/${userId}`);
      setProfile(res.data);
      setFormData(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveChanges = async () => {
    try {
      const res = await axios.put(`${API_URL}/api/users/${userId}`, {
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
      });
      setProfile(res.data);
      setIsEditing(false);
      setMessage("Profile updated successfully");

      // Update localStorage too, so navbar/other pages stay accurate
      const updatedUser = { ...storedUser, name: res.data.name, email: res.data.email };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      setMessage("Something went wrong");
    }
  };

  const cancelEdit = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handlePictureClick = () => {
    fileInputRef.current.click();
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const uploadData = new FormData();
    uploadData.append("profilePic", file);

    try {
      const res = await axios.post(
        `${API_URL}/api/users/${userId}/picture`,
        uploadData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setProfile(res.data);
      setMessage("Profile picture updated");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to upload picture");
    } finally {
      setUploading(false);
    }
  };

  if (!userId) {
    return (
      <div className="profile-page">
        <h1>My Profile</h1>
        <div className="dashboard-alert">
          You're not logged in. Please <Link to="/login">login</Link> to view your profile.
        </div>
      </div>
    );
  }

  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : "?";

  return (
    <div className="profile-page">
      <h1>My Profile</h1>

      <div className="profile-card">
        <div className="profile-avatar-wrap" onClick={handlePictureClick}>
          {profile.profilePic ? (
            <img
              src={`${API_URL}${profile.profilePic}`}
              alt="Profile"
              className="profile-avatar-img"
            />
          ) : (
            <div className="profile-avatar">{initial}</div>
          )}
          <div className="profile-avatar-overlay">
            {uploading ? "Uploading..." : "📷 Change"}
          </div>
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          ref={fileInputRef}
          onChange={handlePictureChange}
          style={{ display: "none" }}
        />

        {!isEditing ? (
          <>
            <p className="profile-field"><strong>Name:</strong> {profile.name}</p>
            <p className="profile-field"><strong>Email:</strong> {profile.email}</p>
            <p className="profile-field"><strong>Bio:</strong> {profile.bio || "No bio yet."}</p>

            <button onClick={() => setIsEditing(true)} className="btn btn-primary">
              ✏️ Edit Profile
            </button>
          </>
        ) : (
          <>
            <div className="profile-form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="profile-form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="profile-form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="profile-actions">
              <button onClick={saveChanges} className="btn btn-primary">
                💾 Save
              </button>
              <button onClick={cancelEdit} className="btn btn-secondary">
                ❌ Cancel
              </button>
            </div>
          </>
        )}

        {message && <p className="profile-message">{message}</p>}
      </div>
    </div>
  );
}

export default Profile;