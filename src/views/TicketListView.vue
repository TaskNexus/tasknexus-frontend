<template>
  <div class="h-full flex flex-col bg-white">
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">工单</h1>
      <button
        class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        @click="openCreateModal"
      >
        新建工单
      </button>
    </div>

    <div class="px-6 py-4 border-b border-gray-50">
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="filters.status"
          class="border border-gray-200 rounded text-sm text-gray-700 h-9 px-2 focus:outline-none focus:border-blue-500 bg-white"
        >
          <option value="">全部状态</option>
          <option value="TODO">待处理</option>
          <option value="IN_PROGRESS">处理中</option>
          <option value="PENDING_RELEASE">待发布</option>
          <option value="DONE">已完成</option>
        </select>

        <select
          v-model="filters.priority"
          class="border border-gray-200 rounded text-sm text-gray-700 h-9 px-2 focus:outline-none focus:border-blue-500 bg-white"
        >
          <option value="">全部优先级</option>
          <option value="LOW">低</option>
          <option value="MEDIUM">中</option>
          <option value="HIGH">高</option>
          <option value="URGENT">紧急</option>
        </select>

        <select
          v-model="filters.assigneeId"
          class="border border-gray-200 rounded text-sm text-gray-700 h-9 px-2 focus:outline-none focus:border-blue-500 bg-white"
        >
          <option value="">全部指派人</option>
          <option v-for="user in users" :key="user.id" :value="String(user.id)">
            {{ user.username }}
          </option>
        </select>

        <input
          v-model="filters.search"
          @keyup.enter="refreshFromFirstPage"
          placeholder="搜索标题或描述"
          class="border border-gray-200 rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:border-blue-500"
        />

        <button
          class="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
          @click="refreshFromFirstPage"
        >
          查询
        </button>
        <button
          class="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm hover:bg-gray-50"
          @click="resetFilters"
        >
          重置
        </button>
      </div>
    </div>

    <div class="flex-1 min-h-0 flex">
      <div class="flex-1 min-w-0 overflow-auto px-6 py-4">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-100 text-xs text-gray-500">
              <th class="py-3 font-medium w-16">ID</th>
              <th class="py-3 font-medium">标题</th>
              <th class="py-3 font-medium text-center">状态</th>
              <th class="py-3 font-medium text-center">优先级</th>
              <th class="py-3 font-medium">指派人</th>
              <th class="py-3 font-medium">创建者</th>
              <th class="py-3 font-medium">更新时间</th>
              <th class="py-3 font-medium text-center w-24">操作</th>
            </tr>
          </thead>
          <tbody class="text-sm text-gray-700">
            <tr v-if="tickets.length === 0" class="border-b border-gray-50">
              <td colspan="8" class="py-10 text-center text-gray-400">暂无工单</td>
            </tr>
            <tr
              v-for="ticket in tickets"
              :key="ticket.id"
              class="border-b border-gray-50 transition-colors cursor-pointer"
              :class="selectedTicketId === ticket.id ? 'bg-blue-50' : 'hover:bg-blue-50/30'"
              @click="selectTicket(ticket.id)"
            >
              <td class="py-3 text-gray-500">#{{ ticket.id }}</td>
              <td class="py-3">
                <button
                  class="text-blue-600 hover:text-blue-800 font-medium text-left"
                  @click.stop="openTicketDetail(ticket.id)"
                >
                  {{ ticket.title }}
                </button>
              </td>
              <td class="py-3 text-center">
                <span :class="statusBadgeClass(ticket.status)" class="px-2 py-0.5 rounded text-xs font-medium">
                  {{ statusLabel(ticket.status) }}
                </span>
              </td>
              <td class="py-3 text-center">
                <span :class="priorityBadgeClass(ticket.priority)" class="px-2 py-0.5 rounded text-xs font-medium">
                  {{ priorityLabel(ticket.priority) }}
                </span>
              </td>
              <td class="py-3 text-gray-600">{{ ticket.assignee_username || '-' }}</td>
              <td class="py-3 text-gray-600">{{ ticket.created_by_username }}</td>
              <td class="py-3 text-gray-500">{{ formatDate(ticket.updated_at) }}</td>
              <td class="py-3 text-center">
                <button
                  class="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  @click.stop="openTicketDetail(ticket.id)"
                >
                  详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <aside v-if="selectedTicket" class="w-[420px] shrink-0 border-l border-gray-200 bg-white flex flex-col">
        <div class="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="text-lg font-semibold text-gray-900 truncate">#{{ selectedTicket.id }} {{ selectedTicket.title }}</h2>
            <div class="text-xs text-gray-500 mt-1">
              创建者 {{ selectedTicket.created_by_username }} · 更新于 {{ formatDate(selectedTicket.updated_at) }}
            </div>
          </div>
          <button class="text-gray-400 hover:text-gray-700" @click="closeDetail">关闭</button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 space-y-6">
          <section>
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">状态进度</div>
            <div class="flex items-center">
              <template v-for="(step, idx) in statusSteps" :key="step">
                <div class="flex items-center">
                  <div
                    class="w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center"
                    :class="statusStepClass(step)"
                  >
                    {{ idx + 1 }}
                  </div>
                  <span class="ml-2 text-xs text-gray-700">{{ statusLabel(step) }}</span>
                </div>
                <div
                  v-if="idx < statusSteps.length - 1"
                  class="w-8 h-[2px] mx-2"
                  :class="isStepReached(idx) ? 'bg-blue-500' : 'bg-gray-200'"
                />
              </template>
            </div>
          </section>

          <section>
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">基础信息</div>
            <p class="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {{ selectedTicket.description || '暂无描述' }}
            </p>
            <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div><span class="text-gray-500">状态：</span>{{ statusLabel(selectedTicket.status) }}</div>
              <div><span class="text-gray-500">优先级：</span>{{ priorityLabel(selectedTicket.priority) }}</div>
              <div><span class="text-gray-500">指派：</span>{{ selectedTicket.assignee_username || '未指派' }}</div>
              <div><span class="text-gray-500">关闭时间：</span>{{ formatDate(selectedTicket.closed_at) }}</div>
            </div>
          </section>

          <section v-if="selectedTicket.can_update_status">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">更新状态</div>
            <div class="flex gap-2">
              <button
                v-for="step in statusSteps"
                :key="`status-${step}`"
                class="px-3 py-1.5 rounded text-xs border"
                :class="selectedTicket.status === step ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'"
                @click="changeStatus(step)"
              >
                {{ statusLabel(step) }}
              </button>
            </div>
          </section>

          <section v-if="selectedTicket.can_assign">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">指派成员</div>
            <div class="flex gap-2">
              <select
                v-model="assignAssigneeId"
                class="flex-1 border border-gray-200 rounded text-sm text-gray-700 h-9 px-2 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">未指派</option>
                <option v-for="user in users" :key="`assign-${user.id}`" :value="String(user.id)">
                  {{ user.username }}
                </option>
              </select>
              <button class="bg-blue-600 text-white px-3 rounded text-sm hover:bg-blue-700" @click="assignTicket">
                保存
              </button>
            </div>
          </section>

          <section v-if="selectedTicket.can_edit">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">编辑工单</div>
            <div class="space-y-2">
              <input
                v-model="editForm.title"
                class="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="标题"
              />
              <textarea
                v-model="editForm.description"
                class="w-full border border-gray-200 rounded px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:border-blue-500"
                placeholder="描述"
              />
              <select
                v-model="editForm.priority"
                class="w-full border border-gray-200 rounded text-sm text-gray-700 h-9 px-2 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
                <option value="URGENT">紧急</option>
              </select>
              <button class="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700" @click="saveTicketEdit">
                保存编辑
              </button>
            </div>
          </section>

          <section>
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">状态流转</div>
            <div v-if="timeline.length === 0" class="text-sm text-gray-400">暂无流转记录</div>
            <div v-else class="space-y-2">
              <div
                v-for="log in timeline"
                :key="log.id"
                class="border border-gray-100 rounded px-3 py-2 text-sm"
              >
                <div class="text-gray-800">
                  {{ statusLabel(log.from_status) }} → {{ statusLabel(log.to_status) }}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ log.changed_by_username || '系统' }} · {{ formatDate(log.changed_at) }}
                </div>
              </div>
            </div>
          </section>

          <section v-if="selectedTicket.can_delete">
            <button class="w-full bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded text-sm hover:bg-red-100" @click="deleteTicket">
              删除工单
            </button>
          </section>
        </div>
      </aside>
    </div>

    <ListPagination
      :total="totalCount"
      :currentPage="currentPage"
      :pageSize="pageSize"
      @update:currentPage="handlePageChange"
      @update:pageSize="handlePageSizeChange"
    />

    <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-lg rounded-lg shadow-lg border border-gray-100">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-base font-semibold text-gray-900">新建工单</h3>
          <button class="text-gray-400 hover:text-gray-700" @click="showCreateModal = false">关闭</button>
        </div>
        <div class="p-5 space-y-3">
          <div>
            <label class="block text-sm text-gray-700 mb-1">标题 *</label>
            <input
              v-model="createForm.title"
              class="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="请输入工单标题"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-700 mb-1">描述</label>
            <textarea
              v-model="createForm.description"
              class="w-full border border-gray-200 rounded px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:border-blue-500"
              placeholder="请输入工单描述"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-gray-700 mb-1">优先级</label>
              <select
                v-model="createForm.priority"
                class="w-full border border-gray-200 rounded text-sm text-gray-700 h-9 px-2 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
                <option value="URGENT">紧急</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">指派成员（可选）</label>
              <select
                v-model="createForm.assigneeId"
                class="w-full border border-gray-200 rounded text-sm text-gray-700 h-9 px-2 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">未指派</option>
                <option v-for="user in users" :key="`create-${user.id}`" :value="String(user.id)">
                  {{ user.username }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <div class="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button class="px-4 py-2 border border-gray-200 rounded text-sm text-gray-700 hover:bg-gray-50" @click="showCreateModal = false">
            取消
          </button>
          <button class="px-4 py-2 rounded text-sm text-white bg-blue-600 hover:bg-blue-700" @click="createTicket">
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from 'axios'

import ListPagination from '@/components/ListPagination.vue'

interface Ticket {
  id: number
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'PENDING_RELEASE' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignee: number | null
  assignee_username: string | null
  created_by: number
  created_by_username: string
  created_at: string
  updated_at: string
  closed_at: string | null
  can_assign: boolean
  can_update_status: boolean
  can_edit: boolean
  can_delete: boolean
}

interface TicketStatusLog {
  id: number
  from_status: 'TODO' | 'IN_PROGRESS' | 'PENDING_RELEASE' | 'DONE'
  to_status: 'TODO' | 'IN_PROGRESS' | 'PENDING_RELEASE' | 'DONE'
  changed_by: number | null
  changed_by_username: string | null
  changed_at: string
}

interface UserOption {
  id: number
  username: string
}

const tickets = ref<Ticket[]>([])
const users = ref<UserOption[]>([])
const timeline = ref<TicketStatusLog[]>([])

const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)

