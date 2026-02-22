// src/stores/authStore.js
import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode";

function readTokenFromStorage() {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 > Date.now()) {
        const rol = (decoded.rol || decoded.role || "").toLowerCase().trim();
        return { token, user: decoded, role: rol };
      } else {
        localStorage.removeItem("token");
      }
    } catch (e) {
      localStorage.removeItem("token");
    }
  }
  return { token: null, user: null, role: null };
}

const initialState = readTokenFromStorage();

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: initialState.token,
    user: initialState.user,
    role: initialState.role,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    canModify: (state) => {
      if (!state.role) return false;
      const rol = state.role.toLowerCase().trim();
      return rol === "administrador" || rol === "usuario";
    },
    isSuperAdmin: (state) => !!state.user && Number(state.user.id) === 1,
  },

  actions: {
    loadUserFromToken(token) {
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const rol = (decoded.rol || decoded.role || "").toLowerCase().trim();
          this.user = decoded;
          this.role = rol;
          this.token = token;
        } catch (e) {
          this.logout();
        }
      }
    },

    logout() {
      localStorage.removeItem("token");
      this.user = null;
      this.role = null;
      this.token = null;
      window.location.replace("/");
    },

    initialize() {
      this.loadUserFromToken(this.token);
    },
  },
});
