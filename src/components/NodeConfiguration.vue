
<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <h3 class="font-semibold text-gray-800 text-sm" v-if="nodeData.componentCode">
            Plugin: {{ nodeData.componentCode }} (v{{ nodeData.version }})
        </h3>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <BasicInfoSettings
            v-model="nodeData.label"
            @change="updateNode"
        />

        <FailureHandlingSettings
            :error-ignorable="nodeData.errorIgnorable"
            :skippable="nodeData.skippable"
            :retryable="nodeData.retryable"
            @update:errorIgnorable="(val) => { nodeData.errorIgnorable = val; updateNode(); }"
            @update:skippable="(val) => { nodeData.skippable = val; updateNode(); }"
            @update:retryable="(val) => { nodeData.retryable = val; updateNode(); }"
        />

        <SubProcessSettings
            :visible="nodeData.type === 'SUBPROCESS' || nodeData.type === 'subprocess'"
            v-model="nodeInputs['workflow_id']"
            :param-values="nodeInputs"
            @update:modelValue="(val) => { nodeInputs['workflow_id'] = val; updateInputs(); }"
            @update:paramValues="(key, val) => { nodeInputs[key] = val; updateInputs(); }"
            @subprocessOutputsLoaded="handleSubprocessOutputsLoaded"
        />

        <InputParamsSettings
            :inputs="nodeData.componentInputs || []"
            :values="nodeInputs"
            :project-id="projectId"
            :model-groups="aiModelGroups"
            @update:values="(key, val) => { nodeInputs[key] = val; updateInputs(); }"
        />

        <OutputParamsSettings
            :outputs="effectiveOutputs"
            :mappings="nodeOutputMappings"
            @update:mappings="(mappings) => { nodeOutputMappings = mappings; updateOutputs(); }"
        />
        <p v-if="subprocessCleanupNotice" class="text-xs text-amber-600">
            {{ subprocessCleanupNotice }}
        </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import axios from 'axios'
import {
    SubProcessSettings,
    BasicInfoSettings,
    FailureHandlingSettings,
    InputParamsSettings,
    OutputParamsSettings
} from './node-params'

const props = defineProps<{
    node: any,
    projectId?: number | string
}>()

const nodeData = ref<any>({})
const nodeInputs = ref<any>({})
const nodeOutputMappings = ref<Record<string, string>>({})
const subprocessOutputs = ref<Array<{ key: string; name: string; type: string }>>([])
const subprocessCleanupNotice = ref('')

// AI Model Configuration
interface ModelGroup {
    title: string;
    enabled: boolean;
    models: { name: string; enabled: boolean }[];
}
const aiModelGroups = ref<ModelGroup[]>([])

// Component Definitions Cache
const componentDefinitions = ref<any[]>([])
const builtinSubprocessOutputKeys = new Set(['_loop', '_inner_loop'])

const isSubProcessNode = computed(() => {
    return nodeData.value.type === 'SUBPROCESS' || nodeData.value.type === 'subprocess'
})

const effectiveOutputs = computed(() => {
    if (isSubProcessNode.value) {
        return subprocessOutputs.value
    }
    return nodeData.value.componentOutputs || []
})

const fetchAiConfig = async () => {
    if (!props.projectId) return
    try {
        const resp = await axios.get(`/api/projects/${props.projectId}/`)
        const extra = resp.data.extra_config || {}
        aiModelGroups.value = extra.model_groups || []
    } catch (e) {
        console.error("Failed to fetch AI config", e)
    }
}

const fetchComponentDefinitions = async () => {
    try {
        const resp = await axios.get('/api/components/')
        const data = resp.data
        if (Array.isArray(data)) {
            componentDefinitions.value = data
        } else if (data && Array.isArray(data.results)) {
            componentDefinitions.value = data.results
        }
    } catch(e) {
        console.error("Failed to fetch component definitions", e)
    }
}

const syncFromNode = () => {
    if (!props.node) return
    const data = props.node.getData() || {}
    nodeData.value = { ...data }
    nodeInputs.value = { ...data.inputs }
    subprocessOutputs.value = []
    subprocessCleanupNotice.value = ''
    
    // Sync output mappings from node's outputs array
    nodeOutputMappings.value = {}
    if (Array.isArray(data.outputs)) {
        data.outputs.forEach((out: { sourceKey: string; contextKey: string }) => {
            if (out.sourceKey && out.contextKey) {
                nodeOutputMappings.value[out.sourceKey] = out.contextKey
            }
        })
    }
    
    // Check if we need to fetch AI config
    if (props.projectId && (nodeData.value.componentCode === 'text2image' || nodeData.value.componentCode === 'chat2ai')) {
        fetchAiConfig()
    }
    
    // Auto-update component schema if outdated
    updateSchemaFromLatest()
}

