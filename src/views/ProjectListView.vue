<template>
  <div class="h-full bg-gray-50 flex flex-col">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Projects</h1>
        <p class="text-sm text-gray-500 mt-1">Manage your automation projects and resources</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
      >
        <Plus class="w-5 h-5 mr-2" />
        New Project
      </button>
    </div>

    <!-- Project Grid -->
    <div class="flex-1 overflow-auto p-8">
      <div v-if="loading" class="flex justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-blue-600" />
      </div>

      <div v-else-if="projects.length === 0" class="text-center py-12">
        <FolderOpen class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900">No projects found</h3>
        <p class="text-gray-500 mt-2">Get started by creating your first project.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          v-for="project in projects" 
          :key="project.id"
          class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all cursor-pointer group flex flex-col relative"
          @click="navigateToProject(project.id)"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderKanban class="w-6 h-6" />
            </div>
            <!-- More Options Dropdown -->
            <div class="relative">
               <button 
                 @click.stop="toggleMenu(project.id)" 
                 class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
               >
                 <MoreHorizontal class="w-5 h-5 text-gray-400 hover:text-gray-600" />
               </button>
               <!-- Dropdown Menu -->
               <div 
                 v-if="activeMenuId === project.id" 
                 class="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10"
               >
                 <button 
                   @click.stop="editProject(project)" 
                   class="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center"
                 >
                   <Pencil class="w-4 h-4 mr-2" />
                   编辑
                 </button>

                 <button 
                   @click.stop="deleteProject(project.id)" 
                   class="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center"
                 >
                   <Trash2 class="w-4 h-4 mr-2" />
                   删除
                 </button>
               </div>
            </div>
          </div>
          
          <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{{ project.name }}</h3>
          <p class="text-sm text-gray-500 mb-4 line-clamp-2 h-10">{{ project.description || 'No description provided.' }}</p>
          
          <div class="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>{{ formatDate(project.updated_at) }}</span>
            <div class="flex items-center">
               <User class="w-3 h-3 mr-1" />
               {{ project.created_by_username || 'Admin' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-800">Create Project</h2>
          <button @click="showCreateModal = false" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <form @submit.prevent="createProject">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input 
              v-model="newProject.name"
              type="text" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g., Backend Services"
            />
          </div>
          
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              v-model="newProject.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="Briefly describe the project..."
            ></textarea>
          </div>
          
          <div class="flex justify-end gap-3">
            <button 
              type="button" 
              @click="showCreateModal = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="saving"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
            >
              <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
    

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Plus, 
  FolderKanban, 
  MoreHorizontal, 
  User, 
  Loader2,
  FolderOpen,
  X,
  Pencil,
  Trash2,
  Users
} from 'lucide-vue-next'
import axios from 'axios'


const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const showCreateModal = ref(false)
const projects = ref<any[]>([])
const activeMenuId = ref<number | null>(null)

const newProject = ref({
  name: '',
  description: ''
})

const fetchProjects = async () => {
  loading.value = true
  try {
    // Replace with actual API call
    const response = await axios.get('/api/projects/')
    projects.value = response.data
    
    // Mock data fallback if empty (for demonstration)
    // Removed to avoid confusion with real empty state
    // if (projects.value.length === 0) { ... }
  } catch (error) {
    console.error('Failed to fetch projects:', error)
  } finally {
    loading.value = false
  }
}

const createProject = async () => {
    if (!newProject.value.name) return
    
    saving.value = true
    try {
        await axios.post('/api/projects/', newProject.value)
        showCreateModal.value = false
        newProject.value = { name: '', description: '' }
        await fetchProjects()
    } catch (error) {
        console.error('Failed to create project:', error)
    } finally {
        saving.value = false
    }
}

const navigateToProject = (id: number) => {
    router.push(`/workflows?project_id=${id}`)
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
}

const toggleMenu = (id: number) => {
    if (activeMenuId.value === id) {
        activeMenuId.value = null
    } else {
        activeMenuId.value = id
    }
}

const editProject = (project: any) => {
    activeMenuId.value = null
    router.push({ name: 'project-settings', params: { id: project.id } })
}

const deleteProject = async (id: number) => {
    activeMenuId.value = null
    if (!confirm('确定要删除这个项目吗？此操作不可撤销。')) {
        return
    }
    try {
        await axios.delete(`/api/projects/${id}/`)
        projects.value = projects.value.filter(p => p.id !== id)
    } catch (e) {
        console.error('Failed to delete project:', e)
        alert('删除失败，请重试')
    }
}

// Close menu when clicking outside
const closeMenuOnClickOutside = (e: MouseEvent) => {
    if (activeMenuId.value !== null) {
        activeMenuId.value = null
    }
}

// Members Management


onMounted(() => {
  fetchProjects()
  document.addEventListener('click', closeMenuOnClickOutside)
})
</script>
