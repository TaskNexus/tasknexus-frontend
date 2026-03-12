<template>
  <div class="h-full w-full flex">
    <!-- Node Library Sidebar -->
    <NodeLibrary :onStartDrag="handleStartDrag" :readOnly="readOnly" />

    <div class="flow-container flex-1 h-full flex flex-col relative w-full overflow-hidden">
        <!-- Canvas Toolbar (Floating) -->
        <div class="absolute top-4 left-4 z-10 flex items-center bg-white rounded-md shadow p-1 border border-slate-200 space-x-1">
            <button class="p-1.5 hover:bg-slate-100 rounded text-slate-600" @click="zoomOut" title="Zoom Out">
                <Minus class="w-4 h-4" />
            </button>
            <span class="text-xs font-medium text-slate-500 w-12 text-center">{{ Math.round(zoom * 100) }}%</span>
            <button class="p-1.5 hover:bg-slate-100 rounded text-slate-600" @click="zoomIn" title="Zoom In">
                <Plus class="w-4 h-4" />
            </button>
            <div class="w-px h-4 bg-slate-200 mx-1"></div>
            <button class="p-1.5 hover:bg-slate-100 rounded text-slate-600" @click="fitContent" title="Fit Content">
                <Maximize class="w-4 h-4" />
            </button>
        </div>

        <!-- Context Menu -->
        <ContextMenu 
            :visible="showContext" 
            :x="contextX" 
            :y="contextY"
            :menuType="contextMenuType" 
            @action="handleContextAction"
            @close="showContext = false"
        />

        <!-- Graph Container -->
        <div 
            ref="container" 
            class="graph-container flex-1 bg-slate-50 relative"
            :class="{ 'hide-ports': props.readOnly }"
        ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { Graph, Dnd, Shape, History, Keyboard, Selection } from '@antv/x6'
import { register } from '@antv/x6-vue-shape'
import { Plus, Minus, Maximize } from 'lucide-vue-next'
import StandardNode from './nodes/StandardNode.vue'
import GatewayNode from './nodes/GatewayNode.vue'
import NodeLibrary from './NodeLibrary.vue'
import ContextMenu from './ContextMenu.vue'

const props = defineProps<{
    readOnly?: boolean
}>()

const emit = defineEmits<{
    (e: 'node-selected', node: any): void
    (e: 'edge-selected', edge: any): void
    (e: 'node-dblclick', node: any): void
    (e: 'save'): void
}>()

// Register Custom Vue Nodes
register({
  shape: 'standard-node',
  width: 240,
  height: 80,
  component: StandardNode,
})

register({
  shape: 'gateway-node',
  width: 60,
  height: 60,
  component: GatewayNode,
})

const container = ref<HTMLElement | null>(null)
const graph = ref<Graph | null>(null)
const dnd = ref<Dnd | null>(null)
const zoom = ref(1)

// Context Menu State
const showContext = ref(false)
const contextX = ref(0)
const contextY = ref(0)
const contextNode = ref<any>(null)
const contextEdge = ref<any>(null)
const contextMenuType = ref<'node' | 'edge'>('node')

// --- Manual Edge Label Dragging Logic ---
const isLabelDragging = ref(false)
const labelDragEdge = ref<any>(null)

const onLabelMouseMove = (e: MouseEvent) => {
    if (!isLabelDragging.value || !labelDragEdge.value || !graph.value) return
    
    e.preventDefault()

    const view = graph.value.findViewByCell(labelDragEdge.value)
    if (view) {
        const p = graph.value.clientToLocal(e.clientX, e.clientY)
        // Access underlying path (X6 geometry)
        const path = (view as any).path
        if (path) {
            const length = path.closestPointLength(p)
            const total = path.length()
            let ratio = length / total
            ratio = Math.max(0, Math.min(1, ratio))
            
            // Update label
            // We assume there's one label at index 0
            const labels = labelDragEdge.value.getLabels()
            if (labels.length > 0) {
                 const label = labels[0]
                 // Keep existing attrs, update position
                 labelDragEdge.value.setLabelAt(0, {
                     ...label,
                     position: ratio
                 })
            }
        }
    }
}

const onLabelMouseUp = () => {
    isLabelDragging.value = false
    labelDragEdge.value = null
    window.removeEventListener('mousemove', onLabelMouseMove)
    window.removeEventListener('mouseup', onLabelMouseUp, true) // Remove capture listener
    document.body.style.cursor = ''
}

