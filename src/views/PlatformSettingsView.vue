<template>
  <div class="h-full flex bg-white">
    <!-- Sidebar Navigation -->
    <aside class="w-60 min-w-60 bg-white border-r border-gray-200 flex flex-col">
      <div class="px-5 pt-5 pb-4">
        <button @click="$router.back()" class="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-xs mb-3 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          返回
        </button>
        <h1 class="text-lg font-bold text-gray-800">平台设置</h1>
        <p class="text-xs text-gray-400 mt-1">管理平台级别的配置</p>
      </div>

      <div class="border-t border-gray-100"></div>

      <nav class="flex-1 overflow-y-auto py-3 px-3">
        <div>
          <div class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-1.5">配置</div>
          <button
            v-for="item in navItems" :key="item.key"
            @click="activeSection = item.key"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-0.5"
            :class="activeSection === item.key
              ? 'bg-blue-50 text-blue-600 font-medium border-l-[3px] border-blue-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-l-[3px] border-transparent'"
          >
            <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
            {{ item.label }}
          </button>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <div class="px-8 py-4 bg-white border-b border-gray-200 flex items-baseline gap-3">
        <h2 class="text-lg font-semibold text-gray-800">{{ currentSectionMeta.title }}</h2>
        <span class="text-sm text-gray-400">{{ currentSectionMeta.subtitle }}</span>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-8 py-6">

          <!-- ==================== Feishu Integration ==================== -->
          <section v-if="activeSection === 'feishu'">
            <p class="text-sm text-gray-500 mb-4">配置飞书应用凭证，用于 OAuth 登录、通知推送和用户列表获取。</p>

            <!-- Login Enabled Toggle -->
            <div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg mb-4">
              <div>
                <label class="text-sm font-medium text-gray-700">启用飞书登录</label>
                <p class="text-xs text-gray-400 mt-0.5">开启后登录页会显示飞书登录入口</p>
              </div>
              <button
                @click="feishuForm.login_enabled = !feishuForm.login_enabled"
                :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors', feishuForm.login_enabled ? 'bg-blue-600' : 'bg-gray-300']"
              >
                <span :class="['inline-block h-4 w-4 transform rounded-full bg-white transition-transform', feishuForm.login_enabled ? 'translate-x-6' : 'translate-x-1']" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">App ID</label>
                <input v-model="feishuForm.app_id" type="text" placeholder="cli_xxxxxxxxx" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">App Secret</label>
                <input v-model="feishuForm.app_secret" type="password" placeholder="输入新的 App Secret（留空保持不变）" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                <p v-if="maskedSecret" class="mt-1 text-xs text-gray-400">当前值: {{ maskedSecret }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Redirect URI</label>
                <input v-model="feishuForm.redirect_uri" type="text" placeholder="http://your-domain/feishu-callback" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                <p class="mt-1 text-xs text-gray-400">飞书 OAuth 回调地址，需与飞书开放平台配置一致</p>
              </div>
            </div>

            <div class="flex justify-end pt-4 mt-4 border-t border-gray-100">
              <button @click="saveFeishuConfig" :disabled="savingFeishu" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {{ savingFeishu ? '保存中...' : '保存飞书配置' }}
              </button>
            </div>
          </section>

          <!-- ==================== Permission Matrix ==================== -->
          <section v-if="activeSection === 'permissions'">
            <p class="text-sm text-gray-500 mb-4">管理不同角色对操作的权限。勾选表示该角色拥有该操作权限。</p>

            <!-- Loading -->
            <div v-if="permLoading" class="flex items-center justify-center py-8">
              <Loader2 class="w-5 h-5 animate-spin text-blue-500" />
              <span class="ml-2 text-sm text-gray-500">加载中...</span>
            </div>

            <!-- Matrix Table -->
            <div v-else class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">操作</th>
                    <th v-for="role in roles" :key="role" class="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider w-24" :class="roleHeaderClass(role)">
                      {{ role }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <template v-for="group in permissionGroups" :key="group.name">
                    <tr class="bg-gray-50">
                      <td :colspan="roles.length + 1" class="px-4 py-1.5 text-sm font-semibold text-gray-700">
                        {{ group.name }}
                      </td>
                    </tr>
                    <tr v-for="perm in group.permissions" :key="perm.key" class="hover:bg-blue-50 transition-colors">
                      <td class="px-4 py-2 text-sm text-gray-700 pl-8">
                        {{ perm.label }}
                        <span v-if="perm.description" class="text-xs text-gray-400 ml-1">({{ perm.description }})</span>
                      </td>
                      <td v-for="role in roles" :key="role" class="px-4 py-2 text-center">
                        <input type="checkbox" :checked="isPermitted(perm.key, role)" @change="togglePermission(perm.key, role)" :disabled="role === 'OWNER'" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>

            <!-- Footer -->
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p class="text-xs text-gray-400">
                <Info class="w-3 h-3 inline-block mr-1" />
                Owner 角色默认拥有所有权限且不可修改
              </p>
              <div class="flex gap-3">
                <button @click="resetToDefault" class="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  恢复默认
                </button>
                <button @click="savePermissions" :disabled="permSaving || !permHasChanges" class="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Loader2 v-if="permSaving" class="w-3 h-3 animate-spin inline-block mr-1" />
                  {{ permSaving ? '保存中...' : '保存权限' }}
                </button>
              </div>
            </div>
          </section>

      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" class="fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50" :class="toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import { Link, Shield, Loader2, Info } from 'lucide-vue-next'

// ==================== Sidebar Navigation ====================
const activeSection = ref('feishu')

const navItems = [
  { key: 'feishu', label: '飞书集成', icon: Link },
  { key: 'permissions', label: '角色与权限', icon: Shield },
]

const sectionMeta: Record<string, { title: string; subtitle: string }> = {
  feishu:      { title: '飞书集成',   subtitle: '配置飞书 OAuth 登录和通知' },
  permissions: { title: '角色与权限', subtitle: '管理不同角色的操作权限' },
}

const currentSectionMeta = computed(() => sectionMeta[activeSection.value] || { title: '', subtitle: '' })

// ==================== Toast ====================
const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    toast.value = { show: true, message, type }
    setTimeout(() => { toast.value.show = false }, 3000)
}

// ==================== Feishu Config ====================
const feishuForm = ref({
    app_id: '',
    app_secret: '',
    redirect_uri: '',
    login_enabled: false,
})
const maskedSecret = ref('')
const savingFeishu = ref(false)

const fetchConfig = async () => {
    try {
        const { data } = await axios.get('/api/platform/config/')
        if (data.feishu) {
            feishuForm.value.app_id = data.feishu.app_id || ''
            feishuForm.value.redirect_uri = data.feishu.redirect_uri || ''
            feishuForm.value.login_enabled = data.feishu.login_enabled || false
            maskedSecret.value = data.feishu.app_secret || ''
            feishuForm.value.app_secret = ''
        }
        // Load permission matrix from config
        if (data.permission_matrix && typeof data.permission_matrix === 'object') {
            permMatrix.value = { ...DEFAULT_MATRIX, ...data.permission_matrix }
        } else {
            permMatrix.value = { ...DEFAULT_MATRIX }
        }
        permOriginal.value = { ...permMatrix.value }
    } catch (e: any) {
        if (e.response?.status === 403) {
            alert('无权限访问平台设置，请使用管理员账号')
        } else {
            console.error("Failed to fetch platform config", e)
        }
        permMatrix.value = { ...DEFAULT_MATRIX }
        permOriginal.value = { ...DEFAULT_MATRIX }
    } finally {
        permLoading.value = false
    }
}

const saveFeishuConfig = async () => {
    savingFeishu.value = true
    try {
        const payload: any = {
            feishu: {
                app_id: feishuForm.value.app_id,
                redirect_uri: feishuForm.value.redirect_uri,
                login_enabled: feishuForm.value.login_enabled,
            }
        }
        if (feishuForm.value.app_secret) {
            payload.feishu.app_secret = feishuForm.value.app_secret
        } else {
            payload.feishu.app_secret = maskedSecret.value
        }

        const { data } = await axios.put('/api/platform/config/', payload)

        if (data.feishu) {
            maskedSecret.value = data.feishu.app_secret || ''
            feishuForm.value.app_secret = ''
        }
        showToast('飞书配置保存成功')
    } catch (e: any) {
        console.error("Failed to save feishu config", e)
        showToast(e.response?.data?.detail || '保存失败', 'error')
    } finally {
        savingFeishu.value = false
    }
}

// ==================== Permission Matrix ====================
const roles = ['REPORTER', 'DEVELOPER', 'MAINTAINER', 'OWNER'] as const

const DEFAULT_MATRIX: Record<string, string> = {
  'project.view':          'REPORTER',
  'project.create':        'OWNER',
  'project.edit':          'MAINTAINER',
  'project.delete':        'OWNER',
  'member.view':           'REPORTER',
  'member.manage':         'MAINTAINER',
  'workflow.view':         'REPORTER',
  'workflow.create':       'DEVELOPER',
  'workflow.edit_own':     'DEVELOPER',
  'workflow.edit_all':     'MAINTAINER',
  'workflow.delete_own':   'DEVELOPER',
  'workflow.delete_all':   'MAINTAINER',
  'task.view':             'REPORTER',
  'task.create':           'REPORTER',
  'task.operate_own':      'REPORTER',
  'task.operate_all':      'MAINTAINER',
  'task.delete_own':       'REPORTER',
  'task.delete_all':       'MAINTAINER',
  'scheduled_task.view':       'REPORTER',
  'scheduled_task.create':     'REPORTER',
  'scheduled_task.edit_own':   'REPORTER',
  'scheduled_task.edit_all':   'MAINTAINER',
  'scheduled_task.delete_own': 'REPORTER',
  'scheduled_task.delete_all': 'MAINTAINER',
  'component.view':        'REPORTER',
  'component.edit':        'MAINTAINER',
  'agent.chat':            'OWNER',
  'platform.project_create':   'OWNER',
  'platform.user_manage':      'MAINTAINER',
  'platform.user_delete':      'MAINTAINER',
  'platform.config_edit':      'OWNER',
}

const ROLE_HIERARCHY: Record<string, number> = {
  'REPORTER': 0, 'DEVELOPER': 1, 'MAINTAINER': 2, 'OWNER': 3,
}

const permissionGroups = [
  { name: '项目管理', permissions: [
    { key: 'project.view', label: '查看项目' },
    { key: 'project.edit', label: '编辑项目' },
    { key: 'project.delete', label: '删除项目' },
    { key: 'member.view', label: '查看成员' },
    { key: 'member.manage', label: '管理成员' },
  ]},
  { name: '工作流', permissions: [
    { key: 'workflow.view', label: '查看工作流' },
    { key: 'workflow.create', label: '创建工作流' },
    { key: 'workflow.edit_own', label: '编辑工作流', description: '仅自己的' },
    { key: 'workflow.edit_all', label: '编辑工作流', description: '所有' },
    { key: 'workflow.delete_own', label: '删除工作流', description: '仅自己的' },
    { key: 'workflow.delete_all', label: '删除工作流', description: '所有' },
  ]},
  { name: '任务', permissions: [
    { key: 'task.view', label: '查看任务' },
    { key: 'task.create', label: '创建/执行任务' },
    { key: 'task.operate_own', label: '操作任务', description: '暂停/恢复/撤销自己的' },
    { key: 'task.operate_all', label: '操作任务', description: '暂停/恢复/撤销所有' },
    { key: 'task.delete_own', label: '删除任务', description: '仅自己的' },
    { key: 'task.delete_all', label: '删除任务', description: '所有' },
  ]},
  { name: '定时/计划/Webhook 任务', permissions: [
    { key: 'scheduled_task.view', label: '查看' },
    { key: 'scheduled_task.create', label: '创建' },
    { key: 'scheduled_task.edit_own', label: '编辑/启停', description: '仅自己的' },
    { key: 'scheduled_task.edit_all', label: '编辑/启停', description: '所有' },
    { key: 'scheduled_task.delete_own', label: '删除', description: '仅自己的' },
    { key: 'scheduled_task.delete_all', label: '删除', description: '所有' },
  ]},
  { name: '组件 / AI', permissions: [
    { key: 'component.view', label: '查看组件' },
    { key: 'component.edit', label: '编辑组件分类' },
    { key: 'agent.chat', label: '调用 AI 对话' },
  ]},
  { name: '平台管理', permissions: [
    { key: 'platform.project_create', label: '创建项目' },
    { key: 'platform.user_manage', label: '管理用户' },
    { key: 'platform.user_delete', label: '删除用户' },
    { key: 'platform.config_edit', label: '编辑平台设置' },
  ]},
]

const permLoading = ref(true)
const permSaving = ref(false)
const permMatrix = ref<Record<string, string>>({})
const permOriginal = ref<Record<string, string>>({})

const permHasChanges = computed(() => JSON.stringify(permMatrix.value) !== JSON.stringify(permOriginal.value))

const isPermitted = (permKey: string, role: string) => {
  if (role === 'OWNER') return true
  const minRole = permMatrix.value[permKey] || 'OWNER'
  return (ROLE_HIERARCHY[role] ?? -1) >= (ROLE_HIERARCHY[minRole] ?? 999)
}

const togglePermission = (permKey: string, role: string) => {
  if (role === 'OWNER') return
  const clickedLevel = ROLE_HIERARCHY[role] ?? -1
  if (isPermitted(permKey, role)) {
    const higherRoles = roles.filter(r => (ROLE_HIERARCHY[r] ?? -1) > clickedLevel && r !== 'OWNER')
    permMatrix.value[permKey] = higherRoles.length > 0 ? higherRoles[0] : 'OWNER'
  } else {
    permMatrix.value[permKey] = role
  }
}

const roleHeaderClass = (role: string) => {
  switch (role) {
    case 'OWNER': return 'text-purple-600'
    case 'MAINTAINER': return 'text-blue-600'
    case 'DEVELOPER': return 'text-green-600'
    case 'REPORTER': return 'text-gray-600'
    default: return ''
  }
}

const savePermissions = async () => {
  permSaving.value = true
  try {
    const res = await axios.get('/api/platform/config/')
    const existing = res.data || {}
    await axios.put('/api/platform/config/', {
      ...existing,
      permission_matrix: permMatrix.value
    })
    permOriginal.value = { ...permMatrix.value }
    showToast('权限配置已保存')
  } catch (e: any) {
    showToast(e.response?.data?.detail || '保存失败', 'error')
  } finally {
    permSaving.value = false
  }
}

const resetToDefault = () => {
  permMatrix.value = { ...DEFAULT_MATRIX }
}

// ==================== Init ====================
onMounted(() => {
    fetchConfig()
})
</script>
