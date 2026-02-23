<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button @click="$router.back()" class="text-gray-500 hover:text-gray-700">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
        </button>
        <h1 class="text-xl font-bold text-gray-800">平台设置</h1>
    </header>

    <div class="flex-1 overflow-auto p-6">
        <div class="max-w-4xl mx-auto space-y-8">
            
            <!-- Feishu Integration -->
            <section class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4 pb-2 border-b cursor-pointer select-none" @click="toggleSection('feishu')">
                    <h2 class="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <component :is="collapsedSections.feishu ? ChevronRight : ChevronDown" class="w-5 h-5 text-gray-500" />
                        飞书集成
                    </h2>
                </div>
                
                <div v-show="!collapsedSections.feishu" class="space-y-4">
                    <p class="text-sm text-gray-500">配置飞书应用凭证，用于 OAuth 登录、通知推送和用户列表获取。</p>
                    
                    <!-- Login Enabled Toggle -->
                    <div class="flex items-center justify-between py-2">
                        <div>
                            <label class="text-sm font-medium text-gray-700">启用飞书登录</label>
                            <p class="text-xs text-gray-400">开启后登录页会显示飞书登录入口</p>
                        </div>
                        <button 
                            @click="feishuForm.login_enabled = !feishuForm.login_enabled"
                            :class="[
                                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                                feishuForm.login_enabled ? 'bg-blue-600' : 'bg-gray-300'
                            ]"
                        >
                            <span 
                                :class="[
                                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                    feishuForm.login_enabled ? 'translate-x-6' : 'translate-x-1'
                                ]"
                            />
                        </button>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">App ID</label>
                        <input 
                            v-model="feishuForm.app_id" 
                            type="text" 
                            placeholder="cli_xxxxxxxxx"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">App Secret</label>
                        <input 
                            v-model="feishuForm.app_secret" 
                            type="password" 
                            placeholder="输入新的 App Secret（留空保持不变）"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                        />
                        <p v-if="maskedSecret" class="mt-1 text-xs text-gray-400">当前值: {{ maskedSecret }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Redirect URI</label>
                        <input 
                            v-model="feishuForm.redirect_uri" 
                            type="text" 
                            placeholder="http://your-domain/feishu-callback"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                        />
                        <p class="mt-1 text-xs text-gray-400">飞书 OAuth 回调地址，需与飞书开放平台配置一致</p>
                    </div>
                    
                    <div class="flex justify-end">
                        <button 
                            @click="saveFeishuConfig" 
                            :disabled="savingFeishu"
                            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {{ savingFeishu ? '保存中...' : '保存飞书配置' }}
                        </button>
                    </div>
                </div>
            </section>

        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'

// Section collapse state
const collapsedSections = reactive({
    feishu: false,
})

const toggleSection = (section: keyof typeof collapsedSections) => {
    collapsedSections[section] = !collapsedSections[section]
}

// Feishu config state
const feishuForm = ref({
    app_id: '',
    app_secret: '',
    redirect_uri: '',
    login_enabled: false,
})
const maskedSecret = ref('')
const savingFeishu = ref(false)

const fetchConfig = async () => {
    try {
        const { data } = await axios.get('/api/platform/config/')
        if (data.feishu) {
            feishuForm.value.app_id = data.feishu.app_id || ''
            feishuForm.value.redirect_uri = data.feishu.redirect_uri || ''
            feishuForm.value.login_enabled = data.feishu.login_enabled || false
            // Store the masked secret for display, don't put it in the form
            maskedSecret.value = data.feishu.app_secret || ''
            feishuForm.value.app_secret = ''
        }
    } catch (e: any) {
        if (e.response?.status === 403) {
            alert('无权限访问平台设置，请使用管理员账号')
        } else {
            console.error("Failed to fetch platform config", e)
        }
    }
}

const saveFeishuConfig = async () => {
    savingFeishu.value = true
    try {
        const payload: any = {
            feishu: {
                app_id: feishuForm.value.app_id,
                redirect_uri: feishuForm.value.redirect_uri,
                login_enabled: feishuForm.value.login_enabled,
            }
        }
        // Only send app_secret if user typed a new one
        if (feishuForm.value.app_secret) {
            payload.feishu.app_secret = feishuForm.value.app_secret
        } else {
            // Send the masked value so backend knows not to overwrite
            payload.feishu.app_secret = maskedSecret.value
        }

        const { data } = await axios.put('/api/platform/config/', payload)
        
        // Update masked display
        if (data.feishu) {
            maskedSecret.value = data.feishu.app_secret || ''
            feishuForm.value.app_secret = ''
        }
        alert('飞书配置保存成功')
    } catch (e: any) {
        console.error("Failed to save feishu config", e)
        alert(e.response?.data?.detail || '保存失败')
    } finally {
        savingFeishu.value = false
    }
}

onMounted(() => {
    fetchConfig()
})
</script>
