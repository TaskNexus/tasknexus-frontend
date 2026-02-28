<template>
  <div class="space-y-6">
    <!-- Back + Header -->
    <div class="flex items-center gap-4">
      <button @click="emit('back')" class="p-2 hover:bg-gray-100 rounded-lg">
        <ArrowLeft class="w-5 h-5 text-gray-600" />
      </button>
      <div class="flex-1">
        <div class="font-semibold text-gray-900">{{ agent?.name || 'Agent' }}</div>
      </div>
      <span 
        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
        :class="getStatusClass(agent?.status || 'OFFLINE')"
      >
        <span class="w-2 h-2 rounded-full mr-2" :class="getStatusDotClass(agent?.status || 'OFFLINE')"></span>
        {{ agent?.status_display || '离线' }}
      </span>
    </div>

    <!-- Agent Info -->
    <div class="bg-white rounded-xl shadow-sm p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Agent 信息</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div class="text-sm text-gray-500">主机名</div>
          <div class="font-medium">{{ agent?.hostname || '-' }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">平台</div>
          <div class="font-medium">{{ agent?.platform || '-' }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">IP 地址</div>
          <div class="font-medium">{{ agent?.ip_address || '-' }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">最后心跳</div>
          <div class="font-medium">{{ formatTime(agent?.last_heartbeat) }}</div>
        </div>
      </div>
    </div>

    <!-- Workspaces -->
    <div class="bg-white rounded-xl shadow-sm">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 class="text-lg font-semibold text-gray-800">工作空间</h2>
        <button
          @click="showCreateWorkspaceDialog = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          添加工作空间
        </button>
      </div>
      <div class="divide-y divide-gray-100">
        <div 
          v-for="workspace in workspaces" 
          :key="workspace.id"
          class="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
              <Folder class="w-5 h-5 text-white" />
            </div>
            <div>
              <div class="font-medium text-gray-900">{{ workspace.name }}</div>
              <div class="flex flex-wrap gap-1 mt-1">
                <span 
                  v-for="label in workspace.labels" 
                  :key="label"
                  class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                >
                  {{ label }}
                </span>
                <span v-if="!workspace.labels?.length" class="text-gray-400 text-xs">无标签</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="getWorkspaceStatusClass(workspace.status)"
            >
              {{ workspace.status_display }}
            </span>
            <div class="flex items-center gap-1">
              <button
                @click="openEditWorkspaceDialog(workspace)"
                class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Pencil class="w-4 h-4" />
              </button>
              <button
                @click="confirmDeleteWorkspace(workspace)"
                class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div v-if="workspaces.length === 0" class="px-6 py-12 text-center text-gray-500">
          <Folder class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>暂无工作空间</p>
          <p class="text-sm mt-1">添加工作空间以开始接收任务</p>
        </div>
      </div>
    </div>

    <!-- Environment Variables -->
    <div class="bg-white rounded-xl shadow-sm">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">环境变量</h2>
          <p class="text-sm text-gray-500 mt-1">配置任务执行时的环境变量</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="addEnvVar"
            class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 text-sm"
          >
            <Plus class="w-4 h-4" />
            添加
          </button>
          <button
            @click="saveEnvironment"
            :disabled="!envChanged"
            class="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            保存
          </button>
        </div>
      </div>
      <div class="divide-y divide-gray-100">
        <div 
          v-for="(key, index) in envVarKeys" 
          :key="index"
          class="px-6 py-3 flex items-center gap-4"
        >
          <input
            v-model="envVarKeys[index]"
            type="text"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="变量名 (如: TOOL_PATH)"
            @input="onEnvChange"
          />
          <span class="text-gray-400">=</span>
          <input
            v-model="envVarValues[index]"
            type="text"
            class="flex-[2] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="变量值 (如: /path/to/tool)"
            @input="onEnvChange"
          />
          <button
            @click="removeEnvVar(index)"
            class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <div v-if="envVarKeys.length === 0" class="px-6 py-8 text-center text-gray-500">
          <p class="text-sm">暂无环境变量配置</p>
        </div>
      </div>
    </div>

    <!-- Create/Edit Workspace Dialog -->
    <div v-if="showCreateWorkspaceDialog || showEditWorkspaceDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ showEditWorkspaceDialog ? '编辑工作空间' : '添加工作空间' }}
          </h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
            <input
              v-model="workspaceForm.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="workspace-1"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">标签</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <span 
                v-for="(label, index) in workspaceForm.labels" 
                :key="index"
                class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
              >
                {{ label }}
                <button @click="removeLabel(index)" class="ml-1 hover:text-blue-900">
                  <X class="w-3 h-3" />
                </button>
              </span>
            </div>
            <div class="flex gap-2">
              <input
                v-model="newLabel"
                type="text"
                @keyup.enter="addLabel"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="添加标签"
              />
              <button
                @click="addLabel"
                class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus class="w-4 h-4" />
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">标签用于任务路由，匹配任务的 workspace_label 配置</p>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            @click="closeWorkspaceDialog"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="saveWorkspace"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Workspace Confirmation -->
    <div v-if="deleteWorkspaceDialog.show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div class="p-6 text-center">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 class="w-6 h-6 text-red-600" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">删除工作空间</h3>
          <p class="text-gray-500">确定删除工作空间 "{{ deleteWorkspaceDialog.name }}"？</p>
        </div>
        <div class="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            @click="deleteWorkspaceDialog.show = false"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="deleteWorkspace"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ArrowLeft, Plus, Folder, Pencil, Trash2, X } from 'lucide-vue-next'
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
  environment: Record<string, string>
  workspaces: AgentWorkspace[]
}

const props = defineProps<{
  agentId: number | string
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const agentId = props.agentId

const agent = ref<ClientAgent | null>(null)
const workspaces = ref<AgentWorkspace[]>([])
const showCreateWorkspaceDialog = ref(false)
const showEditWorkspaceDialog = ref(false)
const editingWorkspaceId = ref<number | null>(null)
const newLabel = ref('')

const workspaceForm = reactive({
  name: '',
  labels: [] as string[]
})

const deleteWorkspaceDialog = reactive({
  show: false,
  id: null as number | null,
  name: ''
})

// Environment variables
const envVars = ref<Record<string, string>>({})
const envVarKeys = ref<string[]>([])
const envVarValues = ref<string[]>([])
const envChanged = ref(false)

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

const getWorkspaceStatusClass = (status: string) => {
  switch (status) {
    case 'IDLE': return 'bg-green-100 text-green-800'
    case 'RUNNING': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const formatTime = (time: string | null | undefined) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

const fetchAgent = async () => {
  try {
    const response = await axios.get(`/api/client-agents/agents/${agentId}/`)
    agent.value = response.data
    workspaces.value = response.data.workspaces || []
    initEnvVars(response.data.environment || {})
  } catch (error) {
    console.error('Failed to fetch agent:', error)
  }
}

const initEnvVars = (env: Record<string, string>) => {
  envVars.value = { ...env }
  envVarKeys.value = Object.keys(env)
  envVarValues.value = Object.values(env)
  envChanged.value = false
}

const addEnvVar = () => {
  envVarKeys.value.push('')
  envVarValues.value.push('')
  envChanged.value = true
}

const removeEnvVar = (index: number) => {
  envVarKeys.value.splice(index, 1)
  envVarValues.value.splice(index, 1)
  envChanged.value = true
}

const onEnvChange = () => {
  envChanged.value = true
}

const saveEnvironment = async () => {
  const env: Record<string, string> = {}
  for (let i = 0; i < envVarKeys.value.length; i++) {
    const key = envVarKeys.value[i].trim()
    if (key) {
      env[key] = envVarValues.value[i] || ''
    }
  }
  try {
    await axios.patch(`/api/client-agents/agents/${agentId}/`, { environment: env })
    envVars.value = env
    envChanged.value = false
  } catch (error) {
    console.error('Failed to save environment:', error)
  }
}

const addLabel = () => {
  if (newLabel.value.trim() && !workspaceForm.labels.includes(newLabel.value.trim())) {
    workspaceForm.labels.push(newLabel.value.trim())
    newLabel.value = ''
  }
}

const removeLabel = (index: number) => {
  workspaceForm.labels.splice(index, 1)
}

const openEditWorkspaceDialog = (workspace: AgentWorkspace) => {
  editingWorkspaceId.value = workspace.id
  workspaceForm.name = workspace.name
  workspaceForm.labels = [...workspace.labels]
  showEditWorkspaceDialog.value = true
}

const closeWorkspaceDialog = () => {
  showCreateWorkspaceDialog.value = false
  showEditWorkspaceDialog.value = false
  editingWorkspaceId.value = null
  workspaceForm.name = ''
  workspaceForm.labels = []
  newLabel.value = ''
}

const saveWorkspace = async () => {
  try {
    if (showEditWorkspaceDialog.value && editingWorkspaceId.value) {
      await axios.patch(`/api/client-agents/workspaces/${editingWorkspaceId.value}/`, workspaceForm)
    } else {
      await axios.post('/api/client-agents/workspaces/', {
        ...workspaceForm,
        agent: agentId
      })
    }
    closeWorkspaceDialog()
    fetchAgent()
  } catch (error) {
    console.error('Failed to save workspace:', error)
  }
}

const confirmDeleteWorkspace = (workspace: AgentWorkspace) => {
  deleteWorkspaceDialog.id = workspace.id
  deleteWorkspaceDialog.name = workspace.name
  deleteWorkspaceDialog.show = true
}

const deleteWorkspace = async () => {
  if (!deleteWorkspaceDialog.id) return
  try {
    await axios.delete(`/api/client-agents/workspaces/${deleteWorkspaceDialog.id}/`)
    deleteWorkspaceDialog.show = false
    fetchAgent()
  } catch (error) {
    console.error('Failed to delete workspace:', error)
  }
}

onMounted(() => {
  fetchAgent()
})
</script>
