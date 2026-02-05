<template>
  <div class="space-y-8">
    
    <!-- Section: Recent Workflows (Use Updated At) -->
    <section>
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-800">{{ $t('home.recentWorkflows') }}</h3>
             <a @click="goWorkflows" class="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">{{ $t('home.allWorkflows') }}</a>
        </div>
        <div v-if="dashboardData.workflows.length === 0" class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[120px] flex items-center justify-center text-gray-400 text-sm border-dashed">
            No workflows found.
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div 
                v-for="wf in dashboardData.workflows" 
                :key="wf.id" 
                class="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
                @click="goWorkflowDetail(wf.id)"
             >
                <div class="flex justify-between items-start mb-3">
                    <div class="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
                         <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                </div>
                <h4 class="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors truncate">{{ wf.name }}</h4>
                <p class="text-xs text-gray-500 mt-1 truncate">{{ wf.description || 'No description' }}</p>
                <div class="mt-4 flex items-center text-xs text-gray-400">
                    <span>Updated: {{ formatDate(wf.updated_at) }}</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Section: Recent Projects -->
    <section>
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-800">{{ $t('home.recentProjects') }}</h3>
            <a @click="goProjects" class="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">{{ $t('home.allProjects') }}</a>
        </div>
        <div v-if="dashboardData.projects.length === 0" class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[120px] flex items-center justify-center text-gray-400 text-sm border-dashed">
            No projects found.
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
                v-for="proj in dashboardData.projects" 
                :key="proj.id"
                class="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
                @click="goProjects" 
            >
                <div class="flex justify-between items-start mb-3">
                    <div class="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                        <Folder class="w-5 h-5" />
                    </div>
                </div>
                <h4 class="font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate">{{ proj.name }}</h4>
                <p class="text-xs text-gray-500 mt-1">ID: {{ proj.id }}</p>
                <div class="mt-4 flex items-center text-xs text-gray-400">
                     <span>{{ formatDate(proj.created_at) }}</span>
                </div>
            </div>
             <!-- Create New Project Shortcut -->
             <div class="border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center text-gray-300 p-5 min-h-[140px] cursor-pointer hover:border-blue-200 hover:text-blue-400 transition-colors" @click="goProjects">
                <div class="flex flex-col items-center">
                    <Plus class="w-6 h-6 mb-2" />
                    <span class="text-xs">New Project</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Section: My Tasks (Dynamic) -->
    <section>
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-800">{{ $t('home.recentTasks') }}</h3>
            <a @click="goTasks" class="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">{{ $t('home.allTasks') }}</a>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
                        <tr>
                            <th class="px-6 py-4 font-semibold">ID</th>
                            <th class="px-6 py-4 font-semibold">Task Name</th>
                            <th class="px-6 py-4 font-semibold">Workflow</th>
                            <th class="px-6 py-4 font-semibold">Status</th>
                            <th class="px-6 py-4 font-semibold whitespace-nowrap">Start Time</th>
                            <th class="px-6 py-4 font-semibold whitespace-nowrap">End Time</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        <tr v-if="dashboardData.tasks.length === 0">
                             <td colspan="6" class="px-6 py-8 text-center text-gray-400">No recent tasks</td>
                        </tr>
                        <tr v-for="task in dashboardData.tasks" :key="task.id" class="hover:bg-gray-50/50 transition-colors">
                            <td class="px-6 py-4 text-gray-500">#{{ task.id }}</td>
                            <td class="px-6 py-4">
                                <a @click="goTaskDetail(task.id)" class="text-blue-600 hover:underline font-medium cursor-pointer">{{ task.name }}</a>
                            </td>
                            <td class="px-6 py-4 text-gray-700">{{ task.workflow_name || '-' }}</td>
                            <td class="px-6 py-4">
                                <span 
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    :class="getStatusColor(task.status)"
                                >
                                    <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="getStatusDot(task.status)"></span>
                                    {{ task.status }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{{ formatDate(task.started_at) }}</td>
                            <td class="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{{ formatDate(task.finished_at) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Folder, Plus } from 'lucide-vue-next'
import axios from 'axios'

const router = useRouter()

const dashboardData = ref({
    projects: [] as any[],
    tasks: [] as any[],
    workflows: [] as any[],
    stats: {}
})

const fetchData = async () => {
    try {
        const response = await axios.get('/api/projects/dashboard/')
        dashboardData.value = response.data
    } catch (e) {
        console.error("Failed to fetch dashboard data", e)
    }
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'FINISHED': return 'bg-green-50 text-green-700'
        case 'RUNNING': return 'bg-blue-50 text-blue-700'
        case 'REVOKED': return 'bg-yellow-50 text-yellow-700'
        case 'FAILED': return 'bg-red-50 text-red-700'
        default: return 'bg-gray-50 text-gray-700'
    }
}

const getStatusDot = (status: string) => {
    switch (status) {
        case 'FINISHED': return 'bg-green-500'
        case 'RUNNING': return 'bg-blue-500'
        case 'REVOKED': return 'bg-yellow-500'
        case 'FAILED': return 'bg-red-500'
        default: return 'bg-gray-400'
    }
}

const goProjects = () => router.push('/projects')
const goWorkflows = () => router.push('/workflows')
const goTasks = () => router.push('/tasks')
const goTaskDetail = (id: number) => router.push(`/tasks/${id}`)
const goWorkflowDetail = (id: number) => router.push(`/workflows/${id}`)

onMounted(() => {
    fetchData()
})
</script>
