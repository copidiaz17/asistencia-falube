<template>
  <div class="informe-view">
    <div class="informe-header">
      <button class="btn-back" @click="$router.back()">← Volver</button>
      <h2 class="informe-titulo">Informe de Horas — {{ obra.nombre || '...' }}</h2>
    </div>

    <div class="panel panel-selector">
      <div class="selector-row">
        <div class="selector-field">
          <label>Año</label>
          <select v-model="anio">
            <option v-for="a in anios" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <div class="selector-field">
          <label>Mes</label>
          <select v-model="mes">
            <option v-for="(m, i) in meses" :key="i" :value="i + 1">{{ m }}</option>
          </select>
        </div>
        <div class="selector-field">
          <label>Período</label>
          <select v-model="periodo">
            <option value="Q1">1ª Quincena (1-15)</option>
            <option value="Q2">2ª Quincena (16-fin)</option>
            <option value="MES">Mes completo</option>
          </select>
        </div>
        <button class="btn-primary btn-info btn-buscar" @click="cargarReporte" :disabled="cargando">
          {{ cargando ? 'Cargando...' : 'Generar' }}
        </button>
      </div>
      <p class="rango-texto" v-if="desde && hasta">
        Período: <strong>{{ formatDate(desde) }}</strong> al <strong>{{ formatDate(hasta) }}</strong>
      </p>
    </div>

    <div class="panel panel-tabla" v-if="buscado && !cargando && datosConRegistros.length === 0">
      <p class="text-muted">No se encontraron registros de asistencia para el período seleccionado.</p>
    </div>

    <div class="panel panel-tabla" v-if="datosConRegistros.length > 0">
      <div class="tabla-header">
        <h3 class="panel-titulo" style="margin:0;">Resultado</h3>
        <button class="btn-primary btn-danger btn-pdf" @click="exportarPDF">📄 Exportar PDF</button>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Apellido</th>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Categoría</th>
              <th style="text-align:center;">Días Pres.</th>
              <th style="text-align:center;">Días Aus.</th>
              <th style="text-align:center;">Horas Trab.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in datosConRegistros" :key="emp.id">
              <td>{{ emp.apellido }}</td>
              <td>{{ emp.nombre }}</td>
              <td>{{ emp.dni }}</td>
              <td>
                <span :class="'badge-cat badge-' + emp.categoria.replace(/ /g, '-')">{{ emp.categoria }}</span>
              </td>
              <td style="text-align:center;"><span class="badge-presente">{{ emp.diasPresente }}</span></td>
              <td style="text-align:center;">
                <span v-if="emp.diasAusente > 0" class="badge-ausente">{{ emp.diasAusente }}</span>
                <span v-else class="text-muted">0</span>
              </td>
              <td style="text-align:center; font-weight:700; color:#60a5fa;">{{ emp.horasTrabajadas }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="fila-total">
              <td colspan="4"><strong>TOTAL</strong></td>
              <td style="text-align:center;"><strong>{{ totalPresentes }}</strong></td>
              <td style="text-align:center;"><strong>{{ totalAusentes }}</strong></td>
              <td style="text-align:center;"><strong>{{ totalHoras }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

  </div>
</template>

<script>
import api from '../config/axios.Config.js';
import { useRoute } from 'vue-router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default {
  name: 'InformeHorasView',
  setup() {
    const route = useRoute();
    return { route };
  },
  data() {
    const hoy = new Date();
    return {
      obra: {},
      datos: [],
      cargando: false,
      buscado: false,
      anio: hoy.getFullYear(),
      mes: hoy.getMonth() + 1,
      periodo: 'MES',
      desde: null,
      hasta: null,
      meses: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
    };
  },
  computed: {
    anios() {
      const actual = new Date().getFullYear();
      return [actual - 1, actual, actual + 1];
    },
    totalPresentes() { return this.datosConRegistros.reduce((s, e) => s + e.diasPresente, 0); },
    totalAusentes()  { return this.datosConRegistros.reduce((s, e) => s + e.diasAusente, 0); },
    totalHoras() {
      const min = this.datosConRegistros.reduce((s, e) => s + e.totalMinutos, 0);
      if (min <= 0) return '—';
      const h = Math.floor(min / 60), m = min % 60;
      return m > 0 ? h + 'h ' + m + 'm' : h + 'h';
    },
    periodoTexto() {
      if (!this.desde || !this.hasta) return '';
      return this.formatDate(this.desde) + ' al ' + this.formatDate(this.hasta);
    },
    datosConRegistros() {
      return this.datos.filter((e) => e.totalRegistros > 0);
    },
  },
  methods: {
    calcularRango() {
      const anio = this.anio;
      const mes = String(this.mes).padStart(2, '0');
      if (this.periodo === 'Q1') {
        return { desde: anio + '-' + mes + '-01', hasta: anio + '-' + mes + '-15' };
      } else if (this.periodo === 'Q2') {
        const ultimo = new Date(anio, this.mes, 0).getDate();
        return { desde: anio + '-' + mes + '-16', hasta: anio + '-' + mes + '-' + String(ultimo).padStart(2,'0') };
      } else {
        const ultimo = new Date(anio, this.mes, 0).getDate();
        return { desde: anio + '-' + mes + '-01', hasta: anio + '-' + mes + '-' + String(ultimo).padStart(2,'0') };
      }
    },
    async cargarObra() {
      try {
        const res = await api.get('/obras/' + this.route.params.obraId);
        this.obra = res.data;
      } catch(e) { console.error(e); }
    },
    async cargarReporte() {
      const { desde, hasta } = this.calcularRango();
      this.desde = desde; this.hasta = hasta;
      this.cargando = true; this.buscado = false;
      try {
        const res = await api.get('/obras/' + this.route.params.obraId + '/asistencia/reporte?desde=' + desde + '&hasta=' + hasta);
        this.datos = res.data || [];
      } catch(e) { console.error(e); this.datos = []; }
      finally { this.cargando = false; this.buscado = true; }
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      return d + '/' + m + '/' + y;
    },
    periodoLabel() {
      if (this.periodo === 'Q1') return '1a Quincena';
      if (this.periodo === 'Q2') return '2a Quincena';
      return 'Mes Completo';
    },
    exportarPDF() {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const mesNombre = this.meses[this.mes - 1];
      doc.setFontSize(16); doc.setTextColor(40,40,40);
      doc.text('Informe de Horas - ' + (this.obra.nombre || 'Obra'), 14, 18);
      doc.setFontSize(10); doc.setTextColor(100,100,100);
      doc.text(this.periodoLabel() + ' | ' + mesNombre + ' ' + this.anio + ' | ' + this.periodoTexto, 14, 25);
      let curY = 31;
      if (this.obra.ubicacion) { doc.text('Ubicacion: ' + this.obra.ubicacion, 14, curY); curY += 6; }
      const body = this.datosConRegistros.map(emp => [emp.apellido, emp.nombre, emp.dni, emp.categoria, emp.diasPresente, emp.diasAusente, emp.horasTrabajadas]);
      body.push([
        { content: 'TOTAL', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: String(this.totalPresentes), styles: { fontStyle: 'bold', halign: 'center' } },
        { content: String(this.totalAusentes),  styles: { fontStyle: 'bold', halign: 'center' } },
        { content: this.totalHoras,             styles: { fontStyle: 'bold', halign: 'center' } },
      ]);
      autoTable(doc, {
        startY: curY,
        head: [['Apellido','Nombre','DNI','Categoria','Dias Pres.','Dias Aus.','Horas Trab.']],
        body,
        headStyles: { fillColor: [30,30,30], textColor: [240,192,64], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          0:{cellWidth:40},1:{cellWidth:40},2:{cellWidth:28},3:{cellWidth:50},
          4:{cellWidth:25,halign:'center'},5:{cellWidth:25,halign:'center'},6:{cellWidth:32,halign:'center',fontStyle:'bold'}
        },
        alternateRowStyles: { fillColor: [245,245,245] },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 },
      });
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150);
        doc.text('Generado el ' + new Date().toLocaleDateString('es-AR') + ' - Pag. ' + i + ' de ' + pageCount, 14, doc.internal.pageSize.height - 8);
      }
      doc.save('informe-horas_' + (this.obra.nombre||'obra').replace(/ /g,'-') + '_' + this.periodoLabel().replace(/ /g,'-') + '_' + mesNombre + '-' + this.anio + '.pdf');
    },
  },
  async created() {
    await this.cargarObra();
    await this.cargarReporte();
  },
};
</script>

