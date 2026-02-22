<template>
  <div class="panel-content-centered">
    <div class="card form-card">
      <h1 class="titulo-pagina">Nueva Obra</h1>

      <form @submit.prevent="crearObra">
        <div class="form-group">
          <label class="form-label">Nombre de la Obra *</label>
          <input type="text" v-model="form.nombre" class="input-control" required placeholder="Nombre de la obra" />
        </div>

        <div class="form-group">
          <label class="form-label">Ubicación</label>
          <input type="text" v-model="form.ubicacion" class="input-control" placeholder="Dirección o descripción del lugar" />
        </div>

        <button type="submit" class="btn-primary btn-success mt-3" style="width:100%;">
          Guardar Obra
        </button>

        <p v-if="error" class="alert error mt-2">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { useToast } from "vue-toastification";

export default {
  name: "CrearObraView",
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      form: { nombre: "", ubicacion: "" },
      error: "",
    };
  },
  methods: {
    async crearObra() {
      this.error = "";
      try {
        await api.post("/obras", this.form);
        this.toast.success("Obra creada correctamente.");
        this.$router.push({ name: "DashboardHome" });
      } catch (err) {
        this.error = err.response?.data?.message || "Error al crear la obra.";
      }
    },
  },
};
</script>

<style scoped>
.mt-3 { margin-top: 16px; }
.mt-2 { margin-top: 8px; }
</style>
