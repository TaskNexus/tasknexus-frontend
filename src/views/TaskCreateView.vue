<template>
  <div class="flex flex-col h-full bg-slate-50">
    <!-- Header -->
    <div class="px-6 py-4 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between">
      <div class="flex items-center space-x-2 text-sm">
        <router-link to="/workflows" class="text-gray-500 hover:text-blue-600">工作流</router-link>
        <span class="text-gray-300">/</span>
        <span class="text-gray-500">{{ workflowName || (isEditMode ? '编辑任务' : '新建任务') }}</span>
        <span class="text-gray-300">/</span>
        <span class="font-medium text-gray-900">{{ pageTitle }}</span>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <div class="max-w-3xl mx-auto space-y-6">
        
        <!-- Basic Info Module -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">基本信息</h2>
            <div class="space-y-4">
                <!-- Workflow Selection -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">工作流</label>
                    <select 
                        v-model="selectedWorkflowId" 
                        @change="onWorkflowChange"
                        class="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border bg-white"
                        :disabled="!!routeWorkflowId"
                    >
                        <option value="" disabled>选择工作流</option>
                        <option v-for="w in workflows" :key="w.id" :value="w.id">
                            {{ w.name }}
                        </option>
                    </select>
                        <p v-if="routeWorkflowId" class="text-xs text-gray-400 mt-1">
                        Pre-selected from URL. <router-link to="/tasks/create" class="text-blue-500 hover:underline">Clear</router-link>
                    </p>
                </div>

                <!-- Task Name -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">任务名称</label>
                    <div class="flex items-center gap-2">
                        <input 
                        v-model="taskName" 
                        type="text" 
                        class="flex-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                        placeholder="e.g. Daily Processing"
                        />
                        <button 
                            @click="generateTaskName" 
                            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md text-sm border border-gray-200"
                            title="Generate random name"
                        >
                            Auto
                        </button>
                    </div>
                </div>

                    <!-- Task Type -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">任务类型</label>
                    <div class="flex bg-gray-100 p-1 rounded-md">
                        <button 
                            v-for="type in taskTypes" 
                            :key="type.value"
                            class="flex-1 px-3 py-1.5 text-xs font-medium rounded transition-all"
                            :class="[selectedTaskType === type.value ? 'bg-white text-blue-600 shadow ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700', isEditMode ? 'opacity-50 cursor-not-allowed' : '']"
                            @click="!isEditMode && (selectedTaskType = type.value)"
                        >
                            {{ type.label }}
                        </button>
                    </div>
                </div>

                <!-- Conditional Config: Periodic -->
                <div v-if="selectedTaskType === 'periodic'" class="p-4 bg-blue-50 rounded border border-blue-100 space-y-3">
                    <div>
                        <label class="block text-xs font-bold text-blue-800 mb-1 uppercase tracking-wide">Cron 表达式</label>
                        <input 
                        v-model="cronExpression" 
                        type="text" 
                        class="w-full border-blue-200 rounded focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-sm font-mono border"
                        placeholder="*/5 * * * *"
                        />
                    </div>
                    <div class="bg-white rounded border border-blue-100 p-3">
                        <p class="text-xs font-medium text-blue-700 mb-2">可视化编辑器</p>
                        <CronLight
                            :model-value="cronExpression"
                            format="crontab"
                            locale="zh"
                            @update:model-value="handleCronModelUpdate"
                            @error="handleCronEditorError"
                        />
                        <p v-if="cronUiError" class="mt-2 text-xs text-red-600">{{ cronUiError }}</p>
                    </div>
                    <div v-if="cronDescription" class="flex items-center gap-1.5 text-xs px-1">
                        <span class="text-green-600">⏱</span>
                        <span class="text-gray-700">{{ cronDescription }}</span>
                    </div>
                </div>

                <!-- Conditional Config: Scheduled -->
                <div v-if="selectedTaskType === 'scheduled'" class="p-4 bg-purple-50 rounded border border-purple-100">
                        <label class="block text-xs font-bold text-purple-800 mb-1 uppercase tracking-wide">执行时间</label>
                        <input 
                        v-model="planTime" 
                        type="datetime-local" 
                        class="w-full border-purple-200 rounded focus:border-purple-500 focus:ring-purple-500 px-3 py-2 text-sm border"
                        />
                </div>

                <!-- Conditional Config: Webhook -->
                <div v-if="selectedTaskType === 'webhook'" class="p-4 bg-green-50 rounded border border-green-100">
                        <label class="block text-xs font-bold text-green-800 mb-1 uppercase tracking-wide">Webhook Secret (可选)</label>
                        <input 
                        v-model="webhookSecret" 
                        type="text" 
                        class="w-full border-green-200 rounded focus:border-green-500 focus:ring-green-500 px-3 py-2 text-sm border font-mono"
                        placeholder="留空则不验证"
                        />
                        <p class="text-xs text-green-600 mt-1">External systems must include this secret in X-Webhook-Secret header</p>
                </div>

            </div>
        </div>

        <!-- Parameters Module -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
                <span>任务参数</span>
                <span class="text-xs font-normal text-gray-500">变量将被注入到工作流中</span>
            </h2>
            
            <div v-if="!selectedWorkflowId" class="text-center py-8">
                    <div class="mx-auto w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>
                    <p class="text-sm text-gray-500">选择工作流以配置参数。</p>
            </div>

            <div v-else-if="loadingParams" class="text-center py-8">
                    <Loader2 class="w-6 h-6 animate-spin mx-auto text-blue-500" />
                    <p class="text-xs text-gray-500 mt-2">加载中...</p>
            </div>
            
            <div v-else-if="allParams.length === 0" class="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-200">
                    <p class="text-sm text-gray-500">没有可配置的参数</p>
            </div>
            
            <div v-else class="space-y-4">
                <div v-for="param in allParams" :key="param.key" class="grid grid-cols-12 gap-4 items-start p-3 rounded hover:bg-gray-50 transition-colors border border-gray-100">
                        <!-- Key Info -->
                        <div class="col-span-4">
                            <div class="flex items-center flex-wrap gap-2">
                                <span class="font-mono text-sm font-medium text-gray-700 break-all">{{ param.key }}</span>
                                <div>
                                    <span v-if="param.source === 'global'" class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded uppercase tracking-wide">Project</span>
                                    <span v-else class="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded uppercase tracking-wide">Workflow</span>
                                </div>
                                <span class="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">
                                    {{ paramTypeLabels[param.inputType] || '文本' }}
                                </span>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">{{ param.description || 'No description provided' }}</p>
                        </div>
                        
                        <!-- Value Input -->
                        <div class="col-span-8 space-y-2">
                            <template v-if="param.inputType === 'single-select'">
                                <select
                                  v-if="param.options.length > 0"
                                  v-model="param.runtimeValue"
                                  class="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-sm border bg-white"
                                >
                                    <option value="">请选择</option>
                                    <option v-for="(opt, idx) in param.options" :key="`single-${param.key}-${idx}`" :value="opt.value">
                                        {{ opt.label || opt.value }}
                                    </option>
                                </select>
                                <input
                                  v-else
                                  v-model="param.runtimeValue"
                                  type="text"
                                  class="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-sm border"
                                  :placeholder="typeof param.value === 'string' ? param.value : ''"
                                />
                            </template>

                            <template v-else-if="param.inputType === 'multi-select'">
                                <div v-if="param.options.length > 0" class="space-y-1 border border-gray-200 rounded-md p-2 bg-gray-50">
                                    <label
                                      v-for="(opt, idx) in param.options"
                                      :key="`multi-${param.key}-${idx}`"
                                      class="flex items-center gap-2 text-sm text-gray-700"
                                    >
                                        <input
                                          type="checkbox"
                                          :value="opt.value"
                                          :checked="Array.isArray(param.runtimeValue) && param.runtimeValue.includes(opt.value)"
                                          @change="toggleMultiParamValue(param, opt.value)"
                                          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>{{ opt.label || opt.value }}</span>
                                    </label>
                                </div>
                                <div v-else class="text-xs text-orange-500">未配置可选项，可在流程参数详情页中补充选项。</div>
                            </template>

                            <template v-else-if="param.inputType === 'git-branch'">
                                <div class="space-y-2">
                                    <div class="flex items-center gap-2">
                                        <select
                                          v-model="param.runtimeValue"
                                          class="flex-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-sm border bg-white"
                                          :disabled="param.loadingBranches || param.branchOptions.length === 0"
                                        >
                                            <option value="">{{ param.loadingBranches ? '加载分支中...' : '请选择分支' }}</option>
                                            <option
                                              v-for="(branch, idx) in param.branchOptions"
                                              :key="`branch-${param.key}-${idx}`"
                                              :value="branch.name"
                                            >
                                                {{ branch.name }}{{ branch.is_default ? ' (default)' : '' }}
                                            </option>
                                        </select>
                                        <button
                                          type="button"
                                          @click="refreshGitBranches(param)"
                                          class="px-3 py-2 text-xs text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-md disabled:opacity-50"
                                          :disabled="param.loadingBranches"
                                        >
                                            <Loader2 v-if="param.loadingBranches" class="w-3 h-3 animate-spin" />
                                            <span v-else>刷新</span>
                                        </button>
                                    </div>
                                    <input
                                      v-model="param.runtimeValue"
                                      type="text"
                                      class="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-sm border"
                                      placeholder="可手动输入分支名（接口失败时兜底）"
                                    />
                                    <p v-if="param.branchError" class="text-xs text-orange-500">{{ param.branchError }}</p>
                                </div>
                            </template>

                            <template v-else>
                                <input 
                                  v-model="param.runtimeValue" 
                                  type="text" 
                                  class="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-sm border"
                                  :placeholder="typeof param.value === 'string' ? param.value : ''"
                                />
                            </template>

                            <div class="flex justify-between mt-1">
                                <span class="text-xs text-gray-400">Default: {{ formatParamDefaultValue(param) }}</span>
                                <span v-if="isParamModified(param)" class="text-xs text-orange-500 font-medium">Modified</span>
                            </div>
                        </div>
                </div>
            </div>
        </div>

        <!-- Notification Settings Module -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
                <span>通知设置</span>
            </h2>

            <!-- Feishu Notification -->
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-gray-700">飞书通知</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" v-model="feishuNotifyEnabled" class="sr-only peer">
                        <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                <div v-if="feishuNotifyEnabled" class="space-y-3">
                    <div>
                        <label class="block text-xs text-gray-500 mb-2">飞书用户（无需注册平台）</label>
                        <div ref="feishuDropdownRef" class="relative">
                            <button
                                type="button"
                                class="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm flex items-center justify-between gap-2 text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                @click="feishuDropdownOpen = !feishuDropdownOpen"
                            >
                                <span class="truncate text-gray-700">{{ feishuSelectionSummary }}</span>
                                <svg
                                    class="w-4 h-4 text-gray-400 transition-transform"
                                    :class="feishuDropdownOpen ? 'rotate-180' : ''"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.512a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                                </svg>
                            </button>
                            <div
                                v-if="feishuDropdownOpen"
                                class="absolute z-20 mt-1 w-full border border-gray-200 rounded-md bg-white shadow-lg"
                            >
                                <div class="p-2 border-b border-gray-100">
                                    <input
                                        v-model="feishuUserSearch"
                                        type="text"
                                        class="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="搜索飞书用户"
                                    />
                                </div>
                                <div class="max-h-80 overflow-y-auto p-1">
                                    <div v-if="loadingFeishuUsers" class="text-center py-3">
                                        <Loader2 class="w-4 h-4 animate-spin mx-auto text-blue-500" />
                                    </div>
                                    <template v-else-if="feishuUserList.length > 0">
                                        <div class="sticky top-0 z-10 bg-white border-b border-gray-100 px-2 py-2 mb-1 rounded-sm">
                                            <div class="flex items-center justify-between gap-2 text-xs text-gray-500">
                                                <span>显示 {{ filteredFeishuUsers.length }} / {{ feishuUserList.length }}，已选 {{ feishuNotifyOpenIds.length }}</span>
                                                <div class="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        class="text-blue-600 hover:text-blue-700 disabled:text-gray-300"
                                                        :disabled="filteredFeishuUsers.length === 0"
                                                        @click.stop="selectAllFilteredFeishuUsers"
                                                    >
                                                        全选筛选
                                                    </button>
                                                    <button
                                                        type="button"
                                                        class="text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                                                        :disabled="feishuNotifyOpenIds.length === 0 || filteredFeishuUsers.length === 0"
                                                        @click.stop="clearFilteredFeishuUsersSelection"
                                                    >
                                                        清空筛选
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="mt-1 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    class="text-xs text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                                                    :disabled="!hasCollapsedFeishuGroups"
                                                    @click.stop="setFeishuGroupsCollapsed(false)"
                                                >
                                                    展开全部
                                                </button>
                                                <button
                                                    type="button"
                                                    class="text-xs text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                                                    :disabled="!hasExpandedFeishuGroups"
                                                    @click.stop="setFeishuGroupsCollapsed(true)"
                                                >
                                                    折叠全部
                                                </button>
                                            </div>
                                        </div>

                                        <div v-if="groupedFeishuUsers.length === 0" class="text-center py-3">
                                            <p class="text-sm text-gray-500">无匹配用户</p>
                                        </div>
                                        <div v-else class="space-y-1">
                                            <div
                                                v-for="group in groupedFeishuUsers"
                                                :key="group.key"
                                                class="border border-gray-100 rounded-md"
                                            >
                                                <button
                                                    type="button"
                                                    class="w-full flex items-center gap-2 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-left"
                                                    @click.stop="toggleFeishuGroup(group.key)"
                                                >
                                                    <svg
                                                        class="w-3.5 h-3.5 text-gray-500 transition-transform"
                                                        :class="isFeishuGroupCollapsed(group.key) ? '-rotate-90' : 'rotate-0'"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                        aria-hidden="true"
                                                    >
                                                        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.512a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                                                    </svg>
                                                    <span class="text-xs font-medium text-gray-700">{{ group.key }}</span>
                                                    <span class="ml-auto text-[11px] text-gray-500">{{ group.selectedCount }}/{{ group.users.length }}</span>
                                                </button>
                                                <div v-show="!isFeishuGroupCollapsed(group.key)" class="p-1 space-y-0.5">
                                                    <button
                                                        v-for="user in group.users"
                                                        :key="user.open_id"
                                                        type="button"
                                                        class="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-left"
                                                        @click.stop="toggleFeishuUser(user.open_id)"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                                                            :checked="feishuNotifyOpenIds.includes(user.open_id)"
                                                            readonly
                                                        />
                                                        <span class="text-sm text-gray-700 truncate">{{ user.name }}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                    <div v-else class="text-center py-3">
                                        <div v-if="feishuApiError" class="bg-amber-50 border border-amber-200 rounded p-2">
                                            <p class="text-xs text-amber-700 font-medium">{{ feishuApiError }}</p>
                                            <p v-if="feishuApiHint" class="text-xs text-amber-600 mt-0.5">{{ feishuApiHint }}</p>
                                        </div>
                                        <p v-else class="text-sm text-gray-500">无法获取飞书用户列表</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <p v-else class="text-xs text-gray-400">直接通知飞书用户，无需平台账号</p>
            </div>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-6 pb-2">
            <button 
                @click="router.back()" 
                class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
                取消
            </button>
            <button 
                @click="handleCreateAction" 
                :disabled="!isValid"
                class="px-6 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-blue-200"
            >
                <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
                {{ submitButtonText }}
            </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import axios from 'axios'
