<template>
  <div class="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-white">
    <div class="text-sm text-gray-500">
      共 {{ total }} 条
    </div>
    <div class="flex items-center space-x-2 text-sm">
      <span class="text-gray-500">每页</span>
      <select
        :value="pageSize"
        @change="handlePageSizeChange"
        class="h-8 border border-gray-200 rounded px-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500 bg-white"
      >
        <option v-for="size in normalizedPageSizeOptions" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
      <button
        class="h-8 px-3 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="currentPage <= 1"
        @click="emit('update:currentPage', currentPage - 1)"
      >
        上一页
      </button>
      <span class="text-gray-500 min-w-16 text-center">
        {{ currentPage }} / {{ totalPages }}
      </span>
      <button
        class="h-8 px-3 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="currentPage >= totalPages"
        @click="emit('update:currentPage', currentPage + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  total: number
  currentPage: number
  pageSize: number
  pageSizeOptions?: number[]
}>(), {
  pageSizeOptions: () => [10, 20, 50, 100]
})

const emit = defineEmits<{
  (e: 'update:currentPage', value: number): void
  (e: 'update:pageSize', value: number): void
}>()

const normalizedPageSizeOptions = computed(() => {
  if (!props.pageSizeOptions.length) {
    return [10, 20, 50, 100]
  }
  return props.pageSizeOptions
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.total / props.pageSize))
})

const handlePageSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = Number(target.value)
  if (!Number.isFinite(value) || value <= 0) return
  emit('update:pageSize', value)
}
</script>
