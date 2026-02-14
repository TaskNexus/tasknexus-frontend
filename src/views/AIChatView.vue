<template>
  <div class="flex h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
    
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div class="p-4 border-b border-gray-200">
        <button 
          @click="createNewChat"
          class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus class="w-4 h-4" />
          {{ $t('aiChat.newChat') }}
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-3 space-y-1">
        <div v-if="sessions.length === 0" class="text-center text-gray-400 text-sm py-4">
          {{ $t('aiChat.noHistory') }}
        </div>
        <div 
          v-for="session in sessions" 
          :key="session.id"
          class="group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
          :class="session.id === currentSessionId ? 'bg-white shadow-sm border border-gray-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'"
          @click="selectSession(session.id)"
        >
          <MessageSquare class="w-4 h-4 flex-shrink-0" />
          <div class="flex-1 truncate text-sm font-medium">
            {{ session.title }}
          </div>
          <button 
            @click.stop="deleteSession(session.id)"
            class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <header class="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div class="flex items-center gap-4">
          <!-- Project Selector -->
          <div class="relative min-w-[200px]">
            <select 
              v-model="selectedProjectId" 
              class="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 appearance-none cursor-pointer"
              @change="handleProjectChange"
              :disabled="loading"
            >
              <option :value="null" disabled>Select Project</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <ChevronDown class="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <!-- Model Group Selector -->
          <div class="relative min-w-[200px]">
            <select 
              v-model="selectedModelGroup" 
              class="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 appearance-none cursor-pointer"
              :disabled="!selectedProjectId || loading"
              @change="handleGroupChange"
            >
              <option value="" disabled>Select Model Group</option>
              <option v-for="group in modelGroups" :key="group.title" :value="group.title">
                {{ group.title }}
              </option>
            </select>
            <ChevronDown class="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <!-- Model Selector -->
          <div class="relative min-w-[200px]" v-if="availableModels.length">
            <select 
              v-model="selectedModel" 
              class="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 appearance-none cursor-pointer"
              :disabled="loading"
            >
              <option value="" disabled>Select Model</option>
              <option v-for="m in availableModels" :key="m.name" :value="m.name">{{ m.name }}</option>
            </select>
            <ChevronDown class="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </header>

      <!-- Main Chat Area -->
      <main class="flex-1 overflow-y-auto p-6 scroll-smooth" ref="chatContainer">
        
        <!-- Greeting / Empty State -->
        <div v-if="visibleMessages.length === 0" class="flex flex-col items-center justify-center h-full text-center text-gray-500">
          <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <Bot class="w-8 h-8 text-blue-600" />
          </div>
          <h1 class="text-2xl font-semibold text-gray-900 mb-2">Hi, {{ authStore.user?.username || 'User' }}</h1>
          <p class="text-gray-500">Select a project to start chatting</p>
        </div>

        <!-- Message List -->
        <div v-else class="max-w-4xl mx-auto space-y-6">
          <div v-for="(msg, index) in visibleMessages" :key="index" class="flex gap-4" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
            <!-- Avatar for AI -->
            <div v-if="msg.role === 'assistant'" class="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
              <Bot class="w-5 h-5 text-green-600" />
            </div>

            <!-- Message Bubble -->
            <div 
              class="max-w-[85%] rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden"
              :class="msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none px-5 py-3.5' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'"
            >
                <div v-if="msg.role === 'user'">
                    <div class="markdown-content" v-html="renderMarkdown(msg.content)"></div>
                </div>
                <div v-else class="flex flex-col">
                    <!-- Thinking Block -->
                    <div v-if="msg.thought" class="border-b border-gray-100">
                        <div 
                            @click="msg.isThinkingCollapsed = !msg.isThinkingCollapsed"
                            class="flex items-center gap-2 px-4 py-2 cursor-pointer select-none hover:bg-gray-50 transition-colors rounded-t-lg"
                        >
                            <component :is="msg.isThinkingCollapsed ? ChevronRight : ChevronDown" class="w-4 h-4 text-gray-400" />
                            <span class="text-xs font-medium text-gray-400">{{ msg.thoughtTime || 'Process' }}</span>
                        </div>
                        <div v-show="!msg.isThinkingCollapsed" class="px-4 py-2 text-gray-400 text-sm leading-relaxed whitespace-pre-wrap border-l-2 border-gray-200 ml-4 mb-2">
{{ msg.thought }}
                        </div>
                    </div>
                    
                    <!-- Main Content -->
                    <div class="px-5 py-3.5 markdown-content" v-html="renderMarkdown(msg.mainContent)"></div>
                </div>
            </div>

            <!-- Avatar for User -->
            <div v-if="msg.role === 'user'" class="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
              <User class="w-5 h-5 text-blue-600" />
            </div>
          </div>
          
          <!-- Loading Indicator -->
          <div v-if="loading" class="flex gap-4 justify-start">
            <div class="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
              <Bot class="w-5 h-5 text-green-600" />
            </div>
            <div class="bg-white border border-gray-100 px-5 py-3.5 rounded-2xl rounded-bl-none text-gray-500 text-sm flex items-center gap-2 shadow-sm">
              <Loader2 class="w-4 h-4 animate-spin text-blue-500" />
              Thinking...
            </div>
          </div>
        </div>

      </main>

      <!-- Input Area -->
      <div class="flex-none p-6 bg-white border-t border-gray-200">
        <div class="max-w-4xl mx-auto relative bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all shadow-sm">
          <textarea 
            v-model="inputMessage"
            @keydown.enter.prevent="sendMessage"
            rows="1"
            class="w-full bg-transparent text-gray-900 placeholder-gray-400 px-4 py-4 pr-12 rounded-xl focus:outline-none resize-none overflow-hidden"
            style="min-height: 56px; max-height: 200px;"
            placeholder="Type your message... (Shift+Enter for new line)"
            ref="inputRef"
            @input="adjustHeight"
          ></textarea>
          
          <div class="absolute right-2 bottom-2 flex items-center gap-2">
            <button 
              @click="sendMessage"
              :disabled="!inputMessage.trim() || loading || !selectedProjectId || !selectedModelGroup"
              class="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ArrowUp class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { ChevronDown, ChevronRight, Bot, User, ArrowUp, Loader2, Sparkles, MessageSquare, Plus, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css' // Import highlight.js style

