import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import HomeView from '../views/HomeView.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'projects',
          name: 'projects',
          component: () => import('../views/ProjectListView.vue')
        },
        {
          path: 'projects/:id/settings',
          name: 'project-settings',
          component: () => import('../views/ProjectSettingsView.vue')
        },
        {
          path: 'tasks',
          name: 'tasks',
          component: () => import('../views/TaskListView.vue')
        },
        {
          path: 'tasks/periodic',
          name: 'tasks-periodic',
          component: () => import('../views/PeriodicTaskListView.vue')
        },
        {
          path: 'tasks/scheduled',
          name: 'tasks-scheduled',
          component: () => import('../views/ScheduledTaskListView.vue')
        },
        {
          path: 'tasks/webhook',
          name: 'tasks-webhook',
          component: () => import('../views/WebhookTaskListView.vue')
        },
        {
          path: 'tasks/create/:workflowId?',
          name: 'task-create',
          component: () => import('../views/TaskCreateView.vue')
        },
        {
          path: 'tasks/periodic/:id/edit',
          name: 'task-periodic-edit',
          component: () => import('../views/TaskCreateView.vue'),
          meta: { type: 'periodic', isEdit: true }
        },
        {
          path: 'tasks/scheduled/:id/edit',
          name: 'task-scheduled-edit',
          component: () => import('../views/TaskCreateView.vue'),
          meta: { type: 'scheduled', isEdit: true }
        },
        {
          path: 'tasks/webhook/:id/edit',
          name: 'task-webhook-edit',
          component: () => import('../views/TaskCreateView.vue'),
          meta: { type: 'webhook', isEdit: true }
        },
        {
          path: 'tasks/:id',
          name: 'task-execution',
          component: () => import('../views/TaskExecutionView.vue'),
        },
        {
          path: 'workflows',
          name: 'workflows-list',
          component: () => import('../views/WorkflowListView.vue'),
        },
        {
          path: 'workflows/:id',
          name: 'workflow-designer',
          component: () => import('../views/WorkflowDesignerView.vue'),
        },
        {
          path: 'chat',
          name: 'ai-chat',
          component: () => import('../views/AIChatView.vue'),
        },
        {
          path: 'client-agents',
          name: 'client-agents',
          component: () => import('../views/ClientAgentListView.vue'),
        },
        {
          path: 'client-agents/:id',
          name: 'client-agent-detail',
          component: () => import('../views/ClientAgentDetailView.vue'),
        },
        {
          path: 'platform/settings',
          name: 'platform-settings',
          component: () => import('../views/PlatformSettingsView.vue')
        },
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/feishu-callback',
      name: 'feishu-callback',
      component: () => import('../views/FeishuCallback.vue'),
    },

  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else {
    // 页面刷新后 token 还在但 user 信息丢失，需要重新获取
    if (authStore.isAuthenticated && !authStore.user) {
      await authStore.fetchUser()
    }
    next()
  }
})

export default router
