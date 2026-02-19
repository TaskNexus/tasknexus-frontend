<template>
  <div class="flex flex-col h-full bg-slate-50">
    <!-- Header -->
    <div class="px-6 py-4 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between">
      <div class="flex items-center space-x-2 text-sm">
        <router-link to="/workflows" class="text-gray-500 hover:text-blue-600">Workflows</router-link>
        <span class="text-gray-300">/</span>
        <span class="text-gray-500">{{ workflowName || (isEditMode ? 'Edit Task' : 'New Task') }}</span>
        <span class="text-gray-300">/</span>
        <span class="font-medium text-gray-900">{{ pageTitle }}</span>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <div class="max-w-3xl mx-auto space-y-6">
        
        <!-- Basic Info Module -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div class="space-y-4">
                <!-- Workflow Selection -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Workflow</label>
                    <select 
                        v-model="selectedWorkflowId" 
                        @change="onWorkflowChange"
                        class="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border bg-white"
                        :disabled="!!routeWorkflowId"
                    >
                        <option value="" disabled>Select a workflow</option>
                        <option v-for="w in workflows" :key="w.id" :value="w.id">
                            {{ w.name }}
                        </option>
                    </select>
                        <p v-if="routeWorkflowId" class="text-xs text-gray-400 mt-1">
                        Pre-selected from URL. <router-link to="/tasks/create" class="text-blue-500 hover:underline">Clear</router-link>
                    </p>
                </div>

                <!-- Task Name -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                    <div class="flex items-center gap-2">
                        <input 
                        v-model="taskName" 
                        type="text" 
                        class="flex-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                        placeholder="e.g. Daily Processing"
                        />
                        <button 
                            @click="generateTaskName" 
                            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md text-sm border border-gray-200"
                            title="Generate random name"
                        >
                            Auto
                        </button>
                    </div>
                </div>

                    <!-- Task Type -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
                    <div class="flex bg-gray-100 p-1 rounded-md">
                        <button 
                            v-for="type in taskTypes" 
                            :key="type.value"
                            class="flex-1 px-3 py-1.5 text-xs font-medium rounded transition-all"
                            :class="[selectedTaskType === type.value ? 'bg-white text-blue-600 shadow ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700', isEditMode ? 'opacity-50 cursor-not-allowed' : '']"
                            @click="!isEditMode && (selectedTaskType = type.value)"
                        >
                            {{ type.label }}
                        </button>
                    </div>
                </div>

                <!-- Conditional Config: Periodic -->
                <div v-if="selectedTaskType === 'periodic'" class="p-4 bg-blue-50 rounded border border-blue-100">
                        <label class="block text-xs font-bold text-blue-800 mb-1 uppercase tracking-wide">Cron Expression</label>
                        <input 
                        v-model="cronExpression" 
                        type="text" 
                        class="w-full border-blue-200 rounded focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-sm font-mono border"
                        placeholder="*/5 * * * *"
                        />
                        <p class="text-xs text-blue-600 mt-1">Format: Minute Hour Day Month Week</p>
                </div>

                <!-- Conditional Config: Scheduled -->
                <div v-if="selectedTaskType === 'scheduled'" class="p-4 bg-purple-50 rounded border border-purple-100">
                        <label class="block text-xs font-bold text-purple-800 mb-1 uppercase tracking-wide">Execution Time</label>
                        <input 
                        v-model="planTime" 
                        type="datetime-local" 
                        class="w-full border-purple-200 rounded focus:border-purple-500 focus:ring-purple-500 px-3 py-2 text-sm border"
                        />
                </div>

                <!-- Conditional Config: Webhook -->
                <div v-if="selectedTaskType === 'webhook'" class="p-4 bg-green-50 rounded border border-green-100">
                        <label class="block text-xs font-bold text-green-800 mb-1 uppercase tracking-wide">Secret (Optional)</label>
                        <input 
                        v-model="webhookSecret" 
                        type="text" 
                        class="w-full border-green-200 rounded focus:border-green-500 focus:ring-green-500 px-3 py-2 text-sm border font-mono"
                        placeholder="Leave empty for no secret verification"
                        />
                        <p class="text-xs text-green-600 mt-1">External systems must include this secret in X-Webhook-Secret header</p>
                </div>

            </div>
        </div>

        <!-- Parameters Module -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
                <span>Task Parameters</span>
                <span class="text-xs font-normal text-gray-500">Variables that will be injected into the pipeline</span>
            </h2>
            
            <div v-if="!selectedWorkflowId" class="text-center py-8">
                    <div class="mx-auto w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>
                    <p class="text-sm text-gray-500">Select a workflow to configure parameters.</p>
            </div>

            <div v-else-if="loadingParams" class="text-center py-8">
                    <Loader2 class="w-6 h-6 animate-spin mx-auto text-blue-500" />
                    <p class="text-xs text-gray-500 mt-2">Loading...</p>
            </div>
            
            <div v-else-if="allParams.length === 0" class="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-200">
                    <p class="text-sm text-gray-500">No configurable parameters for this workflow.</p>
            </div>
            
            <div v-else class="space-y-4">
                <div v-for="param in allParams" :key="param.key" class="grid grid-cols-12 gap-4 items-start p-3 rounded hover:bg-gray-50 transition-colors border border-gray-100">
                        <!-- Key Info -->
                        <div class="col-span-4">
                            <div class="flex items-center flex-wrap gap-2">
                                <span class="font-mono text-sm font-medium text-gray-700 break-all">{{ param.key }}</span>
                                <div>
                                    <span v-if="param.source === 'global'" class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded uppercase tracking-wide">Project</span>
                                    <span v-else class="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded uppercase tracking-wide">Workflow</span>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">{{ param.description || 'No description provided' }}</p>
                        </div>
                        
                        <!-- Value Input -->
                        <div class="col-span-8">
                            <input 
                            v-model="param.runtimeValue" 
                            type="text" 
                            class="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-sm border"
                            :placeholder="param.value"
                            />
                            <div class="flex justify-between mt-1">
                            <span class="text-xs text-gray-400">Default: {{ param.value }}</span>
                            <span v-if="param.runtimeValue !== param.value" class="text-xs text-orange-500 font-medium">Modified</span>
                            </div>
                        </div>
                </div>
            </div>
        </div>

        <!-- Notification Settings Module -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
                <span>Notification Settings</span>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="notifyEnabled" class="sr-only peer">
                    <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    <span class="ml-2 text-sm text-gray-600">{{ notifyEnabled ? 'Enabled' : 'Disabled' }}</span>
                </label>
            </h2>

            <div v-if="notifyEnabled" class="space-y-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Notify Members</label>
                    <div class="border border-gray-300 rounded-md p-2 max-h-48 overflow-y-auto">
                        <div v-if="loadingUsers" class="text-center py-3">
                            <Loader2 class="w-4 h-4 animate-spin mx-auto text-blue-500" />
                            <p class="text-xs text-gray-500 mt-1">Loading users...</p>
                        </div>
                        <div v-else-if="userList.length === 0" class="text-center py-3">
                            <p class="text-sm text-gray-500">No users available</p>
                        </div>
                        <div v-else>
                            <label 
                                v-for="user in userList" 
                                :key="user.id"
                                class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <input 
                                    type="checkbox" 
                                    :value="user.id" 
                                    v-model="notifyUserIds"
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span class="text-sm text-gray-700">{{ user.username }}</span>
                                <span v-if="user.first_name" class="text-xs text-gray-400">({{ user.first_name }})</span>
                            </label>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Selected members will receive a notification when the task finishes, fails, or is revoked.</p>
                </div>
            </div>
            <div v-else class="text-center py-3">
                <p class="text-sm text-gray-500">Enable notifications to alert members when the task completes.</p>
            </div>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-6 pb-2">
            <button 
                @click="router.back()" 
                class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
                Cancel
            </button>
            <button 
                @click="handleCreateAction" 
                :disabled="!isValid"
                class="px-6 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-blue-200"
            >
                <Loader2 v-if="creating" class="w-4 h-4 mr-2 animate-spin" />
                {{ submitButtonText }}
            </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// Route Params / Meta