import { CronLight } from '@vue-js-cron/light'
import '@vue-js-cron/light/dist/light.css'
import { fetchAllPages } from '../utils/pagination'
import { formatCronZh, splitCronToPayload } from '../utils/cron'

const route = useRoute()
const router = useRouter()

// Route Params / Meta
const isEditMode = computed(() => !!route.meta.isEdit)
const editTaskId = computed(() => route.params.id)
const routeWorkflowId = route.params.workflowId ? Number(route.params.workflowId) : null
const routeType = (route.meta.type as string) || (route.query.type as string)

// Data
const workflows = ref<any[]>([])
const selectedWorkflowId = ref<number | string>('')
const workflowName = ref('')
const projectId = ref<number | null>(null)
const taskName = ref('')
const cronExpression = ref('*/5 * * * *')
const cronUiError = ref('')
const cronDescription = computed(() => formatCronZh(cronExpression.value, ''))
const planTime = ref('')
const webhookSecret = ref('')

// Feishu direct notification
const feishuNotifyEnabled = ref(false)
const feishuNotifyOpenIds = ref<string[]>([])
const feishuUserList = ref<FeishuUserOption[]>([])
const loadingFeishuUsers = ref(false)
const feishuApiError = ref('')
const feishuApiHint = ref('')
const feishuFetched = ref(false)
const feishuDropdownOpen = ref(false)
const feishuUserSearch = ref('')
const feishuDropdownRef = ref<HTMLElement | null>(null)
const feishuGroupCollapsed = ref<Record<string, boolean>>({})
const currentUserFeishuOpenId = ref('')
const currentUserFeishuName = ref('')
const autoSelectedCurrentFeishuUser = ref(false)

