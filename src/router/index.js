// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { h } from "vue";
import { useToast } from "vue-toastification";
import { useAuthStore } from "../stores/authStore";

import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";
import ObraDetalleView from "../views/ObraDetalleView.vue";
import CrearObraView from "../views/CrearObraView.vue";
import AddEmpleadoView from "../views/AddEmpleadoView.vue";
import RegistrarAsistenciaView from "../views/RegistrarAsistenciaView.vue";
import AsistenciaDetalleView from "../views/AsistenciaDetalleView.vue";
import CrearUsuarioView from "../views/CrearUsuarioView.vue";
import EstadisticasEmpleadoView from "../views/EstadisticasEmpleadoView.vue";
import InformeHorasView from "../views/InformeHorasView.vue";

const DashboardHomeView = {
  render: () =>
    h("div", { class: "panel-content-centered" }, [
      h("h1", { class: "main-dashboard-title" }, "SISTEMA DE CONTROL DE ASISTENCIA"),
      h("p", {}, "Selecciona una obra para ver su información."),
    ]),
};

const routes = [
  {
    path: "/",
    name: "Login",
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardView,
    meta: { requiresAuth: true },
    children: [
      { path: "", name: "DashboardHome", component: DashboardHomeView },

      {
        path: "obra/:obraId",
        name: "ObraDetalle",
        component: ObraDetalleView,
        props: true,
        meta: { requiresAuth: true },
      },

      {
        path: "obra/crear",
        name: "CrearObra",
        component: CrearObraView,
        meta: { requiresAuth: true, requiresModification: true },
      },

      {
        path: "obra/:obraId/empleado/nuevo",
        name: "AddEmpleado",
        component: AddEmpleadoView,
        props: true,
        meta: { requiresAuth: true, requiresModification: true },
      },

      {
        path: "obra/:obraId/empleado/:empleadoId/editar",
        name: "EditarEmpleado",
        component: AddEmpleadoView,
        props: true,
        meta: { requiresAuth: true, requiresModification: true },
      },

      {
        path: "obra/:obraId/asistencia",
        name: "RegistrarAsistencia",
        component: RegistrarAsistenciaView,
        props: true,
        meta: { requiresAuth: true, requiresModification: true },
      },

      {
        path: "obra/:obraId/asistencia/:fecha",
        name: "AsistenciaDetalle",
        component: AsistenciaDetalleView,
        props: true,
        meta: { requiresAuth: true },
      },

      {
        path: "obra/:obraId/informe",
        name: "InformeHoras",
        component: InformeHorasView,
        props: true,
        meta: { requiresAuth: true },
      },

      {
        path: "usuarios/crear",
        name: "CrearUsuario",
        component: CrearUsuarioView,
        meta: { requiresAuth: true },
      },

      {
        path: "estadisticas/empleado",
        name: "EstadisticasEmpleado",
        component: EstadisticasEmpleadoView,
        meta: { requiresAuth: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
  const requiresModify = to.matched.some((r) => r.meta.requiresModification);

  if (requiresAuth && !authStore.isLoggedIn) {
    next({ name: "Login" });
  } else if (requiresModify && !authStore.canModify) {
    const toast = useToast();
    toast.warning("Acceso denegado. Rol de solo lectura.");
    next({ name: "DashboardHome" });
  } else if (to.name === "Login" && authStore.isLoggedIn) {
    next({ name: "DashboardHome" });
  } else {
    next();
  }
});

export default router;
