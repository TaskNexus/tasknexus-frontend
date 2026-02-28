<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">
          工作流列表
      </h1>
      <div class="flex items-center space-x-2">
         <select 
            v-model="selectedProject" 
            @change="handleProjectChange"
            class="border border-gray-200 rounded text-sm text-gray-600 h-9 pl-2 pr-8 focus:outline-none focus:border-blue-500 bg-white"
        >
           <option :value="''">所有项目</option>
           <option v-for="p in projects" :key="p.id" :value="p.id">
             {{ p.name }}
           </option>
        </select>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="px-6 py-4">
      <!-- Search Inputs -->
      <div class="flex items-center space-x-4 mb-4">
        <div class="flex items-center">
            <span class="text-sm text-gray-500 mr-2 w-16 text-right">ID:</span>
            <input type="text" placeholder="请输入" class="border border-gray-200 rounded px-2 py-1 text-sm w-40 focus:outline-none focus:border-blue-500">
        </div>
        <div class="flex items-center">
             <span class="text-sm text-gray-500 mr-2 w-16 text-right">流程名:</span>
            <input type="text" placeholder="请输入" class="border border-gray-200 rounded px-2 py-1 text-sm w-40 focus:outline-none focus:border-blue-500">
        </div>
        <div class="flex items-center">
             <span class="text-sm text-gray-500 mr-2 w-16 text-right">创建人:</span>
            <input type="text" placeholder="请输入" class="border border-gray-200 rounded px-2 py-1 text-sm w-40 focus:outline-none focus:border-blue-500">
        </div>
         <div class="flex items-center">
             <span class="text-sm text-gray-500 mr-2 w-16 text-right">更新人:</span>
            <input type="text" placeholder="请输入" class="border border-gray-200 rounded px-2 py-1 text-sm w-40 focus:outline-none focus:border-blue-500">
        </div>
         <div class="flex-1 text-right">
             <button class="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700" @click="fetchWorkflows">过滤</button>
             <button class="bg-white border border-gray-200 text-gray-600 px-4 py-1.5 rounded text-sm ml-2 hover:bg-gray-50" @click="resetFilters">重置</button>
        </div>
      </div>
      
      <!-- Tags & Action Bar -->
      <div class="flex items-center justify-between mt-6">
        <div class="flex bg-gray-100 p-1 rounded-md overflow-x-auto max-w-[600px] scrollbar-hide">
            <button 
                v-for="tag in availableFilterTags" 
                :key="tag"
                class="px-4 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap"
                :class="activeTag === tag ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'"
                @click="changeTag(tag)"
            >
                {{ tag }}
            </button>
        </div>
        <div class="flex items-center space-x-2">
            <button class="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center" @click="createWorkflow">
                <Plus class="w-4 h-4 mr-1" />
                新建
            </button>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="flex-1 overflow-auto px-6 pb-6">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b border-gray-100 text-xs text-gray-500">
                    <th class="py-3 font-medium w-12 text-center"><input type="checkbox"></th>
                    <th class="py-3 font-medium w-16">ID</th>
                    <th class="py-3 font-medium">流程名称</th>
                    <th class="py-3 font-medium text-center">标签</th>
                    <th class="py-3 font-medium">更新时间</th>
                    <th class="py-3 font-medium">创建人</th>
                    <th class="py-3 font-medium">更新人</th>
                    <th class="py-3 font-medium w-48 text-center">操作</th>
                </tr>
            </thead>
            <tbody class="text-sm text-gray-700">
                <tr v-for="flow in workflows" :key="flow.id" class="border-b border-gray-50 hover:bg-blue-50/30 transition-colors group">
                     <td class="py-3 text-center"><input type="checkbox"></td>
                     <td class="py-3">{{ flow.id }}</td>
                     <td class="py-3">
                         <span class="text-blue-600 cursor-pointer hover:underline font-medium" @click="openCanvas(flow.id)">{{ flow.name }}</span>
                     </td>
                     <td class="py-3 text-center">
                         <div class="flex justify-center gap-1">
                             <span v-for="tag in flow.tags" :key="tag" class="px-2 py-0.5 text-xs rounded text-white" :class="getTagColor(tag)">
                                 {{ tag }}
                             </span>
                         </div>
                     </td>
                     <td class="py-3 text-gray-500">{{ formatDate(flow.updated_at) }}</td>
                     <td class="py-3 text-gray-500">{{ flow.created_by_username || 'admin' }}</td>
                      <td class="py-3 text-gray-500">{{ flow.updated_by_username || 'admin' }}</td>
                     <td class="py-3 text-center">
                         <div class="flex justify-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button class="text-blue-600 hover:text-blue-800 text-xs" @click="handleClone(flow.id, flow.name)">克隆</button>
                             <button class="text-blue-600 hover:text-blue-800 text-xs" @click="handleCreateTaskClick(flow.id)">创建任务</button>
                             <button class="text-red-500 hover:text-red-700 text-xs" @click="deleteWorkflow(flow.id)">删除</button>
                         </div>
                     </td>
                </tr>
            </tbody>
        </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus } from 'lucide-vue-next'