watch(feishuNotifyEnabled, (val) => {
    if (val && !feishuFetched.value) {
        feishuFetched.value = true
        fetchFeishuUsers()
    } else if (!val) {
        feishuDropdownOpen.value = false
        feishuUserSearch.value = ''
    }
})

// For scheduled task, we might need original status checks, but editing usually restricted to pending.

// Params
const allParams = ref<ParamItem[]>([])

// UI State
const loading = ref(false)
const submitting = ref(false)
const loadingParams = ref(false)

// Init Task Type
const selectedTaskType = ref(routeType === 'periodic' || routeType === 'scheduled' || routeType === 'webhook' ? routeType : 'once')

// Constants
const taskTypes = [
    { label: '立即执行', value: 'once' },
    { label: '周期性', value: 'periodic' },
    { label: '定时', value: 'scheduled' },
    { label: 'Webhook', value: 'webhook' }
]

type ParamInputType = 'text' | 'git-branch' | 'single-select' | 'multi-select'

interface ParamOption {
    value: string
    label: string
}

interface GitBranchConfig {
    repo_url: string
    token: string
}

interface GitBranchOption {
    name: string
    is_default: boolean
}

interface ParamItem {
    key: string
    value: any // Default value
    runtimeValue: any // Current input value
    description: string
    source: 'global' | 'workflow'
    inputType: ParamInputType
    options: ParamOption[]
    gitBranch: GitBranchConfig | null
    branchOptions: GitBranchOption[]
    loadingBranches: boolean
    branchError: string
}

