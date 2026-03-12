<template>
    <div class="space-y-2">
        <div class="flex items-center justify-between">
            <div class="text-xs text-gray-500">
                语言：<span class="font-medium text-gray-700">{{ normalizedValue.language }}</span>
            </div>
            <button
                type="button"
                class="px-3 py-1.5 text-xs rounded border border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
                @click="openEditor"
            >
                代码编辑
            </button>
        </div>

        <div class="border border-gray-200 rounded bg-gray-50">
            <pre class="p-2 text-xs text-gray-600 max-h-24 overflow-auto whitespace-pre-wrap break-words">{{ previewText }}</pre>
        </div>

        <div
            v-if="isOpen"
            class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            @click.self="closeEditor"
        >
            <div class="w-full max-w-5xl h-[80vh] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
                <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-gray-800">代码编辑</h3>
                    <button
                        type="button"
                        class="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        @click="closeEditor"
                    >
                        关闭
                    </button>
                </div>

                <div class="px-4 py-3 border-b border-gray-100">
                    <label class="text-xs text-gray-600 mr-2">语言</label>
                    <select
                        v-model="draftLanguage"
                        class="px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="shell">shell</option>
                        <option value="python">python</option>
                    </select>
                </div>

                <div class="flex-1 p-4 min-h-0">
                    <div class="h-full border border-gray-200 rounded overflow-hidden bg-white flex flex-col min-h-0">
                        <div class="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 bg-gray-50">CodeMirror 编辑器</div>
                        <div ref="editorRootRef" class="code-editor-root flex-1 min-h-0"></div>
                    </div>
                </div>

                <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        class="px-3 py-2 text-sm rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                        @click="closeEditor"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        class="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                        @click="saveEditor"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { basicSetup } from 'codemirror'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { python } from '@codemirror/lang-python'
import { StreamLanguage } from '@codemirror/language'
import { shell } from '@codemirror/legacy-modes/mode/shell'

interface CodeEditorValue {
    language: 'shell' | 'python'
    content: string
}

const props = defineProps<{
    modelValue?: Partial<CodeEditorValue> | Record<string, any>
}>()

const emit = defineEmits<{
    'update:modelValue': [value: CodeEditorValue]
}>()

const isOpen = ref(false)
const draftLanguage = ref<'shell' | 'python'>('shell')
const draftContent = ref('')
const editorRootRef = ref<HTMLElement | null>(null)
const languageCompartment = new Compartment()
let editorView: EditorView | null = null

const normalizeValue = (raw?: Partial<CodeEditorValue> | Record<string, any>): CodeEditorValue => {
    const language = raw?.language === 'python' ? 'python' : 'shell'
    const content = typeof raw?.content === 'string' ? raw.content : ''
    return { language, content }
}

const normalizedValue = computed(() => normalizeValue(props.modelValue))

const previewText = computed(() => {
    const code = normalizedValue.value.content.trim()
    if (!code) {
        return '暂无代码'
    }
    const lines = code.split('\n').slice(0, 6)
    if (code.split('\n').length > 6) {
        lines.push('...')
    }
    return lines.join('\n')
})

const getLanguageExtension = (language: 'shell' | 'python') => {
    if (language === 'python') {
        return python()
    }
    return StreamLanguage.define(shell)
}

const createEditor = () => {
    if (!editorRootRef.value) {
        return
    }

    editorView = new EditorView({
        state: EditorState.create({
            doc: draftContent.value,
            extensions: [
                basicSetup,
                EditorView.lineWrapping,
                languageCompartment.of(getLanguageExtension(draftLanguage.value)),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        draftContent.value = update.state.doc.toString()
                    }
                }),
            ],
        }),
        parent: editorRootRef.value,
    })
}

const destroyEditor = () => {
    if (!editorView) {
        return
    }

    editorView.destroy()
    editorView = null
}

const syncEditorDoc = (content: string) => {
    if (!editorView) {
        return
    }

    const currentContent = editorView.state.doc.toString()
    if (currentContent === content) {
        return
    }

    editorView.dispatch({
        changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: content,
        },
    })
}

watch(draftContent, (content) => {
    syncEditorDoc(content)
})

watch(draftLanguage, (language) => {
    if (!editorView) {
        return
    }

    editorView.dispatch({
        effects: languageCompartment.reconfigure(getLanguageExtension(language)),
    })
})

const openEditor = () => {
    const value = normalizedValue.value
    draftLanguage.value = value.language
    draftContent.value = value.content
    isOpen.value = true

    nextTick(() => {
        destroyEditor()
        createEditor()
        editorView?.focus()
    })
}

const closeEditor = () => {
    destroyEditor()
    isOpen.value = false
}

const saveEditor = () => {
    emit('update:modelValue', {
        language: draftLanguage.value,
        content: draftContent.value,
    })
    closeEditor()
}

onBeforeUnmount(() => {
    destroyEditor()
})
</script>

<style scoped>
.code-editor-root {
    min-height: 100%;
}

:deep(.code-editor-root .cm-editor) {
    height: 100%;
    font-size: 14px;
}

:deep(.code-editor-root .cm-scroller) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
        monospace;
    line-height: 1.5;
}

:deep(.code-editor-root .cm-content) {
    padding: 12px 0;
}

:deep(.code-editor-root .cm-gutters) {
    background: #f8fafc;
    border-right: 1px solid #f1f5f9;
}
</style>
