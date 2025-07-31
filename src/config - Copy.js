// src/config.js
const API_URL = process.env.NODE_ENV === "production"
  ? "https://api.geolabs-software.com"
  : process.env.REACT_APP_API_URL;

export default API_URL;
