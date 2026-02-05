<template>
    <section class="space-y-3">
        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider">{{ $t('language.basicInfo') }}</h4>
        
        <div class="space-y-1">
            <label class="text-xs font-medium text-gray-600">{{ $t('language.nodeName') }}</label>
            <input 
                :value="modelValue"
                @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
                @change="$emit('change')"
                class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
        </div>
    </section>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string
}>()

defineEmits<{
    'update:modelValue': [value: string]
    'change': []
}>()
</script>
