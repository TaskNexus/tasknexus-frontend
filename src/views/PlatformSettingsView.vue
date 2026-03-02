<template>
  <div class="h-full flex bg-white">
    <!-- Sidebar Navigation -->
    <aside class="w-60 min-w-60 bg-white border-r border-gray-200 flex flex-col">
      <div class="px-5 pt-5 pb-4">
        <button @click="$router.back()" class="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-xs mb-3 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          返回
        </button>
        <h1 class="text-lg font-bold text-gray-800">平台设置</h1>
        <p class="text-xs text-gray-400 mt-1">管理平台级别的配置</p>
      </div>

      <div class="border-t border-gray-100"></div>

      <nav class="flex-1 overflow-y-auto py-3 px-3">
        <div>
          <div class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-1.5">配置</div>
          <button
            v-for="item in navItems" :key="item.key"
            @click="activeSection = item.key"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-0.5"
            :class="activeSection === item.key
              ? 'bg-blue-50 text-blue-600 font-medium border-l-[3px] border-blue-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-l-[3px] border-transparent'"
          >
            <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
            {{ item.label }}
          </button>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <div class="px-8 py-4 bg-white border-b border-gray-200 flex items-baseline gap-3">
        <h2 class="text-lg font-semibold text-gray-800">{{ currentSectionMeta.title }}</h2>
        <span class="text-sm text-gray-400">{{ currentSectionMeta.subtitle }}</span>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-8 py-6">

          <!-- ==================== General Settings ==================== -->
          <section v-if="activeSection === 'general'">
            <p class="text-sm text-gray-500 mb-4">配置平台的基础站点信息，如后端 API 的外部可访问地址。</p>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">后端站点地址 (Site URL)</label>
                <input v-model="siteForm.site_url" type="text" placeholder="http://192.168.3.40:8000 或 https://api.example.com" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                <p class="mt-1 text-xs text-gray-400">后端 API 服务的外部可访问地址（局域网 IP 或域名），用于生成 Webhook URL 等外部链接。无需末尾斜杠。</p>
              </div>
            </div>

            <div class="flex justify-end pt-4 mt-4 border-t border-gray-100">
              <button @click="saveSiteConfig" :disabled="savingSite" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {{ savingSite ? '保存中...' : '保存通用设置' }}
              </button>
            </div>
          </section>

          <!-- ==================== Feishu Integration ==================== -->
          <section v-if="activeSection === 'feishu'">
            <p class="text-sm text-gray-500 mb-4">配置飞书应用凭证，用于 OAuth 登录、通知推送和用户列表获取。</p>

            <!-- Login Enabled Toggle -->
            <div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg mb-4">
              <div>
                <label class="text-sm font-medium text-gray-700">启用飞书登录</label>
                <p class="text-xs text-gray-400 mt-0.5">开启后登录页会显示飞书登录入口</p>
              </div>
              <button
                @click="feishuForm.login_enabled = !feishuForm.login_enabled"
                :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors', feishuForm.login_enabled ? 'bg-blue-600' : 'bg-gray-300']"
              >
                <span :class="['inline-block h-4 w-4 transform rounded-full bg-white transition-transform', feishuForm.login_enabled ? 'translate-x-6' : 'translate-x-1']" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">App ID</label>
                <input v-model="feishuForm.app_id" type="text" placeholder="cli_xxxxxxxxx" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">App Secret</label>
                <input v-model="feishuForm.app_secret" type="password" placeholder="输入新的 App Secret（留空保持不变）" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                <p v-if="maskedSecret" class="mt-1 text-xs text-gray-400">当前值: {{ maskedSecret }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Redirect URI</label>
                <input v-model="feishuForm.redirect_uri" type="text" placeholder="http://your-domain/feishu-callback" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                <p class="mt-1 text-xs text-gray-400">飞书 OAuth 回调地址，需与飞书开放平台配置一致</p>
              </div>
            </div>

            <div class="flex justify-end pt-4 mt-4 border-t border-gray-100">
              <button @click="saveFeishuConfig" :disabled="savingFeishu" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {{ savingFeishu ? '保存中...' : '保存飞书配置' }}
              </button>
            </div>
          </section>

          <!-- ==================== Permission Matrix ==================== -->
          <section v-if="activeSection === 'permissions'">
            <p class="text-sm text-gray-500 mb-4">管理不同角色对操作的权限。勾选表示该角色拥有该操作权限。</p>

            <!-- Loading -->
            <div v-if="permLoading" class="flex items-center justify-center py-8">
              <Loader2 class="w-5 h-5 animate-spin text-blue-500" />
              <span class="ml-2 text-sm text-gray-500">加载中...</span>
            </div>

            <!-- Matrix Table -->
            <div v-else class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">操作</th>
                    <th v-for="role in roles" :key="role" class="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider w-24" :class="roleHeaderClass(role)">
                      {{ role }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <template v-for="group in permissionGroups" :key="group.name">
                    <tr class="bg-gray-50">
                      <td :colspan="roles.length + 1" class="px-4 py-1.5 text-sm font-semibold text-gray-700">
                        {{ group.name }}
                      </td>
                    </tr>
                    <tr v-for="perm in group.permissions" :key="perm.key" class="hover:bg-blue-50 transition-colors">
                      <td class="px-4 py-2 text-sm text-gray-700 pl-8">
                        {{ perm.label }}
                        <span v-if="perm.description" class="text-xs text-gray-400 ml-1">({{ perm.description }})</span>
                      </td>
                      <td v-for="role in roles" :key="role" class="px-4 py-2 text-center">
                        <input type="checkbox" :checked="isPermitted(perm.key, role)" @change="togglePermission(perm.key, role)" :disabled="role === 'OWNER'" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>

            <!-- Footer -->
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p class="text-xs text-gray-400">
                <Info class="w-3 h-3 inline-block mr-1" />
                Owner 角色默认拥有所有权限且不可修改
              </p>
              <div class="flex gap-3">
                <button @click="resetToDefault" class="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  恢复默认
                </button>
                <button @click="savePermissions" :disabled="permSaving || !permHasChanges" class="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Loader2 v-if="permSaving" class="w-3 h-3 animate-spin inline-block mr-1" />
                  {{ permSaving ? '保存中...' : '保存权限' }}
                </button>
              </div>
            </div>
          </section>

          <!-- ==================== Members Management ==================== -->
          <section v-if="activeSection === 'members'">
            <!-- Toolbar / Search -->
            <div class="flex items-center mb-4">
              <input
                v-model="memberSearchQuery"
                @input="fetchMembers"
                type="text"
                placeholder="搜索用户名或邮箱..."
                class="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <!-- Table -->
            <div class="overflow-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">加入时间</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="user in memberUsers" :key="user.id">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase mr-3">
                          {{ user.username.substring(0, 2) }}
                        </div>
                        <div class="text-sm font-medium text-gray-900">{{ user.username }}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ user.email || '-' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                        :class="{
                          'bg-purple-100 text-purple-800': user.role === 'OWNER',
                          'bg-blue-100 text-blue-800': user.role === 'MAINTAINER',
                          'bg-green-100 text-green-800': user.role === 'DEVELOPER',
                          'bg-gray-100 text-gray-800': user.role === 'REPORTER'
                        }"
                      >
                        {{ user.role }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ new Date(user.date_joined).toLocaleDateString() }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        v-if="canManageMember(user)"
                        @click="openMemberEdit(user)"
                        class="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        编辑
                      </button>
                      <button
                        v-if="canDeleteMember(user)"
                        @click="deleteMember(user)"
                        class="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Edit Modal -->
            <div v-if="editingMember" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div class="bg-white rounded-lg p-6 w-96">
                <h3 class="text-lg font-medium mb-4">编辑角色: {{ editingMember.username }}</h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">角色</label>
                    <select v-model="editMemberRole" class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border">
                      <option value="REPORTER">Reporter</option>
                      <option value="DEVELOPER">Developer</option>
                      <option value="MAINTAINER">Maintainer</option>
                      <option value="OWNER">Owner</option>
                    </select>
                  </div>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                  <button @click="editingMember = null" class="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50">取消</button>
                  <button @click="saveMemberRole" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button>
                </div>
              </div>
            </div>
          </section>

          <!-- ==================== Registration Settings ==================== -->
          <section v-if="activeSection === 'registration'">
            <p class="text-sm text-gray-500 mb-4">控制手动注册开关和邀请链接管理。关闭手动注册后，仅可通过邀请链接或飞书登录加入平台。</p>

            <!-- Registration Toggle -->
            <div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg mb-6">
              <div>
                <label class="text-sm font-medium text-gray-700">开放手动注册</label>
                <p class="text-xs text-gray-400 mt-0.5">关闭后登录页将隐藏注册入口，飞书登录和邀请链接不受影响</p>
              </div>
              <button
                @click="registrationForm.registration_enabled = !registrationForm.registration_enabled"
                :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors', registrationForm.registration_enabled ? 'bg-blue-600' : 'bg-gray-300']"
              >
                <span :class="['inline-block h-4 w-4 transform rounded-full bg-white transition-transform', registrationForm.registration_enabled ? 'translate-x-6' : 'translate-x-1']" />
              </button>
            </div>

            <div class="flex justify-end pb-6 mb-6 border-b border-gray-100">
              <button @click="saveRegistrationConfig" :disabled="savingRegistration" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">
                {{ savingRegistration ? '保存中...' : '保存注册设置' }}
              </button>
            </div>

            <!-- Invite Links Management -->
            <h3 class="text-base font-semibold text-gray-800 mb-3">邀请链接管理</h3>
            <p class="text-sm text-gray-500 mb-4">邀请链接不受注册开关限制，但仍需邮箱验证码。</p>

            <!-- Create Invite -->
            <div class="flex items-end gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">有效期（小时）</label>
                <input v-model.number="inviteFormHours" type="number" min="1" max="8760" class="w-24 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">可使用次数</label>
                <input v-model.number="inviteFormMaxUses" type="number" min="1" max="9999" class="w-24 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <button @click="createInvite" :disabled="creatingInvite" class="px-4 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm">
                {{ creatingInvite ? '生成中...' : '生成邀请链接' }}
              </button>
            </div>

            <!-- Invite List -->
            <div class="overflow-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">邀请链接</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">创建者</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">使用/上限</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">过期时间</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="inv in invites" :key="inv.id">
                    <td class="px-4 py-2 text-sm text-gray-700 max-w-[200px] truncate">
                      {{ getInviteUrl(inv.token) }}
                    </td>
                    <td class="px-4 py-2 text-sm text-gray-500">{{ inv.created_by_username }}</td>
                    <td class="px-4 py-2 text-sm text-gray-500">{{ inv.used_count }} / {{ inv.max_uses }}</td>
                    <td class="px-4 py-2 text-sm text-gray-500">{{ new Date(inv.expires_at).toLocaleString() }}</td>
                    <td class="px-4 py-2">
                      <span class="px-2 py-0.5 text-xs font-medium rounded-full" :class="inv.is_valid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'">
                        {{ inv.is_valid ? '有效' : '已失效' }}
                      </span>
                    </td>
                    <td class="px-4 py-2 text-right text-sm">
                      <button @click="copyInviteUrl(inv.token)" class="text-blue-600 hover:text-blue-800 mr-2">复制</button>
                      <button v-if="inv.is_active" @click="revokeInvite(inv.id)" class="text-red-600 hover:text-red-800">撤销</button>
                    </td>
                  </tr>
                  <tr v-if="invites.length === 0">
                    <td colspan="6" class="px-4 py-6 text-center text-sm text-gray-400">暂无邀请链接</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- ==================== Email Config ==================== -->
          <section v-if="activeSection === 'email'">
            <p class="text-sm text-gray-500 mb-4">配置 SMTP 邮件服务器，用于发送注册验证码等邮件。</p>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">SMTP 服务器</label>
                  <input v-model="emailForm.smtp_host" type="text" placeholder="smtp.example.com" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">端口</label>
                  <input v-model.number="emailForm.smtp_port" type="number" placeholder="587" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">SMTP 用户名</label>
                <input v-model="emailForm.smtp_user" type="text" placeholder="user@example.com" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">SMTP 密码</label>
                <input v-model="emailForm.smtp_password" type="password" placeholder="输入新密码（留空保持不变）" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                <p v-if="maskedSmtpPassword" class="mt-1 text-xs text-gray-400">当前值: {{ maskedSmtpPassword }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">发件人地址</label>
                <input v-model="emailForm.from_email" type="email" placeholder="noreply@example.com" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                <p class="mt-1 text-xs text-gray-400">留空则使用 SMTP 用户名作为发件人</p>
              </div>
              <div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <div>
                  <label class="text-sm font-medium text-gray-700">启用 TLS</label>
                  <p class="text-xs text-gray-400 mt-0.5">大多数邮件服务商要求启用TLS</p>
                </div>
                <button
                  @click="emailForm.smtp_use_tls = !emailForm.smtp_use_tls"
                  :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors', emailForm.smtp_use_tls ? 'bg-blue-600' : 'bg-gray-300']"
                >
                  <span :class="['inline-block h-4 w-4 transform rounded-full bg-white transition-transform', emailForm.smtp_use_tls ? 'translate-x-6' : 'translate-x-1']" />
                </button>
              </div>
            </div>

            <div class="flex justify-end pt-4 mt-4 border-t border-gray-100">
              <button @click="saveEmailConfig" :disabled="savingEmail" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {{ savingEmail ? '保存中...' : '保存邮件配置' }}
              </button>
            </div>
          </section>

          <!-- ==================== Client Agents ==================== -->
          <section v-if="activeSection === 'agents'">
            <ClientAgentDetailView
              v-if="selectedAgentId"
              :agentId="selectedAgentId"
              @back="selectedAgentId = null"
            />
            <ClientAgentListView
              v-else
              @select-agent="(id: number) => selectedAgentId = id"
            />
          </section>

      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" class="fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50" :class="toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { Link, Shield, Users, Server, Loader2, Info, UserPlus, Mail, Globe } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import ClientAgentListView from '@/views/ClientAgentListView.vue'
import ClientAgentDetailView from '@/views/ClientAgentDetailView.vue'

// ==================== Sidebar Navigation ====================
const route = useRoute()
const validTabs = ['general', 'feishu', 'permissions', 'members', 'registration', 'email', 'agents']
const activeSection = ref((route.query.tab as string) && validTabs.indexOf(route.query.tab as string) >= 0 ? (route.query.tab as string) : 'general')
const selectedAgentId = ref<number | null>(null)

watch(() => route.query.tab, (tab) => {
  if (tab && validTabs.indexOf(tab as string) >= 0) {
    activeSection.value = tab as string
  }
})

const navItems = [
  { key: 'general', label: '通用设置', icon: Globe },
  { key: 'feishu', label: '飞书集成', icon: Link },
  { key: 'permissions', label: '角色与权限', icon: Shield },
  { key: 'members', label: '成员管理', icon: Users },
  { key: 'registration', label: '注册设置', icon: UserPlus },
  { key: 'email', label: '邮件配置', icon: Mail },
  { key: 'agents', label: '客户端代理', icon: Server },
]

const sectionMeta: Record<string, { title: string; subtitle: string }> = {
  general:       { title: '通用设置',   subtitle: '配置平台基础站点信息' },
  feishu:        { title: '飞书集成',   subtitle: '配置飞书 OAuth 登录和通知' },
  permissions:   { title: '角色与权限', subtitle: '管理不同角色的操作权限' },
  members:       { title: '成员管理',   subtitle: '管理平台用户及角色' },
  registration:  { title: '注册设置',   subtitle: '管理注册开关和邀请链接' },
  email:         { title: '邮件配置',   subtitle: '配置 SMTP 邮件服务器' },
  agents:        { title: '客户端代理', subtitle: '管理客户端代理和工作空间' },
}

const currentSectionMeta = computed(() => sectionMeta[activeSection.value] || { title: '', subtitle: '' })

// ==================== Toast ====================
const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    toast.value = { show: true, message, type }
    setTimeout(() => { toast.value.show = false }, 3000)
}

// ==================== Site Config ====================
const siteForm = ref({
    site_url: '',
})
const savingSite = ref(false)

const saveSiteConfig = async () => {
    savingSite.value = true
    try {
        const res = await axios.get('/api/platform/config/')
        const existing = res.data || {}
        await axios.put('/api/platform/config/', {
            ...existing,
            site: {
                site_url: siteForm.value.site_url.replace(/\/+$/, ''),
            }
        })
        showToast('通用设置保存成功')
    } catch (e: any) {
        showToast(e.response?.data?.detail || '保存失败', 'error')
    } finally {
        savingSite.value = false
    }
}

// ==================== Feishu Config ====================
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
        // Load site config
        if (data.site) {
            siteForm.value.site_url = data.site.site_url || ''
        }
        if (data.feishu) {
            feishuForm.value.app_id = data.feishu.app_id || ''
            feishuForm.value.redirect_uri = data.feishu.redirect_uri || ''
            feishuForm.value.login_enabled = data.feishu.login_enabled || false
            maskedSecret.value = data.feishu.app_secret || ''
            feishuForm.value.app_secret = ''
        }
        // Load registration config
        if (data.registration) {
            registrationForm.value.registration_enabled = data.registration.registration_enabled ?? true
        }
        // Load email config
        if (data.email) {
            emailForm.value.smtp_host = data.email.smtp_host || ''
            emailForm.value.smtp_port = data.email.smtp_port || 587
            emailForm.value.smtp_user = data.email.smtp_user || ''
            emailForm.value.smtp_use_tls = data.email.smtp_use_tls ?? true
            emailForm.value.from_email = data.email.from_email || ''
            maskedSmtpPassword.value = data.email.smtp_password || ''
            emailForm.value.smtp_password = ''
        }
        // Load permission matrix from config
        if (data.permission_matrix && typeof data.permission_matrix === 'object') {
            permMatrix.value = { ...DEFAULT_MATRIX, ...data.permission_matrix }
        } else {
            permMatrix.value = { ...DEFAULT_MATRIX }
        }
        permOriginal.value = { ...permMatrix.value }
    } catch (e: any) {
        if (e.response?.status === 403) {
            alert('无权限访问平台设置，请使用管理员账号')
        } else {
            console.error("Failed to fetch platform config", e)
        }
        permMatrix.value = { ...DEFAULT_MATRIX }
        permOriginal.value = { ...DEFAULT_MATRIX }
    } finally {
        permLoading.value = false
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
        if (feishuForm.value.app_secret) {
            payload.feishu.app_secret = feishuForm.value.app_secret
        } else {
            payload.feishu.app_secret = maskedSecret.value
        }

        const { data } = await axios.put('/api/platform/config/', payload)

        if (data.feishu) {
            maskedSecret.value = data.feishu.app_secret || ''
            feishuForm.value.app_secret = ''
        }
        showToast('飞书配置保存成功')
    } catch (e: any) {
        console.error("Failed to save feishu config", e)
        showToast(e.response?.data?.detail || '保存失败', 'error')
    } finally {
        savingFeishu.value = false
    }
}