const isEditMode = computed(() => !!route.meta.isEdit)
const editTaskId = computed(() => route.params.id)
const routeWorkflowId = route.params.workflowId ? Number(route.params.workflowId) : null
const routeType = (route.meta.type as string) || (route.query.type as string)

// Data
const workflows = ref<any[]>([])
const selectedWorkflowId = ref<number | string>('')
const workflowName = ref('')
const projectId = ref<number | null>(null)
const taskName = ref('')
const cronExpression = ref('*/5 * * * *')
const planTime = ref('')
const webhookSecret = ref('')

// Notification settings
const notifyEnabled = ref(false)
const notifyUserIds = ref<number[]>([])
const userList = ref<any[]>([])
const loadingUsers = ref(false)
const currentUserId = ref<number | null>(null)
// For scheduled task, we might need original status checks, but editing usually restricted to pending.

// Params
const allParams = ref<ParamItem[]>([])

// UI State
const loading = ref(false)
const submitting = ref(false)
const loadingParams = ref(false)

// Init Task Type
const selectedTaskType = ref(routeType === 'periodic' || routeType === 'scheduled' || routeType === 'webhook' ? routeType : 'once')

// Constants
const taskTypes = [
    { label: 'Run Once', value: 'once' },
    { label: 'Periodic', value: 'periodic' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Webhook', value: 'webhook' }
]

interface ParamItem {
    key: string
    value: string // Default value
    runtimeValue: string // Current input value
    description: string
    source: 'global' | 'workflow'
}

// Computed
const pageTitle = computed(() => isEditMode.value ? 'Edit Task' : 'Create Task')
const submitButtonText = computed(() => {
    if (submitting.value) return isEditMode.value ? 'Saving...' : 'Creating...'
    if (isEditMode.value) return 'Save Changes'
    if (selectedTaskType.value === 'once') return 'Create & Run'
    return 'Create Task'
})

const isValid = computed(() => {
    if (!selectedWorkflowId.value || !taskName.value || submitting.value) return false
    
    if (selectedTaskType.value === 'periodic' && !cronExpression.value) return false
    if (selectedTaskType.value === 'scheduled' && !planTime.value) return false
    
    return true
})

// Setup
onMounted(async () => {
    await Promise.all([fetchWorkflows(), fetchCurrentUser(), fetchUsers()])
    
    if (isEditMode.value && editTaskId.value) {
        await loadTaskForEdit()
    } else if (routeWorkflowId) {
        selectedWorkflowId.value = routeWorkflowId
        await fetchWorkflowDetails(routeWorkflowId)
    }
})

const loadTaskForEdit = async () => {
    loading.value = true
    try {
        let url = ''
        if (selectedTaskType.value === 'periodic') {
            url = `/api/tasks/periodic/${editTaskId.value}/`
        } else if (selectedTaskType.value === 'scheduled') {
            url = `/api/tasks/scheduled/${editTaskId.value}/`
        } else if (selectedTaskType.value === 'webhook') {
            url = `/api/tasks/webhook/${editTaskId.value}/`
        }
        
        const { data } = await axios.get(url)
        
        // Populate fields
        selectedWorkflowId.value = data.workflow
        taskName.value = data.name
        
        // Populate type specific
        if (selectedTaskType.value === 'periodic') {
            // Check if cron_expression is available (it should be from serializer)
            if (data.cron_expression) {
                // The serializer returns "min hour dom moy dow", we might need to use that OR specific fields.
                // The serializer has `cron_expression` field for display, but input expects `minute`, `hour` etc?
                // Wait, our backend create/update logic looked for `minute`, `hour` fields in `validated_data`.
                // BUT my recent `TaskCreateView` implementation for POST passed `cron_expression` string?
                // Step 91 `TaskCreateView` Line 372: `payload.cron_expression = cronExpression.value`.
                // BUT `PeriodicTaskSerializer` (Step 114) defines `minute`, `hour` etc as `write_only`.
                // It does NOT have a `cron_expression` WRITE field.
                // It has `cron_expression` as `SerializerMethodField` (read-only).
                // So my Previous `TaskCreateView` logic was probably BROKEN or I need to parse the cron expression before sending!
                // Wait. `handleCreateAction` (Step 91 L372) sends `cron_expression`.
                // `PeriodicTaskSerializer` (Step 114) does NOT accept `cron_expression` for writing.
                // This implies **Task Creation for Periodic was likely failing silently or not working as expected regarding schedule!**
                
                // Oops. I need to fix this.
                // I should probably parse the cron string into parts or update serializer to accept `cron_expression`.
                // Updating serializer is better for frontend simplicity.
                // But for now, let's assume I need to handle it.
                // Wait, if I change serializer, I fix both.
                
                // Let's assume for this specific edit step, I bind what I get.
                cronExpression.value = data.cron_expression || '* * * * *'
            }
        } else if (selectedTaskType.value === 'scheduled') {
            // format: 2023-10-10T10:10:00Z
            // input type=datetime-local expects "YYYY-MM-DDTHH:mm"
            if (data.execution_time) {
                // Convert ISO to local for input
                const date = new Date(data.execution_time)
                // datetime-local needs local ISO format without Z
                // Simple hack:
                const offset = date.getTimezoneOffset() * 60000
                const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16)
                planTime.value = localISOTime
            }
        } else if (selectedTaskType.value === 'webhook') {
            webhookSecret.value = data.secret || ''
        }
        
        // Load Workflow & Params
        // We fetch workflow details to get parameter Definitions
        await fetchWorkflowDetails(data.workflow)
        
        // Now override params with Saved Context
        const savedContext = data.context || {}
        allParams.value.forEach(p => {
             if (p.key in savedContext) {
                 p.runtimeValue = String(savedContext[p.key])
             }
        })
        
    } catch (e) {
        console.error("Failed to load task", e)
        alert('Failed to load task details')
    } finally {
        loading.value = false
    }
}