const filters = ref({
  status: '',
  priority: '',
  assigneeId: '',
  search: '',
})

const selectedTicket = ref<Ticket | null>(null)
const selectedTicketId = ref<number | null>(null)
const assignAssigneeId = ref('')
const statusSteps: Array<Ticket['status']> = ['TODO', 'IN_PROGRESS', 'PENDING_RELEASE', 'DONE']

const showCreateModal = ref(false)
const createForm = ref({
  title: '',
  description: '',
  priority: 'MEDIUM' as Ticket['priority'],
  assigneeId: '',
})

const editForm = ref({
  title: '',
  description: '',
  priority: 'MEDIUM' as Ticket['priority'],
})

const normalizeListData = (data: any) => {
  if (Array.isArray(data)) {
    return { results: data, count: data.length }
  }
  return { results: data.results || [], count: data.count ?? 0 }
}

const fetchUsers = async () => {
  try {
    const resp = await axios.get('/api/auth/users/', { params: { page_size: 200 } })
    const normalized = normalizeListData(resp.data)
    users.value = normalized.results
  } catch (e) {
    console.error('Failed to fetch users', e)
  }
}

const fetchTickets = async () => {
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      page_size: pageSize.value,
    }
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.priority) params.priority = filters.value.priority
    if (filters.value.assigneeId) params.assignee_id = filters.value.assigneeId
    if (filters.value.search) params.search = filters.value.search

    const resp = await axios.get('/api/tickets/', { params })
    const normalized = normalizeListData(resp.data)
    tickets.value = normalized.results
    totalCount.value = normalized.count
    if (selectedTicketId.value && !tickets.value.some((item) => item.id === selectedTicketId.value)) {
      closeDetail()
    }
  } catch (e) {
    console.error('Failed to fetch tickets', e)
  }
}

