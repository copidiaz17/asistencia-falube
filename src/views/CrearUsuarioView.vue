<template>
  <div class="panel-content-centered">
    <div class="card form-card">
      <h1 class="titulo-pagina">Crear Nuevo Usuario</h1>

      <p v-if="mensaje" :class="['alert', 'mt-2', mensajeTipo === 'ok' ? 'success' : 'error']">
        {{ mensaje }}
      </p>

      <form @submit.prevent="crearUsuario">
        <div class="form-group">
          <label class="form-label">Nombre *</label>
          <input v-model="form.nombre" type="text" class="input-control" required placeholder="Nombre del usuario" />
        </div>

        <div class="form-group">
          <label class="form-label">Email *</label>
          <input v-model="form.email" type="email" class="input-control" required placeholder="correo@ejemplo.com" />
        </div>

        <div class="form-group">
          <label class="form-label">Contraseña *</label>
          <input v-model="form.password" type="password" class="input-control" required placeholder="Contraseña" />
        </div>

        <div class="form-group">
          <label class="form-label">Rol *</label>
          <select v-model="form.rol" class="input-control" required>
            <option value="usuario">Usuario</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>

        <button type="submit" class="btn-primary btn-success" style="width:100%;">
          Crear Usuario
        </button>

        <button type="button" class="btn-primary btn-dark mt-2" style="width:100%;" @click="$router.back()">
          Cancelar
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { useAuthStore } from "../stores/authStore";

export default {
  name: "CrearUsuarioView",
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      form: {
        nombre: "",
        email: "",
        password: "",
        rol: "usuario",
      },
      mensaje: "",
      mensajeTipo: "",
    };
  },
  computed: {
    esSuperAdmin() {
      return this.authStore.user && this.authStore.user.id === 1;
    },
  },
  methods: {
    async crearUsuario() {
      if (!this.esSuperAdmin) {
        this.mensaje = "No tiene permisos para crear usuarios.";
        this.mensajeTipo = "error";
        return;
      }

      this.mensaje = "";
      this.mensajeTipo = "";

      try {
        const payload = {
          nombre: this.form.nombre.trim(),
          email: this.form.email.trim(),
          password: this.form.password,
          rol: this.form.rol,
        };

        const res = await api.post("/usuarios", payload);

        if (res.data && res.data.ok) {
          this.mensaje = "Usuario creado correctamente.";
          this.mensajeTipo = "ok";
          this.form.nombre = "";
          this.form.email = "";
          this.form.password = "";
          this.form.rol = "usuario";
        } else {
          this.mensaje = res.data?.message || "No se pudo crear el usuario.";
          this.mensajeTipo = "error";
        }
      } catch (error) {
        this.mensaje =
          error.response?.data?.message || "Error al crear el usuario.";
        this.mensajeTipo = "error";
      }
    },
  },
  mounted() {
    if (!this.esSuperAdmin) {
      this.$router.replace({ name: "DashboardHome" });
    }
  },
};
</script>

<style scoped>
.mt-2 { margin-top: 8px; }

.alert.success {
  background: #1a3a1a;
  color: #4ade80;
  border: 1px solid #4ade80;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.alert.error {
  background: #3a1a1a;
  color: #f87171;
  border: 1px solid #f87171;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 12px;
}
</style>