const authStore = useAuthStore()

// Markdown Setup
const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre class="hljs"><code>' +
                    hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                    '</code></pre>';
            } catch (__) { }
        }
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
})

// Data
const projects = ref<any[]>([])
const sessions = ref<any[]>([])
const currentSessionId = ref<number | null>(null)

const selectedProjectId = ref<number | null>(null)
const selectedModelGroup = ref<string>('')
const selectedModel = ref<string>('')

const modelGroups = ref<any[]>([])
const availableModels = ref<any[]>([])

const messages = ref<Array<{role: string, content: string}>>([])

interface ParsedMessage {
    role: string
    content: string
    thought?: string
    thoughtTime?: string
    mainContent: string
    isThinkingCollapsed: boolean
}

const visibleMessages = computed<ParsedMessage[]>(() => {
    return messages.value
        .filter(m => m.role !== 'tool')
        .map(m => {
            if (m.role === 'user') {
                return {
                    role: m.role,
                    content: m.content,
                    mainContent: m.content,
                    isThinkingCollapsed: true
                }
            }

            // Parse <think> tags
            const thinkRegex = /<think>([\s\S]*?)<\/think>/i
            const match = thinkRegex.exec(m.content)
            
            if (match) {
                const thought = match[1].trim()
                const mainContent = m.content.replace(match[0], '').trim()
                return {
                    role: m.role,
                    content: m.content,
                    thought: thought,
                    thoughtTime: 'Thinking...', // Could be calculated if we tracked it
                    mainContent: mainContent,
                    isThinkingCollapsed: false // Auto-expand by default for new messages? Or collapse?
                }
            }

            return {
                role: m.role,
                content: m.content,
                mainContent: m.content,
                isThinkingCollapsed: true
            }
        })
})
const inputMessage = ref('')
const loading = ref(false)
const chatContainer = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)

