<template>
  <div class="h-full w-full flex flex-col">
    <div class="flex-1 flex flex-col bg-white rounded-xl shadow-sm m-4 overflow-hidden">
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
          <label class="flex items-center gap-1.5 text-xs text-gray-500">
            字号
            <select
              v-model.number="logFontSizePx"
              class="h-7 rounded border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="size in logFontSizeOptions" :key="size" :value="size">{{ size }}px</option>
            </select>
          </label>
          <button
            class="h-7 px-2.5 rounded border border-gray-300 text-xs text-gray-700 bg-white hover:bg-gray-50 disabled:text-gray-400 disabled:bg-gray-100"
            :disabled="downloadingLog"
            @click="downloadLog"
          >
            {{ downloadingLog ? '下载中...' : '下载日志' }}
          </button>
          <label class="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
            <input type="checkbox" v-model="autoScroll" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            自动滚动
          </label>
          <span v-if="wsConnected" class="flex items-center gap-1.5 text-xs text-green-600">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            已连接
          </span>
          <span v-else-if="connecting" class="flex items-center gap-1.5 text-xs text-amber-600">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            连接中...
          </span>
        </div>
      </div>

      <div class="px-6 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
        <div class="flex items-center gap-2">
          <input
            v-model.trim="searchQuery"
            type="text"
            placeholder="服务端搜索日志关键字"
            class="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="performSearch(true)"
          />
          <button
            class="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white disabled:bg-blue-300"
            :disabled="searchLoading || !searchQuery"
            @click="performSearch(true)"
          >
            搜索
          </button>
          <button
            class="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 disabled:text-gray-300"
            :disabled="searchLoading || !searchQuery"
            @click="clearSearch"
          >
            清空
          </button>
        </div>

        <div v-if="searchError" class="mt-2 text-xs text-red-600">
          {{ searchError }}
        </div>

        <div v-if="searchResults.length" class="mt-2 max-h-32 overflow-y-auto space-y-1">
          <button
            v-for="hit in searchResults"
            :key="hit.offset"
            class="w-full text-left px-2 py-1 rounded border border-gray-200 bg-white hover:bg-blue-50 flex items-start gap-2"
            @click="jumpToSearchHit(hit)"
          >
            <span class="text-[11px] text-gray-500 shrink-0">{{ hit.offset }}</span>
            <span class="text-xs text-gray-700 break-all whitespace-pre-wrap">{{ hit.preview }}</span>
          </button>

          <button
            v-if="searchHasMore"
            class="w-full py-1.5 text-xs text-blue-600 border border-blue-200 rounded bg-white hover:bg-blue-50 disabled:text-blue-300"
            :disabled="searchLoading"
            @click="performSearch(false)"
          >
            加载更多命中
          </button>
        </div>
      </div>

      <div
        ref="logContainerRef"
        class="flex-1 overflow-auto p-4 font-mono whitespace-pre bg-white log-code-font"
        :style="logContainerStyle"
        @scroll="handleScroll"
      >
        <div v-if="initialLoading" class="text-gray-400 animate-pulse">Loading logs...</div>
        <template v-else>
          <div :style="{ height: `${renderedTopSpacerPx}px` }"></div>

          <div
            v-if="isRelocatingWindow"
            class="py-2 text-xs text-gray-400"
          >
            正在定位该位置附近的日志...
          </div>

          <div v-if="isLoadingOlder" class="text-xs text-gray-400 py-2">加载更早日志...</div>

          <div
            v-if="droppedHeadLines > 0"
            class="py-1.5 px-2 mb-2 rounded bg-amber-50 border border-amber-200 text-amber-700 text-xs"
          >
            为保证性能，顶部已折叠 {{ droppedHeadLines }} 行日志
            <button
              class="ml-2 text-amber-800 underline disabled:text-amber-400"
              :disabled="isLoadingOlder"
              @click="expandFoldedHead"
            >
              展开顶部
            </button>
          </div>

          <div
            v-for="line in visibleLogLines"
            :key="line.id"
            class="h-6 log-line"
            :data-line-id="line.id"
            :class="[
              line.isStderr ? 'text-red-600' : 'text-gray-800',
              line.highlight ? 'log-line--highlight bg-yellow-100 rounded px-1 -mx-1' : ''
            ]"
          >
            {{ line.text }}
          </div>

          <div
            v-if="droppedTailLines > 0"
            class="py-1.5 px-2 mt-2 rounded bg-amber-50 border border-amber-200 text-amber-700 text-xs"
          >
            为保证性能，底部已折叠 {{ droppedTailLines }} 行日志
            <button
              class="ml-2 text-amber-800 underline disabled:text-amber-400"
              :disabled="isLoadingNewer"
              @click="expandFoldedTail"
            >
              展开底部
            </button>
          </div>

          <div v-if="isLoadingNewer" class="text-xs text-gray-400 py-2">加载更新日志...</div>

          <div :style="{ height: `${renderedBottomSpacerPx}px` }"></div>

          <div v-if="finished" class="mt-3 pt-3 border-t border-gray-200 text-gray-400 text-xs">
            — Log stream ended —
          </div>
        </template>
      </div>

      <div class="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 shrink-0 bg-gray-50">
        <span>{{ lineCountText }} lines</span>
        <span>{{ formatBytes(fileSize) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { Terminal } from 'lucide-vue-next'

interface LogLine {
  id: number
  text: string
  isStderr: boolean
  highlight?: boolean
  byteStart?: number
  byteEnd?: number
  byteAfter?: number
}

interface LogWindowResponse {
  task_id: number | string
  status: string
  file_size: number
  window_start: number
  window_end: number
  next_backward_cursor: number | null
  next_forward_cursor: number | null
  has_more_backward: boolean
  has_more_forward: boolean
  text: string
}

interface LogSearchHit {
  offset: number
  preview: string
}

interface LogSearchResponse {
  task_id: number | string
  status: string
  file_size: number
  hits: LogSearchHit[]
  next_cursor: number | null
  has_more: boolean
}

interface LogContentResponse {
  task_id: number | string
  status: string
  content: string
}

interface LiveLogUpdate {
  line: LogLine
  replaceLast: boolean
}

const DEFAULT_WINDOW_BYTES = 256 * 1024
const SCROLL_WINDOW_BYTES = 64 * 1024
const MAX_LINES_IN_MEMORY = 3000
const LOG_LINE_HEIGHT_PX = 24
const LOG_FONT_SIZE_OPTIONS = [12, 13, 14, 16]
const LIVE_FLUSH_INTERVAL_MS = 120
const LIVE_MAX_LINES_PER_FLUSH = 400
const TOP_LOAD_THRESHOLD = 80
const BOTTOM_LOAD_THRESHOLD = 80
const BOUNDARY_LOAD_COOLDOWN_MS = 220
const SCROLL_IDLE_TRIGGER_MS = 140
const VIRTUAL_OVERSCAN_LINES = 60

const TERMINAL_STATUSES = new Set(['COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED'])

const props = defineProps<{
  taskId: number | string
}>()

const logLines = ref<LogLine[]>([])
const logContainerRef = ref<HTMLElement | null>(null)
const scrollTopPx = ref(0)
const viewportHeightPx = ref(0)
const autoScroll = ref(true)
const initialLoading = ref(true)
const connecting = ref(false)
const wsConnected = ref(false)
const finished = ref(false)
const taskStatus = ref('')

const fileSize = ref(0)
const earliestOffset = ref(0)
const latestOffset = ref(0)

const hasMoreBackward = ref(false)
const hasMoreForward = ref(false)
const isLoadingOlder = ref(false)
const isLoadingNewer = ref(false)
const isRelocatingWindow = ref(false)

const droppedHeadLines = ref(0)
const droppedTailLines = ref(0)
const topSpacerPx = ref(0)
const bottomSpacerPx = ref(0)
const loadedStartOffset = ref(0)
const loadedEndOffset = ref(0)
const avgBytesPerLine = ref(120)

const searchQuery = ref('')
const searchResults = ref<LogSearchHit[]>([])
const searchCursor = ref<number | null>(null)
const searchHasMore = ref(false)
const searchLoading = ref(false)
const searchError = ref('')
const downloadingLog = ref(false)
const logFontSizePx = ref(14)
const logFontSizeOptions = LOG_FONT_SIZE_OPTIONS

const liveQueue: LiveLogUpdate[] = []
const textEncoder = new TextEncoder()
let lineIdSeed = 0
let flushTimer: ReturnType<typeof setTimeout> | null = null
let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null
let scrollRafId: number | null = null
let lastBoundaryLoadAt = 0
let nextLiveByteCursor: number | null = null
let ws: WebSocket | null = null

const statusClassMap: Record<string, string> = {
  RUNNING: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  TIMEOUT: 'bg-amber-50 text-amber-700 border-amber-200',
  DISPATCHED: 'bg-purple-50 text-purple-700 border-purple-200',
  CANCELLED: 'bg-gray-100 text-gray-700 border-gray-300',
}

const statusClass = computed(() => {
  return statusClassMap[taskStatus.value] || 'bg-gray-50 text-gray-700 border-gray-200'
})

const lineCountText = computed(() => {
  const trimmed = droppedHeadLines.value + droppedTailLines.value
  if (trimmed === 0) return `${logLines.value.length}`
  return `${logLines.value.length} visible (+${trimmed} trimmed)`
})

const topVirtualSpacerPx = computed(() => {
  const unloadedTopBytes = Math.max(0, loadedStartOffset.value)
  const estimatedLines = unloadedTopBytes / Math.max(1, avgBytesPerLine.value)
  return topSpacerPx.value + Math.round(estimatedLines * LOG_LINE_HEIGHT_PX)
})

const bottomVirtualSpacerPx = computed(() => {
  const unloadedBottomBytes = Math.max(0, fileSize.value - loadedEndOffset.value)
  const estimatedLines = unloadedBottomBytes / Math.max(1, avgBytesPerLine.value)
  return bottomSpacerPx.value + Math.round(estimatedLines * LOG_LINE_HEIGHT_PX)
})

const visibleStartIndex = computed(() => {
  if (logLines.value.length === 0) return 0
  const loadedBlockHeight = logLines.value.length * LOG_LINE_HEIGHT_PX
  const offsetInLoadedBlock = Math.max(
    0,
    Math.min(loadedBlockHeight, scrollTopPx.value - topVirtualSpacerPx.value)
  )
  const estimatedStart = Math.floor(offsetInLoadedBlock / LOG_LINE_HEIGHT_PX) - VIRTUAL_OVERSCAN_LINES
  return Math.max(0, Math.min(logLines.value.length, estimatedStart))
})

const visibleEndIndex = computed(() => {
  const viewportLines = Math.max(1, Math.ceil(viewportHeightPx.value / LOG_LINE_HEIGHT_PX))
  const windowSize = viewportLines + VIRTUAL_OVERSCAN_LINES * 2
  return Math.max(visibleStartIndex.value, Math.min(logLines.value.length, visibleStartIndex.value + windowSize))
})

const visibleLogLines = computed(() => logLines.value.slice(visibleStartIndex.value, visibleEndIndex.value))

const renderedTopSpacerPx = computed(() => {
  return topVirtualSpacerPx.value + visibleStartIndex.value * LOG_LINE_HEIGHT_PX
})

const renderedBottomSpacerPx = computed(() => {
  return bottomVirtualSpacerPx.value + Math.max(0, logLines.value.length - visibleEndIndex.value) * LOG_LINE_HEIGHT_PX
})

const loadedBlockHeightPx = computed(() => logLines.value.length * LOG_LINE_HEIGHT_PX)

const totalVirtualContentHeightPx = computed(() => {
  return topVirtualSpacerPx.value + loadedBlockHeightPx.value + bottomVirtualSpacerPx.value
})

const logContainerStyle = computed(() => ({
  fontSize: `${logFontSizePx.value}px`,
  lineHeight: `${LOG_LINE_HEIGHT_PX}px`,
}))

const syncViewportMetrics = () => {
  if (!logContainerRef.value) return
  scrollTopPx.value = logContainerRef.value.scrollTop
  viewportHeightPx.value = logContainerRef.value.clientHeight
}

const isViewportOutsideLoadedBlock = () => {
  if (!logContainerRef.value || logLines.value.length === 0) return false

  const viewportTop = scrollTopPx.value
  const viewportBottom = viewportTop + viewportHeightPx.value
  const loadedTop = topVirtualSpacerPx.value
  const loadedBottom = loadedTop + loadedBlockHeightPx.value
  const margin = LOG_LINE_HEIGHT_PX * VIRTUAL_OVERSCAN_LINES

  return viewportBottom < loadedTop - margin || viewportTop > loadedBottom + margin
}

const estimateByteOffsetForViewport = () => {
  if (!logContainerRef.value || fileSize.value <= 0) return 0

  const totalHeight = Math.max(1, totalVirtualContentHeightPx.value)
  const viewportCenter = scrollTopPx.value + viewportHeightPx.value / 2
  const normalized = Math.min(1, Math.max(0, viewportCenter / totalHeight))
  return Math.round(fileSize.value * normalized)
}

const isNearBottom = () => {
  if (!logContainerRef.value) return false
  const el = logContainerRef.value
  return el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_LOAD_THRESHOLD
}

const isNearTopLoadBoundary = () => {
  if (!logContainerRef.value) return false
  const el = logContainerRef.value
  const threshold = topVirtualSpacerPx.value + TOP_LOAD_THRESHOLD
  return el.scrollTop <= threshold
}

const isNearBottomLoadBoundary = () => {
  if (!logContainerRef.value) return false
  const el = logContainerRef.value
  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  const threshold = bottomVirtualSpacerPx.value + BOTTOM_LOAD_THRESHOLD
  return distanceToBottom <= threshold
}

const formatBytes = (value: number) => {
  if (!value) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

const downloadLog = async () => {
  if (downloadingLog.value) return

  downloadingLog.value = true
  try {
    const response = await axios.get<LogContentResponse>(`/api/client-agents/agent-tasks/${props.taskId}/log/`)
    const content = response.data?.content || ''
    const timeSuffix = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `task_${props.taskId}_${timeSuffix}.log`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const objectUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    window.URL.revokeObjectURL(objectUrl)
  } catch (error) {
    console.error('Failed to download log', error)
  } finally {
    downloadingLog.value = false
  }
}

const createLine = (
  text: string,
  isStderr: boolean,
  byteStart?: number,
  byteEnd?: number,
  byteAfter?: number
): LogLine => {
  lineIdSeed += 1
  return { id: lineIdSeed, text, isStderr, highlight: false, byteStart, byteEnd, byteAfter }
}

const splitWindowTextToLines = (text: string, windowStart: number): LogLine[] => {
  if (!text) return []

  const rawLines = text.split('\n')
  const result: LogLine[] = []
  let cursor = windowStart

  for (let i = 0; i < rawLines.length; i += 1) {
    const line = rawLines[i]
    const lineBytes = textEncoder.encode(line).length
    const lineStart = cursor
    const lineEnd = lineStart + lineBytes
    const hasNewline = i < rawLines.length - 1

    const byteAfter = lineEnd + (hasNewline ? 1 : 0)
    result.push(createLine(line, false, lineStart, lineEnd, byteAfter))
    cursor = byteAfter
  }

  return result
}

const createLiveLine = (text: string, isStderr: boolean, lineComplete: boolean): LogLine => {
  if (!lineComplete || nextLiveByteCursor === null) {
    return createLine(text, isStderr)
  }

  const bytes = textEncoder.encode(text).length
  const lineStart = nextLiveByteCursor
  const lineEnd = lineStart + bytes
  const byteAfter = lineEnd + 1
  nextLiveByteCursor = byteAfter
  return createLine(text, isStderr, lineStart, lineEnd, byteAfter)
}

const syncOffsetRangeFromVisibleLines = () => {
  let first: LogLine | undefined
  for (const line of logLines.value) {
    if (line.byteStart !== undefined) {
      first = line
      break
    }
  }

  let last: LogLine | undefined
  for (let i = logLines.value.length - 1; i >= 0; i -= 1) {
    const line = logLines.value[i]
    if (line.byteAfter !== undefined) {
      last = line
      break
    }
  }

  if (first?.byteStart !== undefined) {
    earliestOffset.value = first.byteStart
  }
  if (last?.byteAfter !== undefined) {
    latestOffset.value = last.byteAfter
    nextLiveByteCursor = last.byteAfter
  }

  let totalBytes = 0
  let totalLines = 0
  for (const line of logLines.value) {
    if (line.byteStart === undefined || line.byteAfter === undefined) continue
    const span = Math.max(1, line.byteAfter - line.byteStart)
    totalBytes += span
    totalLines += 1
  }
  if (totalLines > 0) {
    avgBytesPerLine.value = Math.max(1, totalBytes / totalLines)
  }
}

const syncOffsetsFromVisibleEdges = () => {
  if (logLines.value.length === 0) return

  const first = logLines.value[0]
  const last = logLines.value[logLines.value.length - 1]

  if (first?.byteStart !== undefined) {
    earliestOffset.value = first.byteStart
    loadedStartOffset.value = first.byteStart
  }

  if (last?.byteAfter !== undefined) {
    latestOffset.value = last.byteAfter
    loadedEndOffset.value = Math.max(loadedEndOffset.value, last.byteAfter)
    nextLiveByteCursor = last.byteAfter
    fileSize.value = Math.max(fileSize.value, last.byteAfter)
  }
}

const updateAvgBytesFromChunk = (lines: LogLine[]) => {
  let totalBytes = 0
  let totalLines = 0
  for (const line of lines) {
    if (line.byteStart === undefined || line.byteAfter === undefined) continue
    totalBytes += Math.max(1, line.byteAfter - line.byteStart)
    totalLines += 1
  }
  if (totalLines === 0) return

  const sampleAvg = totalBytes / totalLines
  avgBytesPerLine.value = Math.max(1, avgBytesPerLine.value * 0.85 + sampleAvg * 0.15)
}

const scheduleScrollToBottom = () => {
  if (!autoScroll.value || !logContainerRef.value) return
  if (scrollRafId !== null) return

  scrollRafId = window.requestAnimationFrame(() => {
    scrollRafId = null
    if (!logContainerRef.value) return
    logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
    syncViewportMetrics()
  })
}

const clearHighlights = () => {
  for (const line of logLines.value) {
    line.highlight = false
  }
}

const applyMemoryLimit = (
  anchor: 'prepend' | 'append' | 'replace',
  options: { skipSync?: boolean } = {}
) => {
  const { skipSync = false } = options
  const total = logLines.value.length
  if (total <= MAX_LINES_IN_MEMORY) {
    return { trimmedHead: 0, trimmedTail: 0 }
  }

  const overflow = total - MAX_LINES_IN_MEMORY
  const overflowPx = overflow * LOG_LINE_HEIGHT_PX

  if (anchor === 'prepend') {
    logLines.value.splice(MAX_LINES_IN_MEMORY)
    droppedTailLines.value += overflow
    bottomSpacerPx.value += overflowPx
    if (!skipSync) {
      syncOffsetRangeFromVisibleLines()
    }
    return { trimmedHead: 0, trimmedTail: overflow }
  } else {
    logLines.value.splice(0, overflow)
    droppedHeadLines.value += overflow
    topSpacerPx.value += overflowPx
    if (!skipSync) {
      syncOffsetRangeFromVisibleLines()
    }
    return { trimmedHead: overflow, trimmedTail: 0 }
  }
}

const refreshWindowFlags = () => {
  hasMoreBackward.value = loadedStartOffset.value > 0 || droppedHeadLines.value > 0
  hasMoreForward.value = loadedEndOffset.value < fileSize.value || droppedTailLines.value > 0
}

const syncTaskStatus = (status: string | undefined) => {
  if (!status) return
  taskStatus.value = status
  finished.value = TERMINAL_STATUSES.has(status)
}

const applyWindowChunk = async (
  windowData: LogWindowResponse,
  mode: 'replace' | 'prepend' | 'append',
  options: { scrollToBottomOnReplace?: boolean } = {}
) => {
  const { scrollToBottomOnReplace = false } = options
  syncTaskStatus(windowData.status)
  const chunkLines = splitWindowTextToLines(windowData.text, windowData.window_start)
  fileSize.value = windowData.file_size || 0

  if (mode === 'replace') {
    logLines.value = chunkLines
    droppedHeadLines.value = 0
    droppedTailLines.value = 0
    topSpacerPx.value = 0
    bottomSpacerPx.value = 0
    earliestOffset.value = windowData.window_start
    latestOffset.value = windowData.window_end
    loadedStartOffset.value = windowData.window_start
    loadedEndOffset.value = windowData.window_end
    nextLiveByteCursor = windowData.window_end
    applyMemoryLimit('replace', { skipSync: true })
    syncOffsetsFromVisibleEdges()
    updateAvgBytesFromChunk(chunkLines)
    refreshWindowFlags()
    await nextTick()
    syncViewportMetrics()
    if (scrollToBottomOnReplace) {
      scheduleScrollToBottom()
    }
    return
  }

  if (mode === 'prepend') {
    const container = logContainerRef.value
    const previousScrollHeight = container?.scrollHeight ?? 0
    const previousScrollTop = container?.scrollTop ?? 0
    const recovered = Math.min(droppedHeadLines.value, chunkLines.length)
    droppedHeadLines.value -= recovered
    topSpacerPx.value = Math.max(0, topSpacerPx.value - recovered * LOG_LINE_HEIGHT_PX)

    if (chunkLines.length > 0) {
      logLines.value.unshift(...chunkLines)
    }
    loadedStartOffset.value = Math.min(loadedStartOffset.value, windowData.window_start)
    applyMemoryLimit('prepend', { skipSync: true })
    syncOffsetsFromVisibleEdges()
    updateAvgBytesFromChunk(chunkLines)
    refreshWindowFlags()

    await nextTick()
    if (container) {
      const delta = container.scrollHeight - previousScrollHeight
      container.scrollTop = previousScrollTop + Math.max(0, delta)
    }
    syncViewportMetrics()
    return
  }

  const recovered = Math.min(droppedTailLines.value, chunkLines.length)
  droppedTailLines.value -= recovered
  bottomSpacerPx.value = Math.max(0, bottomSpacerPx.value - recovered * LOG_LINE_HEIGHT_PX)
  logLines.value.push(...chunkLines)
  loadedEndOffset.value = Math.max(loadedEndOffset.value, windowData.window_end)
  applyMemoryLimit('append', { skipSync: true })
  syncOffsetsFromVisibleEdges()
  updateAvgBytesFromChunk(chunkLines)
  latestOffset.value = Math.max(latestOffset.value, windowData.window_end)
  nextLiveByteCursor = latestOffset.value
  refreshWindowFlags()
}

const fetchLogWindow = async (params: {
  direction: 'backward' | 'forward'
  cursor?: number
  limit_bytes?: number
}) => {
  const response = await axios.get<LogWindowResponse>(`/api/client-agents/agent-tasks/${props.taskId}/log-window/`, {
    params,
  })
  return response.data
}

const loadInitialWindow = async () => {
  initialLoading.value = true
  droppedHeadLines.value = 0
  droppedTailLines.value = 0
  topSpacerPx.value = 0
  bottomSpacerPx.value = 0
  logLines.value = []
  earliestOffset.value = 0
  latestOffset.value = 0
  loadedStartOffset.value = 0
  loadedEndOffset.value = 0
  avgBytesPerLine.value = 120
  nextLiveByteCursor = null
  fileSize.value = 0

  try {
    const data = await fetchLogWindow({ direction: 'backward', limit_bytes: DEFAULT_WINDOW_BYTES })
    taskStatus.value = data.status || ''
    finished.value = TERMINAL_STATUSES.has(data.status || '')
    await applyWindowChunk(data, 'replace', { scrollToBottomOnReplace: true })
  } catch (error) {
    console.error('Failed to load initial log window', error)
  } finally {
    initialLoading.value = false
  }
}

const loadOlderLogs = async (limitBytes = SCROLL_WINDOW_BYTES) => {
  if (isLoadingOlder.value || (!hasMoreBackward.value && droppedHeadLines.value <= 0)) return
  isLoadingOlder.value = true

  try {
    const data = await fetchLogWindow({
      direction: 'backward',
      cursor: earliestOffset.value,
      limit_bytes: limitBytes,
    })
    await applyWindowChunk(data, 'prepend')
  } catch (error) {
    console.error('Failed to load older logs', error)
  } finally {
    isLoadingOlder.value = false
  }
}

const loadNewerLogs = async (limitBytes = SCROLL_WINDOW_BYTES) => {
  if (isLoadingNewer.value || (!hasMoreForward.value && droppedTailLines.value <= 0)) return
  isLoadingNewer.value = true

  try {
    const data = await fetchLogWindow({
      direction: 'forward',
      cursor: latestOffset.value,
      limit_bytes: limitBytes,
    })
    await applyWindowChunk(data, 'append')
  } catch (error) {
    console.error('Failed to load newer logs', error)
  } finally {
    isLoadingNewer.value = false
  }
}

const relocateWindowToViewport = async () => {
  if (isRelocatingWindow.value || initialLoading.value || fileSize.value <= 0) return
  if (!isViewportOutsideLoadedBlock()) return

  isRelocatingWindow.value = true
  try {
    const targetOffset = estimateByteOffsetForViewport()
    const cursor = Math.max(0, Math.min(fileSize.value, targetOffset + Math.floor(DEFAULT_WINDOW_BYTES / 2)))
    const data = await fetchLogWindow({
      direction: 'backward',
      cursor,
      limit_bytes: DEFAULT_WINDOW_BYTES,
    })
    await applyWindowChunk(data, 'replace')

    if (logContainerRef.value) {
      const blockStart = topVirtualSpacerPx.value
      const relativeBytes = Math.max(0, targetOffset - loadedStartOffset.value)
      const relativeLines = Math.max(0, Math.round(relativeBytes / Math.max(1, avgBytesPerLine.value)))
      const targetTop = blockStart + relativeLines * LOG_LINE_HEIGHT_PX
      const centerOffset = Math.max(0, (logContainerRef.value.clientHeight - LOG_LINE_HEIGHT_PX) / 2)
      logContainerRef.value.scrollTop = Math.max(0, targetTop - centerOffset)
      syncViewportMetrics()
    }
  } catch (error) {
    console.error('Failed to relocate log window', error)
  } finally {
    isRelocatingWindow.value = false
  }
}

const scheduleLiveFlush = () => {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    if (liveQueue.length === 0) return

    const pending = liveQueue.splice(0, LIVE_MAX_LINES_PER_FLUSH)
    const atBottom = isNearBottom()
    const committedLines: LogLine[] = []
    let appendedLine = false

    for (const update of pending) {
      if (update.replaceLast && logLines.value.length > 0) {
        const lastIndex = logLines.value.length - 1
        const previous = logLines.value[lastIndex]
        if (!previous) continue

        logLines.value[lastIndex] = {
          ...update.line,
          id: previous.id,
          highlight: previous.highlight,
        }
        if (update.line.byteAfter !== undefined) {
          committedLines.push(logLines.value[lastIndex])
        }
        continue
      }

      logLines.value.push(update.line)
      appendedLine = true
      if (update.line.byteAfter !== undefined) {
        committedLines.push(update.line)
      }
    }

    if (appendedLine) {
      applyMemoryLimit('append', { skipSync: true })
    }
    syncOffsetsFromVisibleEdges()
    if (committedLines.length > 0) {
      updateAvgBytesFromChunk(committedLines)
    }
    refreshWindowFlags()
    hasMoreForward.value = false

    if (autoScroll.value || atBottom) {
      scheduleScrollToBottom()
    }

    if (liveQueue.length > 0) {
      scheduleLiveFlush()
    }
  }, LIVE_FLUSH_INTERVAL_MS)
}

const enqueueLiveUpdate = (
  line: string,
  isStderr: boolean,
  replaceLast: boolean,
  lineComplete: boolean
) => {
  liveQueue.push({
    line: createLiveLine(line, isStderr, lineComplete),
    replaceLast,
  })
  scheduleLiveFlush()
}

const scrollToLineIndex = async (lineIndex: number) => {
  if (!logContainerRef.value) return
  const clampedIndex = Math.max(0, Math.min(logLines.value.length - 1, lineIndex))
  const targetTop = topVirtualSpacerPx.value + clampedIndex * LOG_LINE_HEIGHT_PX
  const centerOffset = Math.max(0, (logContainerRef.value.clientHeight - LOG_LINE_HEIGHT_PX) / 2)
  logContainerRef.value.scrollTop = Math.max(0, targetTop - centerOffset)
  syncViewportMetrics()
  await nextTick()
}

const highlightCurrentQuery = async () => {
  clearHighlights()

  const query = searchQuery.value
  if (!query) return

  let firstHighlightIndex = -1
  for (let i = 0; i < logLines.value.length; i += 1) {
    const line = logLines.value[i]
    if (line.text.includes(query)) {
      line.highlight = true
      if (firstHighlightIndex === -1) {
        firstHighlightIndex = i
      }
    }
  }

  if (firstHighlightIndex < 0) return
  await scrollToLineIndex(firstHighlightIndex)
}

const highlightLineByOffset = async (offset: number) => {
  clearHighlights()

  let targetLineIndex = -1
  for (let i = 0; i < logLines.value.length; i += 1) {
    const line = logLines.value[i]
    if (line.byteStart === undefined || line.byteEnd === undefined) {
      continue
    }
    if (offset >= line.byteStart && offset < line.byteEnd) {
      targetLineIndex = i
      break
    }
  }

  if (targetLineIndex < 0) {
    await highlightCurrentQuery()
    return
  }

  const targetLine = logLines.value[targetLineIndex]
  if (!targetLine) return
  targetLine.highlight = true
  await scrollToLineIndex(targetLineIndex)
}

const performSearch = async (reset: boolean) => {
  if (!searchQuery.value || searchLoading.value) return

  searchLoading.value = true
  searchError.value = ''

  if (reset) {
    searchResults.value = []
    searchCursor.value = null
    searchHasMore.value = false
  }

  try {
    const response = await axios.get<LogSearchResponse>(`/api/client-agents/agent-tasks/${props.taskId}/log-search/`, {
      params: {
        q: searchQuery.value,
        cursor: reset ? undefined : searchCursor.value ?? undefined,
        limit: 20,
      },
    })

    const data = response.data
    searchResults.value = [...searchResults.value, ...data.hits]
    searchCursor.value = data.next_cursor ?? null
    searchHasMore.value = Boolean(data.has_more)
    if (data.file_size !== undefined) {
      fileSize.value = data.file_size
    }
  } catch (error: unknown) {
    const maybeError = error as { response?: { data?: { error?: string } } }
    searchError.value = maybeError.response?.data?.error || '搜索失败'
  } finally {
    searchLoading.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  searchCursor.value = null
  searchHasMore.value = false
  searchError.value = ''
  clearHighlights()
}

const jumpToSearchHit = async (hit: LogSearchHit) => {
  autoScroll.value = false

  const cursor = Math.max(0, hit.offset + Math.floor(DEFAULT_WINDOW_BYTES / 2))

  try {
    const data = await fetchLogWindow({
      direction: 'backward',
      cursor,
      limit_bytes: DEFAULT_WINDOW_BYTES,
    })
    await applyWindowChunk(data, 'replace')
    await highlightLineByOffset(hit.offset)
  } catch (error) {
    console.error('Failed to jump to search hit', error)
  }
}

const expandFoldedHead = async () => {
  await loadOlderLogs(DEFAULT_WINDOW_BYTES)
}

const expandFoldedTail = async () => {
  await loadNewerLogs(DEFAULT_WINDOW_BYTES)
}

const scheduleBoundaryLoadCheck = () => {
  if (scrollIdleTimer) {
    clearTimeout(scrollIdleTimer)
  }

  scrollIdleTimer = setTimeout(() => {
    scrollIdleTimer = null
    const now = Date.now()
    if (now - lastBoundaryLoadAt <= BOUNDARY_LOAD_COOLDOWN_MS) return

    if (isViewportOutsideLoadedBlock()) {
      lastBoundaryLoadAt = now
      void relocateWindowToViewport()
      return
    }

    if (isNearTopLoadBoundary()) {
      lastBoundaryLoadAt = now
      void loadOlderLogs()
      return
    }

    if (isNearBottomLoadBoundary() && hasMoreForward.value) {
      lastBoundaryLoadAt = now
      void loadNewerLogs()
    }
  }, SCROLL_IDLE_TRIGGER_MS)
}

const handleScroll = () => {
  if (!logContainerRef.value) return

  syncViewportMetrics()
  autoScroll.value = isNearBottom()
  scheduleBoundaryLoadCheck()
}

const handleWindowResize = () => {
  syncViewportMetrics()
}

const connectWs = () => {
  if (!props.taskId) return

  connecting.value = true

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  const wsUrl = `${protocol}//${host}/ws/agent-log/${props.taskId}/?history=0`

  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    connecting.value = false
    wsConnected.value = true
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      if (data.type === 'log_init') {
        taskStatus.value = data.task_status || taskStatus.value
        finished.value = TERMINAL_STATUSES.has(taskStatus.value)
        return
      }

      if (data.type === 'log_history') {
        taskStatus.value = data.task_status || taskStatus.value
        finished.value = TERMINAL_STATUSES.has(taskStatus.value)
        return
      }

      if (data.type === 'log') {
        const lineText = typeof data.line === 'string' ? data.line : ''
        const replaceLast = Boolean(data.replace_last)
        const lineComplete = data.line_complete !== false
        enqueueLiveUpdate(lineText, Boolean(data.is_stderr), replaceLast, lineComplete)

        if (data.finished) {
          finished.value = true
          if (data.exit_code !== undefined && data.exit_code !== null) {
            taskStatus.value = data.exit_code === 0 ? 'COMPLETED' : 'FAILED'
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse log message', error)
    }
  }

  ws.onclose = () => {
    wsConnected.value = false
    connecting.value = false
  }

  ws.onerror = (error) => {
    console.error('Log WebSocket error', error)
    wsConnected.value = false
    connecting.value = false
  }
}

const disconnectWs = () => {
  if (ws) {
    ws.close()
    ws = null
  }

  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }

  if (scrollIdleTimer) {
    clearTimeout(scrollIdleTimer)
    scrollIdleTimer = null
  }

  if (scrollRafId !== null) {
    window.cancelAnimationFrame(scrollRafId)
    scrollRafId = null
  }

  wsConnected.value = false
}

onMounted(async () => {
  await loadInitialWindow()
  await nextTick()
  syncViewportMetrics()
  window.addEventListener('resize', handleWindowResize)
  connectWs()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
  disconnectWs()
})
</script>

<style scoped>
.log-code-font {
  font-family:
    'JetBrains Mono',
    'Cascadia Mono',
    'Cascadia Code',
    'Fira Code',
    'SF Mono',
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    'Liberation Mono',
    'Sarasa Mono SC',
    'Noto Sans Mono CJK SC',
    'Source Han Mono SC',
    'Microsoft YaHei Mono',
    'Courier New',
    monospace;
  font-variant-ligatures: none;
  font-feature-settings: 'liga' 0, 'calt' 0;
}
</style>
