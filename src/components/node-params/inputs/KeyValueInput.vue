<template>
    <div class="space-y-2">
        <div
            v-for="(pair, index) in pairs"
            :key="index"
            class="flex items-center gap-2 group"
        >
            <input
                type="text"
                :value="pair.key"
                placeholder="Key"
                class="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                @input="updatePair(index, 'key', ($event.target as HTMLInputElement).value)"
            />
            <input
                type="text"
                :value="pair.value"
                placeholder="Value"
                class="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                @input="updatePair(index, 'value', ($event.target as HTMLInputElement).value)"
            />
            <button
                type="button"
                class="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove"
                @click="removePair(index)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>
        </div>

        <div
            v-if="pairs.length === 0"
            class="text-xs text-gray-400 py-2 text-center border border-dashed border-gray-200 rounded"
        >
            No parameters added
        </div>

        <button
            type="button"
            class="w-full py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
            @click="addPair"
        >
            + Add parameter
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface KeyValuePair {
    key: string
    value: string
}

const props = defineProps<{
    modelValue?: Array<Record<string, any>> | Record<string, any>
}>()

const emit = defineEmits<{
    'update:modelValue': [value: KeyValuePair[]]
}>()

const normalizePairs = (value: unknown): KeyValuePair[] => {
    if (Array.isArray(value)) {
        return value
            .filter((item): item is Record<string, any> => !!item && typeof item === 'object')
            .map((item) => ({
                key: String(item.key ?? ''),
                value: String(item.value ?? ''),
            }))
    }

    if (value && typeof value === 'object') {
        return Object.entries(value as Record<string, any>).map(([key, val]) => ({
            key: String(key),
            value: String(val ?? ''),
        }))
    }

    return []
}

const pairs = computed(() => normalizePairs(props.modelValue))

const updatePair = (index: number, field: 'key' | 'value', fieldValue: string) => {
    const next = pairs.value.map((item, i) => {
        if (i === index) {
            return { ...item, [field]: fieldValue }
        }
        return item
    })
    emit('update:modelValue', next)
}

const addPair = () => {
    emit('update:modelValue', [...pairs.value, { key: '', value: '' }])
}

const removePair = (index: number) => {
    const next = [...pairs.value]
    next.splice(index, 1)
    emit('update:modelValue', next)
}
</script>
