// services/api/axiosInstance.ts
import axios from 'axios';

const axiosInstance = axios.create({
  // If your Next.js site is served at the same domain,
  // you can leave baseURL empty or set it to the origin.
  // If you have a separate API domain, set it here:
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  withCredentials: true, // if you need cookies
});

export default axiosInstance;
