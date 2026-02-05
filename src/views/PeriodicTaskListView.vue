<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">
          Periodic Tasks
      </h1>
      <div class="flex items-center space-x-2">
         <button class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center" @click="openCreate">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            New Task
         </button>
      </div>
    </div>
    
    <!-- Data Table -->
    <div class="flex-1 overflow-auto px-6 py-6">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b border-gray-100 text-xs text-gray-500">
                    <th class="py-3 font-medium w-16">ID</th>
                    <th class="py-3 font-medium">Task Name</th>
                    <th class="py-3 font-medium">Workflow Template</th>
                    <th class="py-3 font-medium">Cron Rule</th>
                    <th class="py-3 font-medium">Last Run Time</th>
                    <th class="py-3 font-medium">Creator</th>
                    <th class="py-3 font-medium text-center">Run Count</th>
                    <th class="py-3 font-medium text-center">Enabled</th>
                    <th class="py-3 font-medium text-right w-48">Operations</th>
                </tr>
            </thead>
            <tbody class="text-sm text-gray-700">
                <tr v-if="tasks.length === 0" class="border-b border-gray-50">
                    <td colspan="9" class="py-12 text-center text-gray-400">
                        <div class="flex flex-col items-center">
                            <span class="mb-2">No periodic tasks found</span>
                            <button class="text-blue-600 hover:underline text-xs" @click="openCreate">Create one</button>
                        </div>
                    </td>
                </tr>
                <tr v-for="task in tasks" :key="task.id" class="border-b border-gray-50 hover:bg-gra-50 transition-colors">
                     <td class="py-3 text-gray-500">#{{ task.id }}</td>
                     <td class="py-3 font-medium text-gray-800">{{ task.name }}</td>
                     <td class="py-3 text-blue-600 cursor-pointer hover:underline" @click="goToWorkflow(task.workflow)">
                         {{ task.workflow_name || 'Unknown' }}
                     </td>
                     <td class="py-3 font-mono text-xs bg-gray-50 px-2 py-1 rounded w-max">
                         {{ task.cron_expression }}
                     </td>
                     <td class="py-3 text-gray-500">{{ formatDate(task.last_run_at) }}</td>
                     <td class="py-3 text-gray-500">{{ task.creator_username || '-' }}</td>
                     <td class="py-3 text-center">{{ task.total_run_count }}</td>
                     <td class="py-3 text-center">
                        <button 
                            @click="toggleTask(task)"
                            :class="task.enabled ? 'bg-blue-600' : 'bg-gray-200'"
                            class="relative inline-flex flex-shrink-0 h-5 w-9 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none"
                        >
                            <span 
                                :class="task.enabled ? 'translate-x-4' : 'translate-x-0'"
                                class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                            ></span>
                        </button>
                     </td>
                     <td class="py-3 text-right space-x-3">
                         <button class="text-blue-600 hover:text-blue-800 text-xs font-medium" @click="viewHistory(task.id)">History</button>
                         <button class="text-blue-600 hover:text-blue-800 text-xs font-medium" @click="handleEdit(task)">Edit</button>
                         <button class="text-red-500 hover:text-red-700 text-xs font-medium" @click="deleteTask(task.id)">Delete</button>
                     </td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <!-- Config Drawer -->
    <!-- Config Drawer Removed -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const tasks = ref<any[]>([])

const fetchTasks = async () => {
    try {
        const response = await axios.get('/api/tasks/periodic/')
        tasks.value = response.data.results || response.data
    } catch (e) {
        console.error("Failed to fetch periodic tasks", e)
    }
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString()
}

const goToWorkflow = (id: number) => {
    router.push(`/workflows/${id}`)
}

const toggleTask = async (task: any) => {
    try {
        const response = await axios.post(`/api/tasks/periodic/${task.id}/toggle/`)
        task.enabled = response.data.enabled
    } catch (e) {
        console.error("Failed to toggle task", e)
        alert("Failed to toggle task status")
    }
}

const deleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this periodic task? This cannot be undone.")) return
    try {
        await axios.delete(`/api/tasks/periodic/${id}/`)
        fetchTasks()
    } catch (e) {
        console.error("Failed to delete task", e)
        alert("Failed to delete task")
    }
}

const viewHistory = (id: number) => {
    router.push({ name: 'tasks', query: { periodic_task_id: id } })
}

// Drawer Controls
const openCreate = () => {
    router.push({ path: '/tasks/create', query: { type: 'periodic' } })
}

const handleEdit = (task: any) => {
    router.push({
        name: 'task-periodic-edit',
        params: { id: task.id }
    })
}

// Drawer Controls

onMounted(() => {
    fetchTasks()
})
</script>
