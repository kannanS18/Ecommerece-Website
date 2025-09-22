// Simple API test to debug connection issues
import { API_BASE_URL } from './config.js';

export const testApiConnection = async () => {
  console.log('Testing API connection...');
  console.log('API_BASE_URL:', API_BASE_URL);
  
  try {
    // Test 1: Basic fetch
    console.log('Test 1: Basic fetch to /api/health');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    console.log('Health check status:', healthResponse.status);
    const healthData = await healthResponse.json();
    console.log('Health check data:', healthData);
    
    // Test 2: Items endpoint
    console.log('Test 2: Fetch items');
    const itemsResponse = await fetch(`${API_BASE_URL}/api/items`);
    console.log('Items status:', itemsResponse.status);
    
    if (itemsResponse.ok) {
      const itemsData = await itemsResponse.json();
      console.log('Items count:', itemsData.length);
      console.log('First item:', itemsData[0]);
    } else {
      console.error('Items fetch failed:', itemsResponse.statusText);
    }
    
  } catch (error) {
    console.error('API test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
};

// Auto-run test in development
if (process.env.NODE_ENV === 'development') {
  testApiConnection();
}