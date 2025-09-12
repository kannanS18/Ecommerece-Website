import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import '../Cssfiles/HomePage.css';

const InfiniteMenu = lazy(() => import('./infiniteItem'));

const toSlug = (str) =>
  str
    .toLowerCase()
    .replace(/[\s/&]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-|-$/g, '');

export default function Homepage({ items = [], categories = [], onCartUpdate, onItemsUpdate, user, searchTerm, onSearch, cartCount, onCategorySelect, onCartClick, selectedCategory, onLogout, onProfileSave, setUser }) {
  // const { category } = useParams();
  const navigate = useNavigate();
  const comboRowRef = useRef(null);

  // Prepare menu items for InfiniteMenu
  const itemsForMenu = [...items];
  const menuItems = categories.map((cat) => {
    const item = itemsForMenu.find(i => i.category === cat);
    const image = item?.Image_Name
      ? `/Food/${item.Image_Name.trim()}.jpg`
      : "/Food/fresh-homemade-pita-alon-shaya.jpg";
    return {
      image,
      title: cat,
      description: '',
      link: `/category/${toSlug(cat)}`,
      buttonText: '→',
    };
  });

  // Filter items for search overlay
  const searchResults = searchTerm
    ? items.filter(item =>
        item.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Build combos (limit to 5)
  const mainCourses = items.filter(i => i.category?.toLowerCase().includes('main'));
  const desserts = items.filter(i => i.category?.toLowerCase().includes('dessert'));
  const combos = [];
  for (let i = 0; i < Math.min(5, mainCourses.length, desserts.length); i++) {
    const main = mainCourses[i];
    const dessert = desserts[i];
    if (main && dessert) {
      combos.push({
        _id: `${main._id}_${dessert._id}`,
        Title: `${main.Title.split(' ')[0]} + ${dessert.Title.split(' ')[0]}`,
        price: main.price + dessert.price,
        Image_Names: [main.Image_Name, dessert.Image_Name],
        items: [main, dessert]
      });
    }
  }

  const handleMenuClick = (link) => {
    navigate(link);
  };

  // Quantity state for combos
  const [comboQuantities, setComboQuantities] = useState({});

  const handleComboInc = (id) => setComboQuantities(q => ({ ...q, [id]: (q[id] || 1) + 1 }));
  const handleComboDec = (id) => setComboQuantities(q => {
    const newQty = (q[id] || 1) - 1;
    if (newQty <= 0) {
      const updated = { ...q };
      delete updated[id];
      return updated;
    }
    return { ...q, [id]: newQty };
  });
    const handleImageClick = (item) => {
    // Navigate to the category page with a hash or state for highlighting
    navigate(`/category/${toSlug(item.category)}?highlight=${encodeURIComponent(item.Title)}`);
  };

  // Order handler
  const handleAddComboToCart = async (combo) => {
    if (!user) {
      alert('Please login first to add items to cart');
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/order/${user.registerEmail}`);
      let pendingOrder = res.data.find(o => !o.isFinalised && o.status === 'pending');
      const qty = comboQuantities[combo._id] || 1;
      const comboItems = combo.items.map(i => ({
        name: i.Title,
        price: i.price,
        quantity: qty,
        image: i.Image_Name ? i.Image_Name.trim() + '.jpg' : 'fresh-homemade-pita-alon-shaya.jpg'
      }));

      if (pendingOrder) {
        let newItems = [...pendingOrder.items];
        comboItems.forEach(ci => {
          const idx = newItems.findIndex(i => i.name === ci.name);
          if (idx !== -1) {
            newItems[idx].quantity += ci.quantity;
          } else {
            newItems.push({ ...ci });
          }
        });
        const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        await axios.put(`http://localhost:5000/api/order/${pendingOrder._id}`, {
          ...pendingOrder,
          items: newItems,
          total: newTotal
        });
      } else {
        await axios.post('http://localhost:5000/api/order', {
          registerEmail: user.registerEmail,
          registerName: user.registerName,
          address: user.address,
          phone: user.phone,
          items: comboItems,
          total: comboItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          msg: '',
          isFinalised: false,
          status: 'pending'
        });
      }
      if (typeof onCartUpdate === "function") {
        onCartUpdate();
      }
    } catch (err) {
      alert('Failed to add combo to cart.');
    }
  };

  // Add this function inside your Homepage component:
  // const handleAddSearchItemToCart = async (item) => {
  //   if (!user) {
  //     alert('Please log in to add items to cart.');
  //     return;
  //   }
  //   try {
  //     const res = await axios.get(`http://localhost:5000/api/order/${user.registerEmail}`);
  //     let pendingOrder = res.data.find(o => !o.isFinalised && o.status === 'pending');
  //     const qty = searchItemQuantities[item._id] || 1;
  //     const itemPayload = {
  //       name: item.Title,
  //       price: item.price,
  //       quantity: qty,
  //       _id: item._id,
  //       category: item.category,
  //       Image_Name: item.Image_Name
  //     };

  //     if (pendingOrder) {
  //       let newItems = [...pendingOrder.items];
  //       const idx = newItems.findIndex(i => i._id === item._id);
  //       if (idx !== -1) {
  //         newItems[idx].quantity += qty;
  //       } else {
  //         newItems.push(itemPayload);
  //       }
  //       const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  //       await axios.put(`http://localhost:5000/api/order/${pendingOrder._id}`, {
  //         ...pendingOrder,
  //         items: newItems,
  //         total: newTotal
  //       });
  //     } else {
  //       await axios.post('http://localhost:5000/api/order', {
  //         registerEmail: user.registerEmail,
  //         registerName: user.registerName,
  //         address: user.address,
  //         phone: user.phone,
  //         items: [itemPayload],
  //         total: item.price * qty,
  //         msg: '',
  //         isFinalised: false,
  //         status: 'pending'
  //       });
  //     }
      
  //     if (typeof onCartUpdate === "function") {
  //       onCartUpdate(); // This will refresh the badge
  //     }
  //   } catch (err) {
  //     alert('Failed to add item to cart.');
  //   }
  // };

  useEffect(() => {
    const row = comboRowRef.current;
    if (!row) return;
    let isDown = false;
    let startX;
    let scrollLeft;

    const onMouseDown = (e) => {
      isDown = true;
      row.classList.add('active');
      startX = e.pageX - row.offsetLeft;
      scrollLeft = row.scrollLeft;
    };
    const onMouseLeave = () => {
      isDown = false;
      row.classList.remove('active');
    };
    const onMouseUp = () => {
      isDown = false;
      row.classList.remove('active');
    };
    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - row.offsetLeft;
      const walk = (x - startX) * 1.5; // scroll speed
      row.scrollLeft = scrollLeft - walk;
    };

    row.addEventListener('mousedown', onMouseDown);
    row.addEventListener('mouseleave', onMouseLeave);
    row.addEventListener('mouseup', onMouseUp);
    row.addEventListener('mousemove', onMouseMove);

    return () => {
      row.removeEventListener('mousedown', onMouseDown);
      row.removeEventListener('mouseleave', onMouseLeave);
      row.removeEventListener('mouseup', onMouseUp);
      row.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  // Search bar handler
  // const handleSearchInput = (e) => {
  //   if (onSearch) onSearch(e.target.value);
  // };

  // // Quantity state for search items
  // const [searchItemQuantities, setSearchItemQuantities] = useState({});

  // const handleSearchItemInc = (id) => {
  //   setSearchItemQuantities(q => ({ ...q, [id]: (q[id] || 1) + 1 }));
  // };
  // const handleSearchItemDec = (id) => {
  //   setSearchItemQuantities(q => {
  //     const newQty = (q[id] || 1) - 1;
  //     if (newQty <= 0) {
  //       const updated = { ...q };
  //       delete updated[id];
  //       return updated;
  //     }
  //     return { ...q, [id]: newQty };
  //   });
  // };

  // const [cart, setCart] = useState([]);

  // function handleCartUpdate(item) {
  //   // item should have ._id and .quantity
  //   // Find if item already exists in cart
  //   const idx = cart.findIndex(ci => ci._id === item._id);
  //   if (idx !== -1) {
  //     // Update quantity
  //     cart[idx].quantity = (cart[idx].quantity || 1) + (item.quantity || 1);
  //     setCart([...cart]);
  //   } else {
  //     setCart([...cart, { ...item }]);
  //   }
  // }

  return (
    <div className="homepage-container">


      {/* Search Overlay */}
      {searchTerm && (
        <div className="search-overlay">
          <div className="search-overlay-content">
            <h2>Search Results for "{searchTerm}"</h2>
            <div className="search-results-row">
              {searchResults.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center' }}>No items found.</div>
              ) : (
                searchResults.map(item => (
                  <div key={item._id} className="item-card"
                        onClick={() => handleImageClick(item)}
                        style={{ cursor: "pointer" }}
                  >
                    <img
                      src={
                        item.Image_Name
                          ? `/Food/${item.Image_Name.trim()}.jpg`
                          : '/Food/fresh-homemade-pita-alon-shaya.jpg'
                      }
                      alt={item.Title}
                      className="item-image"
                       onClick={() => handleImageClick(item)}
                        style={{ cursor: "pointer" }}
                      onError={e => { e.target.src = '/Food/fresh-homemade-pita-alon-shaya.jpg'; }}
                    />
                    <h3 className="item-title">{item.Title}</h3>
                    <div className="item-price">₹{item.price.toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Normal homepage content below (only visible when not searching) */}
      {!searchTerm && (
        <>
          <div className="video-background" style={{ background: 'linear-gradient(135deg, #FAECD9 0%, #F8CBA6 100%)', minHeight: '50vh' }}>
            <div className="overlay">
              <h1>Doughy Delights</h1>
              <p>Baked with Love, Served with Joy</p>
            </div>
          </div>
          <h2 className="homepage-title">Combo Offers</h2>
          <div className="homepage-combo-row" ref={comboRowRef}>
            {combos.map(combo => (
              <div key={combo._id} className="homepage-combo-card">
                <div className="combo-img-pair">
                  {combo.Image_Names.map((img, idx) => (
                    <img
                      key={idx}
                      src={`/Food/${img ? img.trim() + '.jpg' : 'fresh-homemade-pita-alon-shaya.jpg'}`}
                      alt={combo.Title}
                      className="combo-img"
                      onError={e => { e.target.src = '/Food/fresh-homemade-pita-alon-shaya.jpg'; }}
                      style={{ width: '100px', margin: '0 4px', borderRadius: '8px' }}
                    />
                  ))}
                </div>
                <h3>{combo.Title}</h3>
                <div className="combo-price">₹{combo.price?.toFixed(2)}</div>
                <div className="combo-qty-controls">
                  <button onClick={() => handleComboDec(combo._id)} className="homepage-add-btn">-</button>
                  <span className="qty-display">{comboQuantities[combo._id] || 1}</span>
                  <button onClick={() => handleComboInc(combo._id)} className="homepage-add-btn">+</button>
                </div>
                <div className="combo-action-buttons">
                  <button
                    onClick={() => handleAddComboToCart(combo)}
                    className="homepage-add-btn"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      background: '#ff4081',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => {
                      if (!user) {
                        alert('Please login first to buy items');
                        return;
                      }
                      handleAddComboToCart(combo);
                      navigate('/cart');
                    }}
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      background: '#ff6b35',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
          <h2 className="homepage-title">Browse by Category</h2>
          <div style={{ height: '500px', position: 'relative' }}>
            <Suspense fallback={<div style={{ color: '#6B4226' }}>Loading...</div>}>
              <InfiniteMenu items={menuItems} onMenuClick={handleMenuClick} />
            </Suspense>
          </div>
        </>
      )}
    </div>
  );
}