const handleContextAction = (action: 'copy' | 'delete' | 'disconnect') => {
    if (!graph.value) return
    
    // Handle edge actions
    if (contextMenuType.value === 'edge' && contextEdge.value) {
        if (action === 'delete') {
            graph.value.removeEdge(contextEdge.value)
            emit('edge-selected', null)
        }
        contextEdge.value = null
        return
    }
    
    // Handle node actions
    if (!contextNode.value) return

    switch (action) {
        case 'delete':
            // Check disableDelete
            if (!contextNode.value.getData()?.disableDelete) {
                graph.value.removeNode(contextNode.value)
            }
            break
        case 'disconnect':
             graph.value.model.getConnectedEdges(contextNode.value).forEach(edge => {
                 edge.remove()
             })
             break
        case 'copy':
             // Clone
             const clone = contextNode.value.clone()
             if (clone) {
                 const pos = contextNode.value.getPosition()
                 clone.position(pos.x + 20, pos.y + 20)
                 graph.value.addNode(clone)
             }
             break
    }
}

const zoomIn = () => {
    graph.value?.zoom(0.1)
    zoom.value = graph.value?.zoom() || 1
}

const zoomOut = () => {
    graph.value?.zoom(-0.1)
    zoom.value = graph.value?.zoom() || 1
}

const fitContent = () => {
    graph.value?.zoomToFit({ padding: 20 })
    zoom.value = graph.value?.zoom() || 1
}

// Watch ReadOnly
import { watch } from 'vue'
watch(() => props.readOnly, (val) => {
    // Port visibility is handled via CSS .hide-ports class
    // Close context menu when switching to read-only
    if (val) {
        showContext.value = false
    }
})

// Port Config (Visible & Centered)
const portAttrs = {
    circle: { 
        r: 6, // Slightly larger
        magnet: true, 
        stroke: '#5F95FF', 
        strokeWidth: 2, // Thicker stroke
        fill: '#fff',
        style: {
            cursor: 'crosshair',
            // Critical: ensure the element captures pointer events, preventing pass-through to node
            pointerEvents: 'all' 
        }
    } 
}
const portGroups = {
    top: { 
        position: { name: 'top' },
        attrs: portAttrs,
        markup: [{ tagName: 'circle', selector: 'circle' }],
    },
    right: { 
        position: { name: 'right' },
        attrs: portAttrs,
        markup: [{ tagName: 'circle', selector: 'circle' }],
    },
    bottom: { 
        position: { name: 'bottom' },
        attrs: portAttrs,
        markup: [{ tagName: 'circle', selector: 'circle' }],
    },
    left: { 
        position: { name: 'left' },
        attrs: portAttrs,
        markup: [{ tagName: 'circle', selector: 'circle' }],
    },
}

const cloneData = (value: any) => {
    try {
        return JSON.parse(JSON.stringify(value))
    } catch {
        return value
    }
}

