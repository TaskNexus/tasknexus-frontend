<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">
          Tasks
      </h1>
      <div class="flex items-center space-x-2">
         <select 
            v-model="selectedProject" 
            @change="handleProjectChange"
            class="border border-gray-200 rounded text-sm text-gray-600 h-9 pl-2 pr-8 focus:outline-none focus:border-blue-500 bg-white"
        >
           <option :value="''">All Projects</option>
           <option v-for="p in projects" :key="p.id" :value="p.id">
             [{{ p.id }}] {{ p.name }}
           </option>
        </select>
        
        <select 
            v-model="selectedStatus" 
            @change="fetchTasks"
            class="border border-gray-200 rounded text-sm text-gray-600 h-9 pl-2 pr-8 focus:outline-none focus:border-blue-500 bg-white"
        >
           <option :value="''">All Status</option>
           <option value="CREATED">Created</option>
           <option value="RUNNING">Running</option>
           <option value="PAUSED">Paused</option>
           <option value="FINISHED">Finished</option>
           <option value="FAILED">Failed</option>
           <option value="REVOKED">Revoked</option>
        </select>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="flex items-center">
                <span class="text-sm text-gray-500 mr-2 w-16 text-right">Task Name:</span>
                <input 
                    v-model="searchName"
                    @keyup.enter="fetchTasks"
                    type="text" 
                    placeholder="Search by name" 
                    class="border border-gray-200 rounded px-2 py-1 text-sm w-40 focus:outline-none focus:border-blue-500"
                >
            </div>
             <div class="flex items-center ml-4">
                 <button class="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700" @click="fetchTasks">Filter</button>
                 <button class="bg-white border border-gray-200 text-gray-600 px-4 py-1.5 rounded text-sm ml-2 hover:bg-gray-50" @click="resetFilters">Reset</button>
            </div>
          </div>
          
          <div class="flex items-center">
              <button 
                v-if="selectedTasks.length > 0"
                class="bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded text-sm hover:bg-red-100 transition-colors"
                @click="batchDelete"
              >
                  Batch Delete ({{ selectedTasks.length }})
              </button>
          </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="flex-1 overflow-auto px-6 pb-6">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b border-gray-100 text-xs text-gray-500">
                    <th class="py-3 font-medium w-12 text-center">
                        <input 
                            type="checkbox" 
                            :checked="isAllSelected" 
                            :indeterminate="isIndeterminate"
                            @change="toggleAll"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        >
                    </th>
                    <th class="py-3 font-medium w-16">ID</th>
                    <th class="py-3 font-medium">Task Name</th>
                    <th class="py-3 font-medium">Workflow</th>
                    <th class="py-3 font-medium">Project</th>
                    <th class="py-3 font-medium text-center">Status</th>
                    <th class="py-3 font-medium">Started At</th>
                    <th class="py-3 font-medium">Finished At</th>
                    <th class="py-3 font-medium w-32 text-center">Action</th>
                </tr>
            </thead>
            <tbody class="text-sm text-gray-700">
                <tr v-if="tasks.length === 0" class="border-b border-gray-50">
                    <td colspan="9" class="py-8 text-center text-gray-400">No tasks found</td>
                </tr>
                <tr v-for="task in tasks" :key="task.id" class="border-b border-gray-50 hover:bg-blue-50/30 transition-colors group">
                     <td class="py-3 text-center">
                         <input 
                            type="checkbox" 
                            v-model="selectedTasks" 
                            :value="task.id"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                         >
                     </td>
                     <td class="py-3 text-gray-500">#{{ task.id }}</td>
                     <td class="py-3 font-medium text-gray-800">{{ task.name }}</td>
                     <td class="py-3 text-blue-600 cursor-pointer hover:underline" @click="goToWorkflow(task.workflow)">
                         {{ task.workflow_name || 'Unknown' }}
                     </td>
                     <td class="py-3 text-gray-500">{{ getProjectName(task.workflow) }}</td>
                     <td class="py-3 text-center">
                         <span :class="getStatusBadgeClass(task.status)" class="px-2 py-0.5 rounded text-xs font-medium">
                             {{ task.status }}
                         </span>
                     </td>
                     <td class="py-3 text-gray-500">{{ formatDate(task.started_at) }}</td>
                     <td class="py-3 text-gray-500">{{ formatDate(task.finished_at) }}</td>
                     <td class="py-3 text-center space-x-2">
                         <button class="text-blue-600 hover:text-blue-800 text-xs font-medium" @click="viewDetail(task.id)">Detail</button>
                         <button class="text-red-500 hover:text-red-700 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" @click="deleteTask(task.id)">Delete</button>
                     </td>
                </tr>
            </tbody>
        </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

