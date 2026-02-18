<template>
    <section v-if="inputs && inputs.length > 0" class="space-y-3">
        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider">{{ $t('language.inputParams') }}</h4>
        
        <div v-for="input in inputs" :key="input.key" class="space-y-1">
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
            
            <!-- Integer Input -->
            <DefaultTextInput 
                v-else-if="input.type === 'int' || input.type === 'string'"
                :model-value="values[input.key] || ''"
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
import { computed } from 'vue'
import {
    ModelGroupSelect,
    ModelNameSelect,
    UserMultiSelect,
    StringTextarea,
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

const updateValue = (key: string, value: any) => {
    emit('update:values', key, value)
}
</script>
