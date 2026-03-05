<template>
  <div class="space-y-6">

    <!-- Agent List -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ t('clientAgents.name') }}
            </th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ t('clientAgents.status') }}
            </th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              工作空间
            </th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ t('clientAgents.platform') }}
            </th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ t('clientAgents.lastHeartbeat') }}
            </th>
            <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ t('clientAgents.actions') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="agent in agents" :key="agent.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
              <a href="#" @click.prevent="emit('select-agent', agent.id)" class="flex items-center gap-3 hover:text-blue-600">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Monitor class="w-5 h-5 text-white" />
                </div>
                <div>
                  <div class="font-medium text-gray-900">{{ agent.name }}</div>
                  <div class="text-sm text-gray-500">{{ agent.hostname || '-' }}</div>
                </div>
              </a>
            </td>
            <td class="px-6 py-4">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClass(agent.status)"
              >
                <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="getStatusDotClass(agent.status)"></span>
                {{ agent.status_display }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-600">
                {{ agent.workspaces?.length || 0 }} 个工作空间
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
              {{ agent.platform || '-' }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
              {{ formatTime(agent.last_heartbeat) }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="emit('select-agent', agent.id)"
                  class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  :title="'配置工作空间'"
                >
                  <Settings class="w-4 h-4" />
                </button>
                <button
                  @click="openEditDialog(agent)"
                  class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  :title="t('common.edit')"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  @click="confirmDelete(agent)"
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  :title="t('common.delete')"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="agents.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-gray-500">
              <Monitor class="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{{ t('clientAgents.noAgents') }}</p>
              <p class="text-sm mt-2">Agent 会在首次连接时自动注册</p>
            </td>
          </tr>
        </tbody>
      </table>
      <ListPagination
        :total="totalCount"
        :currentPage="currentPage"
        :pageSize="pageSize"
        @update:currentPage="handlePageChange"
        @update:pageSize="handlePageSizeChange"
      />
    </div>

    <!-- Download Section -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Download class="w-5 h-5 text-blue-600" />
          <h3 class="text-lg font-semibold text-gray-900">下载客户端代理</h3>
        </div>
        <div v-if="latestRelease" class="flex items-center gap-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {{ latestRelease.tag_name }}
          </span>
          <a :href="latestRelease.html_url" target="_blank" class="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            查看发布说明 →
          </a>
        </div>
      </div>

      <div v-if="releaseLoading" class="px-6 py-8 text-center text-gray-500">
        <Loader2 class="w-6 h-6 mx-auto mb-2 animate-spin text-blue-500" />
        <p class="text-sm">正在获取最新版本...</p>
      </div>

      <div v-else-if="releaseError" class="px-6 py-4">
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle class="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p class="text-sm text-yellow-800">无法获取最新版本信息</p>
            <a href="https://github.com/TaskNexus/tasknexus-client-agent/releases" target="_blank"
              class="text-sm text-blue-600 hover:underline">前往 GitHub 手动下载 →</a>
          </div>
        </div>
      </div>

      <div v-else-if="latestRelease" class="p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <a v-for="asset in downloadAssets" :key="asset.name"
            :href="asset.url" target="_blank"
            class="group relative flex items-center gap-3 p-4 border rounded-lg transition-all"
            :class="asset.recommended
              ? 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:shadow-md'
              : 'border-gray-200 hover:border-blue-300 hover:shadow-md hover:bg-gray-50'"
          >
            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="asset.recommended ? 'bg-blue-100' : 'bg-gray-100'">
              <component :is="asset.icon" class="w-5 h-5" :class="asset.recommended ? 'text-blue-600' : 'text-gray-500'" />
            </div>
            <div class="min-w-0">
              <div class="text-sm font-medium text-gray-900 truncate">{{ asset.label }}</div>
              <div class="text-xs text-gray-500">{{ asset.arch }}</div>
            </div>
            <span v-if="asset.recommended"
              class="absolute -top-2 -right-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white shadow-sm">
              推荐
            </span>
          </a>
        </div>

        <!-- Config file download -->
        <div v-if="configAsset" class="mt-3 pt-3 border-t border-gray-100">
          <a :href="configAsset.browser_download_url" target="_blank"
            class="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
            <FileText class="w-4 h-4" />
            下载配置文件模板 (config.example.yaml)
          </a>
        </div>
      </div>
    </div>

    <!-- Start Command Info -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 class="font-medium text-blue-900 mb-2">启动客户端代理</h3>
      <div class="bg-gray-900 rounded-lg p-4">
        <code class="text-sm text-green-400 break-all">
          tasknexus-client-agent --config config.yaml
        </code>
      </div>
      <p class="text-sm text-blue-700 mt-2">会根据名称自动注册或连接到已存在的客户端代理</p>
    </div>

    <!-- Create/Edit Dialog -->
    <div v-if="showEditDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ t('clientAgents.edit') }}
          </h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('clientAgents.name') }}</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :placeholder="t('clientAgents.namePlaceholder')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('clientAgents.description') }}</label>
            <textarea
              v-model="form.description"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :placeholder="t('clientAgents.descriptionPlaceholder')"
            ></textarea>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            @click="closeDialog"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            @click="saveAgent"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="deleteDialog.show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div class="p-6 text-center">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 class="w-6 h-6 text-red-600" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ t('clientAgents.confirmDelete') }}</h3>
          <p class="text-gray-500">{{ t('clientAgents.deleteWarning', { name: deleteDialog.agentName }) }}</p>
        </div>
        <div class="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            @click="deleteDialog.show = false"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            @click="deleteAgent"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {{ t('common.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Monitor, Pencil, Trash2, Settings, Download, Loader2, AlertCircle, FileText } from 'lucide-vue-next'
import axios from 'axios'
import ListPagination from '../components/ListPagination.vue'

interface AgentWorkspace {
  id: number
  name: string
  labels: string[]
  status: string
  status_display: string
}

interface ClientAgent {
  id: number
  name: string
  status: string
  status_display: string
  last_heartbeat: string | null
  hostname: string
  platform: string
  ip_address: string
  description: string
  workspaces: AgentWorkspace[]
}

const emit = defineEmits<{
  (e: 'select-agent', id: number): void
}>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const parsePageParam = (value: unknown, fallback: number) => {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

const agents = ref<ClientAgent[]>([])
const currentPage = ref(parsePageParam(route.query.page, 1))
const pageSize = ref(parsePageParam(route.query.page_size, 20))
const totalCount = ref(0)
const showEditDialog = ref(false)
const editingAgentId = ref<number | null>(null)

const form = reactive({
  name: '',
  description: ''
})

const deleteDialog = reactive({
  show: false,
  agentId: null as number | null,
  agentName: ''
})

// Release data
interface ReleaseAsset {
  name: string
  browser_download_url: string
  size: number
}

interface ReleaseInfo {
  tag_name: string
  html_url: string
  assets: ReleaseAsset[]
}

const latestRelease = ref<ReleaseInfo | null>(null)
const releaseLoading = ref(false)
const releaseError = ref(false)

interface DownloadAsset {
  name: string
  url: string
  label: string
  arch: string
  icon: any
  recommended: boolean
}

const platformIcons: Record<string, any> = {
  linux: Monitor,
  macos: Monitor,
  windows: Monitor
}

const detectPlatform = (): string => {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.indexOf('mac') >= 0) return 'macos'
  if (ua.indexOf('win') >= 0) return 'windows'
  return 'linux'
}

const downloadAssets = computed((): DownloadAsset[] => {
  if (!latestRelease.value) return []
  const currentPlatform = detectPlatform()
  const assetMap = [
    { match: 'linux-amd64', label: 'Linux', arch: 'x86_64 (amd64)', platform: 'linux' },
    { match: 'linux-arm64', label: 'Linux', arch: 'ARM64', platform: 'linux' },
    { match: 'macos-arm64', label: 'macOS', arch: 'Apple Silicon (ARM64)', platform: 'macos' },
    { match: 'windows-x86_64', label: 'Windows', arch: 'x86_64', platform: 'windows' }
  ]
  const results: DownloadAsset[] = []
  for (const item of assetMap) {
    const asset = latestRelease.value.assets.find(a => a.name.indexOf(item.match) >= 0)
    if (asset) {
      results.push({
        name: asset.name,
        url: asset.browser_download_url,
        label: item.label,
        arch: item.arch,
        icon: platformIcons[item.platform] || Monitor,
        recommended: item.platform === currentPlatform
      })
    }
  }
  results.sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0))
  return results
})

