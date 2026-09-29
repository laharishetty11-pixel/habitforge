import axios from "axios";
import { API_URL } from "./config";

// Attach the login token to every request going to our backend
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // Only send the token to our own API, never to other websites
  if (token && config.url && config.url.startsWith(API_URL)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// If the backend says the token is missing or expired, send the user to login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);