<template>
    <input 
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
        :placeholder="placeholder"
    />
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string | number
    placeholder?: string
}>()

defineEmits<{
    'update:modelValue': [value: string]
}>()
</script>
