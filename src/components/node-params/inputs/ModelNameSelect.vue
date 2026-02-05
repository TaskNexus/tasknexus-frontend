<template>
    <select 
        :value="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
        :disabled="disabled"
    >
        <option value="" disabled>Select Model</option>
        <option v-for="m in models" :key="m.name" :value="m.name">{{ m.name }}</option>
    </select>
</template>

<script setup lang="ts">
interface Model {
    name: string
    enabled: boolean
}

defineProps<{
    modelValue: string
    models: Model[]
    disabled?: boolean
}>()

defineEmits<{
    'update:modelValue': [value: string]
}>()
</script>
