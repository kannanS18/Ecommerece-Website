import React from "react";
import "../Cssfiles/Footer.css";
import { NavLink } from "react-router-dom";
import logo from "../../Images/Logo.png"; // Adjust path if needed
// import {FaFacebook, FaInstagram} from "react-icons/fa";
import { FaInstagram, FaFacebookF, FaEnvelopeOpenText, FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
export default function Footer({ categories }) {
  // Array of bubble positions (spread across the width)
  const bubblePositions = [10, 30, 50, 70, 90, 110];

  return (
    <footer>
      <svg viewBox="0 0 120 28">
        <defs>
          <mask id="xxx">
            <circle cx="7" cy="12" r="40" fill="#fff" />
          </mask>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0  
                0 1 0 0 0  
                0 0 1 0 0  
                0 0 0 13 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
          <path
            id="wave"
            d="M 0,10 C 30,10 30,15 60,15 90,15 90,10 120,10 150,10 150,15 180,15 210,15 210,10 240,10 v 28 h -240 z"
          />
        </defs>
        <use id="wave3" className="wave" xlinkHref="#wave" x="0" y="-2" />
        <use id="wave2" className="wave" xlinkHref="#wave" x="0" y="0" />
        {/* Multiple popping bubbles across the width */}
        <g className="gooeff">
          {bubblePositions.map((cx, i) => (
            <circle
              key={i}
              className={`drop drop${i + 1}`}
              cx={cx}
              cy="2"
              r={1.2 + Math.random()} // randomize radius a bit
              style={{
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${4 + Math.random() * 2}s`,
              }}
            />
          ))}
          <use id="wave1" className="wave" xlinkHref="#wave" x="0" y="1" />
        </g>
      </svg>
    <div className="bakery-footer-main">
        {/* About Section */}
        <div className="bakery-footer-about">
          <img src={logo} alt="Bakery Logo" className="footer-logo-img" style={{ width: "40px", height: "40px" }} />
          <p className="bakery-footer-description">
            Doughy Delights brings you fresh, handcrafted bakery treats every day. Baked with love, served with joy!
          </p>
          <div className="bakery-footer-socials">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
          </div>
        </div>
        {/* Category Links */}
        <div className="bakery-footer-links">
          <h2>Categories</h2>
          <ul>
            {/* <li><a href="/">Home</a></li> */}
            {categories.map(cat => (
              <li key={cat}>
                <a href={`/category/${cat.toLowerCase().replace(/\s+/g, "-")}`}>{cat}</a>
              </li>
            ))}
          </ul>
        </div>
        <div className="bakery-footer-links">
          <h2>Quick Links</h2>
          <ul>
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/about">About Us</NavLink></li>
            <li><NavLink to="/contact">Contact Us</NavLink></li>
            <li><NavLink to="/cart">Cart</NavLink></li>
            
          </ul>
        </div>
        {/* Contact Info */}
        <div className="bakery-footer-contactus">
          <h2>Contact Us</h2>
          <ul className="bakery-footer-contact-list">
            <li>
              <FaPhoneAlt className="footer-icon" /> <a href="tel:+911234567890" className="bakery-footer-phone">+91 12345 67890</a>
            </li>
            <li>
              <FaEnvelopeOpenText className="footer-icon" /> <a href="mailto:hello@doughydelights.com" className="bakery-footer-email">hello@doughydelights.com</a>
            </li>
            <li>
              <FaMapMarkerAlt className="footer-icon" /> 123, Sweet Street, Metro City
            </li>
          </ul>
        </div>
      </div>
        <div style={{ fontSize: "15px", paddingBottom: 8, marginBottom: 30, textAlign: "center" }}>
          &copy; {new Date().getFullYear()} Doughy Delights. All rights reserved.
        </div>
      {/* </div> */}
    </footer>
  );
}