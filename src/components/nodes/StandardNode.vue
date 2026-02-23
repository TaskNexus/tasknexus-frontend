<template>
  <div class="standard-node relative flex flex-col rounded-md border shadow-sm hover:shadow-md transition-shadow group" 
    :class="containerStatusClass"
    :style="containerStyle"
    style="width: 240px; height: 80px;"
    @mouseenter="handleMouseEnter"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <!-- Status Indicator Line (Left) -->
    <div 
      class="absolute left-0 top-0 bottom-0 w-1 rounded-l-md overflow-hidden"
      :class="statusColorClass"
    ></div>

    <!-- Tooltip: Teleport to body to avoid clipping and z-index issues -->
    <Teleport to="body">
        <div v-if="showTooltip" 
             class="fixed z-[9999] bg-slate-800 text-white text-xs rounded shadow-lg p-3 pointer-events-none"
             :style="tooltipStyle"
        >
            <div class="font-semibold border-b border-slate-600 pb-1 mb-2 flex items-center justify-between gap-4">
                <span>Node History</span>
                <span v-if="loadingHistory" class="text-blue-300 text-[10px] animate-pulse">Loading...</span>
            </div>
            
            <div v-if="historyData.length" class="space-y-1">
                <div v-for="(rec, idx) in historyData" :key="idx" class="flex justify-between gap-6">
                   <span class="text-slate-400">{{ new Date(rec.finished_at).toLocaleDateString() }}</span>
                   <span class="font-mono font-medium">{{ formatDuration(rec.duration) }}</span>
                </div>
                <div class="mt-2 pt-1 border-t border-slate-700 text-blue-200 flex justify-between font-medium">
                    <span>Average</span>
                    <span>{{ formatDuration(Math.round(historyData.reduce((acc, r) => acc + r.duration, 0) / historyData.length)) }}</span>
                </div>
            </div>
            <div v-else-if="!loadingHistory" class="text-slate-400 italic py-1">
                No history records found
            </div>
            
            <!-- Current Progress info -->
            <div v-if="status === 'running'" class="mt-2 pt-2 border-t border-slate-600 space-y-1">
                <div class="flex justify-between text-slate-300">
                    <span>Started</span>
                    <span>{{ data.start_time ? new Date(data.start_time).toLocaleTimeString() : '-' }}</span>
                </div>
                <div class="flex justify-between text-blue-300 font-medium">
                    <span>Expected</span>
                    <span>{{ formatDuration(data.expected_duration || 10) }}</span>
                </div>
                 <div class="flex justify-between text-green-300 font-bold">
                    <span>Progress</span>
                    <span>{{ Math.round(displayProgress) }}%</span>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- Header / Meta Info -->
    <div class="px-2 py-1 border-b border-inherit flex items-center justify-between bg-inherit/50 rounded-t-md ml-1">
      <div class="flex items-center gap-1">
        <span class="text-[9px] uppercase font-bold text-slate-500 tracking-wider bg-slate-200/50 px-1 py-0.5 rounded">{{ nodeType }}</span>
      </div>
      <!-- Status Icon -->
      <div v-if="status === 'finished'" class="text-green-600">
        <CheckCircle2 class="w-3 h-3" />
      </div>
      <div v-if="status === 'failed'" class="text-red-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
             <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </div>
      <!-- Loading Spinner -->
      <div v-if="status === 'running'" class="text-blue-600 flex items-center gap-1">
        <span class="text-[9px] font-mono">{{ formatDuration(Math.round(elapsedTime)) }}</span>
        <Loader2 class="w-3 h-3 animate-spin" />
      </div>
    </div>

    <!-- Body / Content -->
    <div class="px-2 py-1.5 ml-1 flex items-center gap-2 flex-1">
        <!-- Icon Placeholder -->
        <div class="w-7 h-7 rounded bg-white/80 flex items-center justify-center shrink-0 shadow-sm text-slate-500">
            <component :is="iconComponent" class="w-4 h-4" />
        </div>
        
        <div class="flex-1 min-w-0">
            <h3 class="text-xs font-medium text-slate-700 truncate leading-tight">{{ label }}</h3>
            <p class="text-[10px] text-slate-400 truncate leading-tight">{{ subLabel || statusText }}</p>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted } from 'vue'
import * as LucideIcons from 'lucide-vue-next'
// We still need specific icons for UI elements (loaders, checks) but node icons are dynamic.
import { Loader2, CheckCircle2 } from 'lucide-vue-next'
import axios from 'axios'

const props = defineProps<{
    node?: any
}>()

// Reactive data
const data = ref(props.node?.getData() || {})
const progress = ref(0)           // Target progress value
const displayProgress = ref(0)    // Displayed progress (lerped)
const elapsedTime = ref(0)
let animationFrameId: number | null = null

// Lerp function for smooth interpolation
const lerp = (current: number, target: number, alpha: number): number => {
    return current + (target - current) * alpha
}

// Animation loop for smooth progress updates - calculates progress every frame
const animateProgress = () => {
    // Calculate real-time progress every frame for smooth animation
    if (status.value === 'running' && data.value.start_time) {
        const start = new Date(data.value.start_time).getTime()
        if (!isNaN(start)) {
            const now = Date.now()
            const elapsed = Math.max(0, (now - start) / 1000)
            elapsedTime.value = elapsed
            
            const duration = Number(data.value.expected_duration) || 10
            let targetProgress = (elapsed / duration) * 100
            if (targetProgress < 0) targetProgress = 0
            if (targetProgress > 99) targetProgress = 99
            progress.value = targetProgress
        }
    } else {
        progress.value = 0
        elapsedTime.value = 0
    }
    
    // Lerp displayProgress towards target progress
    const diff = Math.abs(displayProgress.value - progress.value)
    if (diff > 0.01) {
        displayProgress.value = lerp(displayProgress.value, progress.value, 0.08)
    } else {
        displayProgress.value = progress.value
    }
    
    animationFrameId = requestAnimationFrame(animateProgress)
}