const paramTypeLabels: Record<ParamInputType, string> = {
    text: '文本',
    'git-branch': 'Git 分支',
    'single-select': '单选',
    'multi-select': '多选',
}

interface FeishuUserOption {
    open_id: string
    name: string
}

interface FeishuUserGroup {
    key: string
    users: FeishuUserOption[]
    selectedCount: number
}

// Computed
const pageTitle = computed(() => isEditMode.value ? '编辑任务' : '创建任务')
const submitButtonText = computed(() => {
    if (submitting.value) return isEditMode.value ? '保存中...' : '创建中...'
    if (isEditMode.value) return '保存修改'
    if (selectedTaskType.value === 'once') return '创建并运行'
    return '创建任务'
})

const isValid = computed(() => {
    if (!selectedWorkflowId.value || !taskName.value || submitting.value) return false
    
    if (selectedTaskType.value === 'periodic') {
        if (!cronExpression.value.trim()) return false
        if (cronUiError.value) return false
        if (!splitCronToPayload(cronExpression.value)) return false
    }
    if (selectedTaskType.value === 'scheduled' && !planTime.value) return false
    
    return true
})

const normalizeInputType = (inputType: any): ParamInputType => {
    if (inputType === 'git-branch' || inputType === 'single-select' || inputType === 'multi-select') {
        return inputType
    }
    return 'text'
}

const normalizeParamOptions = (raw: any): ParamOption[] => {
    if (!Array.isArray(raw)) return []
    return raw
        .map((opt: any) => ({
            value: String(opt?.value ?? '').trim(),
            label: String(opt?.label ?? opt?.value ?? '').trim(),
        }))
        .filter((opt: ParamOption) => !!opt.value)
}

const normalizeParamValueByType = (inputType: ParamInputType, value: any, options: ParamOption[]): any => {
    if (inputType === 'multi-select') {
        const optionSet = new Set(options.map((opt) => opt.value))
        let list: string[] = []
        if (Array.isArray(value)) {
            list = value.map((v) => String(v))
        } else if (typeof value === 'string') {
            const trimmed = value.trim()
            if (trimmed) {
                try {
                    const parsed = JSON.parse(trimmed)
                    if (Array.isArray(parsed)) {
                        list = parsed.map((v) => String(v))
                    } else {
                        list = trimmed.split(',').map((v) => v.trim()).filter(Boolean)
                    }
                } catch {
                    list = trimmed.split(',').map((v) => v.trim()).filter(Boolean)
                }
            }
        }
        if (optionSet.size === 0) {
            return list
        }
        return list.filter((v) => optionSet.has(v))
    }

    const normalized = String(value ?? '')
    if (inputType === 'single-select' && normalized) {
        const optionSet = new Set(options.map((opt) => opt.value))
        if (optionSet.size === 0) {
            return normalized
        }
        return optionSet.has(normalized) ? normalized : ''
    }
    return normalized
}