const handleStartDrag = (node: any, e: MouseEvent) => {
    if (!graph.value || !dnd.value || props.readOnly) return

    const templateData = node?.isTemplate && node?.nodeData && typeof node.nodeData === 'object'
        ? cloneData(node.nodeData)
        : null
    const nodeType = String(templateData?.type || node.type || 'CUSTOM').toUpperCase()
    const GATEWAY_TYPES = ['BRANCH', 'PARALLEL', 'CONVERGE', 'CONDITIONAL']
    const isGateway = GATEWAY_TYPES.includes(nodeType)

    const shape = isGateway ? 'gateway-node' : 'standard-node'

    const gatewayPortItems = [
        { group: 'top' },
        { group: 'right' },
        { group: 'bottom' },
        { group: 'left' },
    ]

    const standardPortItems = [
        { group: 'top' },
        { group: 'right' },
        { group: 'bottom' },
        { group: 'left' },
    ]

    const defaultData = {
        label: node.label,
        type: nodeType,
        icon: node.iconName || 'Component',
        status: 'default',
        componentCode: node.componentCode,
        version: node.version,
        componentInputs: node.inputs,
        componentOutputs: node.outputs,
        inputs: {},
        outputs: [],
        errorIgnorable: false,
        skippable: true,
        retryable: true,
    }

    const data = templateData
        ? {
            ...defaultData,
            ...templateData,
            label: templateData.label || defaultData.label,
            type: nodeType,
            icon: templateData.icon || defaultData.icon,
            status: 'default',
            componentCode: templateData.componentCode || defaultData.componentCode,
            version: templateData.version || defaultData.version,
            componentInputs: Array.isArray(templateData.componentInputs)
                ? templateData.componentInputs
                : (defaultData.componentInputs || []),
            componentOutputs: Array.isArray(templateData.componentOutputs)
                ? templateData.componentOutputs
                : (defaultData.componentOutputs || []),
            inputs: templateData.inputs && typeof templateData.inputs === 'object'
                ? templateData.inputs
                : {},
            outputs: Array.isArray(templateData.outputs) ? templateData.outputs : [],
            errorIgnorable: !!templateData.errorIgnorable,
            skippable: templateData.skippable !== false,
            retryable: templateData.retryable !== false,
        }
        : defaultData

    const x6Node = graph.value.createNode({
        shape: shape,
        ports: {
            groups: portGroups,
            items: isGateway ? gatewayPortItems : standardPortItems
        },
        data: data
    })

    dnd.value.start(x6Node, e)
}

const initDefaultNodes = () => {
    if (!graph.value) return
    const cells = graph.value.getCells()
    if (cells.length === 0) {
        const portItems = [
                { group: 'top' },
                { group: 'right' },
                { group: 'bottom' },
                { group: 'left' },
        ]
        
        const startNode = graph.value.createNode({
            id: 'node-start',
            shape: 'standard-node',
            x: 100,
            y: 200,
            ports: { groups: portGroups, items: portItems },
            data: { label: 'Start', type: 'START', icon: 'play', status: 'default', disableDelete: true },
        })
        const endNode = graph.value.createNode({
            id: 'node-end',
            shape: 'standard-node',
            x: 800,
            y: 200,
            ports: { groups: portGroups, items: portItems },
            data: { label: 'End', type: 'END', icon: 'stop-circle', status: 'default', disableDelete: true },
        })
        graph.value.addNode(startNode)
        graph.value.addNode(endNode)
    }
}

