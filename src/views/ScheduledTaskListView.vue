<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">
          计划任务
      </h1>
      <div class="flex items-center space-x-2">
         <button class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center" @click="openCreate">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            新建计划任务
         </button>
      </div>
    </div>
    
    <!-- Data Table -->
    <div class="flex-1 overflow-auto px-6 py-6">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b border-gray-100 text-xs text-gray-500">
                    <th class="py-3 font-medium w-16">ID</th>
                    <th class="py-3 font-medium">任务名称</th>
                    <th class="py-3 font-medium">工作流</th>
                    <th class="py-3 font-medium">状态</th>
                    <th class="py-3 font-medium">执行时间</th>
                    <th class="py-3 font-medium">创建者</th>
                    <th class="py-3 font-medium">创建时间</th>
                    <th class="py-3 font-medium text-right w-48">操作</th>
                </tr>
            </thead>
            <tbody class="text-sm text-gray-700">
                <tr v-if="tasks.length === 0" class="border-b border-gray-50">
                    <td colspan="8" class="py-12 text-center text-gray-400">
                        <div class="flex flex-col items-center">
                            <span class="mb-2">暂无计划任务</span>
                            <button class="text-blue-600 hover:underline text-xs" @click="openCreate">创建计划任务</button>
                        </div>
                    </td>
                </tr>
                <tr v-for="task in tasks" :key="task.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                     <td class="py-3 text-gray-500">#{{ task.id }}</td>
                     <td class="py-3 font-medium text-gray-800">{{ task.name }}</td>
                     <td class="py-3 text-blue-600 cursor-pointer hover:underline" @click="goToWorkflow(task.workflow)">
                         {{ task.workflow_name || 'Unknown' }}
                     </td>
                     <td class="py-3">
                         <span :class="getStatusBadgeClass(task.status)" class="px-2 py-0.5 rounded text-xs font-medium">
                             {{ task.status }}
                         </span>
                     </td>
                     <td class="py-3 font-mono text-xs">
                         {{ formatDate(task.execution_time) }}
                     </td>
                     <td class="py-3 text-gray-500">{{ task.creator_username || '-' }}</td>
                     <td class="py-3 text-gray-500">{{ formatDate(task.created_at) }}</td>
                     <td class="py-3 text-right space-x-3">
                         <button v-if="task.status === 'EXECUTED'" class="text-blue-600 hover:text-blue-800 text-xs font-medium" @click="viewHistory(task.id)">历史</button>
                         <button v-if="task.status === 'PENDING'" class="text-blue-600 hover:text-blue-800 text-xs font-medium" @click="handleEdit(task)">编辑</button>
                         <button class="text-red-500 hover:text-red-700 text-xs font-medium" @click="deleteTask(task.id)">删除</button>
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
        const response = await axios.get('/api/tasks/scheduled/')
        tasks.value = response.data.results || response.data
    } catch (e) {
        console.error("Failed to fetch scheduled tasks", e)
    }
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString()
}

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'PENDING': return 'bg-yellow-100 text-yellow-700'
        case 'EXECUTED': return 'bg-green-100 text-green-700'
        case 'FAILED': return 'bg-red-100 text-red-700'
        default: return 'bg-gray-100'
    }
}

const goToWorkflow = (id: number) => {
    router.push(`/workflows/${id}`)
}

const deleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this scheduled task?")) return
    try {
        await axios.delete(`/api/tasks/scheduled/${id}/`)
        fetchTasks()
    } catch (e) {
        console.error("Failed to delete task", e)
        alert("Failed to delete task")
    }
}

const viewHistory = (id: number) => {
    router.push({ name: 'tasks', query: { scheduled_task_id: id } })
}

// Drawer Controls
const openCreate = () => {
    router.push({ path: '/tasks/create', query: { type: 'scheduled' } })
}

const handleEdit = (task: any) => {
    router.push({
        name: 'task-scheduled-edit',
        params: { id: task.id }
    })
}

onMounted(() => {
    fetchTasks()
})
</script>
