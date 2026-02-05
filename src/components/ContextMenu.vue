<template>
  <div 
    v-show="visible"
    class="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[160px]"
    :style="{ top: `${y}px`, left: `${x}px` }"
    @contextmenu.prevent
  >
    <div class="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-100 mb-1">
      {{ menuType === 'edge' ? 'Edge Actions' : 'Actions' }}
    </div>
    
    <!-- Node-only actions -->
    <template v-if="menuType === 'node'">
      <button 
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
        @click="onAction('copy')"
      >
        <Copy class="w-4 h-4 mr-2" />
        Duplicate
      </button>
      
      <button 
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
        @click="onAction('disconnect')"
      >
          <Unplug class="w-4 h-4 mr-2" />
          Disconnect
      </button>
      
      <div class="border-t border-gray-100 my-1"></div>
    </template>
    
    <!-- Delete action (common) -->
    <button 
      class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
      @click="onAction('delete')"
    >
      <Trash2 class="w-4 h-4 mr-2" />
      Delete
    </button>
  </div>
</template>

<script setup lang="ts">
import { Copy, Trash2, Unplug } from 'lucide-vue-next'

defineProps<{
  visible: boolean
  x: number
  y: number
  menuType?: 'node' | 'edge'
}>()

const emit = defineEmits<{
  (e: 'action', action: 'copy' | 'delete' | 'disconnect'): void
  (e: 'close'): void
}>()

const onAction = (action: 'copy' | 'delete' | 'disconnect') => {
  emit('action', action)
  emit('close')
}
</script>
