<template>
  <div class="dashboard">
    <header class="header header-principal">
      <img src="/falube.jpg" alt="logo" class="logo" />

      <div class="header-main-area">
        <h1 class="main-dashboard-title">SISTEMA DE CONTROL DE ASISTENCIA</h1>

        <div class="action-buttons-container">
          <button v-if="authStore.canModify" @click="navigate('CrearObra')" class="btn-action btn-create-obra">
            ➕ Agregar Obra
          </button>

          <button
            v-if="esSuperAdmin"
            @click="navigate('CrearUsuario')"
            class="btn-action btn-user"
          >
            👤 Crear Usuario
          </button>

          <button @click="navigate('EstadisticasEmpleado')" class="btn-action btn-stats">
            📊 Estadísticas
          </button>
        </div>
      </div>

      <div class="user-profile-widget">
        <p class="welcome-text">¡Bienvenido!</p>
        <p class="user-name">{{ authStore.user?.nombre || authStore.user?.email }}</p>
        <button @click="logout" class="btn-logout-visible" type="button">
          <span>⎋</span>
          <span>Salir</span>
        </button>
      </div>

      <button class="hamburger" @click="toggleSidebar" type="button">☰</button>
    </header>

    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>

    <div class="main-content">
      <aside :class="['sidebar', { open: sidebarOpen }]">
        <h2 class="sidebar-title">Obras</h2>
        <ul class="obra-list">
          <li
            v-for="obra in obras"
            :key="obra.id"
            :class="{ selected: obra.id == obraActiva }"
            @click="seleccionarObra(obra.id)"
          >
            <span class="icon">🏗</span>
            <span class="obra-nombre">{{ obra.nombre }}</span>
            <div v-if="obra.id == obraActiva" class="active-indicator"></div>
          </li>
        </ul>
      </aside>

      <main class="panel-central">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { useAuthStore } from "../stores/authStore";

export default {
  name: "DashboardView",
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return { obras: [], sidebarOpen: false, obraActiva: null };
  },
  computed: {
    esSuperAdmin() {
      return this.authStore.user && this.authStore.user.id === 1;
    },
  },
  watch: {
    "$route.params.obraId": {
      immediate: true,
      handler(newId) {
        this.obraActiva = newId ? Number(newId) : null;
      },
    },
  },
  methods: {
    toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; },
    async cargarObras() {
      try {
        const res = await api.get("/obras");
        this.obras = res.data || [];
      } catch (e) {
        console.error("Error cargando obras:", e);
      }
    },
    logout() {
      this.authStore.logout();
      delete api.defaults.headers.common["Authorization"];
      this.$router.push({ name: "Login" });
    },
    navigate(name) { this.$router.push({ name }); },
    seleccionarObra(id) {
      this.obraActiva = Number(id);
      this.sidebarOpen = false;
      this.$router.push({ name: "ObraDetalle", params: { obraId: id } });
    },
  },
  mounted() { this.cargarObras(); },
};
</script>

<style src="../assets/css/Dashboard.css"></style>
