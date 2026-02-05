<template>
    <select 
        :value="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
    >
        <option value="" disabled>Select Model Group</option>
        <option v-for="g in groups" :key="g.title" :value="g.title">{{ g.title }}</option>
    </select>
</template>

<script setup lang="ts">
interface ModelGroup {
    title: string
    enabled: boolean
}

defineProps<{
    modelValue: string
    groups: ModelGroup[]
}>()

defineEmits<{
    'update:modelValue': [value: string]
}>()
</script>
