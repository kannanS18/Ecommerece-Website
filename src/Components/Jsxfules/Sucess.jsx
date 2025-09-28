import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import "../Cssfiles/Success.css";
import { API_BASE_URL } from '../../config';

export default function Success() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (orderId) {
      axios.put(`${API_BASE_URL}/api/order/${orderId}/finalise`, {
        status: "ordered",
      });
    }
  }, [orderId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          window.location.href = "/home";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="checkmark-container">
          <div className="checkmark">✓</div>
        </div>
        <h1 className="success-title">Payment Successful!</h1>
        <p className="success-message">Your order has been placed and finalized.</p>
        <div className="order-info">
          <p>Order ID: <span className="order-id">{orderId}</span></p>
        </div>
        <div className="redirect-info">
          <p>Redirecting to home in <span className="countdown">{countdown}</span> seconds...</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{animationDuration: '5s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}