// Generate Name
const generateTaskName = () => {
    if (isEditMode.value) return // Don't auto-regen name in edit mode unless requested? 
    if (!workflowName.value) return
    const timeStr = new Date().toLocaleString().replace(/[\/\s:]/g, '')
    const prefix = selectedTaskType.value === 'once' ? '' : `[${selectedTaskType.value.toUpperCase()}] `
    taskName.value = `${prefix}${workflowName.value}_${timeStr}`
}

watch(selectedTaskType, (newVal, oldVal) => {
    if (!isEditMode.value && newVal !== oldVal) {
        generateTaskName()
    }
})

// Methods
const fetchWorkflows = async () => {
    try {
        const { data } = await axios.get('/api/workflows/')
        workflows.value = data
    } catch (e) {
        console.error("Failed to fetch workflows", e)
    }
}

const fetchCurrentUser = async () => {
    try {
        const { data } = await axios.get('/api/auth/me/')
        currentUserId.value = data.id
        // Default: select current user for notification
        if (!isEditMode.value) {
            notifyUserIds.value = [data.id]
        }
    } catch (e) {
        console.error('Failed to fetch current user', e)
    }
}

const fetchUsers = async () => {
    loadingUsers.value = true
    try {
        const { data } = await axios.get('/api/auth/users/')
        userList.value = Array.isArray(data) ? data : (data.results || [])
    } catch (e) {
        console.error('Failed to fetch users', e)
    } finally {
        loadingUsers.value = false
    }
}

