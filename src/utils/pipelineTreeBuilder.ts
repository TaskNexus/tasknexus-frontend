/**
 * Pipeline Tree Builder
 * Converts AntV X6 graph data into bamboo-engine compatible pipeline tree format
 */

import { Graph, Node, Edge } from '@antv/x6'

// Type definitions for bamboo-engine pipeline tree
export interface PipelineTree {
    id: string
    start_event: StartEvent
    end_event: EndEvent
    activities: Record<string, Activity>
    flows: Record<string, Flow>
    gateways: Record<string, Gateway>
    data: PipelineData
}

interface StartEvent {
    id: string
    name: string
    type: 'EmptyStartEvent'
    incoming: string
    outgoing: string
}

interface EndEvent {
    id: string
    name: string
    type: 'EmptyEndEvent'
    incoming: string[]
    outgoing: string
}

interface Activity {
    id: string
    name: string
    type: 'ServiceActivity' | 'SubProcess'
    incoming: string[]
    outgoing: string
    component: {
        code: string
        version?: string | null
        inputs: Record<string, any>
    }
    error_ignorable: boolean
    optional: boolean
    retryable: boolean
    skippable: boolean
    timeout: null
}

interface Flow {
    id: string
    source: string
    target: string
    is_default: boolean
}

interface Gateway {
    id: string
    name: string
    type: 'ParallelGateway' | 'ExclusiveGateway' | 'ConditionalParallelGateway' | 'ConvergeGateway'
    incoming: string[]
    outgoing: string | string[]
    conditions?: Record<string, { evaluate: string }>
    converge_gateway_id?: string
}

interface PipelineData {
    inputs: Record<string, any>
    outputs: string[]
}

// Parameter definition for global/workflow params
export interface ParamDefinition {
    key: string
    value: any
}

// Output extraction definition (for exposing node outputs to context)
export interface OutputExtraction {
    sourceKey: string       // Output key from the node (e.g., 'result')
    contextKey: string      // Context variable name (e.g., 'chat_result')
}

// Options for building pipeline tree
export interface BuildPipelineOptions {
    projectId?: number | string
    globalParams?: ParamDefinition[]      // Project-level params (enabled ones)
    workflowParams?: ParamDefinition[]    // Workflow-specific params
}

