<template>
  <div class="panel-content-centered">
    <div class="card form-card" style="max-width: 950px;">
      <h1 class="titulo-pagina">Registrar Asistencia</h1>
      <p class="text-muted mb-3">Obra ID: {{ obraId }}</p>

      <div class="form-group">
        <label class="form-label">Fecha *</label>
        <input type="date" v-model="fecha" class="input-control" style="max-width: 220px;" />
      </div>

      <div v-if="cargando" class="text-muted">Cargando empleados...</div>

      <div v-else-if="empleados.length === 0" class="text-muted">
        No hay empleados activos en esta obra.
      </div>

      <template v-else>
        <div class="table-wrapper">
          <table class="data-table mt-2">
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
                  <span class="badge-categoria">{{ emp.categoria }}</span>
                </td>
                <td style="text-align:center;">
                  <input
                    type="checkbox"
                    :checked="registros[emp.id] && registros[emp.id].presente"
                    @change="togglePresente(emp.id, $event.target.checked)"
                    class="checkbox-asistencia"
                    :disabled="!!(registros[emp.id] && registros[emp.id].presente && !esSuperAdmin)"
                    :title="registros[emp.id] && registros[emp.id].presente && !esSuperAdmin ? 'Solo el administrador puede desmarcar la presencia' : ''"
                  />
                </td>
                <td style="text-align:center;">
                  <input
                    type="time"
                    :value="registros[emp.id] ? registros[emp.id].horarioIngreso : ''"
                    @change="setField(emp.id, 'horarioIngreso', $event.target.value)"
                    :disabled="!registros[emp.id] || !registros[emp.id].presente || (!esSuperAdmin && !!registros[emp.id].horarioIngreso)"
                    class="input-time"
                    :title="registros[emp.id] && registros[emp.id].horarioIngreso && !esSuperAdmin ? 'Solo el administrador puede modificar el horario de ingreso' : ''"
                  />
                </td>
                <td style="text-align:center;">
                  <input
                    type="time"
                    :value="registros[emp.id] ? registros[emp.id].horarioSalida : ''"
                    @change="setField(emp.id, 'horarioSalida', $event.target.value)"
                    :disabled="!registros[emp.id] || !registros[emp.id].presente || (!esSuperAdmin && !!registros[emp.id].horarioSalida)"
                    class="input-time"
                    :title="registros[emp.id] && registros[emp.id].horarioSalida && !esSuperAdmin ? 'Solo el administrador puede modificar el horario de salida' : ''"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    :value="registros[emp.id] ? registros[emp.id].observacion : ''"
                    @input="setField(emp.id, 'observacion', $event.target.value)"
                    class="input-obs"
                    placeholder="Opcional..."
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="resumen-asistencia">
          Presentes: <strong>{{ cantidadPresentes }}</strong> / {{ empleados.length }}
        </div>

        <button
          class="btn-primary btn-success mt-2"
          style="width:100%;"
          @click="guardar"
          :disabled="guardando || !fecha"
        >
          {{ guardando ? "Guardando..." : "Guardar Asistencia" }}
        </button>
      </template>

      <button
        type="button"
        class="btn-primary btn-dark mt-2"
        style="width:100%;"
        @click="$router.back()"
      >
        Cancelar
      </button>

      <p v-if="error" class="alert error mt-2">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { useToast } from "vue-toastification";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore.js";

