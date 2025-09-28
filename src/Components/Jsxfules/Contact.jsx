import React, { useState } from "react";
import "../Cssfiles/Contact.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faPhone, faLocationDot } from "@fortawesome/free-solid-svg-icons";
// import myPhoto from "../assets/kannan.jpg";

export default function Contact() {
  const [form, setForm] = useState({
    Name: "",
    email: "",
    category: "",
    message: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'https://ecommerece-website-1.onrender.com'}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("Message sent!");
        setForm({ Name: "", email: "", category: "", message: "" });
      } else {
        setStatus("Failed to send.");
      }
    } catch {
      setStatus("Failed to send.");
    }
  };

  return (
    <section className="contact-section">
      <div className="contact-container">

        {/* Contact Info */}
        <div className="contact-info">
          <h1>CONTACT ME</h1>

          <div className="contact-item">
            <FontAwesomeIcon icon={faLocationDot} className="icon" />
            <div>
              <h2>Address</h2>
              <p>48/9, Alagiri Nagar Main Road</p>
              <p>Vadapalani</p>
              <p>Chennai-26</p>
            </div>
          </div>

          <div className="contact-item">
            <FontAwesomeIcon icon={faPhone} className="icon" />
            <div>
              <h2>Phone</h2>
              <p>+91 8072212411</p>
            </div>
          </div>

          <div className="contact-item">
            <FontAwesomeIcon icon={faEnvelope} className="icon" />
            <div>
              <h2>Email</h2>
              <p>kannansformal@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Optional Image Section */}
        {/* <div className="contact-image">
          <img src={myPhoto} alt="kannan" />
        </div> */}

        {/* Contact Form */}
        <div className="Form">
          <h1>FEED BACK</h1>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form-row">
              <input
                type="text"
                name="Name"
                placeholder="Name"
                value={form.Name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <select
              name="category"
              className="form-control form-group"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select Class</option>
              <option value="Snacks">Snacks</option>
              <option value="Dessert">Dessert</option>
              <option value="Baked Goods">Baked Goods</option>
              <option value="Main course">Main course</option>
              <option value="Salads">Salads</option>
            </select>

            <textarea
              name="message"
              placeholder="Message"
              rows={5}
              value={form.message}
              onChange={handleChange}
              required
            />

            <button type="submit">Send Message</button>
            <div className="form-status">{status}</div>
          </form>
        </div>
      </div>
    </section>
  );
}
