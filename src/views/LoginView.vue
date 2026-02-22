<template>
  <div class="login-page">
    <div class="login-container">
      <h1 class="login-title">SISTEMA DE CONTROL DE ASISTENCIA</h1>

      <form @submit.prevent="login" class="login-form">
        <img src="/falube.jpg" alt="Logo Falube" class="logo" />

        <div class="input-group">
          <input v-model="email" type="email" placeholder="Email" required />
        </div>

        <div class="input-group">
          <input v-model="password" type="password" placeholder="Contraseña" required />
        </div>

        <button type="submit" class="btn-submit">Ingresar</button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { useAuthStore } from "../stores/authStore";
import "../assets/css/Loguin.css";

export default {
  name: "LoginView",
  data() {
    return { email: "", password: "", error: null, loading: false };
  },
  methods: {
    async login() {
      this.error = null;
      this.loading = true;
      try {
        const res = await api.post("/auth/login", { email: this.email, password: this.password });
        const token = res.data?.token;
        if (!token) throw new Error("No vino token en la respuesta");

        localStorage.setItem("token", token);
        const authStore = useAuthStore();
        authStore.loadUserFromToken(token);

        this.$router.push({ name: "Dashboard" });
      } catch (err) {
        this.error = err?.response?.data?.message || err?.message || "Error al iniciar sesión";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
img { max-width: 200px; height: auto; }
</style>