// ==================== Permission Matrix ====================
const roles = ['REPORTER', 'DEVELOPER', 'MAINTAINER', 'OWNER'] as const

const DEFAULT_MATRIX: Record<string, string> = {
  'project.view':          'REPORTER',
  'project.create':        'OWNER',
  'project.edit':          'MAINTAINER',
  'project.delete':        'OWNER',
  'member.view':           'REPORTER',
  'member.manage':         'MAINTAINER',
  'workflow.view':         'REPORTER',
  'workflow.create':       'DEVELOPER',
  'workflow.edit_own':     'DEVELOPER',
  'workflow.edit_all':     'MAINTAINER',
  'workflow.delete_own':   'DEVELOPER',
  'workflow.delete_all':   'MAINTAINER',
  'task.view':             'REPORTER',
  'task.create':           'REPORTER',
  'task.operate_own':      'REPORTER',
  'task.operate_all':      'MAINTAINER',
  'task.delete_own':       'REPORTER',
  'task.delete_all':       'MAINTAINER',
  'component.view':        'REPORTER',
  'component.edit':        'MAINTAINER',
  'agent.chat':            'OWNER',
  'platform.project_create':   'OWNER',
  'platform.user_manage':      'MAINTAINER',
  'platform.user_delete':      'MAINTAINER',
  'platform.config_edit':      'OWNER',
}

