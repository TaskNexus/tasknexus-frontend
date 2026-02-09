<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl text-center">
      <div v-if="loading">
        <svg class="animate-spin h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-gray-600">正在登录中...</p>
      </div>
      <div v-else-if="error">
        <div class="text-red-600 mb-4">
          <svg class="h-10 w-10 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-gray-800 font-medium">登录失败</p>
        <p class="text-gray-600 text-sm mt-2">{{ error }}</p>
        <router-link to="/login" class="mt-4 inline-block text-blue-600 hover:text-blue-500">
          返回登录页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const code = route.query.code as string
  
  if (!code) {
    error.value = '授权码缺失'
    loading.value = false
    return
  }

  try {
    const success = await authStore.handleFeishuCallback(code)
    if (!success) {
      error.value = '登录验证失败'
    }
  } catch (e: any) {
    error.value = e.message || '登录过程中发生错误'
  } finally {
    loading.value = false
  }
})
</script>