// Tooltip State
const showTooltip = ref(false)
const historyData = ref<any[]>([])
const loadingHistory = ref(false)
const tooltipStyle = ref({})

let hoverTimer: any = null

// Track real mouse position at document level (unaffected by X6 transforms)
const mousePos = ref({ x: 0, y: 0 })
const onDocumentMouseMove = (e: MouseEvent) => {
    mousePos.value = { x: e.clientX, y: e.clientY }
}

const getTaskId = () => {
    const parts = window.location.pathname.split('/')
    const idx = parts.indexOf('tasks')
    if (idx !== -1 && parts[idx+1]) return parts[idx+1]
    return null
}

// Tooltip dimensions (approximate, adjust if needed)
const TOOLTIP_WIDTH = 220
const TOOLTIP_HEIGHT = 200

const calculateTooltipPosition = () => {
    const { x, y } = mousePos.value
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const overflowRight = x + TOOLTIP_WIDTH > viewportWidth
    const overflowBottom = y + TOOLTIP_HEIGHT > viewportHeight
    
    const style: Record<string, string> = {}
    
    if (overflowRight) {
        style.right = `${viewportWidth - x}px`
    } else {
        style.left = `${x}px`
    }
    
    if (overflowBottom) {
        style.bottom = `${viewportHeight - y}px`
    } else {
        style.top = `${y}px`
    }
    
    return style
}

const handleMouseEnter = (e: MouseEvent) => {
    tooltipStyle.value = calculateTooltipPosition()

    hoverTimer = setTimeout(async () => {
        showTooltip.value = true
        tooltipStyle.value = calculateTooltipPosition()
        await fetchHistory()
    }, 500) 
}

const handleMouseMove = (e: MouseEvent) => {
    if (showTooltip.value) {
        tooltipStyle.value = calculateTooltipPosition()
    }
}

const handleMouseLeave = () => {
    if (hoverTimer) clearTimeout(hoverTimer)
    showTooltip.value = false
}


const fetchHistory = async () => {
    const taskId = getTaskId()
    if (!taskId) return
    
    loadingHistory.value = true
    try {
        const resp = await axios.get(`/api/tasks/${taskId}/node_history/`, {
            params: { node_id: props.node.id }
        })
        historyData.value = resp.data
    } catch (e) {
        console.error("Failed to fetch history", e)
    } finally {
        loadingHistory.value = false
    }
}

const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`
    return `${Math.floor(sec/60)}m ${sec%60}s`
}

onMounted(() => {
    if (props.node) {
        props.node.on('change:data', ({ current }: any) => {
            data.value = current
        })
    }
    
    // Start lerp animation loop (handles all progress updates)
    animationFrameId = requestAnimationFrame(animateProgress)
    
    // Add document-level mouse tracking (accurate coordinates regardless of X6 zoom)
    document.addEventListener('mousemove', onDocumentMouseMove)
})

onUnmounted(() => {
    if (hoverTimer) clearTimeout(hoverTimer)
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    document.removeEventListener('mousemove', onDocumentMouseMove)
})

const label = computed(() => data.value.label || 'Untitled Node')
const subLabel = computed(() => data.value.subLabel || '')
const nodeType = computed(() => {
    if (data.value.componentCode) return data.value.componentCode.toUpperCase()
    return data.value.type || 'TASK'
})
const status = computed(() => data.value.status || 'default')
const loopCount = computed(() => data.value.loop || 1)
const statusText = computed(() => {
    const baseStatus = status.value.toUpperCase()
    if (loopCount.value > 1) {
        return `${baseStatus} (循环 ${loopCount.value})`
    }
    return baseStatus
})

// Icon mapping
const iconComponent = computed(() => {
    const iconName = data.value.icon
    const t = (data.value.type || '').toUpperCase()

    if (t === 'START') return LucideIcons['Play']
    if (t === 'END') return LucideIcons['CircleStop']
    
    if (typeof iconName === 'string' && iconName && (LucideIcons as any)[iconName]) {
        return (LucideIcons as any)[iconName]
    }
    
    return LucideIcons['Component']
})

// Container styles (Background & Border)
const containerStatusClass = computed(() => {
    switch (status.value) {
        case 'finished': return 'bg-green-50 border-green-200'
        case 'running': return 'bg-blue-50 border-blue-200'
        case 'failed': return 'bg-red-50 border-red-200'
        default: return 'bg-white border-slate-200'
    }
})

const containerStyle = computed(() => {
    if (status.value === 'running' && displayProgress.value > 0) {
        // Use a more visible gradient with lerped progress for smooth animation
        return {
            background: `linear-gradient(to right, #dbeafe ${displayProgress.value}%, #ffffff ${displayProgress.value}%)`
        }
    }
    return {}
})

// Side bar and accent styles
const statusColorClass = computed(() => {
    switch (status.value) {
        case 'finished': return 'bg-green-500'
        case 'failed': return 'bg-red-500'
        case 'running': return 'bg-blue-500'
        default: return 'bg-slate-300'
    }
})
</script>

<style scoped>
.standard-node {
    user-select: none;
}
/* Connect Ports Styling could go here if using HTML ports */
</style>
