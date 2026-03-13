<template>
    <section v-if="visible" class="space-y-3">
        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider">子流程配置</h4>

        <div class="space-y-1">
            <label class="text-xs font-medium text-gray-600">选择流程</label>
            <select
                :value="modelValue"
                @change="handleChange"
                class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
            >
                <option value="" disabled>请选择一个流程...</option>
                <option v-for="w in workflows" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
        </div>

        <div v-if="params.length > 0" class="space-y-2 mt-4">
            <label class="text-xs font-medium text-gray-600">流程全局变量配置</label>
            <div class="bg-gray-50 rounded border border-gray-100 p-2 space-y-2">
                <p class="text-xs text-gray-400 mb-1">变量值映射:</p>

                <div v-for="param in params" :key="param.key" class="flex flex-col gap-1">
                    <span class="text-xs font-mono text-gray-500">{{ param.key }}</span>

                    <template v-if="param.input_type === 'single-select'">
                        <select
                            :value="getEffectiveStringValue(param)"
                            @change="updateParamValue(getParamInputKey(param), ($event.target as HTMLSelectElement).value)"
                            class="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">请选择（留空使用默认值）</option>
                            <option v-for="opt in param.options" :key="`${param.key}-single-${opt.value}`" :value="opt.value">
                                {{ opt.label || opt.value }}
                            </option>
                        </select>
                        <span v-if="param.options.length === 0" class="text-[10px] text-orange-500">未配置选项，请在流程参数中补充。</span>
                    </template>

                    <template v-else-if="param.input_type === 'multi-select'">
                        <div v-if="param.options.length > 0" class="space-y-1 border border-gray-200 rounded p-2 bg-white">
                            <label
                                v-for="opt in param.options"
                                :key="`${param.key}-multi-${opt.value}`"
                                class="flex items-center gap-2 text-xs text-gray-700"
                            >
                                <input
                                    type="checkbox"
                                    :checked="isMultiSelected(param, opt.value)"
                                    @change="toggleMultiParamValue(param, opt.value)"
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>{{ opt.label || opt.value }}</span>
                            </label>
                        </div>
                        <span v-else class="text-[10px] text-orange-500">未配置选项，请在流程参数中补充。</span>
                    </template>

                    <template v-else-if="param.input_type === 'toggle'">
                        <label class="inline-flex items-center gap-2 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700">
                            <input
                                type="checkbox"
                                :checked="getEffectiveToggleValue(param) === 1"
                                @change="updateParamValue(getParamInputKey(param), ($event.target as HTMLInputElement).checked ? 1 : 0)"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{{ getEffectiveToggleValue(param) === 1 ? '开启 (1)' : '关闭 (0)' }}</span>
                        </label>
                    </template>

                    <template v-else-if="param.input_type === 'git-branch'">
                        <div class="space-y-2">
                            <div class="flex items-center gap-2">
                                <select
                                    :value="getEffectiveStringValue(param)"
                                    @change="updateParamValue(getParamInputKey(param), ($event.target as HTMLSelectElement).value)"
                                    class="flex-1 px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:border-blue-500"
                                    :disabled="param.loadingBranches || param.branchOptions.length === 0"
                                >
                                    <option value="">{{ param.loadingBranches ? '加载分支中...' : '请选择分支' }}</option>
                                    <option
                                        v-for="branch in param.branchOptions"
                                        :key="`${param.key}-branch-${branch.name}`"
                                        :value="branch.name"
                                    >
                                        {{ branch.name }}{{ branch.is_default ? ' (default)' : '' }}
                                    </option>
                                </select>
                                <button
                                    type="button"
                                    @click="refreshGitBranches(param)"
                                    class="px-2 py-1 text-xs text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded disabled:opacity-50"
                                    :disabled="param.loadingBranches"
                                >
                                    {{ param.loadingBranches ? '刷新中...' : '刷新' }}
                                </button>
                            </div>
                            <input
                                :value="getEffectiveStringValue(param)"
                                @input="updateParamValue(getParamInputKey(param), ($event.target as HTMLInputElement).value)"
                                placeholder="可手动输入分支名（接口失败时兜底）"
                                class="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:border-blue-500"
                            />
                            <span v-if="param.branchError" class="text-[10px] text-orange-500">{{ param.branchError }}</span>
                        </div>
                    </template>

                    <template v-else-if="param.input_type === 'client-agent'">
                        <div class="space-y-1">
                            <select
                                :value="getEffectiveStringValue(param)"
                                @change="updateParamValue(getParamInputKey(param), ($event.target as HTMLSelectElement).value)"
                                class="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:border-blue-500"
                                :disabled="loadingRegisteredClientAgents"
                            >
                                <option value="">{{ loadingRegisteredClientAgents ? '加载客户端代理中...' : '请选择客户端代理' }}</option>
                                <option
                                    v-for="agent in registeredClientAgents"
                                    :key="`client-agent-${agent.id}`"
                                    :value="getClientAgentMachineName(agent)"
                                >
                                    {{ getClientAgentDisplayLabel(agent) }}
                                </option>
                            </select>
                            <span
                                v-if="clientAgentWarningMap[getParamInputKey(param)]"
                                class="text-[10px] text-orange-500"
                            >
                                {{ clientAgentWarningMap[getParamInputKey(param)] }}
                            </span>
                            <span
                                v-else-if="!loadingRegisteredClientAgents && registeredClientAgents.length === 0"
                                class="text-[10px] text-orange-500"
                            >
                                暂无已注册客户端代理
                            </span>
                        </div>
                    </template>

                    <template v-else>
                        <input
                            :value="getEffectiveStringValue(param)"
                            @input="updateParamValue(getParamInputKey(param), ($event.target as HTMLInputElement).value)"
                            :placeholder="typeof param.value === 'string' ? param.value : ''"
                            class="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:border-blue-500"
                        />
                    </template>

                    <span class="text-[10px] text-gray-400 truncate">{{ param.description }}</span>
                </div>
            </div>
        </div>

        <div v-else-if="modelValue" class="text-xs text-gray-400 italic">
            所选流程没有可配置的全局变量。
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import { fetchAllPages } from '../../utils/pagination'

