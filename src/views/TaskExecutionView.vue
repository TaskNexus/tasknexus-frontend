<template>
  <div class="h-full w-full flex flex-col bg-slate-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex flex-col gap-2 shrink-0">
        <div class="flex items-center justify-between">
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-xl font-semibold text-gray-900">{{ task?.name || '加载中...' }}</h1>
                    <span 
                        v-if="task"
                        class="px-2.5 py-0.5 rounded-full text-xs font-medium border"
                        :class="statusClasses"
                    >
                        {{ task.status }}
                    </span>
                </div>
                <!-- Breadcrumbs -->
                <div class="text-sm text-gray-500 mt-2 flex items-center gap-2">
                    <template v-for="(item, index) in navStack" :key="index">
                        <span 
                            class="hover:text-blue-600 cursor-pointer flex items-center gap-1"
                            :class="{ 'font-semibold text-gray-900': index === navStack.length - 1 }"
                            @click="navigateTo(index)"
                        >
                            {{ item.label }}
                        </span>
                        <span v-if="index < navStack.length - 1" class="text-gray-400">/</span>
                    </template>
                </div>
            </div>
            
            <!-- Controls -->
            <div class="flex items-center gap-3" v-if="task">
                <button 
                    v-if="task.status === 'RUNNING'"
                    @click="handleAction('pause')"
                    :disabled="actionLoading"
                    class="flex items-center px-4 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-md text-sm font-medium transition-colors"
                >
                    <Pause class="w-4 h-4 mr-2" />
                    暂停
                </button>
                <button 
                    v-if="task.status === 'PAUSED'"
                    @click="handleAction('resume')"
                    :disabled="actionLoading"
                    class="flex items-center px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 rounded-md text-sm font-medium transition-colors"
                >
                    <Play class="w-4 h-4 mr-2" />
                    恢复
                </button>
                <button 
                    v-if="['RUNNING', 'PAUSED'].includes(task.status)"
                    @click="handleAction('revoke')"
                    :disabled="actionLoading"
                    class="flex items-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md text-sm font-medium transition-colors"
                >
                    <Ban class="w-4 h-4 mr-2" />
                    终止
                </button>
                <button 
                    @click="router.push('/workflows/' + task.workflow)"
                    class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md text-sm font-medium transition-colors"
                >
                    工作流
                </button>
            </div>
        </div>
        <div class="text-xs text-gray-400 flex items-center gap-4">
             <span>任务ID: {{ task?.id }}</span>
             <span>工作流: {{ task?.workflow_name }}</span>
             <span>开始时间: {{ formatDate(task?.started_at) }}</span>
        </div>
    </div>


    <!-- Content -->
    <div class="flex-1 flex min-h-0 relative">
        <div class="flex-1 min-w-0 h-full">
            <FlowCanvas 
                ref="flowCanvasRef" 
                :readOnly="true" 
                @node-selected="handleNodeClick"
                @node-dblclick="handleNodeDblClick"
            />
        </div>
        
        <!-- Side Panel -->
        <div v-if="activeNode" class="w-96 shrink-0 bg-white border-l border-gray-200 flex flex-col shadow-lg z-20 overflow-hidden">
            <div class="h-14 px-4 flex items-center justify-between border-b border-gray-100 bg-gray-50">
                <h3 class="font-medium text-gray-900 truncate pr-2">{{ activeNode.label || activeNode.id }}</h3>
                <button @click="activeNode = null" class="text-gray-400 hover:text-gray-600">
                    <X class="w-4 h-4" />
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-4 space-y-6">
                <!-- Status -->
                <div>
                   <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Status</label>
                   <span 
                        class="px-2 py-1 rounded text-xs font-medium"
                        :class="getNodeStatusClass(activeNode.status)"
                   >
                        {{ activeNode.status || 'UNKNOWN' }}
                   </span>
                </div>

                <!-- View Logs Button (for Client Agent nodes) -->
                <div v-if="agentTaskId">
                    <button 
                        @click="showLogModal = true"
                        class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-green-400 hover:bg-gray-800 rounded-md text-sm font-medium transition-colors border border-gray-700"
                    >
                        <Terminal class="w-4 h-4" />
                        View Logs
                    </button>
                </div>

                <!-- Outputs -->
                <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Outputs</label>
                    <div v-if="nodeLoading" class="flex items-center text-sm text-gray-400 py-2">
                        <Loader2 class="w-3 h-3 animate-spin mr-2" />
                        Loading data...
                    </div>
                    <div v-else-if="!nodeData" class="text-sm text-gray-400 italic">
                        No output data available
                    </div>
                    <div v-else class="space-y-3">
                        <div v-for="(val, key) in filteredOutputs" :key="key" class="space-y-1">
                             <div class="text-xs font-medium text-gray-700">{{ key }}</div>
                             <div class="bg-slate-900 text-slate-50 p-2 rounded text-xs font-mono whitespace-pre-wrap break-all max-h-60 overflow-y-auto">{{ val }}</div>
                        </div>
                    </div>
                </div>

                <!-- Inputs -->
                <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Inputs</label>
                    <div v-if="!nodeData?.inputs" class="text-sm text-gray-400 italic">No inputs</div>
                    <div v-else class="space-y-3">
                        <div v-for="(val, key) in nodeData.inputs" :key="key" class="space-y-1">
                             <div class="text-xs font-medium text-gray-700">{{ key }}</div>
                             <div class="bg-gray-50 p-2 rounded text-xs font-mono text-gray-600 break-all">{{ val }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading Overlay -->
        <div v-if="loading" class="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
        </div>
    </div>

    <!-- Agent Log Modal -->
    <AgentLogModal 
      :visible="showLogModal" 
      :taskId="agentTaskId" 
      @close="showLogModal = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { Play, Pause, Ban, Loader2, X, Terminal } from 'lucide-vue-next'
import FlowCanvas from '../components/FlowCanvas.vue'
import AgentLogModal from '../components/AgentLogModal.vue'

const route = useRoute()
const router = useRouter()
const taskId = route.params.id as string

const task = ref<any>(null)
const loading = ref(true)
const actionLoading = ref(false)
const flowCanvasRef = ref<any>(null)
let pollTimer: any = null

const activeNode = ref<any>(null)
const nodeData = ref<any>(null)
const nodeLoading = ref(false)
const showLogModal = ref(false)

// Computed: extract agent task_id from node outputs if this is a client_agent node
const agentTaskId = computed(() => {
    if (!nodeData.value?.outputs) return null
    return nodeData.value.outputs.task_id || null
})

// Navigation Stack for SubProcesses
interface NavItem {
    label: string
    workflowId: string
    subprocessNodeId: string | null
}
const navStack = ref<NavItem[]>([])

const statusClasses = computed(() => {
    switch (task.value?.status) {
        case 'RUNNING': return 'bg-blue-50 text-blue-700 border-blue-200'
        case 'FINISHED': return 'bg-green-50 text-green-700 border-green-200'
        case 'FAILED': return 'bg-red-50 text-red-700 border-red-200'
        case 'PAUSED': return 'bg-amber-50 text-amber-700 border-amber-200'
        case 'REVOKED': return 'bg-gray-50 text-gray-700 border-gray-200'
        default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
})

const getNodeStatusClass = (status: string) => {
    const s = (status || '').toUpperCase()
    switch (s) {
        case 'FINISHED': return 'bg-green-100 text-green-700'
        case 'FAILED': return 'bg-red-100 text-red-700'
        case 'RUNNING': return 'bg-blue-100 text-blue-700'
        default: return 'bg-gray-100 text-gray-600'
    }
}

// Filter out internal variables (starting with _)
const filteredOutputs = computed(() => {
    if (!nodeData.value?.outputs) return {}
    return Object.fromEntries(
        Object.entries(nodeData.value.outputs).filter(([key]) => !key.startsWith('_'))
    )
})

const formatDate = (date: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleString()
}

const fetchTask = async () => {
    try {
        const resp = await axios.get(`/api/tasks/${taskId}/`)
        task.value = resp.data
        
        // Init Nav Stack if empty
        if (navStack.value.length === 0 && task.value.workflow) {
            navStack.value.push({
                label: '父节点',
                workflowId: task.value.workflow,
                subprocessNodeId: null
            })
            // Load root graph
            await loadGraph(task.value.workflow)
        }
    } catch (e) {
        console.error('Failed to fetch task', e)
    } finally {
        loading.value = false
    }
}

const loadGraph = async (workflowId: string) => {
    try {
        const wfResp = await axios.get(`/api/workflows/${workflowId}/`)
        // Wait for next tick to ensure canvas is ready
        await nextTick()
        if (flowCanvasRef.value && wfResp.data.graph_data) {
             flowCanvasRef.value.loadGraph(wfResp.data.graph_data)
             // Clean selection
             activeNode.value = null
             // Force update status immediately
             updateNodeStates()
        }
    } catch (e) {
        console.error("Failed to load graph", e)
    }
}

const updateNodeStates = async () => {
    if (!task.value?.pipeline_id) return
    
    // Get current context from stack
    const currentView = navStack.value[navStack.value.length - 1]
    const params: any = {}
    if (currentView.subprocessNodeId) {
        params.subprocess_node_id = currentView.subprocessNodeId
    }

    try {
        const resp = await axios.get(`/api/tasks/${taskId}/node_states/`, { params })
        const states = resp.data // { node_id: { state, flow_state } | string }
        if (flowCanvasRef.value) {
            flowCanvasRef.value.updateNodeStatus(states)
            
            if (activeNode.value) {
                const nodeId = activeNode.value.id
                if (states[nodeId]) {
                    // Handle both old string format and new object format
                    const stateValue = states[nodeId]
                    const displayState = typeof stateValue === 'string' 
                        ? stateValue 
                        : stateValue.state
                    activeNode.value = { 
                        ...activeNode.value, 
                        status: displayState 
                    }
                }
            }
        }
        
        // Also refresh task status just in case (only if at root?)
        // Or generic refresh.
        const taskResp = await axios.get(`/api/tasks/${taskId}/`)
        task.value = taskResp.data
        
        if (['FINISHED', 'FAILED', 'REVOKED'].includes(task.value.status)) {
            // Check if we should stop polling... 
            // But if user is viewing a subprocess, maybe we still want to poll?
            // If whole task is finished, then statuses won't change.
            stopPolling()
        }
    } catch (e) {
        console.error('Failed to update states', e)
    }
}

const handleNodeClick = (node: any) => {
    if (!node) {
        activeNode.value = null
        return
    }
    const data = node.getData ? node.getData() : node
    activeNode.value = {
        id: node.id,
        label: data.label,
        status: data.status,
        type: data.type
    }
    // We only fetch detail for the currently rendered graph nodes
    // The backend `node_detail` needs to handle mapping if we are in a subprocess?
    // Actually `node_detail` endpoint currently takes `node_id`. 
    // And it uses `task.execution_data['node_id_map']`.
    // If we are in a subprocess, the node ID is from the SubProcess Template.
    // The `node_id_map` in root execution_data maps ROOT template node IDs.
    // To get detail for a SubProcess Inner Node, we need to know the SubProcess Mapping.
    // However, the current `node_detail` implementation in backend primarily looks at `Data` objects.
    // `Data.objects.get(id=backend_id)`.
    // We need to resolve `backend_id` correctly.
    // If we are in a subprocess view, we have `currentView.subprocessNodeId`.
    // We might need to pass `subprocess_node_id` context to `fetchNodeDetail` too!
    fetchNodeDetail(node.id)
}

const fetchNodeDetail = async (nodeId: string) => {
    nodeLoading.value = true
    nodeData.value = null
    
    const currentView = navStack.value[navStack.value.length - 1]
    const params: any = { node_id: nodeId }
    if (currentView.subprocessNodeId) {
        params.subprocess_node_id = currentView.subprocessNodeId
    }

    try {
        const resp = await axios.get(`/api/tasks/${taskId}/node_detail/`, {
            params: params
        })
        nodeData.value = resp.data
    } catch (e) {
        console.error("Failed to fetch node detail", e)
    } finally {
        nodeLoading.value = false
    }
}


const handleNodeDblClick = async (node: any) => {
    // Check if node is subprocess
    const data = node.getData ? node.getData() : node
    const type = (data.type || '').toUpperCase()
    
    if (type !== 'SUBPROCESS') return
    
    // Find workflow ID
    const inputs = data.componentInputs || data.inputs || {}
    let workflowId = inputs.workflow_id
    if (!workflowId && data.workflow) workflowId = data.workflow
    
    console.log("Drill down to subprocess:", node.id, workflowId)

    if (!workflowId) {
        alert("SubProcess ID not found.")
        return
    }
    
    // Push to stack
    navStack.value.push({
        label: data.label || 'SubProcess',
        workflowId: workflowId,
        subprocessNodeId: node.id
    })
    
    // Load new graph
    loading.value = true
    await loadGraph(workflowId)
    loading.value = false
}

const navigateTo = async (index: number) => {
    if (index === navStack.value.length - 1) return // Current
    
    // Slice stack
    const target = navStack.value[index]
    navStack.value = navStack.value.slice(0, index + 1)
    
    // Load graph
    loading.value = true
    await loadGraph(target.workflowId)
    loading.value = false
}

const handleAction = async (action: 'pause' | 'resume' | 'revoke') => {
    if (!confirm(`Are you sure you want to ${action} this task?`)) return
    
    actionLoading.value = true
    try {
        await axios.post(`/api/tasks/${taskId}/${action}/`)
        await updateNodeStates() 
    } catch (e) {
        console.error(`Failed to ${action} task`, e)
        alert(`Failed to ${action} task`)
    } finally {
        actionLoading.value = false
    }
}


const startPolling = () => {
    stopPolling()
    pollTimer = setInterval(updateNodeStates, 2000)
}

const stopPolling = () => {
    if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
    }
}

onMounted(async () => {
    await fetchTask()
    startPolling()
})

onBeforeUnmount(() => {
    stopPolling()
})
</script>
