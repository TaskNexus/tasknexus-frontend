<template>
    <section v-if="inputs && inputs.length > 0" class="space-y-3">
        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider">{{ $t('language.inputParams') }}</h4>

        <div v-for="input in visibleInputs" :key="input.key" class="space-y-1">
            <label class="text-xs font-medium text-gray-600">
                {{ input.name }} <span v-if="input.required" class="text-red-500">*</span>
            </label>

            <!-- Model Group Select -->
            <ModelGroupSelect
                v-if="input.key === 'model_group'"
                :model-value="values[input.key] || ''"
                :groups="availableModelGroups"
                @update:model-value="(val) => updateValue(input.key, val)"
            />

            <!-- Model Name Select -->
            <ModelNameSelect
                v-else-if="input.key === 'model_name'"
                :model-value="values[input.key] || ''"
                :models="availableModels"
                :disabled="!values['model_group']"
                @update:model-value="(val) => updateValue(input.key, val)"
            />

            <!-- User IDs Multi-select (based on schema.param_type) -->
            <UserMultiSelect
                v-else-if="input.schema?.param_type === 'users'"
                :model-value="values[input.key] || []"
                :project-id="projectId"
                @update:model-value="(val) => updateValue(input.key, val)"
            />

            <!-- String Textarea -->
            <StringTextarea
                v-else-if="input.schema?.param_type === 'textarea'"
                :model-value="values[input.key] || ''"
                placeholder="Enter text content ..."
                @update:model-value="(val) => updateValue(input.key, val)"
            />

            <!-- Select -->
            <select
                v-else-if="input.schema?.param_type === 'select' || hasEnumOptions(input)"
                :value="values[input.key] || ''"
                class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                @change="(event) => updateValue(input.key, (event.target as HTMLSelectElement).value)"
            >
                <option value="" disabled>请选择</option>
                <option
                    v-for="option in enumOptions(input)"
                    :key="String(option)"
                    :value="String(option)"
                >
                    {{ option }}
                </option>
            </select>

            <!-- Code Editor -->
            <CodeEditorInput
                v-else-if="input.schema?.param_type === 'code_editor'"
                :model-value="values[input.key] || { language: 'shell', content: '' }"
                @update:model-value="(val) => updateValue(input.key, val)"
            />

            <!-- Key-Value Pairs -->
            <KeyValueInput
                v-else-if="input.schema?.param_type === 'key_values'"
                :model-value="values[input.key] || []"
                @update:model-value="(val) => updateValue(input.key, val)"
            />

            <!-- Integer / String Input -->
            <DefaultTextInput
                v-else-if="input.type === 'int' || input.type === 'string'"
                :model-value="values[input.key] || ''"
                @update:model-value="(val) => updateValue(input.key, val)"
            />

            <!-- Array of Objects -->
            <ObjectArrayInput
                v-else-if="input.type === 'array'"
                :model-value="values[input.key] || []"
                :schema="input.schema"
                @update:model-value="(val) => updateValue(input.key, val)"
            />

            <!-- Boolean Checkbox -->
            <BooleanCheckbox
                v-else-if="input.type === 'bool'"
                :model-value="values[input.key] || false"
                label="Enable"
                @update:model-value="(val) => updateValue(input.key, val)"
            />

            <!-- Default Input -->
            <DefaultTextInput
                v-else
                :model-value="values[input.key] || ''"
                @update:model-value="(val) => updateValue(input.key, val)"
            />
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import {
    ModelGroupSelect,
    ModelNameSelect,
    UserMultiSelect,
    KeyValueInput,
    StringTextarea,
    CodeEditorInput,
    BooleanCheckbox,
    DefaultTextInput,
    ObjectArrayInput
} from './inputs'

interface InputDef {
    key: string
    name: string
    type: string
    required: boolean
    schema?: {
        param_type?: string
        enum?: any[]
        visible_when?: Record<string, any>
        [key: string]: any
    }
}

interface ModelGroup {
    title: string
    enabled: boolean
    models: { name: string; enabled: boolean }[]
}

const props = defineProps<{
    inputs: InputDef[]
    values: Record<string, any>
    projectId?: number | string
    modelGroups?: ModelGroup[]
    hiddenKeys?: string[]
}>()

const emit = defineEmits<{
    'update:values': [key: string, value: any]
}>()

const availableModelGroups = computed(() => {
    return (props.modelGroups || []).filter(g => g.enabled)
})

const availableModels = computed(() => {
    const groupName = props.values['model_group']
    if (!groupName) return []
    const group = (props.modelGroups || []).find(g => g.title === groupName)
    return group ? group.models.filter(m => m.enabled) : []
})

const matchesVisibleWhen = (visibleWhen: Record<string, any> | undefined): boolean => {
    if (!visibleWhen || typeof visibleWhen !== 'object') {
        return true
    }

    return Object.entries(visibleWhen).every(([depKey, expected]) => {
        const actual = props.values?.[depKey]
        if (Array.isArray(expected)) {
            return expected.map((item) => String(item)).includes(String(actual))
        }
        return String(actual ?? '') === String(expected)
    })
}

const visibleInputs = computed(() => {
    const hiddenSet = new Set((props.hiddenKeys || []).map((key) => String(key)))
    return (props.inputs || []).filter((input) => {
        if (hiddenSet.has(String(input.key))) return false
        return matchesVisibleWhen(input.schema?.visible_when)
    })
})

const enumOptions = (input: InputDef): any[] => {
    if (Array.isArray(input.schema?.enum)) {
        return input.schema?.enum || []
    }
    return []
}

const hasEnumOptions = (input: InputDef): boolean => {
    return enumOptions(input).length > 0
}

const ensureSelectDefaults = () => {
    for (const input of props.inputs || []) {
        if (!(input.schema?.param_type === 'select' || hasEnumOptions(input))) {
            continue
        }
        const current = props.values?.[input.key]
        if (current !== undefined && current !== null && String(current) !== '') {
            continue
        }
        const options = enumOptions(input)
        if (options.length > 0) {
            updateValue(input.key, String(options[0]))
        }
    }
}

watch(
    () => props.inputs,
    () => {
        ensureSelectDefaults()
    },
    { immediate: true, deep: true }
)

watch(
    () => props.values,
    () => {
        ensureSelectDefaults()
    },
    { deep: true }
)

const updateValue = (key: string, value: any) => {
    emit('update:values', key, value)
}
</script>