const ROLE_HIERARCHY: Record<string, number> = {
  'REPORTER': 0, 'DEVELOPER': 1, 'MAINTAINER': 2, 'OWNER': 3,
}

const permissionGroups = [
  { name: '项目管理', permissions: [
    { key: 'project.view', label: '查看项目' },
    { key: 'project.edit', label: '编辑项目' },
    { key: 'project.delete', label: '删除项目' },
    { key: 'member.view', label: '查看成员' },
    { key: 'member.manage', label: '管理成员' },
  ]},
  { name: '工作流', permissions: [
    { key: 'workflow.view', label: '查看工作流' },
    { key: 'workflow.create', label: '创建工作流' },
    { key: 'workflow.edit_own', label: '编辑工作流', description: '仅自己的' },
    { key: 'workflow.edit_all', label: '编辑工作流', description: '所有' },
    { key: 'workflow.delete_own', label: '删除工作流', description: '仅自己的' },
    { key: 'workflow.delete_all', label: '删除工作流', description: '所有' },
  ]},
  { name: '任务 / 定时计划 / Webhook', permissions: [
    { key: 'task.view', label: '查看任务' },
    { key: 'task.create', label: '创建/执行任务' },
    { key: 'task.operate_own', label: '操作/编辑/启停', description: '仅自己的' },
    { key: 'task.operate_all', label: '操作/编辑/启停', description: '所有' },
    { key: 'task.delete_own', label: '删除任务', description: '仅自己的' },
    { key: 'task.delete_all', label: '删除任务', description: '所有' },
  ]},
  { name: '组件 / AI', permissions: [
    { key: 'component.view', label: '查看组件' },
    { key: 'component.edit', label: '编辑组件分类' },
    { key: 'agent.chat', label: '调用 AI 对话' },
  ]},
  { name: '平台管理', permissions: [
    { key: 'platform.project_create', label: '创建项目' },
    { key: 'platform.user_manage', label: '管理用户' },
    { key: 'platform.user_delete', label: '删除用户' },
    { key: 'platform.config_edit', label: '编辑平台设置' },
  ]},
]

