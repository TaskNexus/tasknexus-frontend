<template>
    <section class="space-y-3">
        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider">{{ $t('language.failureHandle') }}</h4>
        
        <div class="space-y-2">
            <label class="flex items-center space-x-2 cursor-pointer">
                <input 
                    type="checkbox" 
                    :checked="errorIgnorable" 
                    @change="$emit('update:errorIgnorable', ($event.target as HTMLInputElement).checked)" 
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                />
                <span class="text-sm text-gray-600">{{ $t('language.allowFailure') }}</span>
            </label>
            
            <label class="flex items-center space-x-2 cursor-pointer">
                <input 
                    type="checkbox" 
                    :checked="skippable" 
                    @change="$emit('update:skippable', ($event.target as HTMLInputElement).checked)" 
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                />
                <span class="text-sm text-gray-600">{{ $t('language.skippable') }}</span>
            </label>
            
            <label class="flex items-center space-x-2 cursor-pointer">
                <input 
                    type="checkbox" 
                    :checked="retryable" 
                    @change="$emit('update:retryable', ($event.target as HTMLInputElement).checked)" 
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                />
                <span class="text-sm text-gray-600">{{ $t('language.retryable') }}</span>
            </label>
        </div>
    </section>
</template>

<script setup lang="ts">
defineProps<{
    errorIgnorable: boolean
    skippable: boolean
    retryable: boolean
}>()

defineEmits<{
    'update:errorIgnorable': [value: boolean]
    'update:skippable': [value: boolean]
    'update:retryable': [value: boolean]
}>()
</script>
