<template>
    <textarea 
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        rows="4"
        class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 font-mono text-xs"
        :placeholder="placeholder"
    ></textarea>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string
    placeholder?: string
}>()

defineEmits<{
    'update:modelValue': [value: string]
}>()
</script>