const fetchTimeline = async (ticketId: number) => {
  try {
    const resp = await axios.get(`/api/tickets/${ticketId}/timeline/`)
    timeline.value = resp.data || []
  } catch (e) {
    console.error('Failed to fetch timeline', e)
    timeline.value = []
  }
}

const openTicketDetail = async (ticketId: number) => {
  try {
    const resp = await axios.get(`/api/tickets/${ticketId}/`)
    const ticket: Ticket = resp.data
    selectedTicketId.value = ticket.id
    selectedTicket.value = ticket
    assignAssigneeId.value = ticket.assignee ? String(ticket.assignee) : ''
    editForm.value = {
      title: ticket.title,
      description: ticket.description || '',
      priority: ticket.priority,
    }
    await fetchTimeline(ticketId)
  } catch (e) {
    console.error('Failed to fetch ticket detail', e)
  }
}

const selectTicket = async (ticketId: number) => {
  if (selectedTicketId.value === ticketId && selectedTicket.value) return
  await openTicketDetail(ticketId)
}

const closeDetail = () => {
  selectedTicketId.value = null
  selectedTicket.value = null
  timeline.value = []
}

const refreshFromFirstPage = () => {
  currentPage.value = 1
  fetchTickets()
}

const resetFilters = () => {
  filters.value = {
    status: '',
    priority: '',
    assigneeId: '',
    search: '',
  }
  refreshFromFirstPage()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchTickets()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchTickets()
}

