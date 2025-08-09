// Simple encoding/decoding utilities
const encode = (data) => btoa(JSON.stringify(data));
const decode = (encodedData) => JSON.parse(atob(encodedData));

export const secureStorage = {
  setItem: (key, data) => {
    const encoded = encode(data);
    sessionStorage.setItem(key, encoded);
    localStorage.setItem(key, encoded);
  },
  
  getItem: (key) => {
    const encoded = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (!encoded) return null;
    try {
      return decode(encoded);
    } catch {
      return null;
    }
  },
  
  removeItem: (key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
};