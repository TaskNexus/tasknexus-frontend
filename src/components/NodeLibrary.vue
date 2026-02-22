<template>
  <div class="flex h-full border-r border-gray-200">
    <!-- Categories (Left Column) -->
    <div class="w-12 flex flex-col items-center py-4 bg-gray-50 border-r border-gray-100 space-y-4">
        <button 
            v-for="cat in categories" 
            :key="cat.name"
            class="p-2 rounded-md transition-colors relative group"
            :class="selectedCategory === cat.name ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-white hover:text-gray-600'"
            @click="selectedCategory = cat.name"
            :title="cat.name"
        >
            <component :is="cat.icon" class="w-5 h-5" />
            
            <!-- Tooltip -->
            <div class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                {{ cat.name }}
            </div>
        </button>
    </div>

    <!-- Items (Right Column) -->
    <div class="w-48 bg-white flex flex-col h-full">
        <div class="p-3 border-b border-gray-100 bg-gray-50/50">
           <h3 class="font-medium text-sm text-gray-700">{{ selectedCategory }}</h3>
        </div>
        
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
            <div v-if="loading" class="text-xs text-center text-gray-400 py-4">Loading components...</div>
            
            <div 
                v-else
                v-for="item in currentItems" 
                :key="item.type + (item.componentCode || '')"
                class="flex items-center p-2 border border-gray-100 rounded bg-white hover:bg-blue-50 hover:border-blue-200 cursor-move transition-all select-none shadow-sm"
                @mousedown="handleMouseDown($event, item)"
            >
                <component :is="item.icon || LucideIcons.Box" class="w-4 h-4 mr-2 text-gray-500" />
                <div class="flex-1 min-w-0">
                     <div class="text-xs font-medium text-gray-700 truncate" :title="item.label">{{ item.label }}</div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as LucideIcons from 'lucide-vue-next'
import axios from 'axios'

const props = defineProps<{
    onStartDrag: (node: any, e: MouseEvent) => void
    readOnly?: boolean
}>()

const loading = ref(false)
const remoteComponents = ref<any[]>([])
const selectedCategory = ref('Standard')

// Category Meta
const categories = computed(() => {
    // Standard always exists
    const cats = [
        { name: 'Standard', icon: LucideIcons['Layers'] },
        { name: 'Gateways', icon: LucideIcons['GitBranch'] },
    ]
    
    // Add remote categories unique
    const comps = Array.isArray(remoteComponents.value) ? remoteComponents.value : []
    const remoteCats = new Set(comps.map(c => c.category))
    remoteCats.forEach(cat => {
        // Avoid duplicate Standard if backend sends it
        if (cat == "Uncategorized") {
            return
        }
        if (cat !== 'Standard') {
             let catIcon = LucideIcons['Cpu']
             if (cat === 'AI') catIcon = LucideIcons['Sparkles']
             cats.push({ name: cat, icon: catIcon })
        }
    })
    
    return cats
})

const standardItems = [
    { type: 'subprocess', label: 'Sub Process', icon: LucideIcons['Layers'] },
]

const gatewayItems = [
    { type: 'branch', label: 'Branch Gateway', icon: LucideIcons['GitBranch'] },
    { type: 'parallel', label: 'Parallel Gateway', icon: LucideIcons['Split'] },
    { type: 'converge', label: 'Converge Gateway', icon: LucideIcons['Combine'] },
    { type: 'conditional', label: 'Conditional Parallel', icon: LucideIcons['GitMerge'] },
]

const currentItems = computed(() => {
    let items: any[] = []
    
    if (selectedCategory.value === 'Standard') {
        items = [...standardItems]
    } else if (selectedCategory.value === 'Gateways') {
        return gatewayItems
    }
    
    // Filter and append remote components for the selected category
    const remotes = remoteComponents.value
        .filter(c => c.category === selectedCategory.value)
        .map(c => {
            let iconName = c.icon
            let iconComponent = LucideIcons['Box']

            if (iconName && (LucideIcons as any)[iconName]) {
                iconComponent = (LucideIcons as any)[iconName]
            }

            return {
                type: 'custom', // X6 type
                label: c.name,
                icon: iconComponent,
                iconName: iconName,
                componentCode: c.code,
                version: c.version,
                inputs: c.inputs,
                outputs: c.outputs
            }
        })
        
    return [...items, ...remotes]
})


const fetchComponents = async () => {
    loading.value = true
    try {
        const resp = await axios.get('/api/components/')
        const data = resp.data
        console.log("Fetched Components:", data) // DEBUG
        if (Array.isArray(data)) {
            remoteComponents.value = data
        } else if (data && Array.isArray(data.results)) {
            remoteComponents.value = data.results
        } else {
             console.warn("Unexpected API response format", data)
             remoteComponents.value = []
        }
    } catch(e) {
        console.error("Failed to fetch components", e)
    } finally {
        loading.value = false
    }
}

const handleMouseDown = (e: MouseEvent, node: any) => {
    if (props.readOnly) return
    props.onStartDrag(node, e)
}

onMounted(() => {
    fetchComponents()
})
</script>
