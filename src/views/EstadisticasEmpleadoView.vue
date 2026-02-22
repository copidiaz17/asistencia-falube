<template>
  <div class="panel-content-centered">
    <div class="card form-card" style="max-width: 1100px;">
      <h1 class="titulo-pagina">Estadísticas de Empleado</h1>

      <!-- Formulario de selección -->
      <div class="filtros-container">
        <div class="filtro-grupo">
          <label class="filtro-label">Obra:</label>
          <select v-model="obraSeleccionada" @change="cargarEmpleados" class="form-select">
            <option value="">Seleccionar obra...</option>
            <option v-for="obra in obras" :key="obra.id" :value="obra.id">
              {{ obra.nombre }}
            </option>
          </select>
        </div>

        <div class="filtro-grupo" v-if="obraSeleccionada">
          <label class="filtro-label">Empleado:</label>
          <select v-model="empleadoSeleccionado" class="form-select">
            <option value="">Seleccionar empleado...</option>
            <option v-for="emp in empleados" :key="emp.id" :value="emp.id">
              {{ emp.apellido }}, {{ emp.nombre }} - {{ emp.dni }}
            </option>
          </select>
        </div>

        <div class="filtro-grupo">
          <label class="filtro-label">Período:</label>
          <select v-model="periodo" class="form-select">
            <option value="mes">Mes completo</option>
            <option value="quincena">Quincena</option>
          </select>
        </div>

        <div class="filtro-grupo">
          <label class="filtro-label">Año:</label>
          <input v-model.number="year" type="number" class="form-input" min="2020" :max="currentYear" />
        </div>

        <div class="filtro-grupo">
          <label class="filtro-label">Mes:</label>
          <select v-model.number="month" class="form-select">
            <option v-for="m in 12" :key="m" :value="m">{{ nombreMes(m) }}</option>
          </select>
        </div>

        <div class="filtro-grupo" v-if="periodo === 'quincena'">
          <label class="filtro-label">Quincena:</label>
          <select v-model.number="quincena" class="form-select">
            <option :value="1">1ra Quincena (1-15)</option>
            <option :value="2">2da Quincena (16-fin)</option>
          </select>
        </div>

        <button
          @click="consultarEstadisticas"
          class="btn-primary btn-success"
          :disabled="!empleadoSeleccionado || cargando"
        >
          {{ cargando ? 'Consultando...' : 'Consultar' }}
        </button>
      </div>

      <p v-if="error" class="alert error mt-2">{{ error }}</p>

      <!-- Resultados -->
      <template v-if="estadisticas">
        <div class="estadisticas-panel">
          <div class="stats-header">
            <div>
              <h2 class="empleado-nombre">{{ estadisticas.empleado.nombre }}</h2>
              <p class="empleado-info">
                DNI: {{ estadisticas.empleado.dni }} ·
                Categoría: <span :class="'badge-cat badge-' + estadisticas.empleado.categoria.replace(/ /g, '-')">
                  {{ estadisticas.empleado.categoria }}
                </span> ·
                Obra: {{ estadisticas.empleado.obra }}
              </p>
            </div>
            <div class="periodo-info">
              <strong>{{ periodo === 'mes' ? 'Mes completo' : `${quincena}ra Quincena` }}</strong>
              <div class="text-muted">{{ formatDate(estadisticas.periodo.fechaInicio) }} - {{ formatDate(estadisticas.periodo.fechaFin) }}</div>
              <div class="text-muted">{{ estadisticas.periodo.diasPeriodo }} días en el período</div>
            </div>
          </div>

          <!-- Cards de estadísticas -->
          <div class="stats-grid">
            <div class="stat-card stat-presente">
              <div class="stat-numero">{{ estadisticas.estadisticas.diasAsistidos }}</div>
              <div class="stat-label">Días Asistidos</div>
            </div>
            <div class="stat-card stat-ausente">
              <div class="stat-numero">{{ estadisticas.estadisticas.diasInasistidos }}</div>
              <div class="stat-label">Días Inasistidos</div>
            </div>
            <div class="stat-card stat-sin-registro">
              <div class="stat-numero">{{ estadisticas.estadisticas.diasSinRegistro }}</div>
              <div class="stat-label">Días Sin Registro</div>
            </div>
            <div class="stat-card stat-horas">
              <div class="stat-numero">{{ estadisticas.estadisticas.totalHorasTrabajadas }}h</div>
              <div class="stat-label">Horas Trabajadas</div>
            </div>
            <div class="stat-card stat-promedio">
              <div class="stat-numero">{{ estadisticas.estadisticas.promedioHorasDiarias }}h</div>
              <div class="stat-label">Promedio Horas/Día</div>
            </div>
            <div class="stat-card stat-porcentaje">
              <div class="stat-numero">{{ calcularPorcentajeAsistencia() }}%</div>
              <div class="stat-label">% Asistencia</div>
            </div>
          </div>

          <!-- Detalle diario -->
          <div class="detalle-section">
            <h3 class="section-titulo">Detalle Diario</h3>
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th style="text-align:center;">Estado</th>
                    <th style="text-align:center;">H. Ingreso</th>
                    <th style="text-align:center;">H. Salida</th>
                    <th style="text-align:center;">Horas Trabajadas</th>
                    <th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="det in estadisticas.detalle" :key="det.fecha">
                    <td>{{ formatDate(det.fecha) }}</td>
                    <td style="text-align:center;">
                      <span :class="det.presente ? 'badge-presente' : 'badge-ausente'">
                        {{ det.presente ? 'Presente' : 'Ausente' }}
                      </span>
                    </td>
                    <td style="text-align:center;">{{ det.horarioIngreso ? formatHora(det.horarioIngreso) : '—' }}</td>
                    <td style="text-align:center;">{{ det.horarioSalida ? formatHora(det.horarioSalida) : '—' }}</td>
                    <td style="text-align:center;">{{ det.horasTrabajadas > 0 ? det.horasTrabajadas + 'h' : '—' }}</td>
                    <td>{{ det.observacion || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>

      <button
        type="button"
        class="btn-primary btn-dark mt-3"
        style="width:100%;"
        @click="$router.push({ name: 'DashboardHome' })"
      >
        Volver al Dashboard
      </button>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";

export default {
  name: "EstadisticasEmpleadoView",
  data() {
    const now = new Date();
    return {
      obras: [],
      empleados: [],
      obraSeleccionada: "",
      empleadoSeleccionado: "",
      periodo: "mes",
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      quincena: 1,
      currentYear: now.getFullYear(),
      estadisticas: null,
      cargando: false,
      error: "",
    };
  },
  methods: {
    async cargarObras() {
      try {
        const res = await api.get("/obras");
        this.obras = res.data || [];
      } catch (err) {
        console.error("Error al cargar obras:", err);
        this.error = "Error al cargar las obras.";
      }
    },
    async cargarEmpleados() {
      if (!this.obraSeleccionada) {
        this.empleados = [];
        this.empleadoSeleccionado = "";
        return;
      }
      try {
        const res = await api.get(`/obras/${this.obraSeleccionada}/empleados`);
        this.empleados = res.data || [];
        this.empleadoSeleccionado = "";
      } catch (err) {
        console.error("Error al cargar empleados:", err);
        this.error = "Error al cargar los empleados.";
      }
    },
    async consultarEstadisticas() {
      if (!this.empleadoSeleccionado) {
        this.error = "Debe seleccionar un empleado.";
        return;
      }

      this.cargando = true;
      this.error = "";
      this.estadisticas = null;

      try {
        const params = {
          periodo: this.periodo,
          year: this.year,
          month: this.month,
        };

        if (this.periodo === "quincena") {
          params.quincena = this.quincena;
        }

        const res = await api.get(`/estadisticas/empleado/${this.empleadoSeleccionado}`, {
          params,
        });

        if (res.data.ok) {
          this.estadisticas = res.data;
        } else {
          this.error = res.data.error || "Error al obtener estadísticas.";
        }
      } catch (err) {
        console.error("Error al consultar estadísticas:", err);
        this.error = err.response?.data?.error || "Error al consultar las estadísticas.";
      } finally {
        this.cargando = false;
      }
    },
    nombreMes(m) {
      const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      return meses[m - 1];
    },
    formatDate(dateStr) {
      if (!dateStr) return "";
      const parts = dateStr.split("T")[0].split("-");
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    },
    formatHora(hora) {
      if (!hora) return "—";
      return hora.substring(0, 5);
    },
    calcularPorcentajeAsistencia() {
      if (!this.estadisticas) return 0;
      const total = this.estadisticas.estadisticas.diasAsistidos +
                    this.estadisticas.estadisticas.diasInasistidos;
      if (total === 0) return 0;
      return Math.round((this.estadisticas.estadisticas.diasAsistidos / total) * 100);
    },
  },
  mounted() {
    this.cargarObras();
  },
};
</script>

<style scoped>
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 16px; }
.text-muted { color: #9ca3af; font-size: 0.85rem; }

.filtros-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin: 20px 0;
  padding: 16px;
  background: #0d0d0d;
  border: 1px solid #333;
  border-radius: 8px;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filtro-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f0c040;
}

.form-select,
.form-input {
  padding: 8px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 0.9rem;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #f0c040;
}

.estadisticas-panel {
  margin-top: 24px;
  padding: 20px;
  background: #0d0d0d;
  border: 1px solid #f0c040;
  border-radius: 8px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #333;
}

.empleado-nombre {
  color: #f0c040;
  font-size: 1.5rem;
  margin: 0 0 8px;
}

.empleado-info {
  color: #9ca3af;
  font-size: 0.9rem;
  margin: 0;
}

.periodo-info {
  text-align: right;
  color: #60a5fa;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  border: 2px solid;
}

.stat-numero {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.stat-presente {
  background: #064e3b;
  border-color: #10b981;
  color: #6ee7b7;
}

.stat-ausente {
  background: #4c1d1d;
  border-color: #ef4444;
  color: #fca5a5;
}

.stat-sin-registro {
  background: #1e3a8a;
  border-color: #60a5fa;
  color: #93c5fd;
}

.stat-horas {
  background: #3b1f00;
  border-color: #f59e0b;
  color: #fbbf24;
}

.stat-promedio {
  background: #1e293b;
  border-color: #94a3b8;
  color: #cbd5e1;
}

.stat-porcentaje {
  background: #065f46;
  border-color: #34d399;
  color: #6ee7b7;
}

.detalle-section {
  margin-top: 24px;
}

.section-titulo {
  color: #f0c040;
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-wrapper {
  overflow-x: auto;
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
