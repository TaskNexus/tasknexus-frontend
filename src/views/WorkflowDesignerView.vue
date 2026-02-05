<template>
  <div class="h-full w-full flex flex-col bg-slate-50">
    <!-- Header: Tabs and Actions -->
    <div class="bg-white border-b border-gray-200 shadow-sm">
        <!-- Top Row: Breadcrumb / Title -->
        <div class="h-10 px-4 flex items-center justify-between border-b border-gray-100">
             <div class="flex items-center text-xs text-gray-500 space-x-2">
                 <span>Workflows</span>
                 <span>/</span>
                 <!-- Editable Workflow Name -->
                 <input 
                   v-model="workflowName" 
                   class="text-blue-600 font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 -mx-1"
                   :class="{ 'cursor-default': isReadOnly }"
                   :readonly="isReadOnly"
                   placeholder="Untitled Workflow"
                 />
             </div>
             <div class="text-xs text-gray-400">
                 {{ isSaving ? 'Saving...' : (lastSaved ? `Saved ${lastSaved}` : 'Not saved') }}
             </div>
        </div>
        
        <!-- Bottom Row: Tools -->
        <div class="h-12 px-4 flex items-center justify-between">
            <div class="flex items-center space-x-1">
                 <!-- Left side placeholder or empty if no tabs needed -->
            </div>
            
            <div class="flex items-center space-x-2">
                <!-- User Requested Toolbar Buttons -->
                <button title="Basic Info" class="p-2 text-gray-500 hover:bg-gray-100 rounded" @click="togglePanel('info')">
                   <Info class="w-4 h-4" />
                </button>
                <button title="Global Variables" class="p-2 text-gray-500 hover:bg-gray-100 rounded" @click="togglePanel('vars')">
                   <Globe class="w-4 h-4" />
                </button>
                <button title="Flow Data JSON" class="p-2 text-gray-500 hover:bg-gray-100 rounded" @click="togglePanel('json')">
                   <Code class="w-4 h-4" />
                </button>
                <button title="Operation Record" class="p-2 text-gray-500 hover:bg-gray-100 rounded" @click="togglePanel('history')">
                   <History class="w-4 h-4" />
                </button>
                
                <div class="w-px h-4 bg-gray-300 mx-2"></div>

                <button 
                  title="Toggle Edit Mode" 
                  class="flex items-center px-3 py-1.5 rounded border text-sm transition-colors"
                  :class="isReadOnly ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-200'"
                  @click="isReadOnly = !isReadOnly"
                >
                    <Edit3 class="w-4 h-4 mr-1.5" />
                    {{ isReadOnly ? 'Read Only' : 'Editing' }}
                </button>

                <div class="w-px h-4 bg-gray-300 mx-2"></div>
                
                <button 
                  class="flex items-center px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded border border-transparent hover:border-gray-200 text-sm transition-colors"
                  @click="handleSaveClick"
                >
                    <Save class="w-4 h-4 mr-1.5" />
                    Save
                </button>
                <button 
                  class="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm text-sm transition-colors"
                  @click="handleCreateTask"
                  :disabled="!workflowId"
                  :title="!workflowId ? 'Save workflow first' : ''"
                  :class="{ 'opacity-50 cursor-not-allowed': !workflowId }"
                >
                    <Play class="w-4 h-4 mr-1.5" />
                    Create Task
                </button>
            </div>
        </div>
    </div>
    
    <!-- Canvas Area with Right Panel -->
    <div class="flex-1 flex min-h-0">
      <div class="flex-1 relative overflow-hidden">
        <FlowCanvas ref="flowCanvasRef" :readOnly="isReadOnly" @node-selected="handleNodeSelected" @edge-selected="handleEdgeSelected" @save="handleSaveClick" />
      </div>

      <!-- Right Sidebar -->
      <div v-show="activePanel" class="w-80 bg-white border-l border-gray-200 flex flex-col shadow-lg shrink-0">
          <!-- Sidebar Header -->
          <div class="h-10 border-b border-gray-100 flex items-center justify-between px-4">
              <span class="font-medium text-gray-700 capitalize">{{ panelTitles[activePanel || ''] || activePanel }}</span>
              <button @click="closePanel" class="text-gray-400 hover:text-gray-600">
                  <X class="w-4 h-4" />
              </button>
          </div>
          
          <!-- Content: Info (Basic Info) -->
          <div v-if="activePanel === 'info'" class="flex-1 p-4 overflow-y-auto space-y-4">
              <div class="space-y-1">
                  <label class="text-xs font-medium text-gray-500">Workflow Name</label>
                  <input 
                    v-model="workflowName" 
                    class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Enter workflow name"
                  />
              </div>
              <div class="space-y-1">
                  <label class="text-xs font-medium text-gray-500">Project</label>
                  <select 
                      v-model="selectedProjectId" 
                      class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                      :disabled="!!workflowId"
                  >
                      <option value="" disabled>Select a project...</option>
                      <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                  <p v-if="workflowId" class="text-xs text-gray-400 italic">Project cannot be changed for saved workflows.</p>
              </div>
              <div class="space-y-1">
                  <label class="text-xs font-medium text-gray-500">Tags</label>
                  <div class="flex flex-wrap gap-1 mb-2">
                      <span 
                        v-for="(tag, idx) in workflowTags" 
                        :key="idx" 
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600"
                      >
                          {{ tag }}
                          <button @click="removeTag(idx)" class="ml-1 text-blue-400 hover:text-blue-600">×</button>
                      </span>
                  </div>
                  <div class="flex gap-2">
                      <select 
                        v-model="newTag" 
                        class="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="" disabled>Select a tag...</option>
                        <option v-for="tag in availableTags" :key="tag" :value="tag">
                            {{ tag }}
                        </option>
                      </select>
                      <button 
                        @click="addTag" 
                        :disabled="!newTag"
                        class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-600 disabled:opacity-50"
                      >
                        Add
                      </button>
                  </div>
                  <div v-if="availableTags.length === 0" class="mt-1 text-xs text-orange-500">
                      No tags configured in Project Settings.
                  </div>
              </div>
          </div>
          

          <!-- Content: Global Variables -->
          <div v-else-if="activePanel === 'vars'" class="flex-1 p-4 overflow-y-auto">
              <div v-if="!selectedProjectId" class="text-sm text-gray-400 text-center py-4">
                  Please select a project first to see available parameters.
              </div>
              <div v-else-if="loadingProjectParams" class="text-center py-4">
                  <Loader2 class="w-6 h-6 animate-spin mx-auto text-blue-500" />
              </div>
              <div v-else-if="projectParams.length === 0" class="text-sm text-gray-400 text-center py-4">
                  No global parameters defined in this project.
              </div>
              <div v-else class="space-y-4">
                  <p class="text-xs text-gray-500 mb-2">Enable parameters to inject into this workflow.</p>
                  
                  <!-- Always Visible Project ID -->
                  <div class="flex items-start gap-2 p-2 rounded bg-gray-50 border border-gray-100 opacity-75">
                      <input type="checkbox" checked disabled class="mt-1 rounded border-gray-300 text-blue-600 bg-gray-100" />
                      <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between">
                             <span class="text-sm font-medium text-gray-700">project_id</span>
                             <span class="text-xs font-mono text-gray-500">{{ selectedProjectId }}</span>
                          </div>
                          <p class="text-xs text-gray-400 mt-0.5">Fixed Project ID</p>
                      </div>
                  </div>

                  <div v-for="param in projectParams" :key="param.key" class="flex items-start gap-2 p-2 rounded border transition-colors" :class="isParamEnabled(param.key) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-200'">
                      <input 
                        type="checkbox" 
                        :checked="isParamEnabled(param.key)" 
                        @change="toggleParam(param.key)"
                        class="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between">
                             <span class="text-sm font-medium text-gray-700 break-all">{{ param.key }}</span>
                             <span class="text-xs font-mono text-gray-500 truncate max-w-[80px]" :title="param.value">{{ param.value }}</span>
                          </div>
                          <p class="text-xs text-gray-500 mt-0.5 break-words">{{ param.description || 'No description' }}</p>
                      </div>
                  </div>
              </div>

              <!-- Separator -->
              <div class="border-t border-gray-200 my-4"></div>

              <!-- Component Output Params (Discovered) -->
              <div>
                  <div class="flex items-center justify-between mb-2">
                       <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wider">上下文输出变量</h4>
                       <button @click="refreshComponentVars" class="text-xs text-blue-600 hover:text-blue-800" title="刷新">
                           <History class="w-3 h-3" />
                       </button>
                  </div>
                  <p class="text-xs text-gray-500 mb-3">节点输出已映射到上下文的变量，可在其他节点中通过 <code class="bg-gray-100 px-1 rounded">${变量名}</code> 引用。</p>

                  <div v-if="componentVars.length === 0" class="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-200">
                      <span class="text-xs text-gray-400">暂无配置的输出变量</span>
                      <p class="text-xs text-gray-400 mt-1">请在节点配置面板中设置"输出变量映射"</p>
                  </div>

                  <div v-else class="space-y-2 mb-4">
                       <div v-for="(v, index) in componentVars" :key="index" class="p-2 rounded border border-green-100 bg-green-50">
                           <div class="flex items-center justify-between">
                               <span class="text-xs font-medium text-green-700 font-mono">${{ v.key }}</span>
                               <span class="text-xs text-gray-400 italic">{{ v.component }}</span>
                           </div>
                           <p class="text-xs text-green-800/60 mt-0.5">来源: {{ v.sourceNode }}</p>
                       </div>
                  </div>
              </div>

              <!-- Separator -->
              <div class="border-t border-gray-200 my-4"></div>

              <!-- Component Input References (Discovered) -->
              <div>
                  <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">引用的变量</h4>
                  <p class="text-xs text-gray-500 mb-3">节点输入中使用的 SPLICE 变量引用</p>

                  <div v-if="referencedVars.length === 0" class="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-200">
                      <span class="text-xs text-gray-400">暂无变量引用</span>
                  </div>

                  <div v-else class="space-y-2 mb-4">
                       <div v-for="(v, index) in referencedVars" :key="'ref-'+index" class="p-2 rounded border border-orange-100 bg-orange-50">
                           <div class="flex items-center justify-between">
                               <span class="text-xs font-medium text-orange-700 font-mono">${{ v.key }}</span>
                           </div>
                           <p class="text-xs text-orange-800/60 mt-0.5">使用于 {{ v.component }}</p>
                       </div>
                  </div>
              </div>

              <!-- Separator -->
              <div class="border-t border-gray-200 my-4"></div>
              
              <!-- Workflow Specific Params -->
              <div>
                  <div class="flex items-center justify-between mb-2">
                      <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Workflow Parameters</h4>
                      <button @click="addWorkflowParam" class="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                          + Add
                      </button>
                  </div>
                  <p class="text-xs text-gray-500 mb-3">Define parameters specific to this workflow. These override project defaults.</p>
                  
                  <div v-if="workflowParams.length === 0" class="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-200">
                      <span class="text-xs text-gray-400">No workflow-specific parameters</span>
                  </div>
                  
                  <div v-else class="space-y-3">
                      <div v-for="(param, index) in workflowParams" :key="index" class="p-2 rounded border border-gray-200 bg-white hover:border-blue-300 transition-colors">
                          <div class="space-y-2">
                              <div>
                                  <input 
                                      v-model="param.key" 
                                      placeholder="Key (e.g. TIMEOUT)" 
                                      class="w-full text-xs font-medium border-gray-200 rounded px-2 py-1 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white"
                                  />
                              </div>
                              <div>
                                  <input 
                                      v-model="param.value" 
                                      placeholder="Value" 
                                      class="w-full text-xs border-gray-200 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                                  />
                              </div>
                              <div class="flex items-center gap-2">
                                  <input 
                                      v-model="param.description" 
                                      placeholder="Description (Optional)" 
                                      class="flex-1 text-xs text-gray-500 border-transparent bg-transparent focus:border-gray-200 rounded px-1 py-0.5 focus:bg-white"
                                  />
                                  <button @click="removeWorkflowParam(index)" class="text-gray-400 hover:text-red-500">
                                      <X class="w-3 h-3" />
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          
          <!-- Content: JSON -->
          <div v-else-if="activePanel === 'json'" class="flex-1 p-4 overflow-y-auto">
               <div class="text-xs font-mono bg-gray-50 p-2 rounded border border-gray-100 whitespace-pre-wrap break-all">
                  {{ JSON.stringify({ ...graphData, global_params_enabled: enabledGlobalParams }, null, 2) }}
               </div>
          </div>
          
          <!-- ... remaining panels ... -->
          <div v-else-if="activePanel === 'configuration'" class="flex-1 h-full overflow-hidden">
              <NodeConfiguration 
                  v-if="selectedNode" 
                  :node="selectedNode" 
                  :project-id="selectedProjectId || undefined"
              />
              <div v-else class="text-sm text-gray-400 text-center py-10">
                  Select a node to configure.
              </div>
          </div>

          <!-- Content: Edge Configuration -->
          <div v-else-if="activePanel === 'edge-configuration'" class="flex-1 h-full overflow-hidden">
              <EdgeConfiguration 
                  v-if="selectedEdge" 
                  :edge="selectedEdge" 
              />
              <div v-else class="text-sm text-gray-400 text-center py-10">
                  Select a line to configure.
              </div>
          </div>
          
          <!-- Default Placeholder -->
          <div v-else class="flex-1 p-4 overflow-y-auto text-sm text-gray-500">
              Placeholder for {{ activePanel }} content.
          </div>
      </div>
    </div>
    
    <!-- Save Modal -->
    <div v-if="showSaveModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showSaveModal = false">
        <div class="bg-white rounded-lg shadow-xl w-96 p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Save Workflow</h3>
            <div class="space-y-4">
                <div class="space-y-1">
                    <label class="text-xs font-medium text-gray-500">Workflow Name</label>
                    <input 
                      v-model="workflowName" 
                      class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Enter workflow name"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <select v-model="selectedProjectId" class="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="" disabled>Select a project</option>
                        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button @click="showSaveModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md">
                        Cancel
                    </button>
                    <button 
                        @click="handleSave" 
                        :disabled="isSaving || !workflowName"
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                    >
                        {{ isSaving ? 'Saving...' : 'Save' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FlowCanvas from '../components/FlowCanvas.vue'
import NodeConfiguration from '../components/NodeConfiguration.vue'
import EdgeConfiguration from '../components/EdgeConfiguration.vue'
import { Save, Play, Info, Globe, Code, History, Edit3, X, Loader2 } from 'lucide-vue-next'
import axios from 'axios'
import { buildPipelineTree, validatePipelineTree, type BuildPipelineOptions, type ParamDefinition } from '../utils/pipelineTreeBuilder'

const route = useRoute()
const router = useRouter()
const flowCanvasRef = ref<InstanceType<typeof FlowCanvas> | null>(null)

const activePanel = ref<string | null>(null)
const isReadOnly = ref(false)
const selectedNode = ref<any>(null)
const selectedEdge = ref<any>(null)
const graphData = ref<any>({}) // Placeholder for JSON view

// ... (skipping unchanged parts) ...

const panelTitles: Record<string, string> = {
    info: 'Basic Info',
    vars: 'Global Variables',
    json: 'Flow Data',
    history: 'Operation History',
    configuration: 'Node Configuration',
    'edge-configuration': 'Edge Configuration'
}

// Workflow state
const workflowId = ref<string | null>(null)
const workflowName = ref('Untitled Workflow')
const workflowTags = ref<string[]>([])
const newTag = ref('')
const selectedProjectId = ref<number | string>('')
const projects = ref<{id: number, name: string}[]>([])
const isLoading = ref(false)

// Global Params State
interface ProjectParam {
    key: string
    value: string
    description: string
}
const projectParams = ref<ProjectParam[]>([])
const loadingProjectParams = ref(false)
const enabledGlobalParams = ref<string[]>([])

const availableTags = ref<string[]>([])

const fetchProjectParams = async () => {
    if (!selectedProjectId.value) {
        projectParams.value = []
        availableTags.value = []
        return
    }
    loadingProjectParams.value = true
    try {
        const { data } = await axios.get(`/api/projects/${selectedProjectId.value}/`)
        // Global Params
        if (data.extra_config && data.extra_config.global_params) {
            projectParams.value = data.extra_config.global_params
        } else {
             projectParams.value = []
        }
        // Workflow Tags
        if (data.extra_config && data.extra_config.workflow_tags) {
            availableTags.value = data.extra_config.workflow_tags
        } else {
            availableTags.value = []
        }
    } catch (e) {
        console.error("Failed to load project params", e)
    } finally {
        loadingProjectParams.value = false
    }
}

// Watch activePanel to load params when 'vars' opens.
// Also watch selectedProjectId.
watch(activePanel, (newVal) => {
    if (newVal === 'vars' || newVal === 'info') {
        fetchProjectParams()
    }
    if (newVal === 'vars') {
        // Wait for graph to be ready/loaded before checking
        nextTick(() => {
            refreshComponentVars()
        })
    }
})
watch(selectedProjectId, () => {
    if (activePanel.value === 'vars' || activePanel.value === 'info') {
        fetchProjectParams()
    }
})

const isParamEnabled = (key: string) => {
    return enabledGlobalParams.value.includes(key)
}

const toggleParam = (key: string) => {
    const idx = enabledGlobalParams.value.indexOf(key)
    if (idx === -1) {
        enabledGlobalParams.value.push(key)
    } else {
        enabledGlobalParams.value.splice(idx, 1)
    }
}

// Workflow Local Params State
interface WorkflowParam {
    key: string
    value: string
    description: string
}
const workflowParams = ref<WorkflowParam[]>([])

const addWorkflowParam = () => {
    workflowParams.value.push({
        key: '',
        value: '',
        description: ''
    })
}

const removeWorkflowParam = (index: number) => {
    workflowParams.value.splice(index, 1)
}

// Save state
const showSaveModal = ref(false)
const isSaving = ref(false)
const lastSaved = ref('')

// Create Task state
const showCreateTaskModal = ref(false)

// Discovered Component Output Vars
interface ComponentVar {
    key: string
    component: string
    sourceNode: string
}
const componentVars = ref<ComponentVar[]>([])
const referencedVars = ref<ComponentVar[]>([])

const refreshComponentVars = () => {
    componentVars.value = []
    referencedVars.value = []
    
    if (!flowCanvasRef.value) return

    const graph = flowCanvasRef.value.getGraph()
    if (!graph) return

    const nodes = graph.getNodes()
    nodes.forEach((node: any) => {
        const data = node.getData()
        if (!data) return
        
        // Find Produced Vars from outputs array
        // Format: outputs: [{ sourceKey: 'result', contextKey: 'ai_response' }]
        if (Array.isArray(data.outputs)) {
            data.outputs.forEach((out: { sourceKey: string; contextKey: string }) => {
                if (out.sourceKey && out.contextKey) {
                    componentVars.value.push({
                        key: out.contextKey,
                        component: data.label || 'Unknown Component',
                        sourceNode: `${node.id} → ${out.sourceKey}`
                    })
                }
            })
        }
        
        // Find Referenced Vars
        // Iterate all inputs
        if (data.inputs) {
            Object.entries(data.inputs).forEach(([k, v]) => {
                if (typeof v === 'string') {
                    const matches = v.match(/\$\{([a-zA-Z0-9_]+)\}/g)
                    if (matches) {
                        matches.forEach(match => {
                            const key = match.substring(2, match.length - 1)
                            referencedVars.value.push({
                                key: key,
                                component: data.label || 'Unknown Component',
                                sourceNode: node.id
                            })
                        })
                    }
                }
            })
        }
    })
}

const handleNodeSelected = (node: any) => {
    selectedNode.value = node
    if (node) {
        selectedEdge.value = null // Only deselect edge if selecting a node
        activePanel.value = 'configuration'
    } else {
        // Only close if it was the active panel
        if (activePanel.value === 'configuration') {
            activePanel.value = null
        }
    }
}

const handleEdgeSelected = (edge: any) => {
    selectedEdge.value = edge
    if (edge) {
        selectedNode.value = null // Only deselect node if selecting an edge
        activePanel.value = 'edge-configuration'
    } else {
        // Only close if it was the active panel
        if (activePanel.value === 'edge-configuration') {
            activePanel.value = null
        }
    }
}

const updateNodeData = () => {
    // Deprecated, handled by NodeConfiguration
}

const closePanel = () => {
    activePanel.value = null
}

const togglePanel = (panel: string) => {
    if (activePanel.value === panel) {
        activePanel.value = null
    } else {
        activePanel.value = panel
    }
}

const addTag = () => {
    const tag = newTag.value.trim()
    if (tag && !workflowTags.value.includes(tag)) {
        workflowTags.value.push(tag)
        newTag.value = ''
    }
}

const removeTag = (idx: number) => {
    workflowTags.value.splice(idx, 1)
}

const fetchProjects = async () => {
    try {
        const resp = await axios.get('/api/projects/')
        projects.value = resp.data.results || resp.data || []
    } catch (e) {
        console.error('Failed to fetch projects:', e)
    }
}

// Handle save button click - skip modal for existing workflows
const handleSaveClick = () => {
    if (workflowId.value) {
        // Existing workflow - save directly
        handleSave()
    } else {
        // New workflow - show modal to select project
        showSaveModal.value = true
    }
}

const handleSave = async (): Promise<boolean> => {
    if (!workflowName.value) return false
    
    isSaving.value = true
    try {
        // Get graph from FlowCanvas
        const graph = flowCanvasRef.value?.getGraph()
        if (!graph) {
            throw new Error('Graph not available')
        }
        
        // Build pipeline tree from graph with params
        // Filter enabled global params from projectParams
        const enabledGlobalParamsList: ParamDefinition[] = projectParams.value
            .filter(p => enabledGlobalParams.value.includes(p.key))
            .map(p => ({ key: p.key, value: p.value }))
        
        // Map workflow params
        const workflowParamsList: ParamDefinition[] = workflowParams.value
            .filter(p => p.key)
            .map(p => ({ key: p.key, value: p.value }))
        
        const buildOptions: BuildPipelineOptions = {
            projectId: selectedProjectId.value || undefined,
            globalParams: enabledGlobalParamsList,
            workflowParams: workflowParamsList
        }
        
        const pipelineTree = buildPipelineTree(graph, buildOptions)
        
        // Validate pipeline tree
        const validation = validatePipelineTree(pipelineTree)
        if (!validation.valid) {
            alert('Validation errors:\n' + validation.errors.join('\n'))
            return false
        }
        
        // Get graph JSON data for storage
        const graphDataJSON: any = graph.toJSON()
        
        // MERGE global_params_enabled into graphData
        graphDataJSON.global_params_enabled = enabledGlobalParams.value
        // MERGE workflow_params
        graphDataJSON.workflow_params = workflowParams.value

        const payload = {
            name: workflowName.value,
            tags: workflowTags.value,
            project: selectedProjectId.value || null,
            graph_data: graphDataJSON,
            pipeline_tree: pipelineTree
        }
        
        // Use PATCH for existing workflows, POST for new ones
        if (workflowId.value) {
            await axios.patch(`/api/workflows/${workflowId.value}/`, payload)
        } else {
            const resp = await axios.post('/api/workflows/', payload)
            // Update workflowId so subsequent saves update instead of create
            workflowId.value = resp.data.id
        }
        lastSaved.value = 'just now'
        showSaveModal.value = false
        return true
    } catch (e: any) {
        console.error('Failed to save workflow:', e)
        alert('Failed to save workflow: ' + (e.message || 'Unknown error'))
        return false
    } finally {
        isSaving.value = false
    }
}

const loadWorkflow = async (id: string, isClone = false) => {
    isLoading.value = true
    try {
        const resp = await axios.get(`/api/workflows/${id}/`)
        const workflow = resp.data
        
        if (isClone) {
             workflowId.value = null
             workflowName.value = `${workflow.name}`
             workflowTags.value = workflow.tags || []
             selectedProjectId.value = workflow.project || ''
        } else {
             workflowId.value = id
             workflowName.value = workflow.name || 'Untitled Workflow'
             workflowTags.value = workflow.tags || []
             selectedProjectId.value = workflow.project || ''
        }

        graphData.value = workflow.graph_data || {}
        
        // Load enabled global params from graph_data
        if (workflow.graph_data && workflow.graph_data.global_params_enabled) {
            enabledGlobalParams.value = workflow.graph_data.global_params_enabled
        } else {
            enabledGlobalParams.value = []
        }
        
        // Load workflow params
        if (workflow.graph_data && workflow.graph_data.workflow_params) {
            workflowParams.value = workflow.graph_data.workflow_params
        } else {
            workflowParams.value = []
        }
        
        // Wait for FlowCanvas to be mounted, then load graph
        await nextTick()
        if (flowCanvasRef.value && workflow.graph_data) {
            flowCanvasRef.value.loadGraph(workflow.graph_data)
        }
        
        lastSaved.value = isClone ? 'not saved' : 'loaded'
    } catch (e: any) {
        console.error('Failed to load workflow:', e)
        alert('Failed to load workflow: ' + (e.message || 'Not found'))
    } finally {
        isLoading.value = false
    }
}

const handleCreateTask = async () => {
    // Enforce Save (and Validation) before creating task
    // The modal handles creation, but we want to ensure save first
    if (!workflowId.value) return
    
    // If not saved or modified, maybe save?
    // For now, simpler to just open modal
    // But original logic enforced save
    
    // We can hook into the 'Create Task' button click
    const saved = await handleSave()
    if (!saved) return
    
    // showCreateTaskModal.value = true
    // Navigate to Create Task Page
    router.push({
        name: 'task-create',
        params: { workflowId: workflowId.value }
    })
}

onMounted(async () => {
    fetchProjects()
    
    // Check if editing an existing workflow or cloning
    const id = route.params.id as string
    const cloneFrom = route.query.clone_from as string
    
    if (id && id !== 'new') {
        await loadWorkflow(id)
    } else if (cloneFrom) {
        // Clone mode: load original data but treat as new
        await loadWorkflow(cloneFrom, true)
    }
})
</script>
