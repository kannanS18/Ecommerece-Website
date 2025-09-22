import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Cssfiles/ReviewModal.css';
import { API_BASE_URL } from '../../config';

const ReviewModal = ({ item, user, onClose, onReviewUpdate, canReview = false }) => {
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [actualCanReview, setActualCanReview] = useState(false);

  const handleRatingInputChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    if (value <= 5) {
      setRating(value);
    }
  };

  useEffect(() => {
    if (item) {
      fetchReviews();
      if (user) {
        fetchUserReview();
        checkCanReview();
      }
    }
  }, [item, user]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/reviews/${item._id}`);
      setReviews(res.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchUserReview = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/reviews/${item._id}/${user.registerEmail || user.email}`);
      if (res.data) {
        setUserReview(res.data);
        setRating(res.data.rating);
        setComment(res.data.comment || '');
      }
    } catch (error) {
      // User hasn't reviewed yet
    }
  };

  const checkCanReview = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/can-review/${item._id}/${user.registerEmail || user.email}`);
      setActualCanReview(res.data.canReview);
    } catch (error) {
      setActualCanReview(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/reviews`, {
        itemId: item._id,
        userEmail: user.registerEmail || user.email,
        userName: user.registerName || user.name,
        rating,
        comment
      });
      
      await fetchReviews();
      await fetchUserReview();
      onReviewUpdate?.(); // Notify parent to refresh data
      alert('Review submitted successfully!');
      onClose(); // Close the modal after successful submission
    } catch (error) {
      alert('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/reviews/${item._id}/${user.registerEmail || user.email}`);
      setUserReview(null);
      setRating(0);
      setComment('');
      await fetchReviews();
      onReviewUpdate?.(); // Notify parent to refresh data
      alert('Review deleted successfully!');
    } catch (error) {
      alert('Failed to delete review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (currentRating, isClickable = false) => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      const isFilled = index < Math.floor(currentRating);
      const isHalfFilled = index === Math.floor(currentRating) && currentRating % 1 >= 0.5;
      
      return (
        <span
          key={index}
          className={`star ${isFilled ? 'filled' : isHalfFilled ? 'half-filled' : ''} ${isClickable ? 'clickable' : ''}`}
          onClick={isClickable ? () => handleStarClick(starValue) : undefined}
          onMouseEnter={isClickable ? () => setHoverRating(starValue) : undefined}
          onMouseLeave={isClickable ? () => setHoverRating(0) : undefined}
        >
          ★
        </span>
      );
    });
  };

  const handleStarClick = (starValue) => {
    setRating(starValue);
  };

  return (
    <div className="review-modal-backdrop" onClick={onClose}>
      <div className="review-modal" onClick={e => e.stopPropagation()}>
        <div className="review-modal-header">
          <h2>Reviews for {item.Title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="review-modal-content">
          {/* Item Rating Summary */}
          <div className="rating-summary">
            <div className="average-rating">
              <span className="rating-number">{item.averageRating?.toFixed(1) || '0.0'}</span>
              <div className="stars-display">
                {renderStars(item.averageRating || 0)}
              </div>
              <span className="review-count">({item.reviewCount || 0} reviews)</span>
            </div>
          </div>

          {/* User Review Section */}
          {user && actualCanReview && (
            <div className="user-review-section">
              <h3>{userReview ? 'Your Review' : 'Write a Review'}</h3>
              <div className="rating-input">
                <span>Rating: </span>
                <input
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={rating || ''}
                  onChange={handleRatingInputChange}
                  className="rating-number-input"
                  placeholder="0.0"
                />
                <div className="stars-display clickable-stars">
                  {renderStars(hoverRating || rating, true)}
                </div>
                <small>Click stars to rate or type a number (max 5.0)</small>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review here... (optional)"
                maxLength={500}
                rows={3}
              />
              <div className="review-actions">
                <button 
                  onClick={handleSubmitReview} 
                  disabled={loading}
                  className="submit-review-btn"
                >
                  {loading ? 'Saving...' : userReview ? 'Update Review' : 'Submit Review'}
                </button>
                {userReview && (
                  <button 
                    onClick={handleDeleteReview} 
                    disabled={loading}
                    className="delete-review-btn"
                  >
                    Delete Review
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Show login message for non-logged users */}
          {!user && (
            <div className="no-review-permission">
              <p>Please log in to write a review.</p>
            </div>
          )}
          
          {/* Show message if user can't review */}
          {user && !actualCanReview && (
            <div className="no-review-permission">
              <p>You can only review items you have purchased and received!</p>
            </div>
          )}

          {/* Reviews List */}
          <div className="reviews-list">
            <h3>All Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <p className="no-reviews">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <span className="reviewer-name">{review.userName}</span>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                    </div>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="review-comment">{review.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;