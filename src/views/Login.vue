<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">工作流平台</h2>
        <div class="mt-2 text-center" v-if="registrationEnabled">
            <span class="text-sm text-gray-600">没有账号？ </span>
            <router-link to="/register" class="font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out">
                立即注册
            </router-link>
        </div>
      </div>

      <!-- Login Mode Tabs -->
      <div class="flex border-b border-gray-200">
        <button 
          @click="loginMode = 'password'" 
          :class="['flex-1 py-2 px-4 text-center font-medium text-sm transition-colors', loginMode === 'password' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700']"
        >
          账号密码登录
        </button>
        <button 
          v-if="feishuLoginEnabled"
          @click="loginMode = 'qrcode'" 
          :class="['flex-1 py-2 px-4 text-center font-medium text-sm transition-colors', loginMode === 'qrcode' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700']"
        >
          飞书扫码登录
        </button>
      </div>

      <!-- Password Login Form -->
      <form v-if="loginMode === 'password'" class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <input type="hidden" name="remember" value="true" />
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="username" class="sr-only">用户名</label>
            <input id="username" name="username" type="text" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="用户名" v-model="username" />
          </div>
          <div>
            <label for="password" class="sr-only">密码</label>
            <input id="password" name="password" type="password" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="密码" v-model="password" />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input id="remember-me" name="remember-me" type="checkbox" v-model="rememberMe" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900"> 记住我 </label>
          </div>

          <div class="text-sm">
            <a href="#" class="font-medium text-blue-600 hover:text-blue-500"> 忘记密码？ </a>
          </div>
        </div>

        <div>
          <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out">
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <!-- Lock Icon -->
              <svg class="h-5 w-5 text-blue-500 group-hover:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
              </svg>
            </span>
            登录
          </button>
        </div>

        <!-- Divider & Feishu Login Button (only when enabled) -->
        <template v-if="feishuLoginEnabled">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">或使用以下方式登录</span>
          </div>
        </div>

        <!-- Feishu Login Button -->
        <div>
          <button @click="handleFeishuLogin" type="button" class="group relative w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 4.5L11 8.5V15.5L4.5 11.5V4.5Z" fill="#00D6B9"/>
              <path d="M11 8.5L19.5 4.5V11.5L11 15.5V8.5Z" fill="#3370FF"/>
              <path d="M4.5 11.5L11 15.5V19.5L4.5 15.5V11.5Z" fill="#00D6B9"/>
              <path d="M11 15.5L19.5 11.5V15.5L11 19.5V15.5Z" fill="#3370FF"/>
            </svg>
            使用飞书登录
          </button>
        </div>
        </template>
      </form>

      <!-- QR Code Login (only when Feishu is enabled) -->
      <div v-else-if="feishuLoginEnabled" class="mt-8 space-y-6">
        <div class="text-center text-sm text-gray-500 mb-4">
          请使用飞书 App 扫描二维码登录
        </div>
        <!-- QR Code Container -->
        <div class="flex justify-center">
          <div id="feishu-qr-container" class="w-[300px] h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
            <div v-if="qrLoading" class="text-gray-400">
              <svg class="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        </div>
        <div class="text-center text-xs text-gray-400">
          扫码后请在手机上确认登录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const authStore = useAuthStore()
const loginMode = ref<'password' | 'qrcode'>('password')
const qrLoading = ref(true)
const feishuLoginEnabled = ref(false)
const registrationEnabled = ref(true)
const gotoUrl = ref('')

declare global {
  interface Window {
    QRLogin: (options: {
      id: string
      goto: string
      width: string
      height: string
      style?: string
    }) => void
  }
}

const handleLogin = async () => {
  await authStore.login({ username: username.value, password: password.value, rememberMe: rememberMe.value })
}

const handleFeishuLogin = async () => {
  await authStore.loginWithFeishu()
}

// Load Feishu QR SDK
const loadFeishuQRSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.QRLogin) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://lf-package-cn.feishucdn.com/obj/feishu-static/lark/passport/qrcode/LarkSSOSDKWebQRCode-1.0.3.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Feishu QR SDK'))
    document.head.appendChild(script)
  })
}

// Initialize QR code login
const initQRLogin = async () => {
  qrLoading.value = true
  
  try {
    // Load SDK
    await loadFeishuQRSDK()
    
    // Get QR login URL from backend
    const response = await axios.get('/api/auth/feishu/qr_login_url/')
    gotoUrl.value = response.data.goto_url
    
    // Initialize QR code
    window.QRLogin({
      id: 'feishu-qr-container',
      goto: gotoUrl.value,
      width: '300',
      height: '300',
      style: 'border:none;background-color:#FFFFFF;'
    })
    
    qrLoading.value = false
  } catch (error) {
    console.error('Failed to initialize QR login:', error)
    qrLoading.value = false
  }
}

// Handle message from QR code iframe
const handleQRMessage = async (event: MessageEvent) => {
  // Verify origin is from Feishu
  if (!event.origin.includes('feishu.cn') && !event.origin.includes('larksuite.com')) {
    return
  }
  
  const data = event.data
  console.log('Received QR message:', data, 'from origin:', event.origin)
  
  // Extract tmp_code - can be string or object {tmp_code, source}
  let tmpCode: string | null = null
  if (typeof data === 'string' && data.length > 0) {
    tmpCode = data
  } else if (data && typeof data === 'object' && data.tmp_code) {
    tmpCode = data.tmp_code
  }
  
  if (tmpCode) {
    // Redirect to Feishu with tmp_code to complete authorization
    const redirectUrl = `${gotoUrl.value}&tmp_code=${encodeURIComponent(tmpCode)}`
    console.log('Redirecting to:', redirectUrl)
    window.location.href = redirectUrl
  }
}


// Watch for login mode changes
watch(loginMode, (newMode) => {
  if (newMode === 'qrcode') {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      initQRLogin()
    }, 100)
  }
})

onMounted(async () => {
  window.addEventListener('message', handleQRMessage)
  
  // Load saved credentials if "Remember Me" was checked previously
  const saved = authStore.getSavedCredentials()
  if (saved) {
    username.value = saved.username
    password.value = saved.password
    rememberMe.value = true
  }
  
  // Check if Feishu login is enabled and if registration is enabled
  try {
    const [feishuRes, regRes] = await Promise.all([
      axios.get('/api/platform/feishu-login-status/'),
      axios.get('/api/platform/registration-status/'),
    ])
    feishuLoginEnabled.value = feishuRes.data.login_enabled
    registrationEnabled.value = regRes.data.registration_enabled
  } catch (e) {
    feishuLoginEnabled.value = false
    registrationEnabled.value = true
  }
  
  // If starting with QR mode, initialize it
  if (loginMode.value === 'qrcode' && feishuLoginEnabled.value) {
    initQRLogin()
  }
})

onUnmounted(() => {
  window.removeEventListener('message', handleQRMessage)
})
</script>