const buildParamItem = (raw: any, source: 'global' | 'workflow'): ParamItem => {
    const inputType = source === 'workflow' ? normalizeInputType(raw?.input_type) : 'text'
    const options = source === 'workflow' ? normalizeParamOptions(raw?.options) : []
    const defaultValue = normalizeParamValueByType(inputType, raw?.value, options)

    return {
        key: String(raw?.key ?? ''),
        value: defaultValue,
        runtimeValue: Array.isArray(defaultValue) ? [...defaultValue] : defaultValue,
        description: String(raw?.description ?? ''),
        source,
        inputType,
        options,
        gitBranch: source === 'workflow' && inputType === 'git-branch'
            ? {
                repo_url: String(raw?.git_branch?.repo_url ?? ''),
                token: String(raw?.git_branch?.token ?? ''),
            }
            : null,
        branchOptions: [],
        loadingBranches: false,
        branchError: '',
    }
}

const formatParamDefaultValue = (param: ParamItem) => {
    if (Array.isArray(param.value)) {
        return param.value.length ? param.value.join(', ') : '[]'
    }
    return String(param.value ?? '')
}

const isParamModified = (param: ParamItem) => {
    if (Array.isArray(param.value) || Array.isArray(param.runtimeValue)) {
        const d = Array.isArray(param.value) ? param.value.map((v: any) => String(v)) : []
        const r = Array.isArray(param.runtimeValue) ? param.runtimeValue.map((v: any) => String(v)) : []
        if (d.length !== r.length) return true
        return d.some((v: string, idx: number) => v !== r[idx])
    }
    return String(param.runtimeValue ?? '') !== String(param.value ?? '')
}

const toggleMultiParamValue = (param: ParamItem, value: string) => {
    const current = Array.isArray(param.runtimeValue) ? [...param.runtimeValue] : []
    const idx = current.indexOf(value)
    if (idx >= 0) {
        current.splice(idx, 1)
    } else {
        current.push(value)
    }
    param.runtimeValue = current
}

const getContextValue = (param: ParamItem) => {
    if (param.inputType === 'multi-select') {
        return Array.isArray(param.runtimeValue) ? param.runtimeValue.map((v: any) => String(v)) : []
    }
    return String(param.runtimeValue ?? '')
}

const applyContextToParams = (context: Record<string, any>) => {
    if (!context || typeof context !== 'object') return

    allParams.value.forEach((param) => {
        if (Object.prototype.hasOwnProperty.call(context, param.key)) {
            param.runtimeValue = normalizeParamValueByType(param.inputType, context[param.key], param.options)
        }
    })
}

const refreshGitBranches = async (param: ParamItem) => {
    if (param.inputType !== 'git-branch') return
    const repoUrl = String(param.gitBranch?.repo_url || '').trim()
    const token = String(param.gitBranch?.token || '').trim()

    if (!repoUrl || !token) {
        param.branchOptions = []
        param.branchError = '流程参数未配置仓库地址或 Token，请回到流程设计页完善配置。'
        return
    }

    param.loadingBranches = true
    param.branchError = ''
    try {
        const { data } = await axios.post('/api/tasks/git-branches/', {
            repo_url: repoUrl,
            token,
        })
        const branches: GitBranchOption[] = Array.isArray(data?.branches)
            ? data.branches
                .map((branch: any) => ({
                    name: String(branch?.name ?? ''),
                    is_default: !!branch?.is_default,
                }))
                .filter((branch: GitBranchOption) => !!branch.name)
            : []

        param.branchOptions = branches
        if (branches.length === 0) {
            param.branchError = '未获取到分支列表，可手动输入分支名。'
        }

        const allowed = new Set(branches.map((branch) => branch.name))
        const currentValue = String(param.runtimeValue ?? '')
        if (!currentValue) {
            const defaultBranch = branches.find((branch) => branch.is_default)?.name || ''
            if (defaultBranch) {
                param.runtimeValue = defaultBranch
            }
        } else if (!allowed.has(currentValue)) {
            param.branchError = '当前分支不在远端列表中，可继续手动输入。'
        }
    } catch {
        param.branchOptions = []
        param.branchError = '分支加载失败，可手动输入分支名。'
    } finally {
        param.loadingBranches = false
    }
}

const refreshGitBranchesForAllParams = () => {
    allParams.value
        .filter((param) => param.inputType === 'git-branch')
        .forEach((param) => {
            refreshGitBranches(param)
        })
}

const getFeishuGroupKey = (name: string) => {
    const normalized = String(name || '').trim()
    if (!normalized) return '未命名'
    const first = normalized.charAt(0)
    if (/[a-z]/i.test(first)) return first.toUpperCase()
    if (/[0-9]/.test(first)) return '0-9'
    return first
}

const normalizeFeishuUsers = (users: any[]): FeishuUserOption[] => {
    const seen = new Set<string>()
    const normalized: FeishuUserOption[] = []

    for (const rawUser of users || []) {
        const openId = String(rawUser?.open_id || '').trim()
        if (!openId || seen.has(openId)) continue

        seen.add(openId)
        const name = String(rawUser?.name || openId).trim() || openId
        normalized.push({ open_id: openId, name })
    }

    normalized.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
    return normalized
}

const filteredFeishuUsers = computed(() => {
    const q = feishuUserSearch.value.trim().toLowerCase()
    if (!q) return feishuUserList.value
    return feishuUserList.value.filter((user) => {
        const name = String(user.name || '').toLowerCase()
        const openId = String(user.open_id || '').toLowerCase()
        return name.includes(q) || openId.includes(q)
    })
})

