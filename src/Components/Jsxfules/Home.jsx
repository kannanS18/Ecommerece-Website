import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "../Cssfiles/home.css";
import ReviewModal from './ReviewModal';
import { API_BASE_URL } from '../../config';

const toSlug = (str) =>
  str.toLowerCase().replace(/[\s/&]+/g, '-').replace(/-+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '');

export default function Home({ items, user, onCartUpdate, onItemsUpdate }) {
  const { category } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const highlightTitle = params.get("highlight");
  const selectedCategory = category
    ? items.find(i => i.category && toSlug(i.category) === category)?.category
    : null;

  const filteredItems = selectedCategory
    ? items.filter(item => item.category === selectedCategory)
    : [];

  const createComboPairs = () => {
    const groups = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });

    const combos = [];
    const usedIds = new Set();

    Object.values(groups).forEach(group => {
      for (let i = 0; i < group.length - 1 && combos.length < 3; i++) {
        const a = group[i], b = group[i + 1];
        if (!usedIds.has(a._id) && !usedIds.has(b._id)) {
          usedIds.add(a._id);
          usedIds.add(b._id);
          combos.push({
            type: 'special',
            items: [a, b],
            price: Math.round((a.price + b.price) * 0.85),
            title: `${a.Title} & ${b.Title} Combo`
          });
        }
      }
    });

    return { combos, usedIds };
  };

  const { combos: specialCombos, usedIds } = createComboPairs();

  const highlyOrdered = filteredItems
    .filter(item => !usedIds.has(item._id))
    .sort((a, b) => (b.quantitySold || 0) - (a.quantitySold || 0))
    .slice(0, 3)
    .map(item => ({
      type: 'high',
      items: [item],
      price: item.price,
      title: item.Title
    }));

  const interleave = () => {
    const result = [];
    for (let i = 0; i < 3; i++) {
      if (specialCombos[i]) result.push(specialCombos[i]);
      if (highlyOrdered[i]) result.push(highlyOrdered[i]);
    }
    return result;
  };

  const rotatingItems = interleave();
  const [offerIndex, setOfferIndex] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const [prevSlideKey, setPrevSlideKey] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setOfferIndex(prev => (prev + 1) % rotatingItems.length);
      setSlideKey(prev => prev + 1);
    }, 7000);
    return () => clearInterval(interval);
  }, [rotatingItems.length]);

  useEffect(() => {
    if (prevSlideKey !== slideKey) {
      setIsExiting(true);
      const timeout = setTimeout(() => {
        setIsExiting(false);
        setPrevSlideKey(slideKey);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [slideKey]);

  useEffect(() => {
    if (highlightTitle) {
      const el = document.getElementById("highlighted-item");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightTitle]);

  const currentItem = rotatingItems[offerIndex];

  const [activeCard, setActiveCard] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [overlayItem, setOverlayItem] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [showOverlayReviews, setShowOverlayReviews] = useState(false);
  const [overlayReviews, setOverlayReviews] = useState([]);
  const [overlayUserReview, setOverlayUserReview] = useState(null);
  const [overlayRating, setOverlayRating] = useState(0);
  const [overlayComment, setOverlayComment] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleCardClick = (id) => {
    const item = items.find(i => i._id === id);
    setOverlayItem(item);
    setQuantities(q => ({ ...q, [id]: q[id] || 1 }));
    fetchOverlayReviews(id);
  };

  const handleCloseOverlay = () => {
    setOverlayItem(null);
    setShowOverlayReviews(false);
    setOverlayReviews([]);
    setOverlayUserReview(null);
    setOverlayRating(0);
    setOverlayComment('');
    setCurrentImageIndex(0);
  };

  const rotateImages = () => {
    setCurrentImageIndex(prev => (prev + 1) % 4);
  };

  const handleShowReviews = (item, e) => {
    e.stopPropagation();
    setReviewItem(item);
    setShowReviewModal(true);
  };

  const handleCloseReviews = () => {
    setShowReviewModal(false);
    setReviewItem(null);
  };

  const fetchOverlayReviews = async (itemId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/reviews/${itemId}`);
      setOverlayReviews(res.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchOverlayUserReview = async (itemId) => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/reviews/${itemId}/${user.registerEmail || user.email}`);
      if (res.data) {
        setOverlayUserReview(res.data);
        setOverlayRating(res.data.rating);
        setOverlayComment(res.data.comment || '');
      }
    } catch (error) {
      // User hasn't reviewed yet
    }
  };

  const handleOverlayReviewSubmit = async () => {
    if (!overlayItem || overlayRating === 0) return;
    try {
      await axios.post(`${API_BASE_URL}/api/reviews`, {
        itemId: overlayItem._id,
        userEmail: user.registerEmail || user.email,
        userName: user.registerName || user.name,
        rating: overlayRating,
        comment: overlayComment
      });
      fetchOverlayReviews(overlayItem._id);
      fetchOverlayUserReview(overlayItem._id);
      onItemsUpdate?.();
      alert('Review submitted successfully!');
    } catch (error) {
      alert('Failed to submit review');
    }
  };

  const handleShowOverlayReviews = () => {
    if (showOverlayReviews) {
      setShowOverlayReviews(false);
    } else {
      setShowOverlayReviews(true);
      fetchOverlayReviews(overlayItem._id);
      if (user) {
        fetchOverlayUserReview(overlayItem._id);
      }
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => {
      const isFilled = index < Math.floor(rating);
      const isHalfFilled = index === Math.floor(rating) && rating % 1 >= 0.5;
      
      return (
        <span
          key={index}
          className={`star ${isFilled ? 'filled' : isHalfFilled ? 'half-filled' : ''}`}
        >
          ★
        </span>
      );
    });
  };

  const handleInc = (id) => {
    setQuantities(q => ({ ...q, [id]: (q[id] || 1) + 1 }));
  };

  const handleDec = (id) => {
    setQuantities(q => {
      const newQty = (q[id] || 1) - 1;
      if (newQty < 1) return { ...q, [id]: 1 };
      return { ...q, [id]: newQty };
    });
  };

  const handleAddToCart = async (id, qty = 1, overrideItem = null) => {
    const item = overrideItem || items.find(i => i._id === id);
    if (!item) return;
    if (!user) {
      alert('Please login first to add items to cart');
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/order/${user.registerEmail}`);
      let pendingOrder = res.data.find(o => !o.isFinalised && o.status === 'pending');

      const quantity = qty || quantities[id] || 1;
      const itemPayload = {
        name: item.Title,
        price: item.price,
        quantity,
        image: item.Image_Name ? item.Image_Name.trim() + '.jpg' : 'fresh-homemade-pita-alon-shaya.jpg'
      };

      if (pendingOrder) {
        const existingIdx = pendingOrder.items.findIndex(i => i.name === item.Title);
        let newItems = [...pendingOrder.items];
        if (existingIdx !== -1) {
          newItems[existingIdx].quantity += quantity;
        } else {
          newItems.push(itemPayload);
        }
        const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        await axios.put(`${API_BASE_URL}/api/order/${pendingOrder._id}`, {
          ...pendingOrder,
          items: newItems,
          total: newTotal
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/order`, {
          registerEmail: user.registerEmail,
          registerName: user.registerName,
          address: user.address,
          phone: user.phone,
          items: [itemPayload],
          total: item.price * quantity,
          msg: '',
          isFinalised: false,
          status: 'pending'
        });
      }

      setActiveCard(null);
      if (typeof onCartUpdate === "function") {
        onCartUpdate(id, quantity);
      }
    } catch (err) {
      console.error('Add to cart error:', err);
      alert('Failed to add to cart. Please check your profile and login.');
    }
  };

  const handleAddComboToCart = async (comboItems) => {
    if (!user) {
      alert('Please login first to add items to cart');
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/order/${user.registerEmail}`);
      let pendingOrder = res.data.find(o => !o.isFinalised && o.status === 'pending');
      const itemsPayload = comboItems.map(i => ({
        name: i.Title,
        price: i.price,
        quantity: 1,
        image: i.Image_Name ? i.Image_Name.trim() + '.jpg' : 'fresh-homemade-pita-alon-shaya.jpg'
      }));

      if (pendingOrder) {
        let newItems = [...pendingOrder.items];
        itemsPayload.forEach(ci => {
          const idx = newItems.findIndex(i => i.name === ci.name);
          if (idx !== -1) {
            newItems[idx].quantity += 1;
          } else {
            newItems.push({ ...ci });
          }
        });
        const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        await axios.put(`${API_BASE_URL}/api/order/${pendingOrder._id}`, {
          ...pendingOrder,
          items: newItems,
          total: newTotal
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/order`, {
          registerEmail: user.registerEmail,
          registerName: user.registerName,
          address: user.address,
          phone: user.phone,
          items: itemsPayload,
          total: itemsPayload.reduce((sum, i) => sum + i.price * i.quantity, 0),
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

  const renderTitle = (title) =>
    title?.split(" ").map((char, i) => (
      <span key={i} style={{ animationDelay: `${i * 0.05}s` }}>{char} </span>
    ));

  return (
    <div className="home-container">
      <h1 className="home-title">{selectedCategory} Items</h1>

      {/* Rotating Offer Section */}
      {currentItem && (
        <div className={`home-special-offer ${currentItem.type}`}>
          <div className="home-offer-left">
            <h2 className="home-offer-subtitle">
              {currentItem.type === 'special' ? '🔥 Special Combo Offer 🔥' : '💖 Highly Ordered 💖'}
            </h2>
            <h2 className="home-offer-title word-animate">
              {renderTitle(currentItem.title)}
            </h2>
            <p className="home-offer-price">₹{currentItem.price?.toFixed(2)}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="home-offer-add-btn"
                onClick={() => {
                  if (currentItem.type === 'special') {
                    handleAddComboToCart(currentItem.items);
                  } else {
                    handleAddToCart(currentItem.items[0]._id, 1, currentItem.items[0]);
                  }
                }}
              >
                Add to Cart
              </button>
              <button
                className="home-offer-buy-btn"
                onClick={() => {
                  if (!user) {
                    alert('Please login first to buy items');
                    return;
                  }
                  if (currentItem.type === 'special') {
                    handleAddComboToCart(currentItem.items);
                  } else {
                    handleAddToCart(currentItem.items[0]._id, 1, currentItem.items[0]);
                  }
                  navigate('/cart');
                }}
                style={{
                  background: '#ff6b35',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Buy Now
              </button>
              <button
                className="home-offer-next-btn"
                onClick={() => {
                  setOfferIndex(prev => (prev - 1 + rotatingItems.length) % rotatingItems.length);
                  setSlideKey(prev => prev - 1);
                }}
              >
                ←
              </button>
              <button
                className="home-offer-next-btn"
                onClick={() => {
                  setOfferIndex(prev => (prev + 1) % rotatingItems.length);
                  setSlideKey(prev => prev + 1);
                }}
              >
                →
              </button>
            </div>
          </div>
          <div className="home-offer-right">
            {currentItem.items.map((item, idx) => (
              <div
                key={slideKey + '-' + idx}
                className="home-offer-img-wrapper"
                style={{ '--i': idx }}
              >
                <img
                  src={`/Food/${item.Image_Name?.trim() || 'fresh-homemade-pita-alon-shaya'}.jpg`}
                  alt={item.Title}
                  className={`home-offer-img ${
                    isExiting ? 'exit-animation' :
                    currentItem.type === 'special'
                      ? idx === 0
                        ? 'slide-from-bottom-to-right'
                        : 'slide-from-bottom'
                      : 'slide-up'
                  }`}
                  onError={e => { e.target.src = 'https://via.placeholder.com/400x300/FAECD9/6B4226?text=Food+Image'; }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Items */}
      <div className="home-items-row">
        {filteredItems.map(item => (
          <div
            key={item._id}
            className={`home-card${highlightTitle === item.Title ? " highlight-item" : ""}`}
            id={highlightTitle === item.Title ? "highlighted-item" : undefined}
            onClick={() => handleCardClick(item._id)}
          >
            <img
              src={`/Food/${item.Image_Name ? item.Image_Name.trim() + '.jpg' : 'fresh-homemade-pita-alon-shaya.jpg'}`}
              alt={item.Title || item.name}
              className="home-card-img"
              onError={e => { e.target.src = 'https://via.placeholder.com/400x300/FAECD9/6B4226?text=Food+Image'; }}
            />
            <h3 className="home-card-title">{item.Title}</h3>
            <div className="home-card-rating">
              <div className="rating-info">
                <div className="stars">
                  {renderStars(item.averageRating || 0)}
                </div>
                <span className="rating-text">
                  {item.averageRating ? item.averageRating.toFixed(1) : '0.0'} ({item.reviewCount || 0})
                </span>
              </div>
              <button 
                className="review-btn"
                onClick={(e) => handleShowReviews(item, e)}
              >
                Reviews
              </button>
            </div>
            <div className="home-card-price">₹{item.price?.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Overlay Modal */}
      {overlayItem && (
        <div className="item-overlay-backdrop" onClick={handleCloseOverlay}>
          <div className="item-overlay-modal" onClick={e => e.stopPropagation()}>
            <button className="item-overlay-close" onClick={handleCloseOverlay}>×</button>
            <div className="item-overlay-layout">
              <div className="item-overlay-top">
                <div className="item-overlay-left">
                  <div className="item-overlay-cards">
                    {[...Array(4)].map((_, idx) => {
                      const position = (idx - currentImageIndex + 4) % 4;
                      return (
                        <div 
                          key={idx} 
                          className={`item-overlay-card card-position-${position}`}
                          style={{
                            transform: `
                              translateX(${position === 0 ? '0px' : position === 1 ? '180px' : '-180px'}) 
                              translateY(${position === 0 ? '0px' : position === 1 ? '20px' : '20px'}) 
                              rotateY(${position === 0 ? '0deg' : position === 1 ? '-25deg' : '25deg'})
                              scale(${position === 0 ? '0.9' : position === 1 ? '0.75' : '0.75'})
                            `,
                            zIndex: position === 0 ? 3 : position === 1 ? 2 : 1,
                            opacity: position === 3 ? 0 : 1,
                            visibility: position === 3 ? 'hidden' : 'visible'
                          }}
                        >
                          <img
                            src={`/Food/${overlayItem.Image_Name ? overlayItem.Image_Name.trim() + '.jpg' : 'fresh-homemade-pita-alon-shaya.jpg'}`}
                            alt={overlayItem.Title}
                            className="item-overlay-img"
                            onError={e => { e.target.src = 'https://via.placeholder.com/400x300/FAECD9/6B4226?text=Food+Image'; }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <button className="rotate-btn" onClick={rotateImages}>
                    ↻
                  </button>
                </div>
                
                <div className="item-overlay-right">
                  <div className="item-overlay-info">
                    <h2 className="item-overlay-title">{overlayItem.Title}</h2>
                    <div className="item-overlay-desc">{overlayItem.instructions || "No description available."}
                                          <div className="nutrition-info">
                      {overlayItem.nutrition
                        ? Object.entries(overlayItem.nutrition).map(([key, value]) => (
                            <span key={key} className="nutrition-item">
                              {key}: {value}g
                            </span>
                          ))
                        : "No nutrition info"}
                    </div>
                    </div>
                    
                    
                    <div className="item-overlay-rating">
                      <div className="rating-info">
                        <div className="stars">
                          {renderStars(overlayItem.averageRating || 0)}
                        </div>
                        <span className="rating-text">
                          {overlayItem.averageRating ? overlayItem.averageRating.toFixed(1) : '0.0'} ({overlayItem.reviewCount || 0})
                        </span>
                      </div>
                      
                      {/* Reviews container */}
                      {overlayReviews.length > 0 && (
                        <div className="overlay-reviews-section">
                          <div className="overlay-reviews-scroll overlay-reviews-single-container">
                            {(showOverlayReviews ? overlayReviews : overlayReviews.slice(0, 2)).map((review, idx, arr) => (
                              <React.Fragment key={review._id}>
                                <div className="overlay-review-header">
                                  <span className="overlay-reviewer-name">{review.userName}</span>
                                  <div className="overlay-review-stars">
                                    
                                    {renderStars(review.rating)}
                                  </div>
                                </div>
                                {review.comment && (
                                  <p className="overlay-review-comment">{review.comment}</p>
                                )}
                                {idx !== arr.length - 1 && <hr className="overlay-review-divider" />}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Show Reviews button only if there are more than 2 reviews */}
                      {overlayReviews.length > 2 && (
                        <button 
                          className="overlay-review-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowOverlayReviews(!showOverlayReviews);
                          }}
                          style={{ marginTop: '10px' }}
                        >
                          {showOverlayReviews ? 'Hide Reviews' : 'Show Reviews'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="item-overlay-price-controls">
                    <div className="item-overlay-price">₹{overlayItem.price?.toFixed(2) }</div>

                    <div className="item-overlay-controls">
                      <button onClick={e => { e.stopPropagation(); handleDec(overlayItem._id); }}>-</button>
                      <span className="home-qty">{quantities[overlayItem._id] || 1}</span>
                      <button onClick={e => { e.stopPropagation(); handleInc(overlayItem._id); }}>+</button>
                      <button
                        className="home-add-btn"
                        onClick={e => {
                          e.stopPropagation();
                          handleAddToCart(overlayItem._id, quantities[overlayItem._id] || 1);
                        }}
                      >
                        Add to Cart
                      </button>
                      <button
                        className="home-buy-btn"
                        onClick={e => {
                          e.stopPropagation();
                          if (!user) {
                            alert('Please login first to buy items');
                            return;
                          }
                          handleAddToCart(overlayItem._id, quantities[overlayItem._id] || 1);
                          navigate('/cart');
                        }}
                        style={{
                          marginLeft: '10px',
                          background: '#ff6b35',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewItem && (
        <ReviewModal 
          item={reviewItem} 
          user={user} 
          onClose={handleCloseReviews}
          onReviewUpdate={onItemsUpdate}
          canReview={false}
        />
      )}
    </div>
  );
}