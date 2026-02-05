<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden">
    <div class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="close"></div>
    <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
      <div class="w-screen max-w-md">
        <div class="h-full flex flex-col bg-white shadow-xl">
          <!-- Header -->
          <div class="px-4 py-6 bg-gray-50 sm:px-6"> 
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-medium text-gray-900">
                {{ editId ? 'Edit Scheduled Task' : 'New Scheduled Task' }}
              </h2>
              <button @click="close" class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                <span class="sr-only">Close</span>
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p class="mt-1 text-sm text-gray-500">
              Run a workflow once at a specific future Date & Time.
            </p>
          </div>

          <!-- Body -->
          <div class="relative flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
             <form @submit.prevent="save" class="space-y-6">
                <!-- Workflow -->
                <div>
                   <label class="block text-sm font-medium text-gray-700">Project Workflow *</label>
                   <select 
                      v-model="form.workflow" 
                      required
                      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                      :disabled="!!editId"
                   >
                     <option :value="undefined" disabled>Select a workflow</option>
                     <optgroup v-for="proj in projects" :key="proj.id" :label="proj.name">
                        <option v-for="wf in proj.workflows" :key="wf.id" :value="wf.id">
                           {{ wf.name }}
                        </option>
                     </optgroup>
                   </select>
                   <p v-if="editId" class="mt-1 text-xs text-gray-500">Workflow cannot be changed after creation.</p>
                </div>

                <!-- Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Task Name *</label>
                  <input 
                    v-model="form.name" 
                    type="text" 
                    required
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g. Weekly Report Run"
                  >
                </div>
                
                <!-- Execution Time -->
                <div>
                   <label class="block text-sm font-medium text-gray-700">Execution Time *</label>
                   <input 
                      v-model="form.execution_time" 
                      type="datetime-local" 
                      required
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                   >
                   <p class="mt-1 text-xs text-gray-500">Must be a future time.</p>
                </div>

             </form>
          </div>

          <!-- Footer -->
          <div class="border-t border-gray-200 px-4 py-4 sm:px-6 bg-gray-50 flex justify-end space-x-3">
             <button @click="close" type="button" class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                Cancel
             </button>
             <button @click="save" type="button" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
                {{ editId ? 'Save Changes' : 'Create Task' }}
             </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps<{
    isOpen: boolean,
    editId?: number
}>()

const emit = defineEmits(['close', 'saved'])

const projects = ref<any[]>([])

const form = ref<any>({
    name: '',
    workflow: undefined,
    execution_time: ''
})

// Fetch workflows grouped by project
const fetchWorkflows = async () => {
   try {
       const resp = await axios.get('/api/projects/')
       const projList = resp.data
       
       // Populate workflows for each project (could be optimized)
       for (const p of projList) {
           const wfResp = await axios.get(`/api/workflows/?project_id=${p.id}`)
           p.workflows = wfResp.data.results || wfResp.data
       }
       projects.value = projList
   } catch(e) {
       console.error(e)
   }
}

// Load task data if editing
const loadTask = async (id: number) => {
    try {
        const resp = await axios.get(`/api/tasks/scheduled/${id}/`)
        const data = resp.data
        form.value.name = data.name
        form.value.workflow = data.workflow
        // Format django datetime to input datetime-local: YYYY-MM-DDThh:mm
        if (data.execution_time) {
            const dt = new Date(data.execution_time)
            dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset()) // Adjust for local input? 
            // datetime-local expects local time, but we send ISO?
            // Safer: Use local ISO string trimming Z
            // Actually, backend expects ISO. browsers datetime-local handles local time.
            // value format: yyyy-MM-ddThh:mm
            form.value.execution_time = data.execution_time.slice(0, 16) 
        }
    } catch (e) {
        console.error(e)
    }
}

watch(() => props.isOpen, (val) => {
    if (val) {
        if (props.editId) {
            loadTask(props.editId)
        } else {
            // Reset
            form.value = { name: '', workflow: undefined, execution_time: '' }
            
            // Set default time to now + 1 hour
            const now = new Date()
            now.setHours(now.getHours() + 1)
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
            form.value.execution_time = now.toISOString().slice(0, 16)
        }
    }
})

const close = () => {
    emit('close')
}

const save = async () => {
    try {
        // Prepare data
        // datetime-local value is usually YYYY-MM-DDThh:mm
        // Send as ISO with timezone?
        // Let's assume user input is LOCAL time.
        // We need to convert it to ISO with timezone or let backend handle it.
        // Easiest is to construct a Date object from input.
        const localDate = new Date(form.value.execution_time)
        const isoString = localDate.toISOString()
        
        const payload = { ...form.value, execution_time: isoString }
        
        if (props.editId) {
            await axios.put(`/api/tasks/scheduled/${props.editId}/`, payload)
        } else {
            await axios.post('/api/tasks/scheduled/', payload)
        }
        emit('saved')
        close()
    } catch (e: any) {
        console.error(e)
        alert('Failed to save task: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message))
    }
}

onMounted(() => {
    fetchWorkflows()
})

</script>
