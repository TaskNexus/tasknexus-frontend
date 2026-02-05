<template>
  <div class="gateway-node relative flex items-center justify-center" style="width: 60px; height: 60px;">
    <!-- Diamond Shape -->
    <div 
      class="diamond-shape absolute w-[50px] h-[50px] border-2 rounded-sm flex items-center justify-center transition-shadow hover:shadow-md"
      :class="diamondClass"
      style="transform: rotate(45deg);"
    >
    </div>
    
    <!-- Icon (not rotated) -->
    <div class="relative z-10 flex items-center justify-center" :class="iconColorClass">
      <component :is="iconComponent" class="w-5 h-5" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { GitBranch, GitMerge, Combine, Split, CircleDot } from 'lucide-vue-next'

const props = defineProps<{
    node?: any
}>()

// Reactive data
const data = ref(props.node?.getData() || {})

onMounted(() => {
    if (props.node) {
        props.node.on('change:data', ({ current }: any) => {
            data.value = current
        })
    }
})

const nodeType = computed(() => data.value.type || 'BRANCH')
const status = computed(() => data.value.status || 'default')

// Icon mapping based on gateway type (matching NodeLibrary.vue)
const iconComponent = computed(() => {
    switch (nodeType.value) {
        case 'BRANCH':
        case 'EXCLUSIVE_GATEWAY':
            return GitBranch
        case 'PARALLEL':
        case 'PARALLEL_GATEWAY':
            return Split
        case 'CONVERGE':
        case 'CONVERGE_GATEWAY':
            return Combine  // Fixed: was GitMerge
        case 'CONDITIONAL':
        case 'CONDITIONAL_PARALLEL':
            return GitMerge // Fixed: was Shuffle
        default:
            return CircleDot
    }
})

// Diamond border and background styles based on status
const diamondClass = computed(() => {
    switch (status.value) {
        case 'finished': return 'bg-green-100 border-green-400'
        case 'running': return 'bg-blue-100 border-blue-400'
        case 'failed': return 'bg-red-100 border-red-400'
        default: return 'bg-white border-slate-400'
    }
})

// Icon color based on status
const iconColorClass = computed(() => {
    switch (status.value) {
        case 'finished': return 'text-green-600'
        case 'running': return 'text-blue-600'
        case 'failed': return 'text-red-600'
        default: return 'text-slate-600'
    }
})
</script>

<style scoped>
.gateway-node {
    user-select: none;
}

.diamond-shape {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
