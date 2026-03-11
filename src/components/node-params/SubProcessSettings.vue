<template>
    <section v-if="visible" class="space-y-3">
        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider">子流程配置</h4>
        
        <div class="space-y-1">
            <label class="text-xs font-medium text-gray-600">选择流程</label>
            <select 
                :value="modelValue"
                @change="handleChange"
                class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
            >
                <option value="" disabled>请选择一个流程...</option>
                <option v-for="w in workflows" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
        </div>

        <div v-if="params.length > 0" class="space-y-2 mt-4">
            <label class="text-xs font-medium text-gray-600">流程全局变量配置</label>
            <div class="bg-gray-50 rounded border border-gray-100 p-2 space-y-2">
                <p class="text-xs text-gray-400 mb-1">变量值映射:</p>
                <div v-for="param in params" :key="param.key" class="flex flex-col gap-1">
                    <span class="text-xs font-mono text-gray-500">{{ param.key }}</span>
                    <input 
                        :value="paramValues['params_' + param.key]" 
                        @change="updateParamValue('params_' + param.key, ($event.target as HTMLInputElement).value)"
                        :placeholder="param.value"
                        class="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:border-blue-500"
                    />
                    <span class="text-[10px] text-gray-400 truncate">{{ param.description }}</span>
                </div>
            </div>
        </div>
        <div v-else-if="modelValue" class="text-xs text-gray-400 italic">
            所选流程没有可配置的全局变量。
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import { fetchAllPages } from '../../utils/pagination'

interface Workflow {
    id: string | number
    name: string
}

interface Param {
    key: string
    value: string
    description?: string
}

interface OutputCandidate {
    key: string
    name: string
    type: string
}

const props = defineProps<{
    visible: boolean
    modelValue: string | number | null
    paramValues: Record<string, any>
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string | number]
    'update:paramValues': [key: string, value: any]
    'paramsLoaded': [params: Param[]]
    'subprocessOutputsLoaded': [outputs: OutputCandidate[]]
}>()

const workflows = ref<Workflow[]>([])
const params = ref<Param[]>([])
const loading = ref(false)

const fetchWorkflows = async () => {
    loading.value = true
    try {
        workflows.value = await fetchAllPages('/api/workflows/')
    } catch (e) {
        console.error("Failed to fetch workflows", e)
    } finally {
        loading.value = false
    }
}

const fetchParams = async (workflowId: string | number | null) => {
    if (!workflowId) {
        params.value = []
        emit('paramsLoaded', [])
        emit('subprocessOutputsLoaded', [])
        return
    }
    try {
        const resp = await axios.get(`/api/workflows/${workflowId}/`)
        const graphData = resp.data.graph_data || {}
        const pipelineTree = resp.data.pipeline_tree || {}
        params.value = graphData.workflow_params || []
        const outputCandidates = extractSubprocessOutputs(pipelineTree.data?.outputs)
        emit('paramsLoaded', params.value)
        emit('subprocessOutputsLoaded', outputCandidates)
    } catch (e) {
        console.error("Failed to load sub workflow", e)
        params.value = []
        emit('paramsLoaded', [])
        emit('subprocessOutputsLoaded', [])
    }
}

const normalizeOutputKey = (value: unknown): string => {
    if (typeof value !== 'string') return ''
    return value.trim()
}

const humanizeOutputName = (key: string): string => {
    const matched = key.match(/^\$\{(.+)\}$/)
    return matched ? matched[1] : key
}

const extractSubprocessOutputs = (rawOutputs: unknown): OutputCandidate[] => {
    let outputKeys: string[] = []

    if (Array.isArray(rawOutputs)) {
        outputKeys = rawOutputs.map((item) => normalizeOutputKey(item)).filter(Boolean)
    } else if (rawOutputs && typeof rawOutputs === 'object') {
        outputKeys = Object.keys(rawOutputs as Record<string, unknown>).map((key) => normalizeOutputKey(key)).filter(Boolean)
    }

    const deduped = Array.from(new Set(outputKeys))
    return deduped.map((key) => ({
        key,
        name: humanizeOutputName(key),
        type: 'subprocess-output'
    }))
}

const handleChange = (event: Event) => {
    const value = (event.target as HTMLSelectElement).value
    emit('update:modelValue', value)
    fetchParams(value)
}

const updateParamValue = (key: string, value: any) => {
    emit('update:paramValues', key, value)
}

watch(() => props.modelValue, (newVal) => {
    fetchParams(newVal)
}, { immediate: true })

onMounted(() => {
    if (props.visible) {
        fetchWorkflows()
    }
})

watch(() => props.visible, (visible) => {
    if (visible && workflows.value.length === 0) {
        fetchWorkflows()
    }
})
</script>