// Filters
const selectedProject = ref(route.query.project_id || '')
const selectedPeriodicTask = ref(route.query.periodic_task_id || '')
const selectedScheduledTask = ref(route.query.scheduled_task_id || '')
const selectedStatus = ref('')
const searchName = ref('')

// Data
const projects = ref<any[]>([])
const tasks = ref<any[]>([])

// Selection
const selectedTasks = ref<number[]>([])

const fetchProjects = async () => {
    try {
        const response = await axios.get('/api/projects/')
        projects.value = response.data
    } catch (e) {
        console.error("Failed to fetch projects", e)
    }
}

const fetchTasks = async () => {
    try {
        const params: any = {}
        if (selectedProject.value) params.project_id = selectedProject.value
        if (selectedPeriodicTask.value) params.periodic_task_id = selectedPeriodicTask.value
        if (selectedScheduledTask.value) params.scheduled_task_id = selectedScheduledTask.value
        if (selectedStatus.value) params.status = selectedStatus.value
        if (searchName.value) params.name = searchName.value
        
        const response = await axios.get('/api/tasks/', { params })
        tasks.value = response.data.results || response.data 
        // Reset selection on refetch
        selectedTasks.value = []
    } catch(e) {
        console.error("Failed to fetch tasks", e)
    }
}

// Helper to get project info (optimistic)
const getProjectName = (workflowId: number) => {
    return '-'
}

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'CREATED': return 'bg-gray-100 text-gray-600'
        case 'RUNNING': return 'bg-blue-100 text-blue-600'
        case 'FINISHED': return 'bg-green-100 text-green-600'
        case 'FAILED': return 'bg-red-100 text-red-600'
        case 'REVOKED': return 'bg-yellow-100 text-yellow-600'
        default: return 'bg-gray-100'
    }
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString()
}

const handleProjectChange = () => {
    fetchTasks()
}

const resetFilters = () => {
    selectedProject.value = ''
    selectedStatus.value = ''
    searchName.value = ''
    fetchTasks()
}

const viewDetail = (taskId: number) => {
    router.push({ name: 'task-execution', params: { id: taskId } })
}

const goToWorkflow = (workflowId: number) => {
    router.push(`/workflows/${workflowId}`)
}

// Deletion Logic
const deleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    
    try {
        await axios.delete(`/api/tasks/${id}/`)
        // Remove locally
        tasks.value = tasks.value.filter(t => t.id !== id)
        selectedTasks.value = selectedTasks.value.filter(sid => sid !== id)
    } catch (e) {
        console.error('Failed to delete task', e)
        alert('Failed to delete task')
    }
}

const batchDelete = async () => {
    if (selectedTasks.value.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedTasks.value.length} tasks?`)) return
    
    try {
        await axios.post('/api/tasks/bulk_delete/', { ids: selectedTasks.value })
        // Refresh or remove locally
        await fetchTasks()
    } catch (e) {
        console.error('Failed to batch delete', e)
        alert('Failed to batch delete')
    }
}

// Selection Logic
const isAllSelected = computed(() => {
    return tasks.value.length > 0 && selectedTasks.value.length === tasks.value.length
})

const isIndeterminate = computed(() => {
    return selectedTasks.value.length > 0 && selectedTasks.value.length < tasks.value.length
})

const toggleAll = (e: any) => {
    if (e.target.checked) {
        selectedTasks.value = tasks.value.map(t => t.id)
    } else {
        selectedTasks.value = []
    }
}

onMounted(async () => {
    await fetchProjects()
    await fetchTasks()
})
</script>