// Generate a unique ID for flows
const generateFlowId = (): string => {
    return 'f' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Generate pipeline ID
const generatePipelineId = (): string => {
    return 'p' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Build pipeline tree from X6 graph
 * @param graph - X6 Graph instance
 * @param options - Optional configuration for injecting global/workflow params
 */
export function buildPipelineTree(graph: Graph, options?: BuildPipelineOptions): PipelineTree {
    const nodes = graph.getNodes()
    const edges = graph.getEdges()

    // Initialize containers
    const activities: Record<string, Activity> = {}
    const gateways: Record<string, Gateway> = {}
    const flows: Record<string, Flow> = {}

    let startEvent: StartEvent | null = null
    let endEvent: EndEvent | null = null

    // Map to track incoming/outgoing flows for each node
    const nodeIncomingFlows: Record<string, string[]> = {}
    const nodeOutgoingFlows: Record<string, string[]> = {}
    const flowIdToEdge: Record<string, Edge> = {}

    // Pre-scan valid node IDs to ensure edges connect to existing nodes
    const validNodeIds = new Set(nodes.map(n => n.id))

    // Helper to determine variable type
    const getVariableInfo = (value: any) => {
        if (typeof value === 'string' && value.includes('${')) {
            return {
                type: 'splice',
                value: value
            }
        }
        return {
            type: 'plain',
            value: value
        }
    }

    // First pass: Create flows from edges
    edges.forEach((edge: Edge) => {
        const flowId = edge.id || generateFlowId()
        const sourceId = edge.getSourceCellId()
        const targetId = edge.getTargetCellId()

        // Only include edges where both source and target are valid existing nodes
        if (sourceId && targetId && validNodeIds.has(sourceId) && validNodeIds.has(targetId)) {
            flows[flowId] = {
                id: flowId,
                source: sourceId,
                target: targetId,
                is_default: false
            }

            flowIdToEdge[flowId] = edge

            // Track incoming/outgoing
            if (!nodeOutgoingFlows[sourceId]) nodeOutgoingFlows[sourceId] = []
            nodeOutgoingFlows[sourceId].push(flowId)

            if (!nodeIncomingFlows[targetId]) nodeIncomingFlows[targetId] = []
            nodeIncomingFlows[targetId].push(flowId)
        }
    })

    const transformExpression = (expr: string): string => {
        // Transform ${variable} to variable for Python eval
        // e.g. "${a} > 1" -> "a > 1"
        if (!expr) return 'True'
        return expr.replace(/\$\{([a-zA-Z0-9_]+)\}/g, '$1')
    }

    // Second pass: Process nodes
    nodes.forEach((node: Node) => {
        const nodeId = node.id
        const data = node.getData() || {}
        const nodeType = (data.type || 'TASK').toUpperCase()
        const nodeName = data.label || ''

        const incoming = nodeIncomingFlows[nodeId] || []
        const outgoing = nodeOutgoingFlows[nodeId] || []

        switch (nodeType) {
            case 'START':
                startEvent = {
                    id: nodeId,
                    name: nodeName,
                    type: 'EmptyStartEvent',
                    incoming: '',
                    outgoing: outgoing[0] || ''
                }
                break

            case 'END':
                endEvent = {
                    id: nodeId,
                    name: nodeName,
                    type: 'EmptyEndEvent',
                    incoming: incoming,
                    outgoing: ''
                }
                break

            case 'PARALLEL':
            case 'PARALLEL_GATEWAY':
                gateways[nodeId] = {
                    id: nodeId,
                    name: nodeName,
                    type: 'ParallelGateway',
                    incoming: incoming,
                    outgoing: outgoing
                }
                break

            case 'BRANCH':
            case 'EXCLUSIVE_GATEWAY':
            case 'CONDITIONAL_PARALLEL':
            case 'CONDITIONAL':
                const conditions: Record<string, { evaluate: string }> = {}
                const validOutgoingFlows: string[] = []

                outgoing.forEach(flowId => {
                    // CRITICAL: Only process flows that actually exist in flows dict
                    // A flow might be in flowIdToEdge but not in flows if source/target is invalid
                    if (!flows[flowId]) {
                        return // Skip this flow entirely
                    }

                    validOutgoingFlows.push(flowId)
                    const edge = flowIdToEdge[flowId]
                    if (edge) {
                        const edgeData = edge.getData()
                        if (edgeData && edgeData.expression) {
                            conditions[flowId] = {
                                evaluate: transformExpression(edgeData.expression)
                            }
                        } else {
                            // Default to True if no expression
                            conditions[flowId] = { evaluate: 'True' }
                        }
                    } else {
                        // Fallback if edge data missing but flow exists
                        conditions[flowId] = { evaluate: 'True' }
                    }
                })

                gateways[nodeId] = {
                    id: nodeId,
                    name: nodeName,
                    type: (nodeType === 'CONDITIONAL_PARALLEL' || nodeType === 'CONDITIONAL') ? 'ConditionalParallelGateway' : 'ExclusiveGateway',
                    incoming: incoming,
                    outgoing: validOutgoingFlows,  // Only include flows that have conditions
                    conditions: conditions
                }
                break

            case 'CONVERGE':
            case 'CONVERGE_GATEWAY':
                gateways[nodeId] = {
                    id: nodeId,
                    name: nodeName,
                    type: 'ConvergeGateway',
                    incoming: incoming,
                    outgoing: outgoing[0] || '' // Ensure ConvergeGateway has single outgoing flow ID
                }
                break

            case 'SUBPROCESS':
                // Extract params from inputs
                // Inputs: workflow_id, params_*
                const spInputs = data.inputs || {}
                const workflowId = spInputs.workflow_id
                const spParams: Record<string, any> = {}

                Object.keys(spInputs).forEach(k => {
                    if (k.startsWith('params_')) {
                        const paramKey = k.replace('params_', '')
                        // bamboo-engine expects params keys in ${key} format to match subprocess global variables
                        spParams[`\${${paramKey}}`] = getVariableInfo(spInputs[k])
                    }
                })

                activities[nodeId] = {
                    id: nodeId,
                    name: nodeName,
                    type: 'SubProcess',
                    incoming: incoming,
                    outgoing: outgoing[0] || '',
                    // We treat it as ServiceActivity in type definition mostly, 
                    // but we will add extra fields that our backend expander looks for.
                    // The TypeScript interface might complain if checking strictly, 
                    // but usually parsing handles extra fields.
                    // We'll put the ID in a special field 'template_id' 
                    // and params in 'params'
                    component: {
                        code: 'subprocess_placeholder',
                        inputs: {
                            subprocess_workflow_id: { type: 'plain', value: workflowId }
                        }
                    },
                    // We attach these for the backend expander to use
                    // @ts-ignore
                    template_id: workflowId,
                    // @ts-ignore
                    params: spParams,
                    error_ignorable: data.errorIgnorable || false,
                    optional: data.optional || false,
                    retryable: data.retryable !== false,
                    skippable: data.skippable !== false,
                    timeout: null
                }
                break

            default:
                // All other types are treated as ServiceActivity
                activities[nodeId] = {
                    id: nodeId,
                    name: nodeName,
                    type: 'ServiceActivity',
                    incoming: incoming,
                    outgoing: outgoing[0] || '',
                    component: {
                        code: data.componentCode || 'example',
                        version: data.version || null,
                        inputs: Object.entries(data.inputs || {}).reduce((acc, [key, val]) => {
                            acc[key] = getVariableInfo(val)
                            return acc
                        }, {} as Record<string, any>)
                    },
                    error_ignorable: data.errorIgnorable || false,
                    optional: data.optional || false,
                    retryable: data.retryable !== false,
                    skippable: data.skippable !== false,
                    timeout: null
                }
                break
        }
    })

    // Collect output extractions from all nodes
    // This enables bamboo-engine to automatically extract node outputs to context
    const outputExtractions: Array<{ nodeId: string; sourceKey: string; contextKey: string }> = []

    nodes.forEach((node: Node) => {
        const data = node.getData() || {}
        const outputs = data.outputs as OutputExtraction[] | undefined

        if (outputs && Array.isArray(outputs)) {
            outputs.forEach((out: OutputExtraction) => {
                if (out.sourceKey && out.contextKey) {
                    outputExtractions.push({
                        nodeId: node.id,
                        sourceKey: out.sourceKey,
                        contextKey: out.contextKey
                    })
                }
            })
        }
    })

    // Final Sanity Check: Prune invalid flow references
    // Ensure all outgoing flows referenced by nodes actually exist in the 'flows' dictionary.
    // This prevents backend KeyErrors if an edge was filtered out but somehow referenced.

    const flowIds = new Set(Object.keys(flows))

    Object.values(gateways).forEach(gw => {
        // Filter outgoing (handle string or string[])
        const outgoingList = Array.isArray(gw.outgoing) ? gw.outgoing : (gw.outgoing ? [gw.outgoing] : [])
        const validOutgoing = outgoingList.filter(id => flowIds.has(id))

        // Update outgoing
        if (gw.type === 'ConvergeGateway') {
            gw.outgoing = validOutgoing[0] || ''
        } else {
            gw.outgoing = validOutgoing
        }

        // Cleanup conditions
        if (gw.conditions) {
            Object.keys(gw.conditions).forEach(fid => {
                if (!flowIds.has(fid)) {
                    delete gw.conditions![fid]
                }
            })
        }
    })

    Object.values(activities).forEach(act => {
        if (act.outgoing && !flowIds.has(act.outgoing)) {
            act.outgoing = ''
        }
    })

    if (!startEvent) {
        throw new Error('Pipeline must have a Start Node')
    }
    if (!endEvent) {
        throw new Error('Pipeline must have an End Node')
    }

    // Build data.inputs from options
    // Key format: ${key} for SPLICE variable reference support
    const dataInputs: Record<string, any> = {}

    if (options) {
        // Inject project_id (plain key for parent_data access)
        if (options.projectId !== undefined) {
            dataInputs[`\${project_id}`] = { type: 'splice', value: options.projectId }
        }

        // Inject global params (${key} format for SPLICE reference)
        if (options.globalParams) {
            for (const param of options.globalParams) {
                if (param.key) {
                    dataInputs[`\${${param.key}}`] = { type: 'splice', value: param.value }
                }
            }
        }

        // Inject workflow params (${key} format for SPLICE reference)
        if (options.workflowParams) {
            for (const param of options.workflowParams) {
                if (param.key) {
                    dataInputs[`\${${param.key}}`] = { type: 'splice', value: param.value }
                }
            }
        }
    }

    // Add output extractions to data.inputs
    // This tells bamboo-engine which node outputs to extract to context
    // See: https://github.com/TencentBlueKing/bamboo-engine/blob/master/docs/user_guide/basic_concept.md
    outputExtractions.forEach(extraction => {
        dataInputs[`\${${extraction.contextKey}}`] = {
            type: 'splice',
            value: '',
            source_act: extraction.nodeId,
            source_key: extraction.sourceKey
        }
    })

    // Collect output keys for data.outputs (context outputs)
    const dataOutputs: string[] = outputExtractions.map(e => `\${${e.contextKey}}`)

    return {
        id: generatePipelineId(),
        start_event: startEvent!,
        end_event: endEvent!,
        activities,
        flows,
        gateways,
        data: {
            inputs: dataInputs,
            outputs: dataOutputs
        }
    }
}

/**
 * Validate pipeline tree structure
 */
export function validatePipelineTree(tree: PipelineTree): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check required fields
    if (!tree.id) errors.push('Pipeline tree must have an ID')
    if (!tree.start_event) errors.push('Pipeline tree must have a start event')
    if (!tree.end_event) errors.push('Pipeline tree must have an end event')

    // Check connectivity from start
    if (tree.start_event && !tree.start_event.outgoing) {
        errors.push('Start event must have an outgoing flow')
    }

    // Check connectivity to end
    if (tree.end_event && tree.end_event.incoming.length === 0) {
        errors.push('End event must have at least one incoming flow')
    }

    // Check all activities have outgoing flow
    Object.values(tree.activities).forEach(act => {
        if (!act.outgoing) {
            errors.push(`Node "${act.name}" must have an outgoing connection`)
        }
        if (act.incoming.length > 1) {
            const BRANCHING_GATEWAY_TYPES = ['ExclusiveGateway', 'ParallelGateway', 'ConditionalParallelGateway']
            let nonGatewayCount = 0
            act.incoming.forEach(flowId => {
                const flow = tree.flows[flowId]
                if (!flow) return
                const sourceGateway = tree.gateways[flow.source]
                const isFromBranchingGateway = sourceGateway && BRANCHING_GATEWAY_TYPES.indexOf(sourceGateway.type) !== -1
                if (!isFromBranchingGateway) {
                    nonGatewayCount++
                }
            })
            if (nonGatewayCount > 1) {
                errors.push(`节点 \"${act.name}\" 有多个非网关入边。请使用汇聚网关合并分支，或从分支网关连接回边（用于循环）。`)
            }
        }
    })

    // Check all gateways have outgoing flow
    Object.values(tree.gateways).forEach(gw => {
        if (gw.type === 'ConvergeGateway') {
            if (!gw.outgoing || (typeof gw.outgoing === 'string' && !gw.outgoing)) {
                errors.push(`Converge Gateway "${gw.name}" must have one outgoing connection`)
            }
        } else {
            // For splitting gateways, outgoing should be an array and not empty
            if (Array.isArray(gw.outgoing) && gw.outgoing.length === 0) {
                errors.push(`Gateway "${gw.name}" must have at least one outgoing connection`)
            }
        }

        // Validate Referential Integrity of Outgoing Flows
        const outList = Array.isArray(gw.outgoing) ? gw.outgoing : (gw.outgoing ? [gw.outgoing] : [])
        outList.forEach(fid => {
            if (!tree.flows[fid]) {
                errors.push(`Gateway "${gw.name}" references a missing flow (${fid})`)
            }
        })

        // Validate Referential Integrity of Conditions
        if (gw.conditions) {
            Object.keys(gw.conditions).forEach(fid => {
                if (!tree.flows[fid]) {
                    errors.push(`Gateway "${gw.name}" has a condition for a missing flow (${fid})`)
                }
            })
        }
    })

    // Check all activities integrity
    Object.values(tree.activities).forEach(act => {
        if (act.outgoing && !tree.flows[act.outgoing]) {
            errors.push(`Activity "${act.name}" references a missing flow (${act.outgoing})`)
        }
    })

    return {
        valid: errors.length === 0,
        errors
    }
}

export default {
    buildPipelineTree,
    validatePipelineTree
}
