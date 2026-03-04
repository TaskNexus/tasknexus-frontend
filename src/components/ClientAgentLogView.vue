<template>
  <div class="h-full w-full flex flex-col">
    <!-- Log Card -->
    <div class="flex-1 flex flex-col bg-white rounded-xl shadow-sm m-4 overflow-hidden">
      <!-- Card Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Terminal class="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-800">日志</h2>
            <span class="text-xs text-gray-500">#{{ taskId }}</span>
          </div>
          <span 
            v-if="taskStatus"
            class="px-2.5 py-0.5 rounded-full text-xs font-medium border"
            :class="statusClass"
          >
            {{ taskStatus }}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
            <input type="checkbox" v-model="autoScroll" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            自动滚动
          </label>
          <span v-if="wsConnected" class="flex items-center gap-1.5 text-xs text-green-600">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            已连接
          </span>
          <span v-else-if="!finished" class="flex items-center gap-1.5 text-xs text-amber-600">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            连接中...
          </span>
        </div>
      </div>

      <!-- Log Content -->
      <div 
        ref="logContainerRef"
        class="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all bg-white"
        @scroll="handleScroll"
      >
        <div v-if="connecting" class="text-gray-400 animate-pulse">Connecting...</div>
        <div 
          v-for="(line, index) in logLines" 
          :key="index" 
          class="py-0.5"
          :class="line.isStderr ? 'text-red-600' : 'text-gray-800'"
        >{{ line.text }}</div>
        <div v-if="finished" class="mt-3 pt-3 border-t border-gray-200 text-gray-400 text-xs">
          — Log stream ended —
        </div>
      </div>

      <!-- Card Footer -->
      <div class="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 shrink-0 bg-gray-50">
        <span>{{ logLines.length }} lines</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Terminal } from 'lucide-vue-next'

interface LogLine {
  text: string
  isStderr: boolean
}

const props = defineProps<{
  taskId: number | string
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const logLines = ref<LogLine[]>([])
const logContainerRef = ref<HTMLElement | null>(null)
const autoScroll = ref(true)
const connecting = ref(false)
const wsConnected = ref(false)
const finished = ref(false)
const taskStatus = ref('')

let ws: WebSocket | null = null

const statusClassMap: Record<string, string> = {
  'RUNNING': 'bg-blue-50 text-blue-700 border-blue-200',
  'COMPLETED': 'bg-green-50 text-green-700 border-green-200',
  'FAILED': 'bg-red-50 text-red-700 border-red-200',
  'TIMEOUT': 'bg-amber-50 text-amber-700 border-amber-200',
  'DISPATCHED': 'bg-purple-50 text-purple-700 border-purple-200',
}

const statusClass = computed(() => {
  return statusClassMap[taskStatus.value] || 'bg-gray-50 text-gray-700 border-gray-200'
})

const scrollToBottom = () => {
  if (autoScroll.value && logContainerRef.value) {
    nextTick(() => {
      if (logContainerRef.value) {
        logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
      }
    })
  }
}

const handleScroll = () => {
  if (!logContainerRef.value) return
  const el = logContainerRef.value
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
  autoScroll.value = atBottom
}

const connectWs = () => {
  if (!props.taskId) return
  
  connecting.value = true
  finished.value = false
  logLines.value = []

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  const wsUrl = `${protocol}//${host}/ws/agent-log/${props.taskId}/`

  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    connecting.value = false
    wsConnected.value = true
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      
      if (data.type === 'log_history') {
        taskStatus.value = data.task_status || ''
        if (data.content) {
          const lines = data.content.split('\n')
          for (const line of lines) {
            logLines.value.push({ text: line, isStderr: false })
          }
        }
        scrollToBottom()
        if (['COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED'].includes(data.task_status)) {
          finished.value = true
        }
      } else if (data.type === 'log') {
        logLines.value.push({ text: data.line, isStderr: data.is_stderr || false })
        if (data.finished) {
          finished.value = true
          if (data.exit_code !== undefined && data.exit_code !== null) {
            taskStatus.value = data.exit_code === 0 ? 'COMPLETED' : 'FAILED'
          }
        }
        scrollToBottom()
      }
    } catch (e) {
      console.error('Failed to parse log message', e)
    }
  }

  ws.onclose = () => {
    wsConnected.value = false
    connecting.value = false
  }

  ws.onerror = (err) => {
    console.error('Log WebSocket error', err)
    wsConnected.value = false
    connecting.value = false
  }
}

const disconnectWs = () => {
  if (ws) {
    ws.close()
    ws = null
  }
  wsConnected.value = false
}

onMounted(() => {
  connectWs()
})

onBeforeUnmount(() => {
  disconnectWs()
})
</script>
