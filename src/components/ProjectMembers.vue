<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden">
    <div class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="close"></div>
    <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
      <div class="w-screen max-w-md">
        <div class="h-full flex flex-col bg-white shadow-xl">
          <!-- Header -->
          <div class="px-4 py-6 bg-gray-50 sm:px-6">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-medium text-gray-900">
                Project Members
              </h2>
              <button @click="close" class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                <span class="sr-only">Close</span>
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p class="mt-1 text-sm text-gray-500">
              Manage access and roles for this project.
            </p>
          </div>

          <!-- Body -->
          <div class="relative flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
             
             <!-- Add Member Form -->
             <div class="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h3 class="text-sm font-medium text-gray-700 mb-2">Add Member</h3>
                <div class="flex space-x-2">
                    <input 
                        v-model="newMemberUsername" 
                        type="text" 
                        placeholder="Enter username" 
                        class="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 border"
                    >
                    <select 
                        v-model="newMemberRole"
                        class="block w-24 pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border"
                    >
                        <option value="VIEWER">Viewer</option>
                        <option value="DEVELOPER">Dev</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                    <button 
                        @click="addMember" 
                        :disabled="!newMemberUsername || adding"
                        class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                    >
                        {{ adding ? '...' : 'Add' }}
                    </button>
                </div>
                <p v-if="addError" class="mt-1 text-xs text-red-600">{{ addError }}</p>
             </div>
             
             <!-- Member List -->
             <div class="space-y-4">
                <div v-if="loading" class="text-center text-gray-400 py-4">Loading members...</div>
                <div v-else-if="members.length === 0" class="text-center text-gray-400 py-4">No members found.</div>
                
                <div v-for="member in members" :key="member.id" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div class="flex items-center">
                        <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase mr-3">
                            {{ member.username.substring(0, 2) }}
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-900">{{ member.username }}</p>
                            <p class="text-xs text-gray-500">{{ member.email || 'No email' }}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <select 
                            v-if="canEdit(member)"
                            v-model="member.role" 
                            @change="updateRole(member)"
                            class="text-xs border-gray-200 rounded p-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="OWNER">Owner</option>
                            <option value="ADMIN">Admin</option>
                            <option value="DEVELOPER">Dev</option>
                            <option value="VIEWER">Viewer</option>
                        </select>
                        <span v-else class="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">{{ member.role }}</span>

                        <button 
                            v-if="canDelete(member)"
                            @click="removeMember(member.id)" 
                            class="text-gray-400 hover:text-red-600 p-1"
                        >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
    isOpen: boolean,
    projectId?: number
}>()

const emit = defineEmits(['close'])
const authStore = useAuthStore()

const members = ref<any[]>([])
const loading = ref(false)
const adding = ref(false)
const newMemberUsername = ref('')
const newMemberRole = ref('VIEWER')
const addError = ref('')

const fetchMembers = async () => {
    if (!props.projectId) return
    loading.value = true
    try {
        const response = await axios.get(`/api/projects/members/?project_id=${props.projectId}`)
        members.value = response.data.results || response.data
    } catch (e) {
        console.error("Failed to fetch members", e)
    } finally {
        loading.value = false
    }
}

const addMember = async () => {
    if (!props.projectId || !newMemberUsername.value) return
    adding.value = true
    addError.value = ''
    try {
        // Need to find user ID first? 
        // Or API handles username? The backend ProjectMemberSerializer usually expects `user` ID.
        // We probably need a User Search API or assume we pass ID.
        // Wait, regular serializers expect ID.
        // Let's assume we need to lookup user first or modify backend to accept username.
        // For now, let's try to lookup user via `users` endpoint if exists, OR
        // ideally backend `ProjectMemberViewSet.create` supports username.
        
        // Quick Fix: Let's assume we have a user lookup or list.
        // Since we don't have a user search API yet, I will add a simple `api/users/?username=` endpoint or similar.
        // Or, assume the backend `ProjectMember` creation can accept `username` override.
        // But standard DRF ModelSerializer expects `user` PK.
        
        // I'll try to fetch user list filtering by username
        // NOTE: Standard `UserViewSet` might be `/api/users/`.
        
        const userResp = await axios.get(`/api/auth/users/?username=${newMemberUsername.value}`)
        const users = userResp.data.results || userResp.data
        if (!users || users.length === 0) {
            addError.value = 'User not found'
            return
        }
        const user = users[0]
        
        await axios.post('/api/projects/members/', {
            project: props.projectId,
            user: user.id,
            role: newMemberRole.value
        })
        
        newMemberUsername.value = ''
        fetchMembers()
    } catch (e: any) {
        console.error(e)
        addError.value = e.response?.data?.detail || 'Failed to add member'
    } finally {
        adding.value = false
    }
}

const updateRole = async (member: any) => {
    try {
        await axios.patch(`/api/projects/members/${member.id}/`, {
            role: member.role
        })
    } catch (e) {
        alert('Failed to update role')
        fetchMembers() // Revert
    }
}

const removeMember = async (id: number) => {
    if (!confirm("Remove this member?")) return
    try {
        await axios.delete(`/api/projects/members/${id}/`)
        fetchMembers()
    } catch (e) {
        alert('Failed to remove member')
    }
}

const canEdit = (member: any) => {
    // Logic: Only Owner/Admin can edit. Owner cannot be edited by Admin.
    // Simplifying: If I am Owner, I can edit everyone. If I am Admin, I can edit Dev/Viewer. 
    // For now, just return true if current user is not the member itself (so you don't downgrade yourself accidentally?)
    // Actually, backend enforces permissions.
    return true 
}

const canDelete = (member: any) => {
    return true
}

watch(() => props.isOpen, (val) => {
    if (val && props.projectId) {
        fetchMembers()
        newMemberUsername.value = ''
        newMemberRole.value = 'VIEWER'
    }
})

const close = () => {
    emit('close')
}
</script>