onMounted(() => {
  if (!container.value) return

  // Initialize X6 Graph
  graph.value = new Graph({
    container: container.value,
    autoResize: true,
    background: {
      color: '#f8fafc',
    },
    grid: {
      size: 10,
      visible: true,
      type: 'doubleMesh',
      args: [
        { color: '#e2e8f0', thickness: 1 },
        { color: '#cbd5e1', thickness: 1, factor: 4 },
      ],
    },
    panning: {
        enabled: true,
        modifiers: ['alt'],
        eventTypes: ['leftMouseDown', 'mouseWheel'],
    },
    mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
    },
    interaction: {
        nodeMovable: true,
        edgeMovable: true
    },
    connecting: {
      router: 'manhattan',
      connector: {
        name: 'rounded',
        args: { radius: 8 },
      },
      anchor: 'center',
      connectionPoint: 'anchor',
      allowBlank: false,
      highlight: true,
      snap: {
          radius: 20,
      },
      allowMulti: true,
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: '#cad5e2', 
              strokeWidth: 1.5, 
              targetMarker: {
                name: 'block',
                width: 10,
                height: 6,
                offset: 0,
              },
            },
            // Add a transparent wrapper for easier clicking
            wrap: {
                strokeWidth: 10,
                stroke: 'transparent',
            }
          },
        })
      },
      validateMagnet({ magnet }) {
          return !props.readOnly
      },
      validateConnection({ edge, sourceView, targetView, sourceMagnet, targetMagnet }) {
          if (props.readOnly) return false
          if (!sourceView || !targetView) return false

          const sourceNode = sourceView.cell
          const targetNode = targetView.cell
          
          if (!sourceNode.isNode() || !targetNode.isNode()) return false
          
          const sourceType = sourceNode.getData()?.type
          const targetType = targetNode.getData()?.type

          
          // Get outgoing edges excluding the one we are currently validating/dragging
          // And only count edges that are actually connected to a target node
          const edges = graph.value?.getOutgoingEdges(sourceNode) || []
          const existingEdges = edges.filter(e => {
              // Exclude self
              if (e.id === edge.id) return false
              // Only count established edges (that have a target cell ID)
              const target = e.getTarget() as any
              return target && target.cell
          })

          // Debugging
          // console.log(...)

          // Constraint: End node cannot have outgoing
          if (sourceType === 'END') return false
          
          // Constraint: Start node Max 1 outgoing
          if (sourceType === 'START') {
              if (existingEdges.length > 0) return false
          }
           
          // Constraint: Converge Gateway Max 1 outgoing
          if (sourceType === 'CONVERGE' || sourceType === 'CONVERGE_GATEWAY') {
              if (existingEdges.length > 0) return false
          }
          
          return true
      }
    },
  })

  // Register Plugins manually for X6 v3
  graph.value.use(
    new History({
      enabled: true,
      stackSize: 50,
    })
  )
  
  graph.value.use(
    new Keyboard({
      enabled: true, // Key events handled by X6
      global: true, // Listen on document
    })
  )

  graph.value.use(
    new Selection({
      enabled: true,
      multiple: true,
      rubberband: true,
      movable: true,
      showNodeSelectionBox: true,
    })
  )

  // Initialize DnD
  dnd.value = new Dnd({
      target: graph.value,
      scaled: false,
  })
  
  // Context Menu Events
  graph.value.on('node:contextmenu', ({ e, node }) => {
      // Prevent browser menu
      e.preventDefault()
      
      if (props.readOnly) return 

      const pos = graph.value?.localToClient(node.getPosition())
      if (pos) {
        // Use client coordinates for fixed positioning
        contextX.value = e.clientX
        contextY.value = e.clientY
        contextNode.value = node
        contextEdge.value = null
        contextMenuType.value = 'node'
        showContext.value = true
      }
  })

  // Edge Context Menu
  graph.value.on('edge:contextmenu', ({ e, edge }) => {
      e.preventDefault()
      
      if (props.readOnly) return

      contextX.value = e.clientX
      contextY.value = e.clientY
      contextEdge.value = edge
      contextNode.value = null
      contextMenuType.value = 'edge'
      showContext.value = true
  })

  graph.value.on('blank:click', () => {
      showContext.value = false
      emit('node-selected', null)
      emit('edge-selected', null)
  })
  
  graph.value.on('node:click', ({ node }) => {
      showContext.value = false
      emit('node-selected', node)
      // Clear active edge if node selected
      emit('edge-selected', null)
  })

  // Node Double Click
  graph.value.on('node:dblclick', ({ node }) => {
      // Emit event for parent to handle (e.g. open subprocess)
      emit('node-dblclick', node)
  })

  // Edge Label Mouse Down (Manual Drag Start)
  graph.value.on('edge:mousedown', ({ e, edge }) => {
      // Check if the target is our label background
      const target = e.target as HTMLElement
      // We check for the class 'edge-label-bg' we added earlier check 'edge-label-bg'
      // Or simply check if it's inside the label group
      if (target && (target.classList.contains('edge-label-bg') || target.closest('.edge-label-bg'))) {
          e.stopPropagation() // Prevent edge selection or other events
          e.preventDefault()
          
          isLabelDragging.value = true
          labelDragEdge.value = edge
          
          // Add global listeners
          window.addEventListener('mousemove', onLabelMouseMove)
          window.addEventListener('mouseup', onLabelMouseUp, true) // Use capture to ensure we catch it
          document.body.style.cursor = 'move'
      }
  })

  graph.value.on('edge:click', ({ edge, e }) => {
      console.log('[FlowCanvas] Edge Clicked:', edge.id, e)
      
      // Determine if this edge is configurable (only from Branch or Conditional gateways)
      const source = edge.getSourceNode()
      if (source) {
          const type = source.getData()?.type
          const CONFIGURABLE_TYPES = ['BRANCH', 'EXCLUSIVE_GATEWAY', 'CONDITIONAL', 'CONDITIONAL_PARALLEL']
          
          if (CONFIGURABLE_TYPES.includes(type || '')) {
               showContext.value = false
               emit('node-selected', null)
               emit('edge-selected', edge)
               return
          }
      }
      
      // If not configurable, treat as blank click (deselect others) or just do nothing?
      // User request: "others can not".
      // Let's deselect current edge just in case, or do nothing.
      // If I do nothing, the previous selection remains.
      // Better to deselect everything if clicking a non-configurable edge?
      // Or just not select *this* edge.
      showContext.value = false
      emit('node-selected', null)
      emit('edge-selected', null) 
  })
  
  // Edge Connected (Label Logic)
  graph.value.on('edge:connected', ({ edge }) => {
      const source = edge.getSourceNode()
      if (source) {
          const type = source.getData()?.type
          // If source is Branch or Conditional, add label
          // Note: NodeLibrary sends 'conditional', became 'CONDITIONAL'
          if (['BRANCH', 'EXCLUSIVE_GATEWAY', 'CONDITIONAL', 'CONDITIONAL_PARALLEL'].includes(type || '')) {
              edge.setLabels([
                  {
                      position: 0.5,
                      attrs: {
                        label: {
                          text: 'Condition',
                          fill: '#475569', // slate-600
                          fontSize: 12,
                          fontWeight: 500,
                          textAnchor: 'middle',
                          textVerticalAnchor: 'middle',
                          style: {
                              pointerEvents: 'none' 
                          }
                        },
                        body: {
                            fill: '#ffffff',
                            stroke: '#94a3b8',
                            strokeWidth: 1,
                            rx: 4,
                            ry: 4,
                            ref: 'label', // Ensure reference is explicit
                            refWidth: 16,
                            refHeight: 8,
                            refX: -8, // Centers the box horizontally (-16/2)
                            refY: -4, // Centers the box vertically (-8/2)
                            class: 'edge-label-bg', 
                            style: { 
                                cursor: 'move',
                            } 
                        }
                      },
                  },
              ])
              edge.setData({
                  name: 'Condition',
                  expression: 'True',
                  type: 'condition'
              })
          }
      }
  })



  // Prevent Start/End Deletion
  graph.value.bindKey(['backspace', 'delete'], () => {
      const cells = graph.value?.getSelectedCells() || []
      const deletableCells = cells.filter(cell => {
          // Check data.disableDelete
          if (cell.isNode()) {
              const data = cell.getData()
              return !data?.disableDelete
          }
          return true // Edges are deletable
      })
      
      if (deletableCells.length) {
          graph.value?.removeCells(deletableCells)
      }
      return false
  })

  // Undo: Ctrl+Z / Cmd+Z
  graph.value.bindKey(['ctrl+z', 'meta+z'], () => {
      if (graph.value?.canUndo()) {
          graph.value.undo()
      }
      return false // Prevent browser default
  })

  // Redo: Ctrl+Y / Cmd+Shift+Z
  graph.value.bindKey(['ctrl+y', 'meta+shift+z'], () => {
      if (graph.value?.canRedo()) {
          graph.value.redo()
      }
      return false
  })

  // Save: Ctrl+S / Cmd+S
  graph.value.bindKey(['ctrl+s', 'meta+s'], () => {
      emit('save')
      return false
  })

  // Initial Data Check
  initDefaultNodes()
  
  // Clear history to prevent undoing creation of default nodes
  if (graph.value.cleanHistory) {
      graph.value.cleanHistory()
  }

  graph.value.zoomToFit({ padding: 40 })
  zoom.value = graph.value.zoom()

  // Update zoom ref on scale
  graph.value.on('scale', ({ sx }) => {
      zoom.value = sx
  })
})