<style scoped>
.informe-view { padding: 20px; }
.informe-header { display:flex; align-items:center; gap:16px; margin-bottom:20px; flex-wrap:wrap; }
.informe-titulo { color:#f0c040; font-size:1.5rem; margin:0; }
.btn-back { background:#374151; color:#d1d5db; border:none; padding:6px 14px; border-radius:6px; cursor:pointer; font-size:0.9rem; }
.btn-back:hover { background:#4b5563; }
.panel { background:#1a1a1a; border:1px solid #333; border-radius:10px; padding:16px; margin-bottom:20px; }
.panel-titulo { color:#f0c040; font-size:1.1rem; font-weight:800; margin:0 0 12px; text-transform:uppercase; letter-spacing:0.05em; }
.panel-selector { border-color:#f0c040; }
.panel-tabla    { border-color:#60a5fa; }
.selector-row { display:flex; gap:16px; flex-wrap:wrap; align-items:flex-end; }
.selector-field { display:flex; flex-direction:column; gap:4px; }
.selector-field label { font-size:0.78rem; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em; }
.selector-field select { background:#111; color:#f3f4f6; border:1px solid #444; border-radius:6px; padding:6px 10px; font-size:0.9rem; }
.btn-buscar { padding:6px 20px; }
.rango-texto { margin-top:10px; color:#9ca3af; font-size:0.88rem; }
.rango-texto strong { color:#f3f4f6; }
.tabla-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.btn-pdf { padding:6px 16px; font-size:0.88rem; }
.table-wrapper { overflow-x:auto; }
.badge-cat { display:inline-block; padding:2px 8px; border-radius:999px; font-size:0.78rem; font-weight:700; text-transform:capitalize; }
.badge-ayudante              { background:#374151; color:#d1d5db; }
.badge-medio-oficial         { background:#1e3a5f; color:#93c5fd; }
.badge-oficial               { background:#064e3b; color:#6ee7b7; }
.badge-oficial-especializado { background:#3b1f00; color:#fbbf24; }
.badge-capataz               { background:#4c1d1d; color:#fca5a5; }
.badge-presente { background:#064e3b; color:#6ee7b7; border-radius:4px; padding:2px 8px; font-size:0.80rem; font-weight:700; }
.badge-ausente  { background:#4c1d1d; color:#fca5a5; border-radius:4px; padding:2px 8px; font-size:0.80rem; font-weight:700; }
.fila-total td  { background:#111; color:#f0c040; border-top:2px solid #444; }
.text-muted { color:#6b7280; font-size:0.9rem; }
</style>