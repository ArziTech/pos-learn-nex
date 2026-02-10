import axios from "./axios"

// Example API functions using axios
export const api = {
  // Auth
  auth: {
    register: (data: { email: string; password: string; name?: string }) =>
      axios.post("/auth/register", data),
    login: (data: { email: string; password: string }) =>
      axios.post("/auth/login", data),
  },

  // Users
  users: {
    getMe: () => axios.get("/users/me"),
    update: (data: any) => axios.put("/users/me", data),
  },

  // Add more API endpoints here
}