interface Workflow {
    id: string | number
    name: string
}

type ParamInputType = 'text' | 'git-branch' | 'single-select' | 'multi-select' | 'toggle' | 'client-agent'

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

interface Param {
    key: string
    value: any
    description: string
    input_type: ParamInputType
    options: ParamOption[]
    git_branch: GitBranchConfig
    branchOptions: GitBranchOption[]
    loadingBranches: boolean
    branchError: string
}

interface OutputCandidate {
    key: string
    name: string
    type: string
}

interface RegisteredClientAgent {
    id: number
    name: string
    status: string
}

const props = defineProps<{
    visible: boolean
    modelValue: string | number | null
    paramValues: Record<string, any>
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string | number]
    'update:paramValues': [key: string, value: any]
    'paramsLoaded': [params: Param[]]
    'subprocessOutputsLoaded': [outputs: OutputCandidate[]]
}>()

const workflows = ref<Workflow[]>([])
const params = ref<Param[]>([])
const loadingWorkflows = ref(false)

const registeredClientAgents = ref<RegisteredClientAgent[]>([])
const loadingRegisteredClientAgents = ref(false)
const loadedRegisteredClientAgents = ref(false)
const clientAgentWarningMap = ref<Record<string, string>>({})

const normalizeInputType = (inputType: any): ParamInputType => {
    if (
        inputType === 'git-branch' ||
        inputType === 'single-select' ||
        inputType === 'multi-select' ||
        inputType === 'toggle' ||
        inputType === 'client-agent'
    ) {
        return inputType
    }
    return 'text'
}

