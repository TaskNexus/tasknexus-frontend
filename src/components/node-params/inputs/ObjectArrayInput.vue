<template>
    <div class="space-y-2">
        <div 
            v-for="(item, index) in items" 
            :key="index"
            class="flex items-start gap-2 group"
        >
            <div class="flex-1 grid gap-2" :style="gridStyle">
                <div v-for="field in fields" :key="field.key">
                    <input
                        type="text"
                        :value="item[field.key] ?? ''"
                        :placeholder="field.description || field.key"
                        @input="updateField(index, field.key, ($event.target as HTMLInputElement).value)"
                        class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>
            <button
                type="button"
                @click="removeItem(index)"
                class="mt-1 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="删除"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>

        <!-- Header hint when list is empty -->
        <div v-if="items.length === 0" class="text-xs text-gray-400 py-2 text-center border border-dashed border-gray-200 rounded">
            暂无数据，点击下方按钮添加
        </div>

        <!-- Add button -->
        <button
            type="button"
            @click="addItem"
            class="w-full py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
            + 添加一项
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface FieldDef {
    key: string
    description?: string
    type?: string
}

const props = defineProps<{
    modelValue: Record<string, any>[]
    schema?: {
        items?: {
            properties?: Record<string, { description?: string; type?: string }>
        }
        [key: string]: any
    }
}>()

const emit = defineEmits<{
    'update:modelValue': [value: Record<string, any>[]]
}>()

const fields = computed<FieldDef[]>(() => {
    const properties = props.schema?.items?.properties
    if (properties && typeof properties === 'object') {
        return Object.entries(properties).map(([key, val]) => ({
            key,
            description: val?.description || key,
            type: val?.type || 'string',
        }))
    }
    // Fallback: infer fields from first item
    if (props.modelValue && props.modelValue.length > 0) {
        return Object.keys(props.modelValue[0]).map(key => ({
            key,
            description: key,
            type: 'string',
        }))
    }
    return []
})

const gridStyle = computed(() => ({
    gridTemplateColumns: `repeat(${fields.value.length || 1}, minmax(0, 1fr))`,
}))

const items = computed(() => props.modelValue || [])

const addItem = () => {
    const newItem: Record<string, any> = {}
    for (const field of fields.value) {
        newItem[field.key] = ''
    }
    emit('update:modelValue', [...items.value, newItem])
}

const removeItem = (index: number) => {
    const newList = [...items.value]
    newList.splice(index, 1)
    emit('update:modelValue', newList)
}

const updateField = (index: number, key: string, value: string) => {
    const newList = items.value.map((item, i) => {
        if (i === index) {
            return { ...item, [key]: value }
        }
        return item
    })
    emit('update:modelValue', newList)
}
</script>
