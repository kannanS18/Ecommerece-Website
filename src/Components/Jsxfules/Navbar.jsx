import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import "../Cssfiles/Navbar.css";
import { FaShoppingCart, FaUserCircle, FaSearch } from 'react-icons/fa';
import Login from './Login';
import Profile from './Profile';
import logo from '../../Images/Logo.png';

// Helper to convert category name to slug
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[\s/&]+/g, '-') // replace spaces, slashes, ampersands with dash
    .replace(/[^a-z0-9-]/g, ''); // remove other special chars
}

export default function Navbar({
  categories = [],
  cartCount,
  onCategorySelect,
  onCartClick,
  selectedCategory,
  user,
  onLogout,
  onProfileSave,
  setUser,
  onSearch // <-- add this prop
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef();
  // Add at the top with other useState hooks
  const [cartVisited, setCartVisited] = useState(false);
  function getProfilePhotoUrl(img) {
    try {
      if (
        img?.data?.data &&
        Array.isArray(img.data.data) &&
        typeof img.contentType === 'string'
      ) {
        const uint8Arr = new Uint8Array(img.data.data);
        const binary = uint8Arr.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
        const base64 = window.btoa(binary);
        return `data:${img.contentType};base64,${base64}`;
      }
    } catch {
      return null;
    }
    return null;
  }

  useEffect(() => {
    setDropdownOpen(false);
    if (user) setShowLogin(false);
  }, [user]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest('.navbar-user-dropdown-wrap')) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  useEffect(() => {
    if (onSearch) onSearch(search);
  }, [search, onSearch]);

  // Add this useEffect to your Navbar component
  useEffect(() => {
    // When cartCount increases, reset cartVisited to false (show blue badge)
    setCartVisited(false);
  }, [cartCount]);

  const photoUrl = getProfilePhotoUrl(user?.img);

  function getAvatarBgClass(gender) {
    if (!gender) return "avatar-grey";
    const g = gender.toLowerCase();
    if (g === "male") return "avatar-blue";
    if (g === "female") return "avatar-pink";
    if (g === "other") return "avatar-rainbow";
    return "avatar-grey";
  }

  // Helper to determine if a category is active
  const isCategoryActive = (cat) => {
    const slug = toSlug(cat);
    return location.pathname === `/category/${slug}`;
  };

  return (
    <>
      <nav className="navbar">
        {/* Logo (desktop only) */}
        <div className="navbar-logo">
          <NavLink to="/home">
            <img src={logo} alt="Bakery Logo" className="navbar-logo-img" />
          </NavLink>
        </div>

        {/* Search (always visible, left on mobile) */}
        <div className={`navbar-search ${search ? 'has-text' : 'has-icon'}`}>
          {!search && <FaSearch className="navbar-search-icon" />}
          <input
            ref={searchRef}
            type="text"
            className="navbar-search-input"
            placeholder="Search ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {/* Categories (desktop) */}
        <div className="navbar-buttons desktop-only">
          <NavLink
            to="/home"
            className={({ isActive }) => "nav-btn nav-home-btn navlinks" + (isActive ? " nav-btn-active" : "")}
          >
            Home
          </NavLink>
          {categories.map(cat => (
            <button
              key={cat}
              className={`nav-btn${isCategoryActive(cat) ? ' nav-btn-active' : ''}`}
              onClick={() => {
                onCategorySelect(cat);
                navigate(`/category/${toSlug(cat)}`);
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cart and User/Login (always right, always visible) */}
        <div className="navbar-right">
          <div className="navbar-cart">
            <button
              className={`nav-btn ${cartCount > 0 ? 'active-cart' : ''}`}
              onClick={() => {
                setCartVisited(true);
                onCartClick();
              }}
            >
              <FaShoppingCart size={28} />
              {cartCount > 0 && (
                <span className={`cart-badge${cartVisited || location.pathname === '/cart' ? " visited" : ""}`}>{cartCount}</span>
              )}
            </button>
          </div>
          <div className="navbar-user">
            {!user && (
              <button className="nav-btn" onClick={() => setShowLogin(true)}>
                <FaUserCircle size={28} />
              </button>
            )}
            {user && (
              <div className="navbar-user-dropdown-wrap">
                <div
                  className={`navbar-avatar ${!photoUrl ? getAvatarBgClass(user.gender) : ''}`}
                  onClick={() => setDropdownOpen(v => !v)}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt="User" className="navbar-avatar-img" />
                  ) : (user.name || user.registerName) ? (
                    <span>{(user.name || user.registerName).charAt(0).toUpperCase()}</span>
                  ) : (
                    <FaUserCircle size={32} />
                  )}
                </div>

                <div className="navbar-user-details">
                  <div><strong>{user.name || user.registerName}</strong></div>
                  
                </div>
                

                {dropdownOpen && (
                  <div className="navbar-dropdown show">
                    <button
                      className="navbar-dropdown-item"
                      onClick={() => {
                        setShowProfile(true);
                        setDropdownOpen(false);
                      }}
                    >
                      Show Profile
                    </button>
                    <button
                      className="navbar-dropdown-item"
                      onClick={() => {
                        onLogout();
                        setDropdownOpen(false);
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Burger icon (mobile/tablet only, far right) */}
          <button
            className="navbar-burger mobile-only"
            aria-label="Menu"
            onClick={() => setMobileMenuOpen(m => !m)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Mobile Categories Drawer */}
        {mobileMenuOpen && (
          <div className="navbar-mobile-menu mobile-only">
            <NavLink
              to="/home"
              className={({ isActive }) => "nav-btn nav-home-btn navlinks" + (isActive ? " nav-btn-active" : "")}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </NavLink>
            {categories.map(cat => (
              <button
                key={cat}
                className={`nav-btn${isCategoryActive(cat) ? ' nav-btn-active' : ''}`}
                onClick={() => {
                  onCategorySelect(cat);
                  navigate(`/category/${toSlug(cat)}`);
                  setMobileMenuOpen(false);
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Profile and Login Modals OUTSIDE the navbar */}
      {showProfile && user && (
        <Profile
          email={user.email}
          onSave={onProfileSave}
          onClose={() => setShowProfile(false)}
        />
      )}
      {showLogin && !user && (
        <div className="login-modal">
          <Login setUser={setUser} defaultTab="login" onClose={() => setShowLogin(false)} />
        </div>
      )}
    </>
  );
}