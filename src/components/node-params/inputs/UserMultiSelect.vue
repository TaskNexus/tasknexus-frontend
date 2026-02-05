<template>
    <div class="space-y-2">
        <div v-if="loading" class="text-xs text-gray-400">Loading project members...</div>
        <div v-else-if="members.length === 0" class="text-xs text-gray-400">No project members found</div>
        <div v-else class="space-y-1 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
            <label 
                v-for="member in members" 
                :key="member.user"
                class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
                <input 
                    type="checkbox" 
                    :value="member.user"
                    :checked="(modelValue || []).includes(member.user)"
                    @change="toggleSelection(member.user, $event)"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                />
                <span class="text-sm text-gray-700">{{ member.username }}</span>
                <span class="text-xs text-gray-400">({{ member.role }})</span>
            </label>
        </div>
        <div v-if="(modelValue || []).length > 0" class="text-xs text-gray-500">
            Selected: {{ (modelValue || []).length }} user(s)
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'

interface ProjectMember {
    user: number
    username: string
    role: string
}

const props = defineProps<{
    modelValue: number[]
    projectId?: number | string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: number[]]
}>()

const members = ref<ProjectMember[]>([])
const loading = ref(false)

const toggleSelection = (userId: number, event: Event) => {
    const checked = (event.target as HTMLInputElement).checked
    const currentList = props.modelValue || []
    
    let newList: number[]
    if (checked) {
        newList = currentList.includes(userId) ? currentList : [...currentList, userId]
    } else {
        newList = currentList.filter((id: number) => id !== userId)
    }
    
    emit('update:modelValue', newList)
}

const fetchMembers = async () => {
    if (!props.projectId) {
        members.value = []
        return
    }
    loading.value = true
    try {
        const resp = await axios.get(`/api/projects/members/?project_id=${props.projectId}`)
        const data = resp.data.results || resp.data || []
        members.value = data.map((m: any) => ({
            user: m.user,
            username: m.username,
            role: m.role
        }))
    } catch (e) {
        console.error("Failed to fetch project members", e)
        members.value = []
    } finally {
        loading.value = false
    }
}

watch(() => props.projectId, (newId) => {
    if (newId) {
        fetchMembers()
    }
}, { immediate: true })

onMounted(() => {
    if (props.projectId) {
        fetchMembers()
    }
})
</script>
