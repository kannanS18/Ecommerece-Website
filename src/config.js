// Debug environment variables
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  all_env: Object.keys(process.env).filter(key => key.startsWith('REACT_APP'))
});

// Temporarily hardcode for testing
const API_BASE_URL = 'https://ecommerece-website-1.onrender.com';
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ecommerece-website-1.onrender.com';

console.log('Final API_BASE_URL:', API_BASE_URL);

export { API_BASE_URL };
// Updated for Render backend - v4 with debugging