// Methods
const renderMarkdown = (content: string) => {
    return md.render(content)
}

const fetchProjects = async () => {
    try {
        const response = await axios.get('/api/projects/')
        projects.value = response.data
    } catch (e) {
        console.error("Failed to load projects", e)
    }
}

const fetchSessions = async () => {
    try {
        const response = await axios.get('/api/chat/sessions/')
        sessions.value = response.data
    } catch (e) {
        console.error("Failed to load sessions", e)
    }
}

const createNewChat = () => {
    currentSessionId.value = null
    messages.value = []
    // Keep project selection if possible, or reset? Let's keep it for convenience
}

const selectSession = async (id: number) => {
    if (currentSessionId.value === id) return
    currentSessionId.value = id
    loading.value = true
    try {
        const response = await axios.get(`/api/chat/${id}/messages/`)
        messages.value = response.data
        
        // Restore project context if the session has it
        const session = sessions.value.find(s => s.id === id)
        if (session && session.project_id) {
             selectedProjectId.value = session.project_id
             handleProjectChange() // This loads modelGroups but resets selection
             
             if (session.model_group) {
                 // Verify group exists
                 const group = modelGroups.value.find(g => g.title === session.model_group)
                 if (group) {
                     selectedModelGroup.value = session.model_group
                     handleGroupChange() // This loads availableModels but resets selection
                     
                         if (session.model) {
                             const model = availableModels.value.find(m => m.name === session.model)
                             if (model) {
                                 selectedModel.value = session.model
                             }
                         }
                 }
             }
        }
        
    } catch (e) {
        console.error("Failed to load messages", e)
    } finally {
        loading.value = false
        await scrollToBottom()
    }
}

const deleteSession = async (id: number) => {
    if (!confirm('Are you sure you want to delete this chat?')) return
    try {
        await axios.delete(`/api/chat/${id}/session/`)
        sessions.value = sessions.value.filter(s => s.id !== id)
        if (currentSessionId.value === id) {
            createNewChat()
        }
    } catch (e) {
        console.error("Failed to delete session", e)
    }
}

const handleProjectChange = () => {
    selectedModelGroup.value = ''
    selectedModel.value = ''
    modelGroups.value = []
    
    if (!selectedProjectId.value) return
    
    const project = projects.value.find(p => p.id === selectedProjectId.value)
    if (project && project.extra_config && project.extra_config.model_groups) {
        modelGroups.value = project.extra_config.model_groups.filter((g: any) => g.enabled !== false)
        if (modelGroups.value.length > 0) {
            selectedModelGroup.value = modelGroups.value[0].title
            handleGroupChange()
        }
    }
}

const handleGroupChange = () => {
    selectedModel.value = ''
    availableModels.value = []
    
    if (!selectedModelGroup.value) return
    
    const group = modelGroups.value.find(g => g.title === selectedModelGroup.value)
    if (group && group.models) {
        availableModels.value = group.models.filter((m: any) => m.enabled !== false)
        if (availableModels.value.length > 0) {
            selectedModel.value = availableModels.value[0].name
        }
    }
}

const adjustHeight = () => {
    if (inputRef.value) {
        inputRef.value.style.height = 'auto'
        inputRef.value.style.height = inputRef.value.scrollHeight + 'px'
    }
}

const scrollToBottom = async () => {
    await nextTick()
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
}