const permLoading = ref(true)
const permSaving = ref(false)
const permMatrix = ref<Record<string, string>>({})
const permOriginal = ref<Record<string, string>>({})

const permHasChanges = computed(() => JSON.stringify(permMatrix.value) !== JSON.stringify(permOriginal.value))

const isPermitted = (permKey: string, role: string) => {
  if (role === 'OWNER') return true
  const minRole = permMatrix.value[permKey] || 'OWNER'
  return (ROLE_HIERARCHY[role] ?? -1) >= (ROLE_HIERARCHY[minRole] ?? 999)
}

const togglePermission = (permKey: string, role: string) => {
  if (role === 'OWNER') return
  const clickedLevel = ROLE_HIERARCHY[role] ?? -1
  if (isPermitted(permKey, role)) {
    const higherRoles = roles.filter(r => (ROLE_HIERARCHY[r] ?? -1) > clickedLevel && r !== 'OWNER')
    permMatrix.value[permKey] = higherRoles.length > 0 ? higherRoles[0] : 'OWNER'
  } else {
    permMatrix.value[permKey] = role
  }
}

const roleHeaderClass = (role: string) => {
  switch (role) {
    case 'OWNER': return 'text-purple-600'
    case 'MAINTAINER': return 'text-blue-600'
    case 'DEVELOPER': return 'text-green-600'
    case 'REPORTER': return 'text-gray-600'
    default: return ''
  }
}

