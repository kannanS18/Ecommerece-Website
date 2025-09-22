import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import Navbar from '../Components/Jsxfules/Navbar';
import Home from '../Components/Jsxfules/Home';
import Cart from '../Components/Jsxfules/Cart';
import Login from '../Components/Jsxfules/Login';
import Homepage from '../Components/Jsxfules/Homepage';
import Profile from '../Components/Jsxfules/Profile';
import Success from '../Components/Jsxfules/Sucess';
import Footer from '../Components/Jsxfules/Footer';
import Contact from '../Components/Jsxfules/Contact';
import AboutUs from '../Components/Jsxfules/About';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const toSlug = (str) =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '')
    .replace(/[^a-z0-9-]/g, '');

const fromSlug = (slug, categoryList) =>
  categoryList.find(cat => toSlug(cat) === slug) || null;

function CategoryPage({ items, cart, onCartUpdate, onItemsUpdate, categories, searchTerm = '' }) {
  const { categoryName } = useParams();
  const matchedCategory = fromSlug(categoryName, categories);

  if (!matchedCategory) {
    return <div style={{ padding: 40 }}>⚠️ No items found for this category.</div>;
  }

  const hasSearch = searchTerm.trim().length > 0;
  const filteredItems = hasSearch
    ? items.filter(item =>
        item.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : items.filter(item => item.category === matchedCategory);

  return (
    <Home
      selectedCategory={matchedCategory}
      onCartUpdate={onCartUpdate}
      onItemsUpdate={onItemsUpdate}
      cart={cart}
      items={filteredItems}
    />
  );
}

export default function DefaultLayout() {
  const [cart, setCart] = useState({});
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setUser(null);
        setUserLoading(false);
        return;
      }

      // Always fetch fresh data from API to ensure consistency
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload.email;
        const res = await axios.get(`${API_BASE_URL}/api/user/${email}`);
        const u = res.data;
        const userData = {
          ...u,
          registerName: u.registerName || u.name,
          registerEmail: u.registerEmail || u.email,
        };
        
        setUser(userData);
      } catch (err) {
        console.error("Failed to load user", err);
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    loadUser();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/items`);
      setItems(res.data);
      const cats = [...new Set(res.data.map(item => item.category))];
      setCategories(cats);
      if (!selectedCategory && cats.length > 0) setSelectedCategory(cats[0]);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory]);

  // Clear guest cart on app load
  useEffect(() => {
    localStorage.removeItem('guestCart');
  }, []);

  // Update cart count when user changes or on mount
  useEffect(() => {
    if (!userLoading) {
      handleCartUpdate();
    }
  }, [user, userLoading]);



  const handleCartUpdate = async () => {
    if (!user?.registerEmail && !user?.email) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const totalQty = guestCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      setCartCount(totalQty);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/order/${user.registerEmail || user.email}`);
      const pendingOrder = res.data.find(o => !o.isFinalised && o.status === 'pending');
      if (pendingOrder && Array.isArray(pendingOrder.items)) {
        const totalQty = pendingOrder.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(totalQty);
      } else {
        setCartCount(0);
      }
    } catch {
      setCartCount(0);
    }
  };

  const handleCartClick = () => {
    navigate('/cart');
    // setCartCount(0);
    setSelectedCategory(null);
  };

  const handleCategorySelect = (cat) => {
    setSearchTerm(''); // ✅ Clear search
    navigate(`/${toSlug(cat)}`);
    setSelectedCategory(cat);
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    setCartCount(0);
  };

  const handleProfileSave = async (updatedUser) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/user/${updatedUser.email || updatedUser.registerEmail}`);
      const u = res.data;
      const userData = {
        ...u,
        registerName: u.registerName || u.name,
        registerEmail: u.registerEmail || u.email,
      };
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch updated user:', err);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredItems = searchTerm.trim()
    ? items.filter(item =>
        item.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : items;

  if (userLoading) {
    return <div style={{ padding: 40 }}>Loading user...</div>;
  }

  return (
    <>
      <Navbar
        user={user}
        setUser={setUser}
        onLogout={handleLogout}
        onProfileSave={handleProfileSave}
        categories={categories}
        cartCount={cartCount}
        onCategorySelect={handleCategorySelect}
        onCartClick={handleCartClick}
        selectedCategory={selectedCategory}
        onSearch={handleSearch}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
      <Route
        path="/home"
        element={
          <Homepage
            key={window.location.pathname}
            items={filteredItems}
            user={user}
            onCartUpdate={handleCartUpdate}
            onItemsUpdate={fetchItems}
            categories={categories}
            searchTerm={searchTerm} // <-- add this
          />
        }
      />
        <Route
          path="/category/:category"
          element={
            <Home
              items={filteredItems}
              user={user}
              onCartUpdate={handleCartUpdate}
              onItemsUpdate={fetchItems}
              searchTerm={searchTerm}
              categories={categories}
            />
          }
        />
        <Route
          path="/cart"
          element={
            <Cart
              cart={cart}
              items={items}
              user={user}
              onBack={() => navigate(-1)}
              onProfileEdit={() => setShowProfile(true)}
              onLoginRequest={() => setShowLogin(true)}
              onCartUpdate={handleCartUpdate}
              onItemsUpdate={fetchItems}
            />
          }
        />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route
          path="/:categoryName"
          element={
            <CategoryPage
              items={items}
              cart={cart}
              onCartUpdate={handleCartUpdate}
              onItemsUpdate={fetchItems}
              categories={categories}
              searchTerm={searchTerm}
            />
          }
        />
        <Route path="/success" element={<Success />} />
        <Route path='/contact' element={<Contact />} />
          <Route path="/about" element={<AboutUs />} />
      </Routes>
        <Footer categories={categories}/>

      {showProfile && user && (
        <Profile
          email={user.registerEmail || user.email}
          onSave={updatedUser => setUser(updatedUser)}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showLogin && !user && (
        <div className="login-modal">
          <Login
            setUser={(u) => {
              setUser(u);
              setShowLogin(false);
            }}
            defaultTab="login"
            onClose={() => setShowLogin(false)}
          />
        </div>
      )}
    </>
  );
}