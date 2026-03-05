<template>
    <div class="space-y-2">
        <div v-if="loading" class="text-xs text-gray-400">Loading project members...</div>
        <div v-else-if="members.length === 0" class="text-xs text-gray-400">No project members found</div>
        <div v-else ref="dropdownRef" class="relative">
            <button
                type="button"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-left bg-white text-sm flex items-center justify-between gap-2 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @click="isOpen = !isOpen"
            >
                <span class="text-gray-700 truncate">{{ selectedSummary }}</span>
                <svg
                    class="w-4 h-4 text-gray-400 transition-transform"
                    :class="isOpen ? 'rotate-180' : ''"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.512a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                </svg>
            </button>

            <div
                v-if="isOpen"
                class="absolute z-20 mt-1 w-full border border-gray-200 rounded-md bg-white shadow-lg"
            >
                <div class="p-2 border-b border-gray-100">
                    <input
                        v-model="searchQuery"
                        type="text"
                        class="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Search users..."
                    />
                </div>
                <div class="max-h-48 overflow-y-auto p-1">
                    <button
                        v-for="member in filteredMembers"
                        :key="member.user"
                        type="button"
                        class="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-gray-50"
                        @click="toggleSelection(member.user)"
                    >
                        <input
                            type="checkbox"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                            :checked="(modelValue || []).includes(member.user)"
                            readonly
                        />
                        <span class="text-sm text-gray-700">{{ member.username }}</span>
                        <span class="text-xs text-gray-400">({{ member.role }})</span>
                    </button>
                    <p v-if="filteredMembers.length === 0" class="text-xs text-gray-400 px-2 py-2">
                        No matching users
                    </p>
                </div>
            </div>
        </div>
        <div v-if="(modelValue || []).length > 0" class="text-xs text-gray-500">
            Selected: {{ (modelValue || []).length }} user(s)
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
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
const isOpen = ref(false)
const searchQuery = ref('')
const dropdownRef = ref<HTMLElement | null>(null)

const filteredMembers = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return members.value
    return members.value.filter((member) =>
        member.username.toLowerCase().includes(query) || member.role.toLowerCase().includes(query)
    )
})

const selectedSummary = computed(() => {
    const selectedIds = props.modelValue || []
    if (selectedIds.length === 0) return 'Select users'
    const selectedNames = members.value
        .filter((member) => selectedIds.includes(member.user))
        .map((member) => member.username)
    if (selectedNames.length <= 2) return selectedNames.join(', ')
    return `${selectedNames.slice(0, 2).join(', ')} +${selectedNames.length - 2}`
})

const toggleSelection = (userId: number) => {
    const currentList = props.modelValue || []
    const newList = currentList.includes(userId)
        ? currentList.filter((id: number) => id !== userId)
        : [...currentList, userId]
    emit('update:modelValue', newList)
}

const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        isOpen.value = false
    }
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

        const validIds = new Set(members.value.map((m) => m.user))
        const selected = props.modelValue || []
        const cleaned = selected.filter((id) => validIds.has(id))
        if (cleaned.length !== selected.length) {
            emit('update:modelValue', cleaned)
        }
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
    } else {
        isOpen.value = false
        searchQuery.value = ''
    }
}, { immediate: true })

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})

watch(isOpen, (open) => {
    if (!open) {
        searchQuery.value = ''
    }
})
</script>