const savePermissions = async () => {
  permSaving.value = true
  try {
    const res = await axios.get('/api/platform/config/')
    const existing = res.data || {}
    await axios.put('/api/platform/config/', {
      ...existing,
      permission_matrix: permMatrix.value
    })
    permOriginal.value = { ...permMatrix.value }
    showToast('权限配置已保存')
  } catch (e: any) {
    showToast(e.response?.data?.detail || '保存失败', 'error')
  } finally {
    permSaving.value = false
  }
}

const resetToDefault = () => {
  permMatrix.value = { ...DEFAULT_MATRIX }
}

// ==================== Members Management ====================
const authStore = useAuthStore()
const memberUsers = ref<any[]>([])
const memberSearchQuery = ref('')
const editingMember = ref<any>(null)
const editMemberRole = ref('REPORTER')

const fetchMembers = async () => {
    try {
        const params: any = {}
        if (memberSearchQuery.value) params.username = memberSearchQuery.value
        const response = await axios.get('/api/auth/users/', { params })
        memberUsers.value = response.data.results || response.data
    } catch (e) {
        console.error('Failed to fetch users', e)
    }
}

const canManageMember = (targetUser: any) => {
    const currentUser = authStore.user
    if (!currentUser) return false
    if (currentUser.role !== 'MAINTAINER' && currentUser.role !== 'OWNER') return false
    if (targetUser.role === 'OWNER') return false
    if (currentUser.role === 'MAINTAINER' && targetUser.role === 'MAINTAINER') return false
    return true
}

