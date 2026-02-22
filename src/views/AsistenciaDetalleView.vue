<template>
  <div class="panel-content-centered">
    <div class="card form-card" style="max-width: 950px;">
      <div class="detalle-header">
        <div>
          <h1 class="titulo-pagina">Detalle de Asistencia</h1>
          <p class="text-muted mb-3">Fecha: <strong class="fecha-highlight">{{ formatDate(fecha) }}</strong></p>
        </div>
        <button
          v-if="authStore.canModify && esHoy"
          class="btn-primary btn-warning"
          @click="editarAsistencia"
        >
          Editar Asistencia
        </button>
      </div>

      <div v-if="cargando" class="text-muted">Cargando...</div>

      <div v-else-if="empleados.length === 0" class="text-muted">
        No hay registros de asistencia para esta fecha.
      </div>

      <template v-else>
        <div class="resumen-asistencia mb-3">
          Presentes: <strong>{{ cantidadPresentes }}</strong> / {{ empleados.length }}
          &nbsp;·&nbsp;
          {{ empleados.length > 0 ? ((cantidadPresentes / empleados.length) * 100).toFixed(0) : 0 }}% de asistencia
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Apellido</th>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Categoría</th>
                <th style="text-align:center;">Presente</th>
                <th style="text-align:center;">H. Ingreso</th>
                <th style="text-align:center;">H. Salida</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in empleados" :key="emp.id">
                <td>{{ emp.apellido }}</td>
                <td>{{ emp.nombre }}</td>
                <td>{{ emp.dni }}</td>
                <td>
                  <span :class="'badge-cat badge-' + emp.categoria.replace(/ /g, '-')">
                    {{ emp.categoria }}
                  </span>
                </td>
                <td style="text-align:center;">
                  <span :class="emp.presente ? 'badge-presente' : 'badge-ausente'">
                    {{ emp.presente ? "Sí" : "No" }}
                  </span>
                </td>
                <td style="text-align:center;">{{ emp.presente && emp.horarioIngreso ? formatHora(emp.horarioIngreso) : "—" }}</td>
                <td style="text-align:center;">{{ emp.presente && emp.horarioSalida ? formatHora(emp.horarioSalida) : "—" }}</td>
                <td>{{ emp.observacion || "—" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <p v-if="error" class="alert error mt-2">{{ error }}</p>

      <button
        type="button"
        class="btn-primary btn-dark mt-2"
        style="width:100%;"
        @click="$router.back()"
      >
        Volver
      </button>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { useAuthStore } from "../stores/authStore";

export default {
  name: "AsistenciaDetalleView",
  props: ["obraId", "fecha"],
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      empleados: [],
      cargando: false,
      error: "",
    };
  },
  computed: {
    cantidadPresentes() {
      return this.empleados.filter((e) => e.presente).length;
    },
    esHoy() {
      const hoy = new Date().toISOString().split("T")[0];
      return this.fecha === hoy;
    },
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return "";
      const parts = dateStr.split("T")[0].split("-");
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    },
    formatHora(hora) {
      if (!hora) return "—";
      return hora.substring(0, 5);
    },
    editarAsistencia() {
      this.$router.push({
        name: "RegistrarAsistencia",
        params: { obraId: this.obraId },
        query: { fecha: this.fecha },
      });
    },
    async cargarDetalle() {
      this.cargando = true;
      this.error = "";
      try {
        const res = await api.get(`/obras/${this.obraId}/asistencia?fecha=${this.fecha}`);
        this.empleados = res.data;
      } catch (err) {
        this.error = "Error al cargar el detalle de asistencia.";
        console.error(err);
      } finally {
        this.cargando = false;
      }
    },
  },
  mounted() {
    this.cargarDetalle();
  },
};
</script>

<style scoped>
.mb-3 { margin-bottom: 12px; }
.mt-2 { margin-top: 8px; }
.text-muted { color: #9ca3af; font-size: 0.9rem; }

.fecha-highlight { color: #f0c040; }

.detalle-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 4px;
}

.table-wrapper { overflow-x: auto; }

.resumen-asistencia {
  color: #34d399;
  font-size: 0.95rem;
}

.badge-presente {
  background: #064e3b;
  color: #6ee7b7;
  border-radius: 4px;
  padding: 2px 10px;
  font-size: 0.82rem;
  font-weight: 700;
}

.badge-ausente {
  background: #4c1d1d;
  color: #fca5a5;
  border-radius: 4px;
  padding: 2px 10px;
  font-size: 0.82rem;
  font-weight: 700;
}

.badge-cat {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: capitalize;
}
.badge-ayudante              { background: #374151; color: #d1d5db; }
.badge-medio-oficial         { background: #1e3a5f; color: #93c5fd; }
.badge-oficial               { background: #064e3b; color: #6ee7b7; }
.badge-oficial-especializado { background: #3b1f00; color: #fbbf24; }
.badge-capataz               { background: #4c1d1d; color: #fca5a5; }
</style>