export default {
  name: "RegistrarAsistenciaView",
  props: ["obraId"],
  setup() {
    const toast = useToast();
    const route = useRoute();
    const authStore = useAuthStore();
    return { toast, route, authStore };
  },
  data() {
    const hoy = new Date().toISOString().split("T")[0];
    return {
      fecha: hoy,
      empleados: [],
      registros: {},
      cargando: false,
      guardando: false,
      error: "",
    };
  },
  created() {
    const fechaQuery = this.route?.query?.fecha;
    if (fechaQuery) {
      // Asignar sin disparar el watcher (mounted() ya llama cargarAsistencia)
      this.fecha = fechaQuery;
    }
  },
  computed: {
    cantidadPresentes() {
      return Object.values(this.registros).filter((r) => r && r.presente).length;
    },
    esSuperAdmin() {
      return this.authStore.isSuperAdmin;
    },
  },
  watch: {
    fecha(nuevaFecha) {
      if (nuevaFecha) {
        this.cargarAsistencia();
      }
    },
  },
  methods: {
    togglePresente(empId, checked) {
      const prev = this.registros[empId] || { presente: false, horarioIngreso: "", horarioSalida: "", observacion: "", horarioIngresoFijo: false };
      let horarioIngreso = prev.horarioIngreso;
      if (checked && !prev.horarioIngresoFijo && !prev.horarioIngreso) {
        const now = new Date();
        horarioIngreso = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      } else if (!checked) {
        horarioIngreso = "";
      }
      this.registros = {
        ...this.registros,
        [empId]: {
          ...prev,
          presente: checked,
          horarioIngreso,
          horarioSalida: checked ? prev.horarioSalida : "",
        },
      };
    },

    setField(empId, campo, valor) {
      const prev = this.registros[empId] || { presente: false, horarioIngreso: "", horarioSalida: "", observacion: "", horarioIngresoFijo: false };
      this.registros = {
        ...this.registros,
        [empId]: { ...prev, [campo]: valor },
      };
    },

    async cargarAsistencia() {
      this.cargando = true;
      this.error = "";
      try {
        const res = await api.get(
          `/obras/${this.obraId}/asistencia?fecha=${this.fecha}`
        );
        this.empleados = res.data;
        const mapa = {};
        res.data.forEach((emp) => {
          mapa[emp.id] = {
            presente: emp.presente === true,
            horarioIngreso: emp.horarioIngreso ? emp.horarioIngreso.substring(0, 5) : "",
            horarioSalida: emp.horarioSalida ? emp.horarioSalida.substring(0, 5) : "",
            observacion: emp.observacion || "",
            horarioIngresoFijo: !!emp.horarioIngreso,
          };
        });
        this.registros = mapa;
      } catch (err) {
        this.error = "Error al cargar la asistencia.";
        console.error(err);
      } finally {
        this.cargando = false;
      }
    },

    async guardar() {
      if (!this.fecha) {
        this.error = "Debe seleccionar una fecha.";
        return;
      }

      // Validar que los empleados presentes tengan al menos el horario de ingreso
      for (const emp of this.empleados) {
        const reg = this.registros[emp.id];
        if (reg && reg.presente) {
          if (!reg.horarioIngreso) {
            this.error = `${emp.apellido} ${emp.nombre} está marcado como presente pero falta el horario de ingreso.`;
            return;
          }
        }
      }

      this.guardando = true;
      this.error = "";
      try {
        const registros = this.empleados.map((emp) => {
          const reg = this.registros[emp.id] || {};
          return {
            empleadoId: emp.id,
            presente: !!reg.presente,
            horarioIngreso: reg.horarioIngreso || null,
            horarioSalida: reg.horarioSalida || null,
            observacion: reg.observacion || null,
          };
        });

        await api.post(`/obras/${this.obraId}/asistencia`, {
          fecha: this.fecha,
          registros,
        });

        this.toast.success("Asistencia registrada correctamente.");
        this.$router.back();
      } catch (err) {
        this.error =
          err.response?.data?.message || "Error al guardar la asistencia.";
      } finally {
        this.guardando = false;
      }
    },
  },
  mounted() {
    this.cargarAsistencia();
  },
};
</script>

<style scoped>
.mb-3 { margin-bottom: 12px; }
.mt-2 { margin-top: 8px; }
.text-muted { color: #9ca3af; font-size: 0.9rem; }

.table-wrapper { overflow-x: auto; }

.checkbox-asistencia {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #f0c040;
}

.input-time {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #f0f0f0;
  padding: 3px 6px;
  font-size: 0.85rem;
  width: 100px;
}
.input-time:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.input-time:focus {
  outline: none;
  border-color: #f0c040;
}

.input-obs {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #f0f0f0;
  padding: 3px 8px;
  font-size: 0.85rem;
  width: 160px;
}
.input-obs:focus {
  outline: none;
  border-color: #f0c040;
}

.resumen-asistencia {
  margin-top: 12px;
  color: #f0c040;
  font-size: 0.95rem;
}

.badge-categoria {
  background: #2a2a2a;
  color: #f0c040;
  border: 1px solid #f0c040;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.78rem;
  text-transform: capitalize;
  white-space: nowrap;
}
</style>