const cleanupInvalidSubprocessMappings = (allowedOutputs: Array<{ key: string }>) => {
    if (!isSubProcessNode.value) return

    const allowedKeys = new Set<string>([
        ...Array.from(builtinSubprocessOutputKeys),
        ...allowedOutputs
            .map((output) => (typeof output.key === 'string' ? output.key.trim() : ''))
            .filter(Boolean)
    ])

    const cleanedMappings: Record<string, string> = {}
    const removedKeys: string[] = []
    let changed = false

    for (const [sourceKey, contextKey] of Object.entries(nodeOutputMappings.value)) {
        if (allowedKeys.has(sourceKey)) {
            cleanedMappings[sourceKey] = contextKey
        } else {
            changed = true
            removedKeys.push(sourceKey)
        }
    }

    if (!changed) {
        subprocessCleanupNotice.value = ''
        return
    }

    nodeOutputMappings.value = cleanedMappings
    subprocessCleanupNotice.value = `已移除与当前子流程不匹配的输出映射：${removedKeys.join(', ')}`
    updateOutputs()
}

const handleSubprocessOutputsLoaded = (outputs: Array<{ key: string; name: string; type: string }>) => {
    subprocessOutputs.value = outputs
    cleanupInvalidSubprocessMappings(outputs)
}

const updateSchemaFromLatest = () => {
    if (!nodeData.value.componentCode || componentDefinitions.value.length === 0) return
    
    const latest = componentDefinitions.value.find(c => c.code === nodeData.value.componentCode)
    if (latest) {
        const hasInputsChanged = JSON.stringify(nodeData.value.componentInputs) !== JSON.stringify(latest.inputs)
        const hasOutputsChanged = JSON.stringify(nodeData.value.componentOutputs) !== JSON.stringify(latest.outputs)
        const hasVersionChanged = nodeData.value.version !== latest.version

        if (hasInputsChanged || hasOutputsChanged || hasVersionChanged) {
             console.log(`[NodeConfiguration] Upgrading node ${nodeData.value.label} from ${nodeData.value.version} to ${latest.version}`)
             
             // Update local view
             nodeData.value.componentInputs = latest.inputs
             nodeData.value.componentOutputs = latest.outputs
             nodeData.value.version = latest.version
             
             // Persist to graph node
             props.node.setData({
                 ...props.node.getData(),
                 componentInputs: latest.inputs,
                 componentOutputs: latest.outputs,
                 version: latest.version
             })
        }
    }
}

const updateNode = () => {
    if (!props.node) return
    props.node.setData({
        ...props.node.getData(),
        label: nodeData.value.label,
        errorIgnorable: nodeData.value.errorIgnorable,
        skippable: nodeData.value.skippable,
        retryable: nodeData.value.retryable
    })
}

const updateInputs = () => {
    if (!props.node) return
    props.node.setData({
        ...props.node.getData(),
        inputs: { 
            ...nodeInputs.value
        }
    }, { overwrite: true })
}

const updateOutputs = () => {
    if (!props.node) return
    
    const outputs: { sourceKey: string; contextKey: string }[] = []
    
    for (const [sourceKey, contextKey] of Object.entries(nodeOutputMappings.value)) {
        outputs.push({
            sourceKey,
            contextKey: contextKey ? contextKey.trim() : ''
        })
    }
    
    props.node.setData({
        ...props.node.getData(),
        outputs
    })
}

// Watch for node selection change
watch(() => props.node, (newNode) => {
    syncFromNode()
    if (newNode) {
        newNode.off('change:data')
        newNode.on('change:data', ({ current }: any) => {
            // Avoid cyclic updates
        })
    }
}, { immediate: true })

// Watch definitions to update schema once loaded
watch(componentDefinitions, () => {
    updateSchemaFromLatest()
})

// Watch projectId to refresh config if it changes
watch(() => props.projectId, () => {
    if (nodeData.value.componentCode === 'text2image' || nodeData.value.componentCode === 'chat2ai') {
        fetchAiConfig()
    }
})

onMounted(() => {
    fetchComponentDefinitions()
})
</script>
