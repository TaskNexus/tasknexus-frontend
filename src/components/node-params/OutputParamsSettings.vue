<template>
    <section v-if="allOutputs && allOutputs.length > 0" class="space-y-3">
        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider">输出变量映射</h4>
        <p class="text-xs text-gray-500">
            配置后，其他节点可通过 <code class="bg-gray-100 px-1 rounded">${变量名}</code> 引用该输出
        </p>
        <div class="bg-gray-50 rounded border border-gray-100 p-3 space-y-3">
            <div v-for="output in allOutputs" :key="output.key" class="space-y-1">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-mono text-blue-600">{{ output.key }}</span>
                    <span class="text-[10px] text-gray-400">{{ output.name }} ({{ output.type }})</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-400">→</span>
                    <div class="flex-1 flex items-center border border-gray-200 rounded bg-white overflow-hidden">
                        <span class="px-2 text-xs text-gray-400 bg-gray-50 border-r border-gray-200">${</span>
                        <input 
                            type="text"
                            :value="mappings[output.key] || ''"
                            @input="updateMapping(output.key, ($event.target as HTMLInputElement).value)"
                            :placeholder="'留空则不提取到上下文'"
                            class="flex-1 px-2 py-1.5 text-xs focus:outline-none"
                        />
                        <span class="px-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">}</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface OutputDef {
    key: string
    name: string
    type: string
}

const props = defineProps<{
    outputs: OutputDef[]
    mappings: Record<string, string>
}>()

const emit = defineEmits<{
    'update:mappings': [mappings: Record<string, string>]
}>()

// Built-in outputs for loop support
const builtinOutputs: OutputDef[] = [
    { key: '_loop', name: '循环次数', type: 'int' },
    { key: '_inner_loop', name: '流程内循环次数', type: 'int' }
]

// Merge component outputs with built-in outputs
const allOutputs = computed(() => [...props.outputs, ...builtinOutputs])

const updateMapping = (key: string, value: string) => {
    const newMappings = { ...props.mappings, [key]: value }
    emit('update:mappings', newMappings)
}
</script>