const groupedFeishuUsers = computed<FeishuUserGroup[]>(() => {
    const groupMap = new Map<string, FeishuUserOption[]>()

    for (const user of filteredFeishuUsers.value) {
        const key = getFeishuGroupKey(user.name)
        const list = groupMap.get(key) || []
        list.push(user)
        groupMap.set(key, list)
    }

    const groups = Array.from(groupMap.entries())
        .sort(([a], [b]) => a.localeCompare(b, 'zh-Hans-CN'))
        .map(([key, users]) => ({
            key,
            users: users.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')),
            selectedCount: users.filter((user) => feishuNotifyOpenIds.value.includes(user.open_id)).length,
        }))

    return groups
})

const feishuSelectionSummary = computed(() => {
    const selectedUsers = feishuUserList.value.filter((user) => feishuNotifyOpenIds.value.includes(user.open_id))
    if (selectedUsers.length === 0) return '请选择飞书用户'
    const names = selectedUsers.map((user) => user.name)
    if (names.length <= 2) return names.join(', ')
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
})

const maybeAutoSelectCurrentFeishuUser = () => {
    if (isEditMode.value) return
    if (!feishuNotifyEnabled.value) return
    if (autoSelectedCurrentFeishuUser.value) return
    if (feishuNotifyOpenIds.value.length > 0) return
    if (feishuUserList.value.length === 0) return

    let matchedOpenId = ''

    if (currentUserFeishuOpenId.value) {
        const target = feishuUserList.value.find((u) => u.open_id === currentUserFeishuOpenId.value)
        if (target) matchedOpenId = target.open_id
    }

    if (!matchedOpenId && currentUserFeishuName.value) {
        const sameNameUsers = feishuUserList.value.filter((u) => u.name === currentUserFeishuName.value)
        if (sameNameUsers.length === 1) {
            matchedOpenId = sameNameUsers[0].open_id
        }
    }

    if (matchedOpenId) {
        feishuNotifyOpenIds.value = [matchedOpenId]
        autoSelectedCurrentFeishuUser.value = true
    }
}

const isFeishuGroupCollapsed = (groupKey: string) => !!feishuGroupCollapsed.value[groupKey]

const toggleFeishuGroup = (groupKey: string) => {
    feishuGroupCollapsed.value[groupKey] = !isFeishuGroupCollapsed(groupKey)
}

const setFeishuGroupsCollapsed = (collapsed: boolean) => {
    const nextState: Record<string, boolean> = {}
    groupedFeishuUsers.value.forEach((group) => {
        nextState[group.key] = collapsed
    })
    feishuGroupCollapsed.value = nextState
}

const hasCollapsedFeishuGroups = computed(() => groupedFeishuUsers.value.some((group) => isFeishuGroupCollapsed(group.key)))
const hasExpandedFeishuGroups = computed(() => groupedFeishuUsers.value.some((group) => !isFeishuGroupCollapsed(group.key)))

const selectAllFilteredFeishuUsers = () => {
    if (filteredFeishuUsers.value.length === 0) return
    const merged = new Set(feishuNotifyOpenIds.value)
    filteredFeishuUsers.value.forEach((user) => merged.add(user.open_id))
    feishuNotifyOpenIds.value = Array.from(merged)
}

const clearFilteredFeishuUsersSelection = () => {
    if (filteredFeishuUsers.value.length === 0) return
    const filteredIds = new Set(filteredFeishuUsers.value.map((user) => user.open_id))
    feishuNotifyOpenIds.value = feishuNotifyOpenIds.value.filter((id) => !filteredIds.has(id))
}

const toggleFeishuUser = (openId: string) => {
    if (feishuNotifyOpenIds.value.includes(openId)) {
        feishuNotifyOpenIds.value = feishuNotifyOpenIds.value.filter((id) => id !== openId)
    } else {
        feishuNotifyOpenIds.value = [...feishuNotifyOpenIds.value, openId]
    }
}

const handleDropdownOutsideClick = (event: MouseEvent) => {
    const target = event.target as Node
    if (feishuDropdownRef.value && !feishuDropdownRef.value.contains(target)) {
        feishuDropdownOpen.value = false
    }
}

const handleCronModelUpdate = (value: string) => {
    cronExpression.value = value
}

const handleCronEditorError = (value: string) => {
    cronUiError.value = value || ''
}

watch(feishuDropdownOpen, (open) => {
    if (!open) feishuUserSearch.value = ''
})

watch(groupedFeishuUsers, (groups) => {
    const nextState: Record<string, boolean> = {}
    groups.forEach((group, index) => {
        // Keep previous collapse state; if first time with many groups, collapse tail groups by default.
        nextState[group.key] = feishuGroupCollapsed.value[group.key] ?? (groups.length > 8 && index >= 5)
    })
    feishuGroupCollapsed.value = nextState
}, { immediate: true })

const fetchCurrentUserFeishuStatus = async () => {
    try {
        const { data } = await axios.get('/api/auth/feishu/status/')
        if (data?.bound) {
            currentUserFeishuOpenId.value = String(data.open_id || '').trim()
            currentUserFeishuName.value = String(data.feishu_name || '').trim()
            maybeAutoSelectCurrentFeishuUser()
        } else {
            currentUserFeishuOpenId.value = ''
            currentUserFeishuName.value = ''
        }
    } catch {
        currentUserFeishuOpenId.value = ''
        currentUserFeishuName.value = ''
    }
}