const normalizeToggleValue = (value: any): 0 | 1 => {
    if (value === 1 || value === '1' || value === true) {
        return 1
    }
    const normalized = String(value ?? '').trim().toLowerCase()
    return normalized === 'true' || normalized === 'yes' || normalized === 'on' ? 1 : 0
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

const getClientAgentMachineName = (agent: RegisteredClientAgent): string => {
    return String(agent.name || '').trim()
}

const getClientAgentDisplayLabel = (agent: RegisteredClientAgent): string => {
    const name = getClientAgentMachineName(agent)
    const status = String(agent.status || '').trim()
    return `${name || `Agent #${agent.id}`}${status ? `（${status}）` : ''}`
}

const getValidClientAgentNames = (): Set<string> => {
    return new Set(
        registeredClientAgents.value
            .map((agent) => getClientAgentMachineName(agent))
            .filter(Boolean)
    )
}

const normalizeClientAgentValue = (value: any): string => {
    const normalized = String(value ?? '').trim()
    if (!normalized) return ''

    if (!loadedRegisteredClientAgents.value) {
        return normalized
    }

    const validNames = getValidClientAgentNames()
    if (!validNames.has(normalized)) {
        return ''
    }

    return normalized
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

    if (inputType === 'toggle') {
        return normalizeToggleValue(value)
    }

    if (inputType === 'client-agent') {
        return normalizeClientAgentValue(value)
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

const normalizeWorkflowParam = (raw: any): Param => {
    const inputType = normalizeInputType(raw?.input_type)
    const options = normalizeParamOptions(raw?.options)

    return {
        key: String(raw?.key ?? '').trim(),
        value: normalizeParamValueByType(inputType, raw?.value, options),
        description: String(raw?.description ?? ''),
        input_type: inputType,
        options,
        git_branch: {
            repo_url: String(raw?.git_branch?.repo_url ?? '').trim(),
            token: String(raw?.git_branch?.token ?? '').trim(),
        },
        branchOptions: [],
        loadingBranches: false,
        branchError: '',
    }
}

const getParamInputKey = (param: Pick<Param, 'key'>): string => {
    return `params_${param.key}`
}

const hasParamOverride = (key: string): boolean => {
    return Object.prototype.hasOwnProperty.call(props.paramValues, key)
}

const getEffectiveParamSourceValue = (param: Param): any => {
    const key = getParamInputKey(param)
    if (hasParamOverride(key)) {
        return props.paramValues[key]
    }
    return param.value
}

const getEffectiveStringValue = (param: Param): string => {
    const source = getEffectiveParamSourceValue(param)
    if (source === undefined || source === null) return ''
    if (Array.isArray(source)) {
        return source.map((v) => String(v)).join(',')
    }
    return String(source)
}

const getEffectiveToggleValue = (param: Param): 0 | 1 => {
    return normalizeToggleValue(getEffectiveParamSourceValue(param))
}

const getEffectiveMultiValues = (param: Param): string[] => {
    const source = getEffectiveParamSourceValue(param)
    return normalizeParamValueByType('multi-select', source, param.options)
}

const isMultiSelected = (param: Param, optionValue: string): boolean => {
    return getEffectiveMultiValues(param).includes(optionValue)
}

const toggleMultiParamValue = (param: Param, optionValue: string) => {
    const current = [...getEffectiveMultiValues(param)]
    const index = current.indexOf(optionValue)
    if (index >= 0) {
        current.splice(index, 1)
    } else {
        current.push(optionValue)
    }
    updateParamValue(getParamInputKey(param), current)
}

const isSameParamValue = (left: any, right: any): boolean => {
    if (Array.isArray(left) || Array.isArray(right)) {
        const l = Array.isArray(left) ? left.map((v) => String(v)) : []
        const r = Array.isArray(right) ? right.map((v) => String(v)) : []
        if (l.length !== r.length) return false
        return l.every((value, index) => value === r[index])
    }
    return String(left ?? '') === String(right ?? '')
}

const normalizeExistingParamOverrides = () => {
    const warnings: Record<string, string> = {}

    params.value.forEach((param) => {
        const key = getParamInputKey(param)
        if (!hasParamOverride(key)) return

        const rawValue = props.paramValues[key]
        const normalizedValue = normalizeParamValueByType(param.input_type, rawValue, param.options)

        if (param.input_type === 'client-agent' && loadedRegisteredClientAgents.value) {
            const rawText = String(rawValue ?? '').trim()
            if (rawText && !normalizedValue) {
                warnings[key] = '当前值无效，请重新选择'
            }
        }

        if (!isSameParamValue(rawValue, normalizedValue)) {
            emit('update:paramValues', key, normalizedValue)
        }
    })

    clientAgentWarningMap.value = warnings
}

const updateParamValue = (key: string, value: any) => {
    if (Object.prototype.hasOwnProperty.call(clientAgentWarningMap.value, key)) {
        const nextWarnings = { ...clientAgentWarningMap.value }
        delete nextWarnings[key]
        clientAgentWarningMap.value = nextWarnings
    }
    emit('update:paramValues', key, value)
}

const refreshGitBranches = async (param: Param) => {
    if (param.input_type !== 'git-branch') return

    const repoUrl = String(param.git_branch?.repo_url || '').trim()
    const token = String(param.git_branch?.token || '').trim()

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
                    name: String(branch?.name ?? '').trim(),
                    is_default: !!branch?.is_default,
                }))
                .filter((branch: GitBranchOption) => !!branch.name)
            : []

        param.branchOptions = branches
        if (branches.length === 0) {
            param.branchError = '未获取到分支列表，可手动输入分支名。'
            return
        }

        const allowed = new Set(branches.map((branch) => branch.name))
        const currentValue = getEffectiveStringValue(param).trim()
        if (currentValue && !allowed.has(currentValue)) {
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
    params.value
        .filter((param) => param.input_type === 'git-branch')
        .forEach((param) => {
            refreshGitBranches(param)
        })
}

const fetchWorkflows = async () => {
    loadingWorkflows.value = true
    try {
        workflows.value = await fetchAllPages('/api/workflows/')
    } catch (e) {
        console.error('Failed to fetch workflows', e)
    } finally {
        loadingWorkflows.value = false
    }
}

const fetchRegisteredClientAgents = async () => {
    loadingRegisteredClientAgents.value = true
    loadedRegisteredClientAgents.value = false
    try {
        const agents = await fetchAllPages<any>('/api/client-agents/agents/')
        const deduped = new Map<number, RegisteredClientAgent>()
        agents.forEach((raw) => {
            const id = Number(raw?.id)
            if (!Number.isFinite(id)) return
            const name = String(raw?.name ?? '').trim()
            if (!name) return
            deduped.set(id, {
                id,
                name,
                status: String(raw?.status ?? ''),
            })
        })

        registeredClientAgents.value = Array.from(deduped.values())
            .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN') || a.id - b.id)
        loadedRegisteredClientAgents.value = true
        normalizeExistingParamOverrides()
    } catch (e) {
        console.error('Failed to fetch client agents', e)
        registeredClientAgents.value = []
        loadedRegisteredClientAgents.value = true
        normalizeExistingParamOverrides()
    } finally {
        loadingRegisteredClientAgents.value = false
    }
}

const normalizeOutputKey = (value: unknown): string => {
    if (typeof value !== 'string') return ''
    return value.trim()
}

const humanizeOutputName = (key: string): string => {
    const matched = key.match(/^\$\{(.+)\}$/)
    return matched ? matched[1] : key
}

const extractSubprocessOutputs = (rawOutputs: unknown): OutputCandidate[] => {
    let outputKeys: string[] = []

    if (Array.isArray(rawOutputs)) {
        outputKeys = rawOutputs.map((item) => normalizeOutputKey(item)).filter(Boolean)
    } else if (rawOutputs && typeof rawOutputs === 'object') {
        outputKeys = Object.keys(rawOutputs as Record<string, unknown>).map((key) => normalizeOutputKey(key)).filter(Boolean)
    }

    const deduped = Array.from(new Set(outputKeys))
    return deduped.map((key) => ({
        key,
        name: humanizeOutputName(key),
        type: 'subprocess-output'
    }))
}

const fetchParams = async (workflowId: string | number | null) => {
    if (!workflowId) {
        params.value = []
        clientAgentWarningMap.value = {}
        emit('paramsLoaded', [])
        emit('subprocessOutputsLoaded', [])
        return
    }

    try {
        const resp = await axios.get(`/api/workflows/${workflowId}/`)
        const graphData = resp.data.graph_data || {}
        const pipelineTree = resp.data.pipeline_tree || {}

        const workflowParams = Array.isArray(graphData.workflow_params) ? graphData.workflow_params : []
        params.value = workflowParams
            .map((param: any) => normalizeWorkflowParam(param))
            .filter((param: Param) => !!param.key)

        const outputCandidates = extractSubprocessOutputs(pipelineTree.data?.outputs)
        emit('paramsLoaded', params.value)
        emit('subprocessOutputsLoaded', outputCandidates)

        if (!loadedRegisteredClientAgents.value && !loadingRegisteredClientAgents.value) {
            const hasClientAgentParam = params.value.some((param) => param.input_type === 'client-agent')
            if (hasClientAgentParam) {
                void fetchRegisteredClientAgents()
            }
        }

        normalizeExistingParamOverrides()
        refreshGitBranchesForAllParams()
    } catch (e) {
        console.error('Failed to load sub workflow', e)
        params.value = []
        clientAgentWarningMap.value = {}
        emit('paramsLoaded', [])
        emit('subprocessOutputsLoaded', [])
    }
}

const handleChange = (event: Event) => {
    const value = (event.target as HTMLSelectElement).value
    emit('update:modelValue', value)
    fetchParams(value)
}

watch(() => props.modelValue, (newVal) => {
    fetchParams(newVal)
}, { immediate: true })

onMounted(() => {
    if (props.visible) {
        fetchWorkflows()
        fetchRegisteredClientAgents()
    }
})

watch(() => props.visible, (visible) => {
    if (!visible) return

    if (workflows.value.length === 0 && !loadingWorkflows.value) {
        fetchWorkflows()
    }
    if (!loadedRegisteredClientAgents.value && !loadingRegisteredClientAgents.value) {
        fetchRegisteredClientAgents()
    }
})
</script>
