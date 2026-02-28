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
import { Monitor, Pencil, Trash2, Settings } from 'lucide-vue-next'
import axios from 'axios'

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

const agents = ref<ClientAgent[]>([])
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
    const response = await axios.get('/api/client-agents/agents/')
    agents.value = response.data
  } catch (error) {
    console.error('Failed to fetch agents:', error)
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
    fetchAgents()
  } catch (error) {
    console.error('Failed to delete agent:', error)
  }
}

onMounted(() => {
  fetchAgents()
})
</script>