// Setup
onMounted(async () => {
    document.addEventListener('click', handleDropdownOutsideClick)
    if (!isEditMode.value) {
        feishuNotifyEnabled.value = true
        await fetchCurrentUserFeishuStatus()
    }
    await fetchWorkflows()
    
    if (isEditMode.value && editTaskId.value) {
        await loadTaskForEdit()
    } else if (routeWorkflowId) {
        selectedWorkflowId.value = routeWorkflowId
        await fetchWorkflowDetails(routeWorkflowId)
    }
})

onUnmounted(() => {
    document.removeEventListener('click', handleDropdownOutsideClick)
})

const loadTaskForEdit = async () => {
    loading.value = true
    try {
        let url = ''
        if (selectedTaskType.value === 'periodic') {
            url = `/api/tasks/periodic/${editTaskId.value}/`
        } else if (selectedTaskType.value === 'scheduled') {
            url = `/api/tasks/scheduled/${editTaskId.value}/`
        } else if (selectedTaskType.value === 'webhook') {
            url = `/api/tasks/webhook/${editTaskId.value}/`
        }
        
        const { data } = await axios.get(url)
        
        // Populate fields
        selectedWorkflowId.value = data.workflow
        taskName.value = data.name
        
        // Populate type specific
        if (selectedTaskType.value === 'periodic') {
            // Check if cron_expression is available (it should be from serializer)
            if (data.cron_expression) {
                // The serializer returns "min hour dom moy dow", we might need to use that OR specific fields.
                // The serializer has `cron_expression` field for display, but input expects `minute`, `hour` etc?
                // Wait, our backend create/update logic looked for `minute`, `hour` fields in `validated_data`.
                // BUT my recent `TaskCreateView` implementation for POST passed `cron_expression` string?
                // Step 91 `TaskCreateView` Line 372: `payload.cron_expression = cronExpression.value`.
                // BUT `PeriodicTaskSerializer` (Step 114) defines `minute`, `hour` etc as `write_only`.
                // It does NOT have a `cron_expression` WRITE field.
                // It has `cron_expression` as `SerializerMethodField` (read-only).
                // So my Previous `TaskCreateView` logic was probably BROKEN or I need to parse the cron expression before sending!
                // Wait. `handleCreateAction` (Step 91 L372) sends `cron_expression`.
                // `PeriodicTaskSerializer` (Step 114) does NOT accept `cron_expression` for writing.
                // This implies **Task Creation for Periodic was likely failing silently or not working as expected regarding schedule!**
                
                // Oops. I need to fix this.
                // I should probably parse the cron string into parts or update serializer to accept `cron_expression`.
                // Updating serializer is better for frontend simplicity.
                // But for now, let's assume I need to handle it.
                // Wait, if I change serializer, I fix both.
                
                // Let's assume for this specific edit step, I bind what I get.
                cronExpression.value = data.cron_expression || '* * * * *'
            }
        } else if (selectedTaskType.value === 'scheduled') {
            // format: 2023-10-10T10:10:00Z
            // input type=datetime-local expects "YYYY-MM-DDTHH:mm"
            if (data.execution_time) {
                // Convert ISO to local for input
                const date = new Date(data.execution_time)
                // datetime-local needs local ISO format without Z
                // Simple hack:
                const offset = date.getTimezoneOffset() * 60000
                const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16)
                planTime.value = localISOTime
            }
        } else if (selectedTaskType.value === 'webhook') {
            webhookSecret.value = data.secret || ''
        }
        
        // Load Workflow & Params
        // We fetch workflow details to get parameter Definitions
        await fetchWorkflowDetails(data.workflow)
        
        // Now override params with Saved Context
        const savedContext = data.context || {}
        applyContextToParams(savedContext)
        
        // Restore notification settings
        if (data.feishu_notify_enabled !== undefined) {
            feishuNotifyEnabled.value = data.feishu_notify_enabled
        }
        if (Array.isArray(data.feishu_notify_open_ids)) {
            feishuNotifyOpenIds.value = data.feishu_notify_open_ids
        }
        
    } catch (e) {
        console.error("Failed to load task", e)
        alert('Failed to load task details')
    } finally {
        loading.value = false
    }
}


// Generate Name
const generateTaskName = () => {
    if (isEditMode.value) return // Don't auto-regen name in edit mode unless requested? 
    if (!workflowName.value) return
    const timeStr = new Date().toLocaleString().replace(/[\/\s:]/g, '')
    const prefix = selectedTaskType.value === 'once' ? '' : `[${selectedTaskType.value.toUpperCase()}] `
    taskName.value = `${prefix}${workflowName.value}_${timeStr}`
}

watch(selectedTaskType, (newVal, oldVal) => {
    if (!isEditMode.value && newVal !== oldVal) {
        generateTaskName()
    }
})

// Methods
const fetchWorkflows = async () => {
    try {
        workflows.value = await fetchAllPages('/api/workflows/')
    } catch (e) {
        console.error("Failed to fetch workflows", e)
    }
}

const fetchFeishuUsers = async () => {
    loadingFeishuUsers.value = true
    feishuApiError.value = ''
    feishuApiHint.value = ''
    try {
        const { data } = await axios.get('/api/feishu/users/')
        feishuUserList.value = normalizeFeishuUsers(data.users || [])
        const validOpenIds = new Set(feishuUserList.value.map((user) => user.open_id))
        feishuNotifyOpenIds.value = feishuNotifyOpenIds.value.filter((id) => validOpenIds.has(id))
        maybeAutoSelectCurrentFeishuUser()
        if (data.error) {
            feishuApiError.value = data.error
            feishuApiHint.value = data.hint || ''
        }
    } catch (e) {
        console.error('Failed to fetch Feishu users', e)
        feishuUserList.value = []
        feishuApiError.value = '请求失败'
    } finally {
        loadingFeishuUsers.value = false
    }
}

