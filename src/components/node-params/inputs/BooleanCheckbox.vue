<template>
    <div class="flex items-center mt-1">
        <input 
            type="checkbox" 
            :checked="modelValue"
            @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
        />
        <span class="ml-2 text-sm text-gray-500">{{ label }}</span>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: boolean
    label?: string
}>()

defineEmits<{
    'update:modelValue': [value: boolean]
}>()
</script>