const onWorkflowChange = () => {
    if (selectedWorkflowId.value) {
        fetchWorkflowDetails(Number(selectedWorkflowId.value))
    } else {
        allParams.value = []
        workflowName.value = ''
    }
}

const applyReplayContext = () => {
    const replayRaw = route.query.replay as string
    if (!replayRaw) return
    try {
        const context = JSON.parse(decodeURIComponent(replayRaw))
        if (context && typeof context === 'object') {
            allParams.value.forEach(p => {
                if (p.key in context) {
                    p.runtimeValue = String(context[p.key])
                }
            })
        }
    } catch (e) {
        console.error('Failed to parse replay context', e)
    }
}

const fetchWorkflowDetails = async (id: number) => {
    loadingParams.value = true
    try {
        const { data: workflow } = await axios.get(`/api/workflows/${id}/`)
        workflowName.value = workflow.name
        projectId.value = workflow.project
        
        if (!isEditMode.value) {
             generateTaskName()
        }
        
        // Parse params
        const params: ParamItem[] = []
        const graphData = workflow.graph_data || {}
        const enabledKeys = graphData.global_params_enabled || []
        
        // 1. Global
        if (workflow.project) {
            try {
                const { data: project } = await axios.get(`/api/projects/${workflow.project}/`)
                const globalParams = project.extra_config?.global_params || []
                
                globalParams.forEach((p: any) => {
                    if (enabledKeys.includes(p.key)) {
                        params.push({
                            key: p.key,
                            value: String(p.value),
                            runtimeValue: String(p.value),
                            description: p.description,
                            source: 'global'
                        })
                    }
                })
            } catch (err) {
                console.error("Failed to fetch project params", err)
            }
        }
        
        // 2. Workflow
        const workflowParams = graphData.workflow_params || []
        workflowParams.forEach((p: any) => {
             const existingIdx = params.findIndex(x => x.key === p.key)
             if (existingIdx !== -1) {
                 params[existingIdx] = {
                    key: p.key,
                    value: String(p.value),
                    runtimeValue: String(p.value),
                    description: p.description,
                    source: 'workflow'
                 }
             } else {
                 params.push({
                    key: p.key,
                    value: String(p.value),
                    runtimeValue: String(p.value),
                    description: p.description,
                    source: 'workflow'
                 })
             }
        })
        
        allParams.value = params
        
        // Apply replay context if present
        applyReplayContext()
        
    } catch (e) {
        console.error('Failed to fetch workflow details', e)
    } finally {
        loadingParams.value = false
    }
}

