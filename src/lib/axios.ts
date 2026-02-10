import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || undefined,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // const token = getToken()
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.message;
      console.error("API Error:", message);

      // Handle specific status codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login or refresh token
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          break;
        case 403:
          // Forbidden
          console.error("Access forbidden");
          break;
        case 404:
          // Not found
          console.error("Resource not found");
          break;
        case 500:
          // Server error
          console.error("Server error");
          break;
        default:
          break;
      }
    } else if (error.request) {
      // Request made but no response
      console.error("No response from server");
    } else {
      // Something else happened
      console.error("Request error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