const configAsset = computed(() => {
  return latestRelease.value?.assets.find(a => a.name === 'config.example.yaml') || null
})

const fetchLatestRelease = async () => {
  releaseLoading.value = true
  releaseError.value = false
  try {
    const response = await fetch(
      'https://api.github.com/repos/TaskNexus/tasknexus-client-agent/releases/latest',
      { headers: { 'Accept': 'application/vnd.github.v3+json' } }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    latestRelease.value = await response.json()
  } catch (error) {
    console.error('Failed to fetch latest release:', error)
    releaseError.value = true
  } finally {
    releaseLoading.value = false
  }
}

const wsServerUrl = computed(() => {
  const host = window.location.host
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${host}/ws/agent/`
})

const getStatusClass = (status: string) => {
  switch (status) {
    case 'ONLINE': return 'bg-green-100 text-green-800'
    case 'OFFLINE': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusDotClass = (status: string) => {
  switch (status) {
    case 'ONLINE': return 'bg-green-500'
    case 'OFFLINE': return 'bg-gray-400'
    default: return 'bg-gray-400'
  }
}

const formatTime = (time: string | null) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

const fetchAgents = async () => {
  try {
    const response = await axios.get('/api/client-agents/agents/', {
      params: {
        page: currentPage.value,
        page_size: pageSize.value
      }
    })
    if (Array.isArray(response.data)) {
      agents.value = response.data
      totalCount.value = response.data.length
    } else {
      agents.value = response.data.results || []
      totalCount.value = response.data.count ?? agents.value.length
    }
  } catch (error) {
    console.error('Failed to fetch agents:', error)
  }
}

const syncPaginationQuery = () => {
  router.replace({
    query: {
      ...route.query,
      page: String(currentPage.value),
      page_size: String(pageSize.value)
    }
  })
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  syncPaginationQuery()
  fetchAgents()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  syncPaginationQuery()
  fetchAgents()
}

const adjustPageAfterMutation = (deletedCount: number) => {
  const nextTotal = Math.max(0, totalCount.value - deletedCount)
  const maxPage = Math.max(1, Math.ceil(nextTotal / pageSize.value))
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage
    syncPaginationQuery()
  }
}

const openEditDialog = (agent: ClientAgent) => {
  editingAgentId.value = agent.id
  form.name = agent.name
  form.description = agent.description
  showEditDialog.value = true
}

const closeDialog = () => {
  showEditDialog.value = false
  editingAgentId.value = null
  form.name = ''
  form.description = ''
}

const saveAgent = async () => {
  try {
    if (editingAgentId.value) {
      await axios.patch(`/api/client-agents/agents/${editingAgentId.value}/`, form)
    }
    closeDialog()
    fetchAgents()
  } catch (error) {
    console.error('Failed to save agent:', error)
  }
}

const confirmDelete = (agent: ClientAgent) => {
  deleteDialog.agentId = agent.id
  deleteDialog.agentName = agent.name
  deleteDialog.show = true
}

const deleteAgent = async () => {
  if (!deleteDialog.agentId) return
  try {
    await axios.delete(`/api/client-agents/agents/${deleteDialog.agentId}/`)
    deleteDialog.show = false
    adjustPageAfterMutation(1)
    fetchAgents()
  } catch (error) {
    console.error('Failed to delete agent:', error)
  }
}

onMounted(() => {
  syncPaginationQuery()
  fetchAgents()
  fetchLatestRelease()
})
</script>
