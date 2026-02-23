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
            @contextmenu.prevent="openIconPicker(cat, $event)"
            :title="cat.name"
        >
            <component :is="resolveCatIcon(cat.icon)" class="w-5 h-5" />
            
            <!-- Tooltip -->
            <div class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                {{ cat.name }} <span class="text-gray-400 text-[10px]">(右键编辑图标)</span>
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
                <component :is="item.icon || LucideIcons.Component" class="w-4 h-4 mr-2 text-gray-500" />
                <div class="flex-1 min-w-0">
                     <div class="text-xs font-medium text-gray-700 truncate" :title="item.label">{{ item.label }}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Icon Picker Popover -->
    <div 
        v-if="iconPickerVisible"
        class="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 p-3"
        :style="{ left: iconPickerPos.x + 'px', top: iconPickerPos.y + 'px' }"
    >
        <div class="text-xs font-medium text-gray-500 mb-2">选择「{{ editingCategory?.name }}」的图标</div>
        <input 
            v-model="iconSearch" 
            type="text" 
            placeholder="搜索图标..." 
            class="w-full text-xs border border-gray-200 rounded px-2 py-1 mb-2 outline-none focus:border-blue-400"
            @input="iconPage = 0"
        />
        <div class="grid grid-cols-6 gap-1 w-56">
            <button
                v-for="name in pagedIconNames"
                :key="name"
                class="p-2 rounded hover:bg-blue-50 flex items-center justify-center transition-colors relative group/icon"
                :class="editingCategory?.icon === name ? 'bg-blue-100 ring-1 ring-blue-400' : ''"
                @click="selectIcon(name)"
            >
                <component :is="(LucideIcons as any)[name]" class="w-4 h-4 text-gray-600" />
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/icon:opacity-100 whitespace-nowrap z-[10000] pointer-events-none transition-opacity">
                    {{ name }}
                </div>
            </button>
        </div>
        <div class="flex items-center justify-between mt-2">
            <button 
                class="text-xs px-2 py-0.5 rounded border border-gray-200 disabled:opacity-30"
                :disabled="iconPage === 0"
                @click="iconPage--"
            >上一页</button>
            <span class="text-[10px] text-gray-400">{{ iconPage + 1 }} / {{ totalIconPages }}</span>
            <button 
                class="text-xs px-2 py-0.5 rounded border border-gray-200 disabled:opacity-30"
                :disabled="iconPage >= totalIconPages - 1"
                @click="iconPage++"
            >下一页</button>
        </div>
        <button 
            class="mt-1 w-full text-xs text-gray-400 hover:text-gray-600 text-center"
            @click="iconPickerVisible = false"
        >关闭</button>
    </div>

    <!-- Overlay to close picker -->
    <div 
        v-if="iconPickerVisible" 
        class="fixed inset-0 z-[9998]"
        @click="iconPickerVisible = false"
    />
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

// Category icon map from backend DB
const categoryIconMap = ref<Record<string, string>>({})

// Get all icon names from lucide-vue-next
// Filter: PascalCase keys only, exclude known utility exports
const UTIL_EXPORTS = ['default', 'createLucideIcon', 'icons', 'aliases']
const ALL_ICON_NAMES = Object.keys(LucideIcons)
    .filter(key => /^[A-Z]/.test(key) && !UTIL_EXPORTS.includes(key))
    .sort()

const ICONS_PER_PAGE = 60

// Icon picker state
const iconPickerVisible = ref(false)
const iconPickerPos = ref({ x: 0, y: 0 })
const editingCategory = ref<{ name: string, icon: string } | null>(null)
const iconSearch = ref('')
const iconPage = ref(0)

const filteredIconNames = computed(() => {
    const q = iconSearch.value.toLowerCase()
    if (!q) return ALL_ICON_NAMES
    return ALL_ICON_NAMES.filter(name => name.toLowerCase().includes(q))
})

const totalIconPages = computed(() => Math.max(1, Math.ceil(filteredIconNames.value.length / ICONS_PER_PAGE)))

const pagedIconNames = computed(() => {
    const start = iconPage.value * ICONS_PER_PAGE
    return filteredIconNames.value.slice(start, start + ICONS_PER_PAGE)
})

const resolveCatIcon = (iconName: string) => {
    if (iconName && (LucideIcons as any)[iconName]) {
        return (LucideIcons as any)[iconName]
    }
    return LucideIcons['Component']
}

const openIconPicker = (cat: { name: string, icon: string }, e: MouseEvent) => {
    editingCategory.value = cat
    iconPickerPos.value = { x: e.clientX + 8, y: e.clientY - 20 }
    iconSearch.value = ''
    iconPickerVisible.value = true
}

const selectIcon = async (iconName: string) => {
    if (!editingCategory.value) return
    const catName = editingCategory.value.name
    
    try {
        await axios.patch(`/api/categories/${catName}/`, { icon: iconName })
        // Update local map
        categoryIconMap.value[catName] = iconName
        iconPickerVisible.value = false
    } catch (e) {
        console.error('Failed to update category icon', e)
    }
}

// Category Meta
const categories = computed(() => {
    // Standard always exists
    const cats: { name: string, icon: string }[] = [
        { name: 'Standard', icon: categoryIconMap.value['Standard'] || 'Component' },
        { name: 'Gateways', icon: categoryIconMap.value['Gateways'] || 'Component' },
    ]
    
    // Add remote categories unique
    const comps = Array.isArray(remoteComponents.value) ? remoteComponents.value : []
    const remoteCats = new Set(comps.map((c: any) => c.category))
    remoteCats.forEach(cat => {
        if (cat == "Uncategorized") return
        if (cat !== 'Standard') {
            cats.push({ name: cat, icon: categoryIconMap.value[cat] || 'Component' })
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
            let iconComponent = LucideIcons['Component']

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


const fetchCategories = async () => {
    try {
        const resp = await axios.get('/api/categories/')
        const data = resp.data
        if (Array.isArray(data)) {
            const map: Record<string, string> = {}
            data.forEach((c: any) => { map[c.name] = c.icon })
            categoryIconMap.value = map
        }
    } catch (e) {
        console.error("Failed to fetch categories", e)
    }
}

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

onMounted(async () => {
    await fetchCategories()
    await fetchComponents()
})
</script>