const EDGE_COLORS = {
    default: '#e2e8f0', // slate-200
    success: '#22c55e', // green-500 (finished)
    running: '#3b82f6', // blue-500
    failed: '#ef4444',  // red-500
    revoked: '#9ca3af', // gray-400
}

// Expose graph instance to parent
defineExpose({
    getGraph: () => graph.value,
    loadGraph: (data: any) => {
        if (graph.value && data) {
            // Clear existing graph and load new data
            graph.value.fromJSON(data)
        }
    },
    updateNodeStatus: (statusMap: Record<string, string | { state: string, flow_state: string, start_time?: string, expected_duration?: number, loop?: number, inner_loop?: number }>) => {
        if (!graph.value) return
        
        // Helper to extract state and flow_state from both old and new formats
        const getStates = (value: string | { state: string, flow_state: string, start_time?: string, expected_duration?: number, loop?: number, inner_loop?: number }) => {
            if (typeof value === 'string') {
                return { state: value, flow_state: value, start_time: undefined, expected_duration: undefined, loop: 1, inner_loop: 1 }
            }
            return value
        }
        
        // 1. Update Node Status (using 'state' for display)
        const nodes = graph.value.getNodes()
        nodes.forEach(node => {
            const nodeId = node.id
            if (statusMap[nodeId]) {
               const { state, start_time, expected_duration, loop, inner_loop } = getStates(statusMap[nodeId])
               const status = state.toLowerCase()
               const currentData = node.getData()
               // Update if status, time, or loop data changed
               if (currentData.status !== status || currentData.start_time !== start_time || currentData.loop !== loop) {
                   node.setData({
                       ...currentData,
                       status: status,
                       start_time: start_time,
                       expected_duration: expected_duration,
                       loop: loop,
                       inner_loop: inner_loop
                   })
               }
            }
        })

        // 2. Update Edge Status based on Source Node (using 'flow_state' for edges)
        const edges = graph.value.getEdges()
        const BRANCHING_TYPES = ['EXCLUSIVE_GATEWAY', 'CONDITIONAL', 'BRANCH', 'CONDITIONAL_PARALLEL']

        edges.forEach(edge => {
            const source = edge.getSource()
            const sourceId = (source as any).cell as string
            
            const sourceNode = graph.value!.getCellById(sourceId)
            if (sourceNode && sourceNode.isNode()) {
                const data = sourceNode.getData()
                const nodeId = sourceNode.id
                
                // Get flow_state for edge coloring (allows skipped nodes to have green edges)
                const { flow_state } = statusMap[nodeId] 
                    ? getStates(statusMap[nodeId]) 
                    : { flow_state: data?.status || 'default' }
                const status = flow_state.toLowerCase()
                const type = (data?.type || '').toUpperCase()
                
                let color = EDGE_COLORS.default
                
                // Logic:
                // If Source is Active (Finished/Running):
                // 1. If Sequential/Parallel (Non-Branching): Propagate Source Status.
                // 2. If Branching (Exclusive/Conditional):
                //    - Check Target Status.
                //    - Only show Edge as Active if Target is also Active (Finished/Running/Failed).
                //    - EXCEPTION: If Target is a Shared Node (Merge), we can't easily distinguish which path triggered it,
                //      so we fall back to Source Status (Visualizing "Potential Flow" or risk False Positive).
                //      But for distinct branches (User Issue), verifying Target Status prevents False Positive.

                const isActive = ['finished', 'running'].includes(status)
                
                if (isActive) {
                    let edgeActive = true 
                    
                    if (BRANCHING_TYPES.includes(type)) {
                        const target = edge.getTarget()
                        const targetId = (target as any).cell as string
                        const targetNode = graph.value!.getCellById(targetId)
                        
                        if (targetNode && targetNode.isNode()) {
                             const incoming = graph.value!.getIncomingEdges(targetNode) || []
                             // Only use Target Check if it's a unique path (not shared)
                             if (incoming.length <= 1) {
                                 // Use flow_state for target check too
                                 const { flow_state: tFlowState } = statusMap[targetId]
                                     ? getStates(statusMap[targetId])
                                     : { flow_state: targetNode.getData()?.status || 'default' }
                                 const tStatus = tFlowState.toLowerCase()
                                 // If target not started, edge wasn't taken
                                 if (!['finished', 'running', 'failed', 'paused'].includes(tStatus)) {
                                     edgeActive = false
                                 }
                             }
                        }
                    }

                    if (edgeActive) {
                        if (status === 'finished') color = EDGE_COLORS.success
                        else if (status === 'running') color = EDGE_COLORS.running
                        else if (status === 'failed') color = EDGE_COLORS.failed
                        else if (status === 'revoked' || status === 'cancelled') color = EDGE_COLORS.revoked
                    }
                }
                
                edge.attr('line/stroke', color)
                edge.attr('line/targetMarker/fill', color)
                edge.attr('line/targetMarker/stroke', color)
            }
        })
    }
})

onBeforeUnmount(() => {
  graph.value?.dispose()
})
</script>



<style scoped>
/* Hide ports when in read-only mode */
.hide-ports :deep(.x6-port) {
  visibility: hidden !important;
}
.hide-ports :deep(.x6-port-body) {
  visibility: hidden !important;
}
</style>
