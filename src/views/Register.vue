<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">

      <!-- Registration disabled message -->
      <div v-if="!canRegister && !loading" class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">注册未开放</h2>
        <p class="text-gray-500 mb-6">当前平台未开放手动注册，请联系管理员获取邀请链接。</p>
        <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out">
          返回登录
        </router-link>
      </div>

      <!-- Invalid invite message -->
      <div v-else-if="inviteError" class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">邀请链接无效</h2>
        <p class="text-red-500 mb-6">{{ inviteError }}</p>
        <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out">
          返回登录
        </router-link>
      </div>

      <!-- Loading -->
      <div v-else-if="loading" class="text-center py-8">
        <svg class="animate-spin h-8 w-8 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Registration form -->
      <template v-else>
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">创建账号</h2>
          <p v-if="inviteToken" class="mt-2 text-center text-sm text-green-600">
            通过邀请链接注册
          </p>
          <p class="mt-2 text-center text-sm text-gray-600">
            已有账号？
            <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out">
              登录
            </router-link>
          </p>
        </div>
        <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
          <div class="space-y-4">
            <!-- Username -->
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700">用户名</label>
              <input id="username" name="username" type="text" required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="输入用户名" v-model="form.username" />
            </div>

            <!-- Email + Send Code -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">邮箱</label>
              <div class="mt-1 flex gap-2">
                <input id="email" name="email" type="email" required
                  class="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="输入邮箱地址" v-model="form.email" :disabled="emailVerified" />
                <button type="button" @click="sendCode"
                  :disabled="codeCooldown > 0 || !form.email || sendingCode || emailVerified"
                  class="whitespace-nowrap px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out">
                  <template v-if="sendingCode">发送中...</template>
                  <template v-else-if="codeCooldown > 0">{{ codeCooldown }}s</template>
                  <template v-else-if="emailVerified">已验证</template>
                  <template v-else>发送验证码</template>
                </button>
              </div>
            </div>

            <!-- Verification Code -->
            <div v-if="codeSent && !emailVerified">
              <label for="code" class="block text-sm font-medium text-gray-700">验证码</label>
              <div class="mt-1 flex gap-2">
                <input id="code" name="code" type="text" required maxlength="6"
                  class="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="输入6位验证码" v-model="verificationCode" />
                <button type="button" @click="verifyCode" :disabled="verificationCode.length !== 6 || verifyingCode"
                  class="whitespace-nowrap px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out">
                  {{ verifyingCode ? '验证中...' : '验证' }}
                </button>
              </div>
            </div>

            <!-- Verified badge -->
            <div v-if="emailVerified" class="flex items-center gap-2 text-green-600 text-sm font-medium">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              邮箱已验证
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">密码</label>
              <input id="password" name="password" type="password" required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="输入密码" v-model="form.password" />
            </div>
          </div>

          <!-- Error message -->
          <div v-if="errorMsg" class="text-red-500 text-sm text-center">{{ errorMsg }}</div>

          <div>
            <button type="submit" :disabled="!emailVerified || registering"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out">
              {{ registering ? '注册中...' : '注册' }}
            </button>
          </div>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const form = reactive({
  username: '',
  email: '',
  password: ''
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// State
const loading = ref(true)
const canRegister = ref(true)
const inviteToken = ref<string | null>(null)
const inviteError = ref('')
const codeSent = ref(false)
const codeCooldown = ref(0)
const sendingCode = ref(false)
const verificationCode = ref('')
const verifyingCode = ref(false)
const emailVerified = ref(false)
const registering = ref(false)
const errorMsg = ref('')
let cooldownTimer: number | null = null

onMounted(async () => {
  const invite = route.query.invite as string | undefined

  if (invite) {
    // Validate invite token
    inviteToken.value = invite
    try {
      const { data } = await axios.get(`/api/platform/invites/validate/?token=${invite}`)
      if (!data.valid) {
        inviteError.value = data.detail || '邀请链接无效'
        canRegister.value = false
      }
    } catch (e) {
      inviteError.value = '邀请链接验证失败'
      canRegister.value = false
    }
  } else {
    // Check registration toggle
    try {
      const { data } = await axios.get('/api/platform/registration-status/')
      canRegister.value = data.registration_enabled
    } catch (e) {
      canRegister.value = true // default open if API fails
    }
  }
  loading.value = false
})

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

const sendCode = async () => {
  if (!form.email) return
  sendingCode.value = true
  errorMsg.value = ''
  try {
    await axios.post('/api/auth/send-verification-code/', { email: form.email })
    codeSent.value = true
    codeCooldown.value = 60
    cooldownTimer = window.setInterval(() => {
      codeCooldown.value--
      if (codeCooldown.value <= 0) {
        if (cooldownTimer) clearInterval(cooldownTimer)
      }
    }, 1000)
  } catch (e: any) {
    errorMsg.value = e.response?.data?.detail || '发送验证码失败'
  } finally {
    sendingCode.value = false
  }
}

const verifyCode = async () => {
  verifyingCode.value = true
  errorMsg.value = ''
  try {
    const { data } = await axios.post('/api/auth/verify-code/', {
      email: form.email,
      code: verificationCode.value,
    })
    if (data.verified) {
      emailVerified.value = true
    } else {
      errorMsg.value = data.detail || '验证失败'
    }
  } catch (e: any) {
    errorMsg.value = e.response?.data?.detail || '验证码校验失败'
  } finally {
    verifyingCode.value = false
  }
}

const handleRegister = async () => {
  if (!emailVerified.value) return
  registering.value = true
  errorMsg.value = ''
  try {
    const payload: any = { ...form }
    if (inviteToken.value) {
      payload.invite_token = inviteToken.value
    }
    await axios.post('/api/auth/register/', payload)
    alert('注册成功，请登录')
    router.push('/login')
  } catch (e: any) {
    const detail = e.response?.data?.detail
    const fieldErrors = e.response?.data
    if (detail) {
      errorMsg.value = detail
    } else if (fieldErrors && typeof fieldErrors === 'object') {
      // DRF field-level errors like { username: ["..."] }
      const msgs = Object.values(fieldErrors).flat()
      errorMsg.value = msgs.join('; ')
    } else {
      errorMsg.value = '注册失败，请重试'
    }
  } finally {
    registering.value = false
  }
}
</script>