// import CreateTaskModal from '../components/CreateTaskModal.vue' // No longer used here
import axios from 'axios' // Use configured axios instance in real app

const route = useRoute()
const router = useRouter()
const activeTag = ref('全部')
const selectedProject = ref(route.query.project_id || '')
const projects = ref<any[]>([])

interface Workflow {
  id: number
  name: string
  tags: string[]
  updated_at: string
  created_by_username?: string
}

const workflows = ref<Workflow[]>([])

const availableFilterTags = computed(() => {
    const defaultTags = ['全部', '客户端', '服务端', '测试', '运维', '通用']
    if (!selectedProject.value) {
        return defaultTags
    }
    const proj = projects.value.find(p => p.id == selectedProject.value)
    if (proj && proj.extra_config && Array.isArray(proj.extra_config.workflow_tags) && proj.extra_config.workflow_tags.length > 0) {
        return ['全部', ...proj.extra_config.workflow_tags]
    }
    return ['全部']
})

const fetchProjects = async () => {
    try {
        const response = await axios.get('/api/projects/')
        projects.value = response.data
    } catch (e) {
        console.error("Failed to fetch projects", e)
    }
}

const fetchWorkflows = async () => {
    try {
      const params: any = {}
      if (selectedProject.value) {
          params.project = selectedProject.value
      }
      
      // Add logic for other filters (search inputs) here if needed
      
      const response = await axios.get('/api/workflows/', { params })
      if (response.data) {
         workflows.value = response.data
         // Filter by tag locally for now as tags are JSONField list
         if (activeTag.value !== '全部') {
             workflows.value = workflows.value.filter(w => w.tags && w.tags.includes(activeTag.value))
         }
      }
    } catch (e) {
      console.error("Failed to fetch workflows", e)
    }
}

const handleProjectChange = () => {
    // Reset active tag
    activeTag.value = '全部'
    // Update URL query
    const query = selectedProject.value ? { ...route.query, project_id: selectedProject.value } : { ...route.query }
    if (!selectedProject.value) delete query.project_id
    
    router.replace({ query })
    fetchWorkflows()
}

const changeTag = (tag: string) => {
    activeTag.value = tag
    fetchWorkflows()
}

const resetFilters = () => {
    selectedProject.value = ''
    activeTag.value = '全部'
    handleProjectChange()
}

onMounted(async () => {
    await fetchProjects()
    await fetchWorkflows()
})

const createWorkflow = () => {
    // Pass project_id if exists
    const query = selectedProject.value ? { project_id: selectedProject.value } : {}
    router.push({ path: '/workflows/new', query }) 
}

const openCanvas = (id: number) => {
    router.push(`/workflows/${id}`)
}

const getTagColor = (tag: string) => {
    switch(tag) {
        case '服务端': return 'bg-green-600'
        case '客户端': return 'bg-orange-500'
        case '测试': return 'bg-purple-600'
        case '运维': return 'bg-blue-600'
        default: return 'bg-gray-400'
    }
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
}

const deleteWorkflow = async (id: number) => {
    if (!confirm('确定要删除这个流程吗？此操作不可撤销。')) {
        return
    }
    try {
        await axios.delete(`/api/workflows/${id}/`)
        // Remove from local list
        workflows.value = workflows.value.filter(w => w.id !== id)
    } catch (e) {
        console.error('Failed to delete workflow:', e)
        alert('删除失败，请重试')
    }
}

// Clone Workflow
const handleClone = (id: number, name: string) => {
    // Navigate to new workflow page with clone_from query
    router.push({ 
        path: '/workflows/new', 
        query: { clone_from: id } 
    })
}

// Create Task Logic
// Deprecated modal, now navigating to page
const handleCreateTaskClick = (id: number) => {
    router.push({
        name: 'task-create',
        params: { workflowId: id }
    })
}
</script>