const sendMessage = async () => {
    if (!inputMessage.value.trim() || loading.value) return
    if (!selectedProjectId.value || !selectedModelGroup.value) {
        alert("Please select a project and model group")
        return
    }

    const content = inputMessage.value.trim()
    inputMessage.value = ''
    if(inputRef.value) inputRef.value.style.height = '56px';

    // Add user message optimistic update
    messages.value.push({ role: 'user', content })
    await scrollToBottom()

    loading.value = true
    
    try {
        const payload = {
            session_id: currentSessionId.value,
            project_id: selectedProjectId.value,
            model_group: selectedModelGroup.value,
            model: selectedModel.value,
            messages: messages.value.map(m => ({ role: m.role, content: m.content }))
        }
        
        // Use fetch with streaming for SSE
        const baseUrl = import.meta.env.VITE_API_URL || ''
        const response = await fetch(`${baseUrl}/api/chat/completions/stream/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authStore.accessToken}`
            },
            body: JSON.stringify(payload)
        })
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const reader = response.body?.getReader()
        if (!reader) {
            throw new Error('ReadableStream not supported')
        }
        
        const decoder = new TextDecoder()
        let buffer = ''
        
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            buffer += decoder.decode(value, { stream: true })
            
            // Parse SSE events from buffer
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6) // Remove "data: " prefix
                    if (jsonStr.trim()) {
                        try {
                            const event = JSON.parse(jsonStr)
                            
                            if (event.type === 'message') {
                                // Add message to UI immediately
                                messages.value.push({
                                    role: event.role,
                                    content: event.content
                                })
                                await scrollToBottom()
                            } else if (event.type === 'done') {
                                // Update session info
                                if (event.session_id) {
                                    currentSessionId.value = event.session_id
                                    await fetchSessions()
                                }
                            } else if (event.type === 'error') {
                                messages.value.push({
                                    role: 'assistant',
                                    content: `Error: ${event.error}`
                                })
                            }
                        } catch (parseError) {
                            console.error('Failed to parse SSE event:', parseError, jsonStr)
                        }
                    }
                }
            }
        }
        
    } catch (e: any) {
        console.error("Chat error", e)
        messages.value.push({
            role: 'assistant',
            content: `Error: ${e.message || 'Unknown error'}`
        })
    } finally {
        loading.value = false
        await scrollToBottom()
    }
}

onMounted(async () => {
    await Promise.all([fetchProjects(), fetchSessions()])
    
    // Auto select first project if none selected and no session
    if (projects.value.length > 0 && !currentSessionId.value) {
        selectedProjectId.value = projects.value[0].id
        handleProjectChange()
    }
})
</script>

<style>
/* Markdown Content Styles */
.markdown-content {
    line-height: 1.6;
}

.markdown-content p {
    margin-bottom: 0.75em;
}

.markdown-content p:last-child {
    margin-bottom: 0;
}

.markdown-content pre {
    background-color: #0d1117; /* GitHub Dark background */
    color: #c9d1d9;
    padding: 1em;
    border-radius: 0.5em;
    overflow-x: auto;
    margin: 1em 0;
    font-size: 0.9em;
}

.markdown-content code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    background-color: rgba(175, 184, 193, 0.2);
    padding: 0.2em 0.4em;
    border-radius: 0.25em;
    font-size: 0.9em;
}

.markdown-content pre code {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
    font-size: 1em;
}

.markdown-content ul, .markdown-content ol {
    margin-left: 1.5em;
    margin-bottom: 1em;
    list-style-type: disc;
}

.markdown-content ol {
    list-style-type: decimal;
}

.markdown-content li {
    margin-bottom: 0.25em;
}

.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4 {
    font-weight: 600;
    margin-top: 1.5em;
    margin-bottom: 0.75em;
    line-height: 1.25;
}

.markdown-content h1 { font-size: 1.5em; }
.markdown-content h2 { font-size: 1.25em; }
.markdown-content h3 { font-size: 1.1em; }

.markdown-content a {
    color: #0969da;
    text-decoration: underline;
}

.markdown-content blockquote {
    border-left: 4px solid #d0d7de;
    padding-left: 1em;
    color: #57606a;
    margin: 1em 0;
}

.markdown-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
}

.markdown-content th, .markdown-content td {
    border: 1px solid #d0d7de;
    padding: 0.5em;
    text-align: left;
}

.markdown-content th {
    background-color: #f6f8fa;
    font-weight: 600;
}
</style>
