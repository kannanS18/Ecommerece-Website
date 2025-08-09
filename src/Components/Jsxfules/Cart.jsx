import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../Cssfiles/Cart.css";
import { loadStripe } from '@stripe/stripe-js';
import ReviewModal from './ReviewModal';

export default function Cart({ user, onBack, onLoginRequest, onProfileEdit, onCartUpdate, onItemsUpdate }) {
  const [orders, setOrders] = useState([]);
  const [cartMsgs, setCartMsgs] = useState({});
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({ address: '', items: [], total: 0, msg: '' });
  const [showBill, setShowBill] = useState(false);
  const [billOrder, setBillOrder] = useState(null);
  const [profileValid, setProfileValid] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [orderType, setOrderType] = useState('dine in');
  const [slotCounts, setSlotCounts] = useState({});
  const [pendingFinalizeOrderId, setPendingFinalizeOrderId] = useState(null);
  const registerEmail = user?.registerEmail || user?.email;
  const [history, setHistory] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [items, setItems] = useState([]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const placeholderTexts = [
    "Do you want extra utensils?",
    "Do you want candles?",
    "Any special dietary requirements?",
    "Need extra napkins?",
    "Want it extra spicy?",
    "Any allergies we should know?"
  ];

  // Currency state
  const [currency, setCurrency] = useState("inr");
  const currencySymbols = { inr: "₹", usd: "$", eur: "€" };

  // Conversion rates (replace with real API for production)
  const getConversionRate = (currency) => {
    if (currency === "usd") return 0.012;
    if (currency === "eur") return 0.011;
    return 1;
  };
  const convertPrice = (amount) => (amount * getConversionRate(currency));

  const TIME_SLOTS = [
    '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '06:00 PM - 07:00 PM',
    '07:00 PM - 08:00 PM',
    '08:00 PM - 09:00 PM'
  ];

  useEffect(() => {
    axios.get('http://localhost:5000/api/update-reservation-statuses')
      .catch((err) => console.error("Error updating reservations", err));
    fetchOrders();
    fetchItems();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholderTexts.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [placeholderTexts.length]);

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/items');
      setItems(res.data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  useEffect(() => {
    const fetchSlotCounts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/timeslot-counts');
        setSlotCounts(res.data);
      } catch (err) {
        console.error('Failed to fetch slot counts');
      }
    };
    fetchSlotCounts();
  }, [user?.email]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/order/${registerEmail}`);
      const ordersWithImages = res.data.map(order => ({
        ...order,
        items: order.items.map(item => {
          // Only set image if it doesn't already exist
          if (!item.image) {
            const foundItem = items.find(i => i.Title === item.name);
            if (foundItem && foundItem.Image_Name) {
              return {
                ...item,
                image: foundItem.Image_Name.trim() + '.jpg'
              };
            }
            return {
              ...item,
              image: 'fresh-homemade-pita-alon-shaya.jpg'
            };
          }
          return item; // Keep existing image
        })
      }));
      setOrders(ordersWithImages);
      const msgObj = {};
      ordersWithImages.forEach(o => {
        if (o.status !== 'delivered') msgObj[o._id] = o.msg || '';
      });
      setCartMsgs(msgObj);
      onCartUpdate?.();
    } catch {
      setOrders([]);
      onCartUpdate?.();
    }
  };

  useEffect(() => {
    setProfileValid(true);
    setCheckingProfile(true);
    if (!registerEmail) {
      onLoginRequest?.();
      return;
    }
    const checkProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/user/${registerEmail}`);
        const { address, phone } = res.data;
        setProfileValid(!!address && !!phone);
      } catch {
        setProfileValid(false);
      } finally {
        setCheckingProfile(false);
      }
    };
    checkProfile();
  }, [registerEmail, user]);

  useEffect(() => {
    if (registerEmail && profileValid) fetchOrders();
    // eslint-disable-next-line
  }, [registerEmail, profileValid, showBill, editingOrder, user?.email]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (registerEmail && profileValid) {
        fetchOrders();
      }
    }, 10000); // fetch every 10 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [registerEmail, profileValid]);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const orderedOrders = orders.filter(o => o.status === 'ordered' || o.status === 'Reserved' || o.status === 'out for delivery');
  const orderHistory = orders.filter(o => o.status === 'delivered' || o.status === 'Reservation Over');

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/order/${orderId}`);
      fetchOrders();
      onCartUpdate?.();
    } catch (err) {
      alert('Failed to delete order.');
    }
  };

  const handlePayNow = async (order) => {
    if (!profileValid) {
      alert("Please complete your profile before placing orders.");
      onProfileEdit?.();
      return;
    }

    try {
      if (order.type === 'dine in') {
        const res = await axios.get('http://localhost:5000/api/order/' + order.registerEmail);
        const allOrders = res.data;

        if (!order.dineInDate || !order.dineInTime) {
          alert("Please select a dine-in date and time before finalizing.");
          return;
        }

        const duplicate = allOrders.some(o =>
          o._id !== order._id &&
          o.type === 'dine in' &&
          o.dineInDate === order.dineInDate &&
          o.dineInTime === order.dineInTime &&
          o.status === 'ordered'
        );

        if (duplicate) {
          alert("You already have a dine-in order at this time slot!");
          return;
        }

        const slotRes = await axios.get('http://localhost:5000/api/timeslot-counts');
        const slotCounts = slotRes.data;
        const slotKey = `${order.dineInDate}_${order.dineInTime}`;
        const count = slotCounts[slotKey] || 0;

        if (count >= 3) {
          alert("Selected time slot is full.");
          return;
        }
      }

      const updatedTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

      await axios.put(`http://localhost:5000/api/order/${order._id}`, {
        ...order,
        total: updatedTotal,
      });

      const foodsRes = await axios.get('http://localhost:5000/api/items');
      const foods = foodsRes.data;

      const itemsWithImages = order.items.map(item => {
        const found = foods.find(f => f.Title === item.name || f.name === item.name);
        return {
          ...item,
          image: found && found.Image_Name ? found.Image_Name.trim() + '.jpg' : 'placeholder.jpg'
        };
      });

      const stripe = await loadStripe("pk_test_51RlWngCNTgXzJmn8ACiBJ9wSaoQCFILaKeNGSyHsbpr1Fkil5lfuCP884kStkc4hxY8Q68nYBa82UrYhw0vN7Uwl00keSw9XDs");
      const items = itemsWithImages.map(({ image, ...rest }) => ({
        ...rest,
        price: convertPrice(rest.price)
      }));
      const images = itemsWithImages.map(i => i.image);

      const body = {
        order_id: order._id,
        registerEmail: order.registerEmail,
        registerName: order.registerName,
        address: order.address,
        phone: order.phone,
        price: order.price,
        items,
        final: convertPrice(order.finalTotal || (updatedTotal + Math.round(updatedTotal * 0.05))),
        images,
        total: convertPrice(updatedTotal),
        type: order.type,
        amount: convertPrice(order.total),
        currency,
        payment_method_types: ["card"],
        metadata: {
          order_id: order._id
        }
      };
      const ress = await axios.post('http://localhost:5000/api/payment/create-checkout-session', body);
      const session = ress.data;

      await stripe.redirectToCheckout({ sessionId: session.id });

      setBillOrder({ ...order, total: updatedTotal });
      setShowBill(true);
      fetchOrders();
      onCartUpdate?.();
    } catch (err) {
      console.error(err);
      alert('Failed to finalize order.');
    }
  };

  const BillModal = ({ order, onClose }) => (
    <div className="bill-modal-bg">
      <div className="bill-modal">
        {/* Left: User Details */}
        <div className="bill-modal-left">
          <h2>🧾 Order Bill</h2>
          <p><strong>Order ID:</strong> {order._id}</p>
          <p><strong>Order Type:</strong> {order.type || 'dine in'}</p>
          {order.type === 'dine in' && order.dineInDate && order.dineInTime && (
            <>
              <p><strong>Dine-In Date:</strong> {order.dineInDate}</p>
              <p><strong>Dine-In Time:</strong> {order.dineInTime}</p>
            </>
          )}
          {order.estimatedTime && (
            <p><strong>Estimated Time:</strong> {order.type === 'take away' ? order.estimatedTime : 'N/A'}</p>
          )}
          <h4>User Details:</h4>
          <p><strong>Name:</strong> {order.registerName}</p>
          <p><strong>Email:</strong> {order.registerEmail}</p>
          <p><strong>Phone:</strong> {order.phone}</p>
          <p><strong>Address:</strong> {order.address}</p>
        </div>
        {/* Right: Product Details */}
        <div className="bill-modal-right">
          <h4>🛒 Items:</h4>
          <ul>
            {order.items.map((item, idx) => (
              <li key={idx} className="order-item">
                {item.name} x {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
                <br /><small>Rate: ₹{item.price}</small>
              </li>
            ))}
          </ul>
          <h3 className="order-total">Total Amount: ₹{order.total}</h3>
          <h4 className="order-gst">GST (5%): ₹{order.gst || Math.round(order.total * 0.05)}</h4>
          <h2 className="order-final-total">Final Total: ₹{order.finalTotal || (order.total + Math.round(order.total * 0.05))}</h2>
          <p className="locked-status">
            ✅ Payment Completed <br />
            🙏 Thank you for ordering with us!
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <a
              href={`http://localhost:5000/api/order/bill/${order._id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <button className="bill-btn">
                📄 Download Bill (PDF)
              </button>
            </a>
            <button className="close-btn" onClick={onClose} style={{ minWidth: '80px', fontSize: '1rem' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    const pendingId = sessionStorage.getItem('pendingFinalizeOrderId');
    if (pendingId) setPendingFinalizeOrderId(pendingId);
  }, []);

  const handleFinalizePayment = async () => {
    if (!pendingFinalizeOrderId) return;
    try {
      await axios.put(`http://localhost:5000/api/order/${pendingFinalizeOrderId}/finalise`, {
        status: 'ordered',
      });
      sessionStorage.removeItem('pendingFinalizeOrderId');
      setPendingFinalizeOrderId(null);
      fetchOrders();
      onCartUpdate?.(); // <-- Update badge after finalize
      alert('Order finalized!');
    } catch (err) {
      console.error(err);
      alert('Failed to finalize order.');
    }
  };

  const handleShowReviews = (itemName) => {
    const item = items.find(i => i.Title === itemName);
    if (item) {
      setReviewItem(item);
      setShowReviewModal(true);
    }
  };

  const handleCloseReviews = () => {
    setShowReviewModal(false);
    setReviewItem(null);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => {
      const isFilled = index < Math.floor(rating);
      const isHalfFilled = index === Math.floor(rating) && rating % 1 >= 0.5;
      
      return (
        <span
          key={index}
          className={`star ${isFilled ? 'filled' : isHalfFilled ? 'half-filled' : ''}`}
          style={{ color: isFilled || isHalfFilled ? '#ffd700!important' : '#ddd', fontSize: '14px' }}
        >
          ★
        </span>
      );
    });
  };

  // All price displays below use currencySymbols[currency] and convertPrice()

  if (!registerEmail) {
    return <div className="cart-container">Please log in to view your cart.</div>;
  }
  if (checkingProfile) {
    return <div className="cart-container">Checking your profile...</div>;
  }
  if (!profileValid) {
    return (
      <div className="cart-container">
        <h2>⚠ Incomplete Profile</h2>
        <p>You need to complete your profile (address & phone) before placing orders.</p>
        <button className="profile-btn" onClick={onProfileEdit}>Edit Profile</button>
        <button className="back-btn" onClick={onBack}>Back</button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <button className="back-btn" onClick={onBack}>⬅ Back</button>
      {/* Currency Selector */}

      {/* Pending Orders */}
      {!history &&(
        <>
        <button className='order-history-btn'  onClick={() => setHistory(true)}>Order History</button>
        {pendingOrders.length > 0 && (
        <>
              <div style={{ margin: "16px 0" }}>
        <label style={{ fontWeight: "bold", marginRight: 8 }}>Currency:</label>
        <select value={currency} onChange={e => setCurrency(e.target.value)}>
          <option value="inr">INR (₹)</option>
          <option value="usd">USD ($)</option>
          <option value="eur">EUR (€)</option>
        </select>
      </div>
          <h3 className="order-status pending">Current Orders (Pending)</h3>
          {pendingOrders.map(order => (
            <div key={order._id} className="cart-order-block">
              <div className="order-header">
                <h4 className="order-id">Order #{order._id.slice(-6)}</h4>
                <span className="order-status-badge">{order.status}</span>
              </div>
              
              <div className="order-details-grid">
                <div className="customer-info">
                  <h5>Customer Details</h5>
                  <div className="form-group">
                    <label><strong>Name:</strong></label>
                    <input 
                      type="text" 
                      value={order.registerName} 
                      onChange={async e => {
                        const newName = e.target.value;
                        await axios.put(`http://localhost:5000/api/order/${order._id}`, {
                          ...order,
                          registerName: newName
                        });
                        fetchOrders();
                      }}
                      className="form-input"
                      disabled={order.isFinalised} 
                    />
                  </div>
                  <div className="form-group">
                    <label><strong>Phone:</strong></label>
                    <input
                      type="text"
                      value={order.phone}
                      onChange={async e => {
                        const newPhone = e.target.value;
                        await axios.put(`http://localhost:5000/api/order/${order._id}`, {
                          ...order,
                          phone: newPhone
                        });
                        fetchOrders();
                      }}
                      className="form-input"
                      disabled={order.isFinalised}
                    />
                  </div>
                  <div className="form-group">
                    <label><strong>Address:</strong></label>
                    <input
                      type="text"
                      value={order.address}
                      onChange={async e => {
                        const newAddress = e.target.value;
                        await axios.put(`http://localhost:5000/api/order/${order._id}`, {
                          ...order,
                          address: newAddress
                        });
                        fetchOrders();
                      }}
                      className="form-input"
                      disabled={order.isFinalised}
                    />
                  </div>
                </div>
                
                <div className="order-type-info">
                  <h5>Order Type</h5>
                  <div className="form-group">
                    <select
                      value={order.type}
                      onChange={async e => {
                        const newType = e.target.value;
                        const updatedOrder = { ...order, type: newType };
                        if (newType !== 'dine in') {
                          delete updatedOrder.dineInDate;
                          delete updatedOrder.dineInTime;
                        }
                        await axios.put(`http://localhost:5000/api/order/${order._id}`, updatedOrder);
                        fetchOrders();
                      }}
                      className="form-select"
                      disabled={order.isFinalised}
                    >
                      <option value="dine in">Dine In</option>
                      <option value="take away">Take Away</option>
                    </select>
                  </div>
                  {order.type === 'dine in' && !order.isFinalised && (
                    <>
                      <div className="form-group">
                        <label><strong>Dine-In Date:</strong></label>
                        <input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={order.dineInDate || ''}
                          onChange={async e => {
                            await axios.put(`http://localhost:5000/api/order/${order._id}`, {
                              ...order,
                              dineInDate: e.target.value
                            });
                            fetchOrders();
                          }}
                          className="form-input"
                        />
                      </div>
                      {order.dineInDate && (
                        <div className="form-group">
                          <label><strong>Time Slot:</strong></label>
                          <select
                            value={order.dineInTime || ''}
                            onChange={async e => {
                              await axios.put(`http://localhost:5000/api/order/${order._id}`, {
                                ...order,
                                dineInTime: e.target.value
                              });
                              fetchOrders();
                            }}
                            className="form-select"
                          >
                            <option value="">-- Select Slot --</option>
                            {TIME_SLOTS.map(slot => {
                              const slotKey = `${order.dineInDate}_${slot}`;
                              const count = slotCounts[slotKey] || 0;
                              const endTimeStr = slot.split(' - ')[1];
                              const [time, ampm] = endTimeStr.trim().split(' ');
                              let [hours, minutes] = time.split(':').map(Number);
                              if (ampm === 'PM' && hours !== 12) hours += 12;
                              if (ampm === 'AM' && hours === 12) hours = 0;
                              const slotDateTime = new Date(`${order.dineInDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
                              const now = new Date();
                              const isPast = slotDateTime < now;
                              const isFull = count >= 3;
                              const disabled = isPast || isFull;
                              return (
                                <option key={slot} value={slot} disabled={disabled}>
                                  {slot} {isFull ? '(Full)' : isPast ? '(Past)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="order-message">
                <label>
                  <strong>Order Message:</strong>
                  <textarea
                    type="text"
                    value={order.msg || ''}
                    placeholder={placeholderTexts[placeholderIndex]}
                    onChange={async (e) => {
                      const newMsg = e.target.value;
                      await axios.put(`http://localhost:5000/api/order/${order._id}`, {
                        ...order,
                        msg: newMsg
                      });
                      fetchOrders();
                    }}
                    className="textarea animated-placeholder"
                    disabled={order.isFinalised}
                  />
                </label>
              </div>
              <h4>🛒 Items:</h4>
              <div className="items-horizontal-layout">
                {order.items.map((item, idx) => (
                  <div key={idx} className="item-horizontal-card">
                    <img
                      src={item.image ? `/Food/${item.image}` : '/Food/fresh-homemade-pita-alon-shaya.jpg'}
                      alt={item.name}
                      className="item-horizontal-img"
                      onError={e => { e.target.src = '/Food/fresh-homemade-pita-alon-shaya.jpg'; }}
                    />
                    <div className="item-horizontal-content">
                      <div className="item-horizontal-header">
                        <h5 className="item-horizontal-name">{item.name}</h5>
                        {!order.isFinalised && (
                          <button
                            className="item-remove-x"
                            onClick={async () => {
                              const updatedItems = order.items.filter((_, i) => i !== idx);
                              if (updatedItems.length === 0) {
                                await axios.delete(`http://localhost:5000/api/order/${order._id}`);
                              } else {
                                const updatedTotal = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
                                await axios.put(`http://localhost:5000/api/order/${order._id}`, {
                                  ...order,
                                  items: updatedItems,
                                  total: updatedTotal,
                                });
                              }
                              fetchOrders();
                              onCartUpdate?.();
                            }}
                            disabled={order.isFinalised}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className="item-horizontal-controls">
                        <div className="qty-control">
                          <span>Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={async (e) => {
                              const updatedItems = [...order.items];
                              updatedItems[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                              const res = await axios.put(`http://localhost:5000/api/order/${order._id}`, {
                                ...order,
                                items: updatedItems,
                              });
                              setOrders(orders => orders.map(o => o._id === order._id ? res.data : o));
                              fetchOrders();
                              onCartUpdate?.();
                            }}
                            className="qty-input"
                            disabled={order.isFinalised}
                          />
                        </div>
                        <div className="price-display">
                          <span className="unit-price">{currencySymbols[currency]}{convertPrice(item.price).toFixed(2)} each</span>
                          <span className="total-price">Total: {currencySymbols[currency]}{convertPrice(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pricing-summary-card">
                <div className="pricing-row">
                  <span className="pricing-label">Subtotal:</span>
                  <span className="pricing-value">{currencySymbols[currency]}{convertPrice(order.total).toFixed(2)}</span>
                </div>
                <div className="pricing-row">
                  <span className="pricing-label">GST (5%):</span>
                  <span className="pricing-value">{currencySymbols[currency]}{convertPrice(order.gst || Math.round(order.total * 0.05)).toFixed(2)}</span>
                </div>
                <div className="pricing-divider"></div>
                <div className="pricing-row final-total">
                  <span className="pricing-label">Total Amount:</span>
                  <span className="pricing-value">{currencySymbols[currency]}{convertPrice(order.finalTotal || (order.total + Math.round(order.total * 0.05))).toFixed(2)}</span>
                </div>
              </div>
              {!order.isFinalised && (
                <div className="order-actions-card">
                  <button className="action-btn delete-action" onClick={() => handleDelete(order._id)}>
                    <span className="btn-icon">🗑</span>
                    <span className="btn-text">Delete Order</span>
                  </button>
                  <button className="action-btn pay-action" onClick={() => handlePayNow(order)}>
                    <span className="btn-icon">💳</span>
                    <span className="btn-text">Pay Now</span>
                  </button>
                </div>
              )}
              {order.isFinalised && (
                <div className="locked-status-card">
                  <span className="status-icon">✅</span>
                  <span className="status-text">Order placed and locked</span>
                </div>
              )}
            </div>
          ))}
        </>
      )}
      {/* Ordered */}
      {orderedOrders.length > 0 && (
        <>
          <h2 className="section-heading">Track Order</h2>
          <h3 className="order-status ordered">Ordered (Processing)</h3>
          {orderedOrders.map(order => (
            <div key={order._id} className="cart-order-block">
              {/* ...other fields... */}
              <h4>🛒 Items:</h4>
              <ul className="order-items-list">
                {order.items.map((item, idx) => (
                  <li key={idx} className="order-item">
                    <div className="order-item-content">
                      <img 
                        src={item.image ? `/Food/${item.image}` : '/Food/fresh-homemade-pita-alon-shaya.jpg'}
                        alt={item.name}
                        className="order-item-img"
                        onError={e => { e.target.src = '/Food/fresh-homemade-pita-alon-shaya.jpg'; }}
                      />
                      <div className="order-item-details">
                        <div className="order-item-name">{item.name}</div>
                        <div className="order-item-quantity">Quantity: {item.quantity}</div>
                        <div className="order-item-price">
                          Total: ₹{(item.price * item.quantity).toFixed(2)} (₹{item.price} each)
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <h3 className="order-total">Total Amount: {currencySymbols[currency]}{convertPrice(order.total).toFixed(2)}</h3>
              <p><strong>Status:</strong> {order.status}</p>
              {!order.isFinalised && (
                <>
                  <button className="delete-btn order-btn" onClick={() => handleDelete(order._id)}>🗑 Delete</button>
                  <button className="order-btn success" onClick={() => handlePayNow(order)}>💳 Pay Now</button>
                </>
              )}
              {order.isFinalised && (
                <>
                  <span className="locked-status">
                    Order Status: {order.status}
                  </span>
                  <button onClick={() => { setShowBill(true); setBillOrder(order); }}>💵 View Bill</button>
                </>
              )}
            </div>
          ))}
        </>
      )}
      {pendingOrders.length === 0 && orderedOrders.length === 0 && (
        <p className="empty-cart-msg">No active orders.</p>
      )}
      </>
      )}
      {/* Order History */}
      {history && (
        <>
          <button className="back-btn" onClick={() => setHistory(false)}>⬅ Back to Orders</button>
          <h2 className="section-heading" style={{ marginTop: 40 }}>Order History</h2>
          {orderHistory.length === 0 ? (
            <p className="empty-cart-msg">No previous orders.</p>
          ) : (
            orderHistory.map(order => (
              <div key={order._id} className="cart-order-block order-history">
                <p className="order-title"><strong>Name:</strong> {order.registerName}</p>
                <p><strong>Address:</strong> {order.address}</p>
                <p><strong>Order Message:</strong> {order.msg}</p>
                <h4>🛒 Items:</h4>
                <ul className="order-items-list">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="order-item">
                      <div className="order-item-content">
                        <img 
                          src={item.image ? `/Food/${item.image}` : '/Food/fresh-homemade-pita-alon-shaya.jpg'}
                          alt={item.name}
                          className="order-item-img"
                          onError={e => { e.target.src = '/Food/fresh-homemade-pita-alon-shaya.jpg'; }}
                        />
                        <div className="order-item-details">
                          <div className="order-item-name">
                            {item.name}
                            <div className="item-rating" style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '10px' }}>
                              {renderStars(items.find(i => i.Title === item.name)?.averageRating || 0)}
                              <span style={{ fontSize: '12px', color: '#666', marginLeft: '5px' }}>
                                ({items.find(i => i.Title === item.name)?.averageRating?.toFixed(1) || '0.0'})
                              </span>
                            </div>
                          </div>
                          <div className="order-item-quantity">Quantity: {item.quantity}</div>
                          <div className="order-item-price">
                            Total: ₹{(item.price * item.quantity).toFixed(2)} (₹{item.price} each)
                          </div>
                          {(order.status === 'delivered' || order.status === 'Reservation Over') && (
                            <button 
                              className="review-item-btn"
                              onClick={() => handleShowReviews(item.name)}
                            >
                              {item.reviewed ? 'Update' : 'Review'}
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <h3 className="order-total">Total: ₹{order.total}</h3>
                <button
                  className="reorder-btn order-btn"
                  onClick={async () => {
                    try {
                      await axios.post(`http://localhost:5000/api/order/${order._id}/reorder`);
                      fetchOrders();
                      onCartUpdate?.(); // <-- Update badge after reorder
                      alert('Order re-added to cart');
                    } catch {
                      alert('Failed to reorder');
                    }
                  }}
                >
                  🔁 Reorder
                </button>
                <span style={{ color: 'gray', fontWeight: 'bold' }}>{order.status}</span>
              </div>
            ))
          )}
        </>
      )}
      {/* Bill Modal */}
      {showBill && billOrder && (
        <BillModal order={billOrder} onClose={() => {
          setShowBill(false);
          setBillOrder(null);
        }} />
      )}

      {/* Review Modal */}
      {showReviewModal && reviewItem && (
        <ReviewModal 
          item={reviewItem} 
          user={user} 
          onClose={handleCloseReviews}
          onReviewUpdate={() => { fetchItems(); fetchOrders(); onItemsUpdate?.(); }}
          canReview={history}
        />
      )}
    </div>
  );
}