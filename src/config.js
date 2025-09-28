// Debug environment variables
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  all_env: Object.keys(process.env).filter(key => key.startsWith('REACT_APP'))
});

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ecommerece-website-1.onrender.com';
const ADMIN_API_URL = process.env.REACT_APP_ADMIN_URL || 'https://ecommerece-website-2.onrender.com';

console.log('Final API_BASE_URL:', API_BASE_URL);
console.log('Final ADMIN_API_URL:', ADMIN_API_URL);

export { API_BASE_URL, ADMIN_API_URL };
// Updated for Render backend - v4 with debugging