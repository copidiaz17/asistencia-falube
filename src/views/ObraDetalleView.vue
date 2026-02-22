<template>
  <div class="obra-detalle-view">
    <h2 class="titulo-obra" v-if="obra.nombre">{{ obra.nombre }}</h2>
    <p class="obra-ubicacion" v-if="obra.ubicacion">📍 {{ obra.ubicacion }}</p>

    <!-- ACCIONES -->
    <div class="acciones-container">
      <button
        v-if="authStore.canModify"
        @click="goToAddEmpleado"
        class="btn-primary btn-success btn-lg action-btn"
      >
        👷 Agregar Empleado
      </button>

      <button
        @click="goToRegistrarAsistencia"
        class="btn-primary btn-warning btn-lg action-btn"
      >
        ✅ Registrar Asistencia
      </button>

      <button
        @click="goToInforme"
        class="btn-primary btn-info btn-lg action-btn"
      >
        📊 Informe de Horas
      </button>
    </div>

    <!-- LISTADO DE EMPLEADOS -->
    <div class="panel panel-empleados" v-if="empleados.length > 0 || cargando">
      <h3 class="panel-titulo">Empleados de la Obra</h3>

      <div v-if="cargando" class="text-muted">Cargando...</div>

      <div class="table-wrapper" v-else>
        <table class="data-table">
          <thead>
            <tr>
              <th>Apellido</th>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Categoría</th>
              <th>F. Ingreso</th>
              <th v-if="authStore.canModify">Acciones</th>
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
              <td>{{ formatDate(emp.fechaIngreso) }}</td>
              <td v-if="authStore.canModify">
                <button class="btn-small btn-info" @click="editarEmpleado(emp.id)">Editar</button>
                <button class="btn-small btn-danger" @click="darDeBaja(emp)">Baja</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="!cargando" class="panel panel-empleados">
      <h3 class="panel-titulo">Empleados de la Obra</h3>
      <p class="text-muted">No hay empleados registrados en esta obra.</p>
    </div>

    <!-- ASISTENCIA DEL DÍA -->
    <div class="panel panel-asistencia-hoy" v-if="empleados.length > 0">
      <div class="panel-hoy-header">
        <h3 class="panel-titulo" style="margin:0;">Asistencia del Día</h3>
        <button
          v-if="authStore.canModify"
          class="btn-primary btn-warning btn-sm"
          @click="goToRegistrarAsistencia"
        >
          {{ asistenciaHoy.length > 0 && asistenciaHoy.some(e => e.presente || e.horarioIngreso) ? 'Editar Asistencia' : 'Registrar Asistencia' }}
        </button>
      </div>

      <div v-if="cargandoHoy" class="text-muted mt-1">Cargando...</div>

      <template v-else>
        <div class="resumen-hoy mt-1">
          Presentes: <strong>{{ cantidadPresentesHoy }}</strong> / {{ asistenciaHoy.length }}
          <span v-if="asistenciaHoy.length > 0">
            &nbsp;·&nbsp;{{ ((cantidadPresentesHoy / asistenciaHoy.length) * 100).toFixed(0) }}%
          </span>
        </div>

        <div class="table-wrapper mt-1">
          <table class="data-table">
            <thead>
              <tr>
                <th>Apellido</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th style="text-align:center;">Presente</th>
                <th style="text-align:center;">H. Ingreso</th>
                <th style="text-align:center;">H. Salida</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in asistenciaHoy" :key="emp.id">
                <td>{{ emp.apellido }}</td>
                <td>{{ emp.nombre }}</td>
                <td>
                  <span :class="'badge-cat badge-' + emp.categoria.replace(/ /g, '-')">
                    {{ emp.categoria }}
                  </span>
                </td>
                <td style="text-align:center;">
                  <span :class="emp.presente ? 'badge-presente' : 'badge-ausente'">
                    {{ emp.presente ? 'Sí' : 'No' }}
                  </span>
                </td>
                <td style="text-align:center;">{{ emp.presente && emp.horarioIngreso ? emp.horarioIngreso.substring(0,5) : '—' }}</td>
                <td style="text-align:center;">{{ emp.presente && emp.horarioSalida ? emp.horarioSalida.substring(0,5) : '—' }}</td>
                <td>{{ emp.observacion || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- HISTORIAL DE ASISTENCIA (días anteriores) -->
    <div class="panel panel-historial" v-if="historialPasado.length > 0">
      <h3 class="panel-titulo">Historial de Asistencia</h3>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Presentes</th>
              <th>Total</th>
              <th>% Asistencia</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="h in historialPasado"
              :key="h.fecha"
              class="fila-historial"
              @click="verDetalle(h.fecha)"
              title="Ver detalle del día"
            >
              <td>{{ formatDate(h.fecha) }}</td>
              <td>{{ h.presentes }}</td>
              <td>{{ h.total }}</td>
              <td>{{ h.total > 0 ? ((h.presentes / h.total) * 100).toFixed(0) : 0 }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { useAuthStore } from "../stores/authStore";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";

export default {
  name: "ObraDetalleView",
  setup() {
    const authStore = useAuthStore();
    const route = useRoute();
    const toast = useToast();
    return { authStore, route, toast };
  },
  data() {
    return {
      obra: {},
      empleados: [],
      historialAsistencia: [],
      asistenciaHoy: [],
      cargando: true,
      cargandoHoy: false,
    };
  },
  computed: {
    hoy() {
      return new Date().toISOString().split("T")[0];
    },
    cantidadPresentesHoy() {
      return this.asistenciaHoy.filter((e) => e.presente).length;
    },
    historialPasado() {
      return this.historialAsistencia.filter((h) => h.fecha < this.hoy);
    },
  },
  watch: {
    "route.params.obraId": {
      immediate: true,
      async handler(obraId) {
        if (!obraId) return;
        this.obra = {};
        this.empleados = [];
        this.historialAsistencia = [];
        this.asistenciaHoy = [];
        this.cargando = true;
        await this.fetchData();
        this.cargando = false;
      },
    },
  },
  methods: {
    async fetchData() {
      const obraId = this.route.params.obraId;
      try {
        const [obraRes, empRes, histRes] = await Promise.all([
          api.get(`/obras/${obraId}`),
          api.get(`/obras/${obraId}/empleados`),
          api.get(`/obras/${obraId}/asistencia/historial`),
        ]);
        this.obra = obraRes.data;
        this.empleados = empRes.data || [];
        this.historialAsistencia = histRes.data || [];
      } catch (e) {
        console.error("Error cargando obra:", e);
      }
      // Cargar asistencia de hoy por separado
      await this.fetchAsistenciaHoy();
    },

    async fetchAsistenciaHoy() {
      const obraId = this.route.params.obraId;
      this.cargandoHoy = true;
      try {
        const res = await api.get(`/obras/${obraId}/asistencia?fecha=${this.hoy}`);
        this.asistenciaHoy = res.data || [];
      } catch (e) {
        console.error("Error cargando asistencia de hoy:", e);
      } finally {
        this.cargandoHoy = false;
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return "";
      const parts = dateStr.split("T")[0].split("-");
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    },

    goToAddEmpleado() {
      this.$router.push({ name: "AddEmpleado", params: { obraId: this.route.params.obraId } });
    },

    goToRegistrarAsistencia() {
      this.$router.push({ name: "RegistrarAsistencia", params: { obraId: this.route.params.obraId } });
    },

    goToInforme() {
      this.$router.push({ name: "InformeHoras", params: { obraId: this.route.params.obraId } });
    },

    verDetalle(fecha) {
      this.$router.push({
        name: "AsistenciaDetalle",
        params: { obraId: this.route.params.obraId, fecha },
      });
    },

    editarEmpleado(empleadoId) {
      this.$router.push({
        name: "EditarEmpleado",
        params: { obraId: this.route.params.obraId, empleadoId },
      });
    },

    async darDeBaja(emp) {
      if (!confirm(`¿Confirmar baja de ${emp.nombre} ${emp.apellido}?`)) return;
      try {
        await api.delete(`/obras/${this.route.params.obraId}/empleados/${emp.id}`);
        this.toast.success("Empleado dado de baja correctamente.");
        await this.fetchData();
      } catch (e) {
        this.toast.error("Error al dar de baja el empleado.");
      }
    },
  },
};
</script>

<style scoped>
.obra-detalle-view { padding: 20px; }
.titulo-obra { text-align: center; font-size: 2rem; margin-bottom: 4px; color: #f0c040; }
.obra-ubicacion { text-align: center; color: #9ca3af; margin-bottom: 20px; }

.panel {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
}

.panel-titulo {
  color: #f0c040;
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.panel-empleados       { border-color: #f0c040; }
.panel-asistencia-hoy  { border-color: #60a5fa; }
.panel-historial       { border-color: #34d399; }

.panel-hoy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 0.82rem;
}

.mt-1 { margin-top: 8px; }

.resumen-hoy {
  color: #60a5fa;
  font-size: 0.92rem;
}

.badge-presente {
  background: #064e3b;
  color: #6ee7b7;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.80rem;
  font-weight: 700;
}

.badge-ausente {
  background: #4c1d1d;
  color: #fca5a5;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.80rem;
  font-weight: 700;
}

.table-wrapper { overflow-x: auto; }

.badge-cat {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: capitalize;
}
.badge-ayudante         { background: #374151; color: #d1d5db; }
.badge-medio-oficial    { background: #1e3a5f; color: #93c5fd; }
.badge-oficial          { background: #064e3b; color: #6ee7b7; }
.badge-oficial-especializado { background: #3b1f00; color: #fbbf24; }
.badge-capataz          { background: #4c1d1d; color: #fca5a5; }

.btn-small { margin: 0 2px; }
.text-muted { color: #9ca3af; font-size: 0.9rem; }

.fila-historial {
  cursor: pointer;
  transition: background 0.15s;
}
.fila-historial:hover {
  background: #2a2a2a;
}
</style>
