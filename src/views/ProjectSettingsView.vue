<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button @click="$router.back()" class="text-gray-500 hover:text-gray-700">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
        </button>
        <h1 class="text-xl font-bold text-gray-800">Project Settings</h1>
    </header>

    <div class="flex-1 overflow-auto p-6">
        <div class="max-w-4xl mx-auto space-y-8">
            
            <!-- General Settings -->
            <section class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4 pb-2 border-b cursor-pointer select-none" @click="toggleSection('general')">
                    <h2 class="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <component :is="collapsedSections.general ? ChevronRight : ChevronDown" class="w-5 h-5 text-gray-500" />
                        General Information
                    </h2>
                </div>
                <div v-show="!collapsedSections.general" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Project Name</label>
                        <input 
                            v-model="form.name" 
                            type="text" 
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Description</label>
                        <textarea 
                            v-model="form.description" 
                            rows="3"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                        ></textarea>
                    </div>
                    <div class="flex justify-end">
                        <button 
                            @click="saveGeneral" 
                            :disabled="saving"
                            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {{ saving ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </div>
                </div>
            </section>

            <!-- Members Settings -->
            <section class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4 pb-2 border-b cursor-pointer select-none" @click="toggleSection('members')">
                     <h2 class="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <component :is="collapsedSections.members ? ChevronRight : ChevronDown" class="w-5 h-5 text-gray-500" />
                        Project Members
                    </h2>
                </div>
                
                <div v-show="!collapsedSections.members">
                    <!-- Add Member -->
                    <div class="flex gap-4 mb-6 bg-gray-50 p-4 rounded-md items-start">
                        <div class="flex-1 relative">
                            <input 
                                v-model="userSearchQuery" 
                                @input="handleSearchInput"
                                @focus="showUserDropdown = true"
                                @blur="delayHideDropdown"
                                type="text" 
                                placeholder="Search by username or email..." 
                                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                                autocomplete="off"
                            />
                            <!-- Dropdown -->
                            <div v-if="showUserDropdown && foundUsers.length > 0" class="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                <div 
                                    v-for="user in foundUsers" 
                                    :key="user.id"
                                    @click="selectUser(user)"
                                    class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 text-gray-900 group"
                                >
                                    <span class="block truncate font-medium">{{ user.username }}</span>
                                    <span class="block truncate text-xs text-gray-500">{{ user.email }}</span>
                                </div>
                            </div>
                        </div>

                         <select 
                            v-model="newMemberRole"
                            class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 h-[38px]"
                        >
                            <option value="REPORTER">Reporter</option>
                            <option value="DEVELOPER">Developer</option>
                            <option value="MAINTAINER">Maintainer</option>
                        </select>
                        <button 
                            @click="addMember" 
                            :disabled="!selectedUser || addingMember"
                            class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 h-[38px]"
                        >
                            Add
                        </button>
                    </div>

                    <!-- List -->
                    <div class="overflow-hidden border rounded-lg">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="member in members" :key="member.id">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                                                {{ member.username ? member.username.substring(0,2).toUpperCase() : '??' }}
                                            </div>
                                            <div>
                                                <div class="text-sm font-medium text-gray-900">{{ member.username }}</div>
                                                <div class="text-sm text-gray-500">{{ member.email }}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <select 
                                            v-model="member.role" 
                                            @change="updateRole(member)"
                                            class="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-2 py-1"
                                            :disabled="member.role === 'OWNER'"
                                        >
                                            <option value="OWNER">Owner</option>
                                            <option value="MAINTAINER">Maintainer</option>
                                            <option value="DEVELOPER">Developer</option>
                                            <option value="REPORTER">Reporter</option>
                                        </select>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            @click="removeMember(member)" 
                                            class="text-red-600 hover:text-red-900"
                                            :disabled="member.role === 'OWNER'"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <!-- AI Model Settings -->
            <section class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4 pb-2 border-b cursor-pointer select-none" @click="toggleSection('ai')">
                    <h2 class="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <component :is="collapsedSections.ai ? ChevronRight : ChevronDown" class="w-5 h-5 text-gray-500" />
                        AI Model Settings
                    </h2>
                    <button @click.stop="addModelGroup" class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                        + Add Group
                    </button>
                </div>
                
                <div v-show="!collapsedSections.ai">
                    <p class="text-sm text-gray-500 mb-4">Configure multiple AI model providers for use in workflow nodes.</p>
                    
                    <div v-if="modelGroups.length === 0" class="text-center py-8 text-gray-400 text-sm">
                        No model groups configured. Click "Add Group" to create one.
                    </div>
                    
                    <div class="space-y-4">
                        <div v-for="(group, gIndex) in modelGroups" :key="gIndex" class="border rounded-lg p-4">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        v-model="group.enabled"
                                        class="rounded border-gray-300 text-blue-600"
                                    />
                                    <input 
                                        v-model="group.title" 
                                        type="text" 
                                        placeholder="Group Title (e.g., Banana, OpenAI)"
                                        class="text-sm font-medium text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1"
                                    />
                                </div>
                                <button @click="removeModelGroup(gIndex)" class="text-red-500 hover:text-red-700 text-xs">
                                    Remove
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">API URL</label>
                                    <input 
                                        v-model="group.api_url" 
                                        type="text" 
                                        placeholder="https://api.example.com/..."
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">API Key</label>
                                    <input 
                                        v-model="group.api_key" 
                                        type="password" 
                                        placeholder="sk-..."
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                                    />
                                </div>
                            </div>
                            
                            <!-- Models List -->
                            <div class="bg-gray-50 rounded p-3">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-medium text-gray-600 uppercase">Models</span>
                                    <button @click="addModel(gIndex)" class="text-xs text-blue-600 hover:text-blue-800">+ Add Model</button>
                                </div>
                                <div v-if="group.models.length === 0" class="text-xs text-gray-400 py-2">No models. Click "Add Model" to add one.</div>
                                <div v-for="(model, mIndex) in group.models" :key="mIndex" class="flex items-center gap-2 py-1">
                                    <input type="checkbox" v-model="model.enabled" class="rounded border-gray-300 text-blue-600" />
                                    <input 
                                        v-model="model.name" 
                                        type="text" 
                                        placeholder="Model name (e.g., stable-diffusion-xl)"
                                        class="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                                    />
                                    <button @click="removeModel(gIndex, mIndex)" class="text-red-400 hover:text-red-600 text-xs">×</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end mt-4">
                        <button 
                            @click="saveAiConfig" 
                            :disabled="savingAiConfig"
                            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {{ savingAiConfig ? 'Saving...' : 'Save AI Settings' }}
                        </button>
                    </div>
                </div>
            </section>

            <!-- Global Parameters Settings -->
            <section class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4 pb-2 border-b cursor-pointer select-none" @click="toggleSection('global')">
                    <h2 class="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <component :is="collapsedSections.global ? ChevronRight : ChevronDown" class="w-5 h-5 text-gray-500" />
                        Global Parameters
                    </h2>
                    <button @click.stop="addGlobalParam" class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                        + Add Parameter
                    </button>
                </div>
                
                <div v-show="!collapsedSections.global">
                    <p class="text-sm text-gray-500 mb-4">Define global parameters accessible to all workflows in this project. You can toggle them on/off per workflow. Note: <code>project_id</code> is always available.</p>
                    
                    <div class="space-y-3">
                        <!-- Fixed Project ID -->
                        <div class="flex items-start gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                             <div class="w-1/4">
                                <label class="block text-xs font-medium text-gray-500 uppercase">Key</label>
                                <input type="text" value="project_id" disabled class="w-full text-sm bg-gray-100 text-gray-500 border-gray-300 rounded px-2 py-1" />
                            </div>
                            <div class="w-1/3">
                                <label class="block text-xs font-medium text-gray-500 uppercase">Value</label>
                                <input type="text" :value="projectId" disabled class="w-full text-sm bg-gray-100 text-gray-500 border-gray-300 rounded px-2 py-1" />
                            </div>
                            <div class="flex-1">
                                <label class="block text-xs font-medium text-gray-500 uppercase">Description</label>
                                <input type="text" value="Unique Identifier for this project (Fixed)" disabled class="w-full text-sm bg-gray-100 text-gray-500 border-gray-300 rounded px-2 py-1" />
                            </div>
                             <div class="w-8"></div>
                        </div>

                        <!-- Dynamic Params -->
                        <div v-if="globalParams.length === 0" class="text-center py-4 text-gray-400 text-sm">
                            No custom parameters defined. Click "Add Parameter" to create one.
                        </div>

                        <div v-for="(param, index) in globalParams" :key="index" class="flex items-start gap-3 p-3 rounded border border-gray-100 hover:border-gray-300 transition-colors">
                            <div class="w-1/4">
                                <label class="block text-xs font-medium text-gray-500 uppercase mb-1">Key</label>
                                <input 
                                    v-model="param.key" 
                                    type="text" 
                                    placeholder="e.g. API_KEY"
                                    class="w-full text-sm border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div class="w-1/3">
                                <label class="block text-xs font-medium text-gray-500 uppercase mb-1">Value</label>
                                <input 
                                    v-model="param.value" 
                                    type="text" 
                                    placeholder="Value..."
                                    class="w-full text-sm border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div class="flex-1">
                                <label class="block text-xs font-medium text-gray-500 uppercase mb-1">Description</label>
                                <input 
                                    v-model="param.description" 
                                    type="text" 
                                    placeholder="Description (Optional)"
                                    class="w-full text-sm border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div class="w-8 flex items-center justify-center pt-6">
                                <button @click="removeGlobalParam(index)" class="text-red-400 hover:text-red-600">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end mt-6">
                        <button 
                            @click="saveGlobalParams" 
                            :disabled="savingGlobalParams"
                            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {{ savingGlobalParams ? 'Saving...' : 'Save Parameters' }}
                        </button>
                    </div>
                </div>
            </section>

            <!-- Workflow Tags Settings -->
            <section class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4 pb-2 border-b cursor-pointer select-none" @click="toggleSection('tags')">
                    <h2 class="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <component :is="collapsedSections.tags ? ChevronRight : ChevronDown" class="w-5 h-5 text-gray-500" />
                        Workflow Tags
                    </h2>
                    <button @click.stop="addWorkflowTag" class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                        + Add Tag
                    </button>
                </div>
                
                <div v-show="!collapsedSections.tags">
                    <p class="text-sm text-gray-500 mb-4">Define standard tags for workflows in this project.</p>
                    
                    <div v-if="workflowTags.length === 0" class="text-center py-4 text-gray-400 text-sm">
                        No tags defined. Click "Add Tag" to create one.
                    </div>

                    <div v-else class="space-y-3">
                        <div v-for="(tag, index) in workflowTags" :key="index" class="flex items-center gap-3 p-3 rounded border border-gray-100 hover:border-gray-300 transition-colors">
                            <div class="flex-1">
                                <label class="block text-xs font-medium text-gray-500 uppercase mb-1">Tag Name</label>
                                <input 
                                    v-model="workflowTags[index]" 
                                    type="text" 
                                    placeholder="e.g. Backend"
                                    class="w-full text-sm border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div class="w-8 flex items-center justify-center pt-6">
                                <button @click="removeWorkflowTag(index)" class="text-red-400 hover:text-red-600">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end mt-6">
                        <button 
                            @click="saveWorkflowTags" 
                            :disabled="savingWorkflowTags"
                            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {{ savingWorkflowTags ? 'Saving...' : 'Save Tags' }}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const projectId = route.params.id
const form = ref({
    name: '',
    description: ''
})

// Collapsible Sections State
const collapsedSections = reactive({
    general: false,
    members: false,
    ai: true,
    network: true, // Default collapsed
    global: true, // Default collapsed
    tags: true    // Default collapsed
})

// Network Config State
const proxyUrl = ref('')
const savingNetworkConfig = ref(false)

const saveNetworkConfig = async () => {
    savingNetworkConfig.value = true
    try {
        await axios.patch(`/api/projects/${projectId}/`, {
            extra_config: getExtraConfig()
        })
        alert('Network settings saved successfully')
    } catch (e: any) {
        console.error("Failed to save network config", e)
        alert(e.response?.data?.detail || 'Failed to save network settings')
    } finally {
        savingNetworkConfig.value = false
    }
}

const toggleSection = (section: keyof typeof collapsedSections) => {
    collapsedSections[section] = !collapsedSections[section]
}


// AI Config State - Multi-group
interface AIModel {
    name: string
    enabled: boolean
}
interface ModelGroup {
    title: string
    enabled: boolean
    api_url: string
    api_key: string
    models: AIModel[]
}
const modelGroups = ref<ModelGroup[]>([])
const savingAiConfig = ref(false)
const saving = ref(false)
const members = ref<any[]>([])

// Search State
const userSearchQuery = ref('')
const foundUsers = ref<any[]>([])
const showUserDropdown = ref(false)
const selectedUser = ref<any>(null)
let searchTimeout: any = null

const newMemberRole = ref('REPORTER')
const addingMember = ref(false)

const addModelGroup = () => {
    modelGroups.value.push({
        title: 'New Provider',
        enabled: true,
        api_url: '',
        api_key: '',
        models: []
    })
}

const removeModelGroup = (index: number) => {
    modelGroups.value.splice(index, 1)
}

const addModel = (groupIndex: number) => {
    modelGroups.value[groupIndex].models.push({
        name: '',
        enabled: true
    })
}

const removeModel = (groupIndex: number, modelIndex: number) => {
    modelGroups.value[groupIndex].models.splice(modelIndex, 1)
}

// Global Params State
interface GlobalParam {
    key: string
    value: string
    description: string
}
const globalParams = ref<GlobalParam[]>([])
const savingGlobalParams = ref(false)

const addGlobalParam = () => {
    globalParams.value.push({
        key: '',
        value: '',
        description: ''
    })
}

const removeGlobalParam = (index: number) => {
    globalParams.value.splice(index, 1)
}

// Helper to construct extra_config ensuring all parts are included
const getExtraConfig = () => {
    return {
        model_groups: modelGroups.value,
        global_params: globalParams.value,
        workflow_tags: workflowTags.value,
        proxy_url: proxyUrl.value
    }
}

const saveGlobalParams = async () => {
    savingGlobalParams.value = true
    try {
        await axios.patch(`/api/projects/${projectId}/`, {
            extra_config: getExtraConfig()
        })
        alert('Global parameters saved successfully')
    } catch (e: any) {
        console.error("Failed to save global params", e)
        alert(e.response?.data?.detail || 'Failed to save global parameters')
    } finally {
        savingGlobalParams.value = false
    }
}

const fetchProject = async () => {
    try {
        const { data } = await axios.get(`/api/projects/${projectId}/`)
        form.value.name = data.name
        form.value.description = data.description
        // Load AI config from extra_config
        if (data.extra_config) {
             if (Array.isArray(data.extra_config.model_groups)) {
                modelGroups.value = data.extra_config.model_groups
            }
            if (Array.isArray(data.extra_config.global_params)) {
                globalParams.value = data.extra_config.global_params
            }
            if (Array.isArray(data.extra_config.workflow_tags)) {
                workflowTags.value = data.extra_config.workflow_tags
            }
            if (data.extra_config.proxy_url) {
                proxyUrl.value = data.extra_config.proxy_url
            }
        }
    } catch (e) {
        console.error("Failed to fetch project", e)
        alert('Failed to load project details.')
        router.push({ name: 'projects' })
    }
}

// ... existing saveAiConfig/saveGeneral/etc ...

const saveAiConfig = async () => {
    savingAiConfig.value = true
    try {
        await axios.patch(`/api/projects/${projectId}/`, {
            extra_config: getExtraConfig()
        })
        alert('AI settings saved successfully')
    } catch (e: any) {
        console.error("Failed to save AI config", e)
        alert(e.response?.data?.detail || 'Failed to save AI settings')
    } finally {
        savingAiConfig.value = false
    }
}

// Workflow Tags State
const workflowTags = ref<string[]>([])
const savingWorkflowTags = ref(false)

const addWorkflowTag = () => {
    workflowTags.value.push('')
}

const removeWorkflowTag = (index: number) => {
    workflowTags.value.splice(index, 1)
}

const saveWorkflowTags = async () => {
    savingWorkflowTags.value = true
    try {
        // Filter out empty tags
        workflowTags.value = workflowTags.value.filter(t => t.trim())
        
        await axios.patch(`/api/projects/${projectId}/`, {
            extra_config: getExtraConfig()
        })
        alert('Workflow tags saved successfully')
    } catch (e: any) {
        console.error("Failed to save workflow tags", e)
        alert(e.response?.data?.detail || 'Failed to save workflow tags')
    } finally {
        savingWorkflowTags.value = false
    }
}

// ...

// Re-export other methods implicitly by being in setup script
// But wait, existing code has fetchProject defined. I should replace it.
// And insert the new methods before onMounted.

const saveGeneral = async () => {
    saving.value = true
    try {
        await axios.patch(`/api/projects/${projectId}/`, form.value)
        alert('Project updated successfully')
    } catch (e: any) {
        console.error("Failed to update project", e)
        alert(e.response?.data?.detail || 'Failed to update project')
    } finally {
        saving.value = false
    }
}

const fetchMembers = async () => {
    try {
        const { data } = await axios.get(`/api/projects/members/?project_id=${projectId}`)
        members.value = data.results || data
    } catch (e) {
        console.error("Failed to fetch members", e)
    }
}

const handleSearchInput = () => {
    selectedUser.value = null // Reset selection on type
    if (searchTimeout) clearTimeout(searchTimeout)
    
    if (!userSearchQuery.value) {
        foundUsers.value = []
        return
    }

    searchTimeout = setTimeout(async () => {
        try {
            // Use 'search' param which uses SearchFilter (username, email)
            const { data } = await axios.get(`/api/auth/users/?search=${userSearchQuery.value}`)
            foundUsers.value = data.results || data
        } catch (e) {
            console.error(e)
        }
    }, 300)
}

const selectUser = (user: any) => {
    selectedUser.value = user
    userSearchQuery.value = user.username
    showUserDropdown.value = false
}

const delayHideDropdown = () => {
    setTimeout(() => {
        showUserDropdown.value = false
    }, 200)
}

const addMember = async () => {
    if (!selectedUser.value) return
    addingMember.value = true
    try {
        await axios.post('/api/projects/members/', {
            project: projectId,
            user: selectedUser.value.id,
            role: newMemberRole.value
        })
        userSearchQuery.value = ''
        selectedUser.value = null
        fetchMembers()
    } catch (e: any) {
        console.error("Add member failed", e)
        alert(e.response?.data?.detail || 'Failed to add member')
    } finally {
        addingMember.value = false
    }
}

const updateRole = async (member: any) => {
    try {
        await axios.patch(`/api/projects/members/${member.id}/`, { role: member.role })
    } catch (e: any) {
        console.error("Update role failed", e)
        alert(e.response?.data?.detail || 'Failed to update role')
        fetchMembers()
    }
}

const removeMember = async (member: any) => {
    if (!confirm(`Remove ${member.username} from project?`)) return
    try {
        await axios.delete(`/api/projects/members/${member.id}/`)
        fetchMembers()
    } catch (e: any) {
        console.error("Remove member failed", e)
        alert(e.response?.data?.detail || 'Failed to remove member')
    }
}

onMounted(() => {
    fetchProject()
    fetchMembers()
})

</script>