const canDeleteMember = (targetUser: any) => {
    return canManageMember(targetUser) && targetUser.id !== authStore.user.id
}

const openMemberEdit = (user: any) => {
    editingMember.value = user
    editMemberRole.value = user.role
}

const saveMemberRole = async () => {
    if (!editingMember.value) return
    try {
        await axios.patch(`/api/auth/users/${editingMember.value.id}/`, {
            platform_role: editMemberRole.value
        })
        editingMember.value = null
        showToast('角色已更新')
        fetchMembers()
    } catch (e) {
        showToast('更新角色失败', 'error')
        console.error(e)
    }
}

const deleteMember = async (user: any) => {
    if (!confirm(`确定要删除用户 ${user.username} 吗？此操作不可撤销。`)) return
    try {
        await axios.delete(`/api/auth/users/${user.id}/`)
        showToast('用户已删除')
        fetchMembers()
    } catch (e) {
        showToast('删除用户失败', 'error')
    }
}

// ==================== Registration Settings ====================
const registrationForm = ref({
    registration_enabled: true,
})
const savingRegistration = ref(false)

const saveRegistrationConfig = async () => {
    savingRegistration.value = true
    try {
        const res = await axios.get('/api/platform/config/')
        const existing = res.data || {}
        await axios.put('/api/platform/config/', {
            ...existing,
            registration: {
                registration_enabled: registrationForm.value.registration_enabled,
            }
        })
        showToast('注册设置已保存')
    } catch (e: any) {
        showToast(e.response?.data?.detail || '保存失败', 'error')
    } finally {
        savingRegistration.value = false
    }
}

