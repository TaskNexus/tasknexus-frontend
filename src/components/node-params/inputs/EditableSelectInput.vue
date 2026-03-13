<template>
    <div class="flex items-center gap-2">
        <input
            type="text"
            :value="textValue"
            @input="handleTextInput"
            class="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
            :placeholder="placeholder"
        />
        <select
            :value="selectedOptionValue"
            @change="handleSelectChange"
            class="w-36 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
            :disabled="normalizedOptions.length === 0"
        >
            <option value="">{{ selectPlaceholder }}</option>
            <option
                v-for="option in normalizedOptions"
                :key="option"
                :value="option"
            >
                {{ option }}
            </option>
        </select>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
    modelValue?: string | number | null
    options?: any[]
    placeholder?: string
    selectPlaceholder?: string
}>(), {
    modelValue: '',
    options: () => [],
    placeholder: '请输入机器名称',
    selectPlaceholder: '选择机器'
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const textValue = computed(() => {
    if (props.modelValue === null || props.modelValue === undefined) return ''
    return String(props.modelValue)
})

const normalizedOptions = computed(() => {
    return (props.options || []).map((option) => String(option))
})

const selectedOptionValue = computed(() => {
    if (normalizedOptions.value.includes(textValue.value)) {
        return textValue.value
    }
    return ''
})

const handleTextInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update:modelValue', target.value)
}

const handleSelectChange = (event: Event) => {
    const value = (event.target as HTMLSelectElement).value
    if (!value) return
    emit('update:modelValue', value)
}
</script>
