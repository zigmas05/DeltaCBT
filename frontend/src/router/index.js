import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import AdminDashboard from '../views/AdminDashboard.vue';
import StudentExam from '../views/StudentExam.vue';
import StudentDashboard from '../views/StudentDashboard.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'guru'] },
  },
  {
    path: '/siswa/dashboard',
    name: 'StudentDashboard',
    component: StudentDashboard,
    meta: { requiresAuth: true, allowedRoles: ['siswa'] },
  },
  {
    path: '/siswa/exam/:id',
    name: 'StudentExam',
    component: StudentExam,
    meta: { requiresAuth: true, allowedRoles: ['siswa'], isKioskMode: true },
  },
  {
    path: '/',
    redirect: '/login',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guard (Keamanan Rute Peran)
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('jwt_token');
  const userRole = localStorage.getItem('user_role');

  if (to.meta.requiresAuth) {
    if (!token) {
      return next({ name: 'Login' });
    }

    if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(userRole)) {
      if (userRole === 'siswa') {
        return next({ name: 'StudentDashboard' });
      } else {
        return next({ name: 'AdminDashboard' });
      }
    }
  }

  next();
});

export default router;
