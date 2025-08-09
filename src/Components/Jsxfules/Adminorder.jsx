import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import '../Cssfiles/AdminOrders.css';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [newOrderMessage, setNewOrderMessage] = useState(null);
  const notifiedRef = useRef(new Set()); // ✅ store notified IDs without causing re-renders

  const fetchOrders = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await axios.get('http://localhost:5001/api/admin/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const newOrders = res.data;

      // Sort newest first
      const sortedOrders = [...newOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // ✅ Detect truly new orders (not in notifiedRef)
      const newNotifs = sortedOrders.filter(o => !notifiedRef.current.has(o._id));
      if (newNotifs.length > 0) {
        const latest = newNotifs[0];
        notifyOrder(latest);
        // ✅ Mark all current orders as notified
        newNotifs.forEach(o => notifiedRef.current.add(o._id));
      }

      setOrders(sortedOrders);
    } catch (err) {
      console.error('❌ Failed to fetch orders:', err);
    }
  };

  useEffect(() => {
    fetchOrders(); // Initial
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const notifyOrder = (order) => {
    setNewOrderMessage(`🛎️ New Order: ${order.registerName} (${order.type})`);
    setTimeout(() => {
      setNewOrderMessage(null);
    }, 5000);
  };

const updateStatus = async (orderId) => {
  try {
    const token = sessionStorage.getItem('adminToken');
    await axios.put(
      `http://localhost:5001/api/admin/order/${orderId}/status`,
      { status: 'out for delivery' },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    fetchOrders();
    alert('✅ Marked as out for delivery. Auto-complete in 5 minutes.');
  } catch (err) {
    console.error('❌ Status update failed:', err);
    alert('Failed to update status. Please try again.');
  }
};

  return (
    <div className="admin-orders-container">
      <h2>📋 Active Orders (Ordered, Reserved, Out for Delivery)</h2>

      {/* ✅ Notification popup only when new message exists */}
      {newOrderMessage && (
        <div className="notification-popup show">
          {newOrderMessage}
        </div>
      )}

      {orders.length === 0 ? (
        <p>No active orders found.</p>
      ) : (
        orders.map(order => (
          <div key={order._id} className="order-card">
            <p><strong>Name:</strong> {order.registerName}</p>
            <p><strong>Email:</strong> {order.registerEmail}</p>
            <p><strong>Phone:</strong> {order.phone}</p>
            <p><strong>Address:</strong> {order.address}</p>
            <p><strong>Order Message:</strong> {order.msg}</p>
            <p><strong>Order Type:</strong> {order.type}</p>

            {order.type === 'dine in' && (
              <>
                <p><strong>Dine-In Date:</strong> {order.dineInDate}</p>
                <p><strong>Dine-In Time:</strong> {order.dineInTime}</p>
              </>
            )}

            <h4>🛒 Items:</h4>
            <ul>
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.name} × {item.quantity} = ₹{item.price * item.quantity}
                </li>
              ))}
            </ul>

            <p><strong>Total:</strong> ₹{order.total}</p>
            <p><strong>Status:</strong> {order.status}</p>

            {order.status === 'ordered' && (
              <button className="status-btn" onClick={() => updateStatus(order._id)}>
                🚚 Mark as Out for Delivery
              </button>
            )}

            {order.status === 'out for delivery' && (
              <p className="status-note">⏳ Out for delivery</p>
            )}

            {order.status === 'delivered' && (
              <p className="status-note">✅ Delivered</p>
            )}

            {order.status === 'Reservation Over' && (
              <p className="status-note">🕓 Reservation expired</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