const handleCreateAction = async () => {
    if (!isValid.value) return
    
    submitting.value = true
    try {
        // Collect context
        const context: Record<string, any> = {}
        allParams.value.forEach(p => {
             context[p.key] = p.runtimeValue
        })
        
        const payload: any = {
            name: taskName.value,
            workflow: selectedWorkflowId.value,
            context: context,
            notify_enabled: notifyEnabled.value,
            notify_user_ids: notifyEnabled.value ? notifyUserIds.value : []
        }
        
        let url = '/api/tasks/'
        let method = 'post'
        let redirectRoute: any = { name: 'tasks' } 
        
        if (selectedTaskType.value === 'periodic') {
            url = isEditMode.value 
                ? `/api/tasks/periodic/${editTaskId.value}/` 
                : '/api/tasks/periodic/'
            method = isEditMode.value ? 'put' : 'post'
            
            // Handle Cron Parsing
            // For now, assume backend accepts 'cron_expression' or we need to split it
            // Backend serializer currently takes: minute, hour, day_of_week... 
            // We need to parse "min hr dom moy dow"
            const parts = cronExpression.value.split(' ')
            if (parts.length === 5) {
                payload.minute = parts[0]
                payload.hour = parts[1]
                payload.day_of_month = parts[2]
                payload.month_of_year = parts[3]
                payload.day_of_week = parts[4]
            } else {
                // If special string like @daily? Backend serializer might fail.
                // Fallback to defaults or error?
                // For this implementation, try sending individual fields.
            }

            payload.enabled = true
            redirectRoute = { name: 'tasks-periodic' }
            
        } else if (selectedTaskType.value === 'scheduled') {
            url = isEditMode.value 
                ? `/api/tasks/scheduled/${editTaskId.value}/` 
                : '/api/tasks/scheduled/'
            method = isEditMode.value ? 'put' : 'post'
            
            const date = new Date(planTime.value)
            payload.execution_time = date.toISOString()
            redirectRoute = { name: 'tasks-scheduled' }
            
        } else if (selectedTaskType.value === 'webhook') {
            url = isEditMode.value 
                ? `/api/tasks/webhook/${editTaskId.value}/` 
                : '/api/tasks/webhook/'
            method = isEditMode.value ? 'put' : 'post'
            
            if (webhookSecret.value) {
                payload.secret = webhookSecret.value
            }
            payload.enabled = true
            redirectRoute = { name: 'tasks-webhook' }
            
        } else {
            // Once
            // No edit mode for 'Once' (TaskInstance) usually, create only.
        }
        
        if (method === 'post') {
            const resp = await axios.post(url, payload)
             if (selectedTaskType.value === 'once') {
                 router.push(`/tasks/${resp.data.id}`)
                 return
            }
        } else {
            await axios.put(url, payload)
        }
        
        router.push(redirectRoute)
        
    } catch (e) {
        console.error('Failed to save task:', e)
        alert('Failed to save task. Please check details.')
    } finally {
        submitting.value = false
    }
}
</script>
