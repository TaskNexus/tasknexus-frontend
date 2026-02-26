<template>
  <teleport to="body" v-if="visible">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" @click.self="close">
      <div class="w-[90vw] h-[85vh] bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
          <div class="flex items-center gap-3">
            <Terminal class="w-5 h-5 text-green-400" />
            <h3 class="text-sm font-medium text-gray-200">Agent Task Log — #{{ taskId }}</h3>
            <span 
              v-if="taskStatus"
              class="px-2 py-0.5 rounded text-xs font-medium"
              :class="statusClass"
            >
              {{ taskStatus }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
              <input type="checkbox" v-model="autoScroll" class="rounded border-gray-600 text-green-500 focus:ring-green-500" />
              Auto-scroll
            </label>
            <button @click="close" class="text-gray-400 hover:text-white transition-colors">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <!-- Log Content -->
        <div 
          ref="logContainerRef"
          class="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all"
          @scroll="handleScroll"
        >
          <div v-if="connecting" class="text-gray-500 animate-pulse">Connecting...</div>
          <div v-for="(line, index) in logLines" :key="index" :class="line.isStderr ? 'text-red-400' : 'text-green-400'">{{ line.text }}</div>
          <div v-if="finished" class="mt-2 pt-2 border-t border-gray-700 text-gray-500 text-xs">
            — Log stream ended —
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>{{ logLines.length }} lines</span>
          <span v-if="wsConnected" class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live
          </span>
          <span v-else-if="!finished" class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
            Reconnecting...
          </span>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { Terminal, X } from 'lucide-vue-next'

interface LogLine {
  text: string
  isStderr: boolean
}

const props = defineProps<{
  visible: boolean
  taskId: number | string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
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
  'RUNNING': 'bg-blue-900 text-blue-300',
  'COMPLETED': 'bg-green-900 text-green-300',
  'FAILED': 'bg-red-900 text-red-300',
  'TIMEOUT': 'bg-amber-900 text-amber-300',
  'DISPATCHED': 'bg-purple-900 text-purple-300',
}

const statusClass = computed(() => {
  return statusClassMap[taskStatus.value] || 'bg-gray-700 text-gray-300'
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

  // Build WebSocket URL from current page location
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
        // Parse history content into lines
        taskStatus.value = data.task_status || ''
        if (data.content) {
          const lines = data.content.split('\n')
          for (const line of lines) {
            logLines.value.push({ text: line, isStderr: false })
          }
        }
        scrollToBottom()
        // If task already finished, mark as done
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

const close = () => {
  disconnectWs()
  emit('close')
}

watch(() => props.visible, (val) => {
  if (val && props.taskId) {
    connectWs()
  } else {
    disconnectWs()
  }
})

onBeforeUnmount(() => {
  disconnectWs()
})
</script>
