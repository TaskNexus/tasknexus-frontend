<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">
          Webhook 任务
      </h1>
      <div class="flex items-center space-x-2">
         <button class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center" @click="openCreate">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            新建任务
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
                    <th class="py-3 font-medium">Webhook URL</th>
                    <th class="py-3 font-medium">最后运行</th>
                    <th class="py-3 font-medium text-center">运行次数</th>
                    <th class="py-3 font-medium text-center">启用</th>
                    <th class="py-3 font-medium text-right w-56">操作</th>
                </tr>
            </thead>
            <tbody class="text-sm text-gray-700">
                <tr v-if="tasks.length === 0" class="border-b border-gray-50">
                    <td colspan="8" class="py-12 text-center text-gray-400">
                        <div class="flex flex-col items-center">
                            <span class="mb-2">未找到 Webhook 任务</span>
                            <button class="text-blue-600 hover:underline text-xs" @click="openCreate">新建任务</button>
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
                         <div class="flex items-center space-x-2">
                             <code class="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-xs">{{ task.webhook_url }}</code>
                             <button 
                                 @click="copyUrl(task.webhook_url)"
                                 class="text-gray-400 hover:text-blue-600 transition-colors"
                                 title="Copy URL"
                             >
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                 </svg>
                             </button>
                         </div>
                     </td>
                     <td class="py-3 text-gray-500">{{ formatDate(task.last_run_at) }}</td>
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
                         <button class="text-blue-600 hover:text-blue-800 text-xs font-medium" @click="viewHistory(task.id)">历史</button>
                         <button class="text-orange-500 hover:text-orange-700 text-xs font-medium" @click="regenerateToken(task)">刷新 Token</button>
                         <button class="text-blue-600 hover:text-blue-800 text-xs font-medium" @click="handleEdit(task)">编辑</button>
                         <button class="text-red-500 hover:text-red-700 text-xs font-medium" @click="deleteTask(task.id)">删除</button>
                     </td>
                </tr>
            </tbody>
        </table>
    </div>
    <ListPagination
      :total="totalCount"
      :currentPage="currentPage"
      :pageSize="pageSize"
      @update:currentPage="handlePageChange"
      @update:pageSize="handlePageSizeChange"
    />
    
    <!-- Toast Notification -->
    <div v-if="showToast" class="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg text-sm">
        {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import ListPagination from '../components/ListPagination.vue'

const router = useRouter()
const route = useRoute()
const parsePageParam = (value: unknown, fallback: number) => {
    const raw = Array.isArray(value) ? value[0] : value
    const parsed = Number(raw)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}
const tasks = ref<any[]>([])
const showToast = ref(false)
const toastMessage = ref('')
const currentPage = ref(parsePageParam(route.query.page, 1))
const pageSize = ref(parsePageParam(route.query.page_size, 20))
const totalCount = ref(0)

const syncPaginationQuery = () => {
    router.replace({
        query: {
            ...route.query,
            page: String(currentPage.value),
            page_size: String(pageSize.value)
        }
    })
}

const fetchTasks = async () => {
    try {
        const response = await axios.get('/api/tasks/webhook/', {
            params: {
                page: currentPage.value,
                page_size: pageSize.value
            }
        })
        if (Array.isArray(response.data)) {
            tasks.value = response.data
            totalCount.value = response.data.length
        } else {
            tasks.value = response.data.results || []
            totalCount.value = response.data.count ?? tasks.value.length
        }
    } catch (e) {
        console.error("Failed to fetch webhook tasks", e)
    }
}

const adjustPageAfterMutation = (deletedCount: number) => {
    const nextTotal = Math.max(0, totalCount.value - deletedCount)
    const maxPage = Math.max(1, Math.ceil(nextTotal / pageSize.value))
    if (currentPage.value > maxPage) {
        currentPage.value = maxPage
        syncPaginationQuery()
    }
}

const handlePageChange = (page: number) => {
    currentPage.value = page
    syncPaginationQuery()
    fetchTasks()
}

const handlePageSizeChange = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    syncPaginationQuery()
    fetchTasks()
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
        const response = await axios.post(`/api/tasks/webhook/${task.id}/toggle/`)
        task.enabled = response.data.enabled
    } catch (e) {
        console.error("Failed to toggle task", e)
        alert("Failed to toggle task status")
    }
}

const regenerateToken = async (task: any) => {
    if (!confirm("Regenerating the token will invalidate the current webhook URL. Continue?")) return
    try {
        const response = await axios.post(`/api/tasks/webhook/${task.id}/regenerate_token/`)
        // Update the task in the list
        const index = tasks.value.findIndex(t => t.id === task.id)
        if (index !== -1) {
            tasks.value[index] = response.data
        }
        showNotification("Token regenerated successfully")
    } catch (e) {
        console.error("Failed to regenerate token", e)
        alert("Failed to regenerate token")
    }
}

const copyUrl = async (url: string) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url)
        } else {
            // Fallback for non-HTTPS contexts (e.g. LAN HTTP)
            const textArea = document.createElement('textarea')
            textArea.value = url
            textArea.style.position = 'fixed'
            textArea.style.left = '-9999px'
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
        }
        showNotification("URL copied to clipboard")
    } catch (e) {
        console.error("Failed to copy URL", e)
        prompt("复制 Webhook URL:", url)
    }
}

const showNotification = (message: string) => {
    toastMessage.value = message
    showToast.value = true
    setTimeout(() => {
        showToast.value = false
    }, 2000)
}

const deleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this webhook task? This cannot be undone.")) return
    try {
        await axios.delete(`/api/tasks/webhook/${id}/`)
        adjustPageAfterMutation(1)
        fetchTasks()
    } catch (e) {
        console.error("Failed to delete task", e)
        alert("Failed to delete task")
    }
}

const viewHistory = (id: number) => {
    router.push({ name: 'tasks', query: { webhook_task_id: id } })
}

const openCreate = () => {
    router.push({ path: '/tasks/create', query: { type: 'webhook' } })
}

const handleEdit = (task: any) => {
    router.push({
        name: 'task-webhook-edit',
        params: { id: task.id }
    })
}

onMounted(() => {
    syncPaginationQuery()
    fetchTasks()
})
</script>