const onWorkflowChange = () => {
    if (selectedWorkflowId.value) {
        fetchWorkflowDetails(Number(selectedWorkflowId.value))
    } else {
        allParams.value = []
        workflowName.value = ''
    }
}

const applyReplayContext = async () => {
    const replayTaskId = route.query.replay_task_id as string
    if (!replayTaskId) return
    
    try {
        const { data } = await axios.get(`/api/tasks/${replayTaskId}/`)
        
        // Restore context params
        const context = data.context || {}
        applyContextToParams(context)
        
        // Restore task name
        if (data.name) {
            taskName.value = data.name
        }
        
        // Restore Feishu notification settings
        if (data.feishu_notify_enabled !== undefined) {
            feishuNotifyEnabled.value = data.feishu_notify_enabled
        }
        if (Array.isArray(data.feishu_notify_open_ids)) {
            feishuNotifyOpenIds.value = data.feishu_notify_open_ids
        }
    } catch (e) {
        console.error('Failed to load replay task data', e)
    }
}

const fetchWorkflowDetails = async (id: number) => {
    loadingParams.value = true
    try {
        const { data: workflow } = await axios.get(`/api/workflows/${id}/`)
        workflowName.value = workflow.name
        projectId.value = workflow.project
        
        if (!isEditMode.value) {
             generateTaskName()
        }
        
        // Parse params
        const params: ParamItem[] = []
        const graphData = workflow.graph_data || {}
        const enabledKeys = graphData.global_params_enabled || []
        
        // 1. Global
        if (workflow.project) {
            try {
                const { data: project } = await axios.get(`/api/projects/${workflow.project}/`)
                const globalParams = project.extra_config?.global_params || []
                
                globalParams.forEach((p: any) => {
                    if (enabledKeys.includes(p.key)) {
                        params.push(buildParamItem(p, 'global'))
                    }
                })
            } catch (err) {
                console.error("Failed to fetch project params", err)
            }
        }
        
        // 2. Workflow
        const workflowParams = Array.isArray(graphData.workflow_params) ? graphData.workflow_params : []
        workflowParams.forEach((p: any) => {
             const item = buildParamItem(p, 'workflow')
             const existingIdx = params.findIndex(x => x.key === p.key)
             if (existingIdx !== -1) {
                 params[existingIdx] = item
             } else {
                 params.push(item)
             }
        })
        
        allParams.value = params
        refreshGitBranchesForAllParams()
        
        // Apply replay context if present
        applyReplayContext()
        
    } catch (e) {
        console.error('Failed to fetch workflow details', e)
    } finally {
        loadingParams.value = false
    }
}

const handleCreateAction = async () => {
    if (!isValid.value) return
    
    submitting.value = true
    try {
        // Collect context
        const context: Record<string, any> = {}
        allParams.value.forEach(p => {
             if (p.key) {
                 context[p.key] = getContextValue(p)
             }
        })
        
        const payload: any = {
            name: taskName.value,
            workflow: selectedWorkflowId.value,
            context: context,
            notify_enabled: false,
            notify_user_ids: [],
            feishu_notify_enabled: feishuNotifyEnabled.value,
            feishu_notify_open_ids: feishuNotifyEnabled.value ? feishuNotifyOpenIds.value : []
        }
        
        let url = '/api/tasks/'
        let method = 'post'
        let redirectRoute: any = { name: 'tasks' } 
        
        if (selectedTaskType.value === 'periodic') {
            url = isEditMode.value 
                ? `/api/tasks/periodic/${editTaskId.value}/` 
                : '/api/tasks/periodic/'
            method = isEditMode.value ? 'put' : 'post'

            const cronPayload = splitCronToPayload(cronExpression.value)
            if (!cronPayload || cronUiError.value) {
                alert('Cron 表达式无效，请修正后再提交。')
                return
            }
            Object.assign(payload, cronPayload)

            payload.enabled = true
            redirectRoute = { name: 'tasks-periodic' }
            
        } else if (selectedTaskType.value === 'scheduled') {
            url = isEditMode.value 
                ? `/api/tasks/scheduled/${editTaskId.value}/` 
                : '/api/tasks/scheduled/'
            method = isEditMode.value ? 'put' : 'post'
            
            const date = new Date(planTime.value)
            payload.execution_time = date.toISOString()
            redirectRoute = { name: 'tasks-scheduled' }
            
        } else if (selectedTaskType.value === 'webhook') {
            url = isEditMode.value 
                ? `/api/tasks/webhook/${editTaskId.value}/` 
                : '/api/tasks/webhook/'
            method = isEditMode.value ? 'put' : 'post'
            
            if (webhookSecret.value) {
                payload.secret = webhookSecret.value
            }
            payload.enabled = true
            redirectRoute = { name: 'tasks-webhook' }
            
        } else {
            // Once
            // No edit mode for 'Once' (TaskInstance) usually, create only.
        }
        
        if (method === 'post') {
            const resp = await axios.post(url, payload)
             if (selectedTaskType.value === 'once') {
                 router.push(`/tasks/${resp.data.id}`)
                 return
            }
        } else {
            await axios.put(url, payload)
        }
        
        router.push(redirectRoute)
        
    } catch (e) {
        console.error('Failed to save task:', e)
        alert('Failed to save task. Please check details.')
    } finally {
        submitting.value = false
    }
}
</script>
