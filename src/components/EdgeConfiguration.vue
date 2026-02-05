<template>
  <div v-if="edge" class="flex flex-col h-full bg-white">
    <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
      <div class="flex items-center gap-2">
           <GitBranch class="w-4 h-4 text-blue-500" />
           <h3 class="font-medium text-gray-900">Edge Configuration</h3>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-5">
       <!-- Basic Info -->
       <div class="space-y-3">
          <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Condition Name</label>
              <input 
                 v-model="name"
                 type="text"
                 placeholder="e.g. Success, Score > 60"
                 class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                 @change="handleUpdate"
              />
              <p class="text-xs text-slate-400 mt-1">Displayed on the connecting line.</p>
          </div>

          <div>
               <label class="block text-sm font-medium text-gray-700 mb-1">Expression</label>
               <div class="relative">
                   <textarea 
                       v-model="expression"
                       rows="4"
                       class="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                       placeholder="${variable} == 'value'"
                       @change="handleUpdate"
                   ></textarea>
               </div>
               <p class="text-xs text-slate-400 mt-1">
                   Python expression. Use <code>${var}</code> to reference global variables.
                   <br/>Example: <code>${status_code} == 200</code>
               </p>
          </div>
       </div>
    </div>
  </div>
  <div v-else class="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50">
      <MousePointerClick class="w-8 h-8 mb-2 opacity-50" />
      <span class="text-sm">Select a connection line to configure conditions</span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { GitBranch, MousePointerClick } from 'lucide-vue-next'

const props = defineProps<{
    edge: any // X6 Edge
}>()

const name = ref('')
const expression = ref('')

const initData = () => {
    if (props.edge) {
        const data = props.edge.getData() || {}
        name.value = data.name || ''
        expression.value = data.expression || ''
    }
}

watch(() => props.edge, (newEdge) => {
    initData()
}, { immediate: true })

const handleUpdate = () => {
    if (!props.edge) return
    
    // Update data
    props.edge.setData({
        name: name.value,
        expression: expression.value,
        type: 'condition' // Marker for export
    })
    
    // Update visual label
    props.edge.setLabels([
        {
            attrs: {
                label: {
                    text: name.value || '',
                },
            },
        },
    ])
}
</script>