const openCreateModal = () => {
  createForm.value = {
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: '',
  }
  showCreateModal.value = true
}

const createTicket = async () => {
  if (!createForm.value.title.trim()) {
    alert('标题不能为空')
    return
  }
  try {
    const payload: Record<string, any> = {
      title: createForm.value.title.trim(),
      description: createForm.value.description || '',
      priority: createForm.value.priority,
    }
    if (createForm.value.assigneeId) payload.assignee = Number(createForm.value.assigneeId)
    const resp = await axios.post('/api/tickets/', payload)
    showCreateModal.value = false
    await fetchTickets()
    if (resp.data?.id) {
      await openTicketDetail(resp.data.id)
    }
  } catch (e) {
    console.error('Failed to create ticket', e)
  }
}

const changeStatus = async (targetStatus: Ticket['status']) => {
  if (!selectedTicket.value || selectedTicket.value.status === targetStatus) return
  try {
    const resp = await axios.post(`/api/tickets/${selectedTicket.value.id}/status/`, { status: targetStatus })
    selectedTicket.value = resp.data
    await fetchTickets()
    await fetchTimeline(resp.data.id)
  } catch (e) {
    console.error('Failed to update status', e)
  }
}

const assignTicket = async () => {
  if (!selectedTicket.value) return
  try {
    const assignee_id = assignAssigneeId.value ? Number(assignAssigneeId.value) : null
    const resp = await axios.post(`/api/tickets/${selectedTicket.value.id}/assign/`, { assignee_id })
    selectedTicket.value = resp.data
    await fetchTickets()
  } catch (e) {
    console.error('Failed to assign ticket', e)
  }
}

const saveTicketEdit = async () => {
  if (!selectedTicket.value) return
  if (!editForm.value.title.trim()) {
    alert('标题不能为空')
    return
  }
  try {
    const payload = {
      title: editForm.value.title.trim(),
      description: editForm.value.description || '',
      priority: editForm.value.priority,
    }
    const resp = await axios.patch(`/api/tickets/${selectedTicket.value.id}/`, payload)
    selectedTicket.value = resp.data
    await fetchTickets()
  } catch (e) {
    console.error('Failed to edit ticket', e)
  }
}

const deleteTicket = async () => {
  if (!selectedTicket.value) return
  if (!confirm(`确认删除工单 #${selectedTicket.value.id} 吗？`)) return
  try {
    await axios.delete(`/api/tickets/${selectedTicket.value.id}/`)
    closeDetail()
    await fetchTickets()
  } catch (e) {
    console.error('Failed to delete ticket', e)
  }
}

const statusIndex = (status: Ticket['status']) => statusSteps.indexOf(status)
const isStepReached = (stepIdx: number) => statusIndex(selectedTicket.value?.status || 'TODO') > stepIdx

const statusStepClass = (step: Ticket['status']) => {
  const selected = selectedTicket.value?.status || 'TODO'
  return statusIndex(selected) >= statusIndex(step)
    ? 'bg-blue-600 text-white'
    : 'bg-gray-100 text-gray-500'
}

const statusLabel = (status: Ticket['status']) => {
  switch (status) {
    case 'TODO':
      return '待处理'
    case 'IN_PROGRESS':
      return '处理中'
    case 'PENDING_RELEASE':
      return '待发布'
    case 'DONE':
      return '已完成'
    default:
      return status
  }
}

const priorityLabel = (priority: Ticket['priority']) => {
  switch (priority) {
    case 'LOW':
      return '低'
    case 'MEDIUM':
      return '中'
    case 'HIGH':
      return '高'
    case 'URGENT':
      return '紧急'
    default:
      return priority
  }
}

const statusBadgeClass = (status: Ticket['status']) => {
  switch (status) {
    case 'TODO':
      return 'bg-gray-100 text-gray-600'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-700'
    case 'PENDING_RELEASE':
      return 'bg-purple-100 text-purple-700'
    case 'DONE':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

const priorityBadgeClass = (priority: Ticket['priority']) => {
  switch (priority) {
    case 'LOW':
      return 'bg-slate-100 text-slate-600'
    case 'MEDIUM':
      return 'bg-blue-100 text-blue-700'
    case 'HIGH':
      return 'bg-orange-100 text-orange-700'
    case 'URGENT':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

onMounted(async () => {
  await Promise.all([fetchUsers(), fetchTickets()])
})
</script>