// ==================== Invite Links ====================
const invites = ref<any[]>([])
const inviteFormHours = ref(168)
const inviteFormMaxUses = ref(1)
const creatingInvite = ref(false)

const fetchInvites = async () => {
    try {
        const { data } = await axios.get('/api/platform/invites/')
        invites.value = data.results || data
    } catch (e) {
        console.error('Failed to fetch invites', e)
    }
}

const createInvite = async () => {
    creatingInvite.value = true
    try {
        await axios.post('/api/platform/invites/', {
            expires_hours: inviteFormHours.value,
            max_uses: inviteFormMaxUses.value,
        })
        showToast('邀请链接已生成')
        fetchInvites()
    } catch (e: any) {
        showToast(e.response?.data?.detail || '生成失败', 'error')
    } finally {
        creatingInvite.value = false
    }
}

const getInviteUrl = (token: string) => {
    return `${window.location.origin}/register?invite=${token}`
}

const copyInviteUrl = async (token: string) => {
    const url = getInviteUrl(token)
    try {
        await navigator.clipboard.writeText(url)
        showToast('已复制到剪贴板')
    } catch {
        // Fallback
        prompt('复制邀请链接:', url)
    }
}

const revokeInvite = async (id: number) => {
    if (!confirm('确定撤销此邀请链接？')) return
    try {
        await axios.delete(`/api/platform/invites/${id}/`)
        showToast('邀请链接已撤销')
        fetchInvites()
    } catch (e) {
        showToast('撤销失败', 'error')
    }
}

// ==================== Email Config ====================
const emailForm = ref({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_use_tls: true,
    from_email: '',
})
const maskedSmtpPassword = ref('')
const savingEmail = ref(false)

const saveEmailConfig = async () => {
    savingEmail.value = true
    try {
        const res = await axios.get('/api/platform/config/')
        const existing = res.data || {}
        const payload: any = {
            smtp_host: emailForm.value.smtp_host,
            smtp_port: emailForm.value.smtp_port,
            smtp_user: emailForm.value.smtp_user,
            smtp_use_tls: emailForm.value.smtp_use_tls,
            from_email: emailForm.value.from_email,
        }
        if (emailForm.value.smtp_password) {
            payload.smtp_password = emailForm.value.smtp_password
        } else {
            payload.smtp_password = maskedSmtpPassword.value
        }
        const { data } = await axios.put('/api/platform/config/', {
            ...existing,
            email: payload,
        })
        if (data.email) {
            maskedSmtpPassword.value = data.email.smtp_password || ''
            emailForm.value.smtp_password = ''
        }
        showToast('邮件配置保存成功')
    } catch (e: any) {
        showToast(e.response?.data?.detail || '保存失败', 'error')
    } finally {
        savingEmail.value = false
    }
}

// ==================== Init ====================
onMounted(() => {
    fetchConfig()
    fetchMembers()
    fetchInvites()
    if (!authStore.user?.role) {
        authStore.fetchUser()
    }
})
</script>
