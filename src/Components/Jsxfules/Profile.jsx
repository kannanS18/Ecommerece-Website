import React, { useState, useEffect } from 'react';
import '../Cssfiles/Profile.css';
import axios from 'axios';

export default function Profile({ email, onClose, onSave }) {
    const [showImgModal, setShowImgModal] = useState(false);
  const [originalForm, setOriginalForm] = useState(null);
  const [img, setImg] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    userName: '',
    address: '',
    phone: '',
    gender: '',
    age: '',
    img: null
  });
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Fetch user data from backend on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        // setLoading(true);
        // setError('');
        const res = await axios.get(`http://localhost:5000/api/user/${email}`);
        const userData = {
          name: res.data.name || '',
          email: res.data.email || '',
          userName: res.data.userName || '',
          address: res.data.address || '',
          phone: res.data.phone || '',
          gender: res.data.gender || '',
          age: res.data.age || '',
          img: res.data.img || null
        };
        setForm(userData);
        setOriginalForm(userData);
      } catch (err) {
        // setError('Failed to load user data.');
      } finally {
        // setLoading(false);
      }
    }
    if (email) fetchUser();
  }, [email]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRemoveImg = async () => {
    try {
      await axios.put(`http://localhost:5000/api/user/${email}`, { removeImg: true });
      setImg(null);
      setForm(f => ({ ...f, img: null }));
      const res = await axios.get(`http://localhost:5000/api/user/${email}`);
      onSave(res.data);
    } catch (err) {
      alert('Failed to remove image.');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // setError('');
    const hasChanged = Object.keys(form).some(
      key => form[key] !== (originalForm ? originalForm[key] : '')
    );
    if (!hasChanged && !img) {
      alert('No changes made.');
      return;
    }
    if (/[\s!@#$%^&*(),.?":{}|<>]/.test(form.name[0])) {
      // setError('User Name must start with a letter or number');
      alert('Name must start with a letter or number');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('userName', form.userName);
      formData.append('address', form.address);
      formData.append('phone', form.phone);
      formData.append('gender', form.gender);
      formData.append('age', form.age);
      if (img) formData.append('img', img);

      await axios.put(`http://localhost:5000/api/user/${email}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Fetch updated user and update parent state
      const res = await axios.get(`http://localhost:5000/api/user/${email}`);
      onSave(res.data);
  
      setForm({
        name: res.data.name || '',
        email: res.data.email || '',
        userName: res.data.userName || '',
        address: res.data.address || '',
        phone: res.data.phone || '',
        gender: res.data.gender || '',
        age: res.data.age || '',
        img: res.data.img || null
      });
      setOriginalForm({
        name: res.data.name || '',
        email: res.data.email || '',
        userName: res.data.userName || '',
        address: res.data.address || '',
        phone: res.data.phone || '',
        gender: res.data.gender || '',
        age: res.data.age || '',
        img: res.data.img || null
      });
      setEditMode(false);
      setImg(null);
    }catch (err) {
  alert(err.response?.data?.error || 'Failed to update profile.');
  // Reset form to original values if update failed
  setForm(originalForm);
  setImg(null);
}
  };

    function getAvatarBgColor(gender) {
  if (!gender) return "#bdbdbd"; // grey for not given
  if (gender.toLowerCase() === "male") return "#2196f3"; // blue
  if (gender.toLowerCase() === "female") return "#e91e63"; // pink
  if (gender.toLowerCase() === "other") return "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)"; // rainbow
  return "#bdbdbd"; // fallback grey
}
function getWaveSVG(gender) {
  let fill = "#1976d2"; // default blue
  let fillOpacity = "0.7";
  if (!gender) {
    fill = "#bdbdbd"; // grey
  } else if (gender.toLowerCase() === "female") {
    fill = "#e91e63"; // pink
  } else if (gender.toLowerCase() === "other") {
    // rainbow gradient as a base64 SVG
    return `url('data:image/svg+xml;utf8,<svg width="100%" height="120" viewBox="0 0 370 120" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="rainbow" x1="0" y1="0" x2="370" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="red"/><stop offset="0.16" stop-color="orange"/><stop offset="0.33" stop-color="yellow"/><stop offset="0.5" stop-color="green"/><stop offset="0.66" stop-color="blue"/><stop offset="0.83" stop-color="indigo"/><stop offset="1" stop-color="violet"/></linearGradient></defs><path d="M0 80 Q92.5 10 185 80 T370 80 V0 H0 Z" fill="url(%23rainbow)" fill-opacity="0.7"/></svg>')`;
  }
  // encode the fill color for SVG
  const encodedFill = encodeURIComponent(fill);
  return `url('data:image/svg+xml;utf8,<svg width="100%" height="120" viewBox="0 0 370 120" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 80 Q92.5 10 185 80 T370 80 V0 H0 Z" fill="${encodedFill}" fill-opacity="${fillOpacity}"/></svg>')`;
}

  // Utility to get photo URL from MongoDB buffer
  function getProfilePhotoUrl(img) {
    try {
      if (
        img &&
        img.data &&
        img.data.data &&
        Array.isArray(img.data.data) &&
        typeof img.contentType === "string"
      ) {
        const uint8Arr = new Uint8Array(img.data.data);
        let binary = "";
        for (let i = 0; i < uint8Arr.length; i++) {
          binary += String.fromCharCode(uint8Arr[i]);
        }
        const base64 = window.btoa(binary);
        return `data:${img.contentType};base64,${base64}`;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  const photoUrl = getProfilePhotoUrl(form.img);



   if (editMode) {
    return (
      <div className="profile-modal">
        <form className="profile-form" onSubmit={handleSubmit}>
          <h2>Edit Profile</h2>
          <label>
            <input
              type="file"
              name="img"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={e => {
                const file = e.target.files[0];
                setImg(file);
                setForm(prev => ({ ...prev, img: file }));
              }}
            />
          </label>
          <button
            type="button"
            style={{
              margin: "8px 0",
              color: "#d32f2f",
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
            onClick={handleRemoveImg}
          >
            Remove Image
          </button>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Email
            <input name="email" value={form.email} disabled style={{ background: "#f2f2f2" }} />
          </label>
          <label>
            User Name
            <input name="userName" value={form.userName} onChange={handleChange} />
          </label>
          <label>
            Age
            <input
              name="age"
              type="number"
              inputMode="numeric"
              min="0"
              max="120"
              value={form.age}
              onChange={handleChange}
              placeholder="Enter your age"
              style={{ MozAppearance: "textfield" }}
            />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>
          <label>
            Address
            <textarea name="address" value={form.address} className="profile-address-textarea" placeholder="Enter your address" onChange={handleChange} />
          </label>
          <label>
            Gender
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="" disabled hidden>
                Gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditMode(false)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Profile Card (view mode)
  return (
    <>
        <aside
          className="profile-card"
          style={{
            "--profile-wave-bg": getWaveSVG(form.gender)
          }}
        >
    <div className="profile-card-content">
      <div className="profile-card-img">
        {photoUrl ? (
                <a
                  href="#!"
                  onClick={e => {
                    e.preventDefault();
                    setShowImgModal(true);
                  }}
                  tabIndex={0}
                  aria-label="View full profile image"
                  style={{ textDecoration: "none" }}
                >
                  <img src={photoUrl} alt="Profile" />
                </a>
              ) : (
                <div
                  className="profile-avatar-fallback"
                  style={{
                    background: form.gender && form.gender.toLowerCase() === "other"
                      ? "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)"
                      : getAvatarBgColor(form.gender),
                    backgroundImage: form.gender && form.gender.toLowerCase() === "other"
                      ? "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)"
                      : undefined,
                    color: "#fff"
                  }}
                >
                  {(form.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
      </div>
      <div className="profile-card-header">
    <div className="profile-name">{form.name || "Your Name"}</div>
    <div className="profile-username">@{form.userName || "username"}</div>
  </div>

  <div className="profile-details-grid">
    <div className="detail-label">Phone:</div>
    <div className="detail-value">{form.phone}</div>
    <div className="detail-label">Email:</div>
    <div className="detail-value">{form.email}</div>

    <div className="detail-label">Gender:</div>
    <div className="detail-value">{form.gender || "N/A"}</div>
    <div className="detail-label">Age:</div>
    <div className="detail-value">{form.age || "N/A"}</div>
  </div>
  <div className="profile-actions">
    <button onClick={() => setEditMode(true)}>Edit</button>
    <button onClick={onClose}>Close</button>
  </div>
</div>
  </aside>

  {showImgModal && (
    <div className="profile-img-modal" onClick={() => setShowImgModal(false)}>
      <div className="profile-img-modal-content" onClick={e => e.stopPropagation()}>
        <img src={photoUrl} alt="Full Profile" />
        <button className="close-img-modal" onClick={() => setShowImgModal(false)}>×</button>
      </div>
    </div>
  )}
  </>
  );
}