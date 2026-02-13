<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <div>
          <h1 class="text-xl font-semibold text-gray-800">Platform Members</h1>
          <p class="text-sm text-gray-500">Manage platform users and their roles.</p>
      </div>
    </div>

    <!-- Toolbar / Search -->
    <div class="p-4 border-b border-gray-100 flex items-center bg-gray-50">
       <input 
          v-model="searchQuery"
          @input="fetchUsers"
          type="text" 
          placeholder="Search by username or email..." 
          class="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-blue-500 focus:border-blue-500 text-sm"
       />
    </div>

    <!-- Table -->
    <div class="flex-1 overflow-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase mr-3">
                  {{ user.username.substring(0, 2) }}
                </div>
                <div class="text-sm font-medium text-gray-900">{{ user.username }}</div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ user.email || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                :class="{
                  'bg-purple-100 text-purple-800': user.role === 'OWNER',
                  'bg-blue-100 text-blue-800': user.role === 'ADMIN',
                  'bg-gray-100 text-gray-800': user.role === 'MEMBER'
                }"
              >
                {{ user.role }}
              </span>
            </td>
             <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ new Date(user.date_joined).toLocaleDateString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button 
                v-if="canManage(user)"
                @click="openEdit(user)"
                class="text-blue-600 hover:text-blue-900 mr-3"
              >
                Edit
              </button>
              <button 
                v-if="canDelete(user)"
                @click="deleteUser(user)"
                class="text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Edit Modal -->
    <div v-if="editingUser" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="bg-white rounded-lg p-6 w-96">
            <h3 class="text-lg font-medium mb-4">Edit Role for {{ editingUser.username }}</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Role</label>
                    <select v-model="editFormRole" class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border">
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                        <option value="OWNER" disabled>Owner (Cannot assign)</option>
                    </select>
                </div>
            </div>
            <div class="mt-6 flex justify-end space-x-3">
                <button @click="editingUser = null" class="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50">Cancel</button>
                <button @click="saveRole" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const users = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const authStore = useAuthStore()

const editingUser = ref<any>(null)
const editFormRole = ref('MEMBER')

const fetchUsers = async () => {
    loading.value = true
    try {
        const params: any = {}
        if (searchQuery.value) params.username = searchQuery.value
        const response = await axios.get('/api/auth/users/', { params })
        users.value = response.data.results || response.data
    } catch (e) {
        console.error("Failed to fetch users", e)
    } finally {
        loading.value = false
    }
}

const canManage = (targetUser: any) => {
    const currentUser = authStore.user
    if (!currentUser) return false
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'OWNER') return false
    if (targetUser.role === 'OWNER') return false
    if (currentUser.role === 'ADMIN' && targetUser.role === 'ADMIN') return false
    return true
}

const canDelete = (targetUser: any) => {
    return canManage(targetUser) && targetUser.id !== authStore.user.id
}

const openEdit = (user: any) => {
    editingUser.value = user
    editFormRole.value = user.role
}

const saveRole = async () => {
    if (!editingUser.value) return
    try {
        const isStaff = editFormRole.value === 'ADMIN'
        await axios.patch(`/api/auth/users/${editingUser.value.id}/`, {
            is_staff: isStaff
        })
        editingUser.value = null
        fetchUsers()
    } catch (e) {
        alert('Failed to update role')
        console.error(e)
    }
}

const deleteUser = async (user: any) => {
    if (!confirm(`Are you sure you want to delete ${user.username}? This cannot be undone.`)) return
    try {
        await axios.delete(`/api/auth/users/${user.id}/`)
        fetchUsers()
    } catch (e) {
        alert('Failed to delete user')
    }
}

onMounted(() => {
    if (!authStore.user?.role) {
       authStore.fetchUser()
    }
    fetchUsers()
})
</script>
