<template>
  <div v-if="isOpen" class="fixed inset-0 overflow-hidden z-50">
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="close"></div>
      <section class="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div class="w-screen max-w-md">
          <div class="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
            <div class="px-4 py-6 bg-blue-600 sm:px-6">
              <div class="flex items-start justify-between">
                <h2 class="text-lg font-medium text-white">
                  {{ isEdit ? 'Edit Periodic Task' : 'New Periodic Task' }}
                </h2>
                <div class="ml-3 h-7 flex items-center">
                  <button @click="close" class="bg-blue-600 rounded-md text-blue-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white">
                    <span class="sr-only">Close panel</span>
                    <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="relative flex-1 py-6 px-4 sm:px-6">
               <form @submit.prevent="save">
                   <!-- Workflow Selection -->
                   <div class="mb-6">
                       <label class="block text-sm font-medium text-gray-700 mb-1">Workflow *</label>
                       <select 
                           v-model="form.workflow" 
                           required 
                           class="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                           :disabled="isEdit"
                        >
                           <option value="" disabled>Select a workflow</option>
                           <option v-for="w in workflows" :key="w.id" :value="w.id">{{ w.name }}</option>
                       </select>
                       <p class="mt-1 text-xs text-gray-500">Periodic task saves a snapshot of the workflow.</p>
                   </div>
                   
                   <!-- Name -->
                   <div class="mb-6">
                       <label class="block text-sm font-medium text-gray-700 mb-1">Task Name *</label>
                       <input 
                            v-model="form.name" 
                            type="text" 
                            required 
                            placeholder="Enter task name"
                            class="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                       >
                   </div>
                   
                   <!-- Cron Schedule -->
                   <div class="mb-6">
                       <label class="block text-sm font-medium text-gray-700 mb-2">Schedule Rule * (Cron)</label>
                       <div class="grid grid-cols-5 gap-2 text-center text-xs text-gray-500 mb-1">
                           <span>Min</span>
                           <span>Hour</span>
                           <span>Day</span>
                           <span>Month</span>
                           <span>Week</span>
                       </div>
                       <div class="grid grid-cols-5 gap-2">
                           <input v-model="form.minute" type="text" placeholder="*" class="border border-gray-300 rounded p-2 text-center text-sm focus:border-blue-500 outline-none">
                           <input v-model="form.hour" type="text" placeholder="*" class="border border-gray-300 rounded p-2 text-center text-sm focus:border-blue-500 outline-none">
                           <input v-model="form.day_of_month" type="text" placeholder="*" class="border border-gray-300 rounded p-2 text-center text-sm focus:border-blue-500 outline-none">
                           <input v-model="form.month_of_year" type="text" placeholder="*" class="border border-gray-300 rounded p-2 text-center text-sm focus:border-blue-500 outline-none">
                           <input v-model="form.day_of_week" type="text" placeholder="*" class="border border-gray-300 rounded p-2 text-center text-sm focus:border-blue-500 outline-none">
                       </div>
                       <p class="mt-2 text-xs text-gray-400">Current Rule: {{ computedCron }}</p>
                   </div>
                   
                   <div class="mb-6 border-t border-gray-100 pt-4">
                       <h3 class="text-sm font-medium text-gray-900">Task Information</h3>
                       <div class="mt-4 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                           <div class="mx-auto h-12 w-12 text-gray-400">
                               <svg fill="none" class="h-12 w-12" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                           </div>
                           <span class="mt-2 block text-sm font-medium text-gray-900">Inputs Configured in Workflow</span>
                       </div>
                   </div>

                   <div class="flex-shrink-0 px-4 py-4 flex justify-end">
                     <button type="button" @click="close" class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                       Cancel
                     </button>
                     <button type="submit" class="ml-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
                       {{ isEdit ? 'Save Changes' : 'Create Task' }}
                     </button>
                   </div>

               </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { fetchAllPages } from '../utils/pagination'

const props = defineProps<{
    isOpen: boolean
    editId?: number
}>()

const emit = defineEmits(['close', 'saved'])

const isEdit = computed(() => !!props.editId)
const workflows = ref<any[]>([])

const form = ref({
    name: '',
    workflow: '',
    minute: '*',
    hour: '*',
    day_of_month: '*',
    month_of_year: '*',
    day_of_week: '*'
})

const computedCron = computed(() => {
    return `${form.value.minute} ${form.value.hour} ${form.value.day_of_month} ${form.value.month_of_year} ${form.value.day_of_week}`
})

const fetchWorkflows = async () => {
    try {
        workflows.value = await fetchAllPages('/api/workflows/')
    } catch (e) {
        console.error(e)
    }
}

const loadTask = async (id: number) => {
    try {
        const response = await axios.get(`/api/tasks/periodic/${id}/`)
        const data = response.data
        form.value = {
            name: data.name,
            workflow: data.workflow,
            minute: data.minute || '*',
            hour: data.hour || '*',
            day_of_month: data.day_of_month || '*',
            month_of_year: data.month_of_year || '*',
            day_of_week: data.day_of_week || '*'
        }
    } catch (e) {
        console.error(e)
    }
}

const resetForm = () => {
    form.value = {
        name: '',
        workflow: '',
        minute: '*',
        hour: '*',
        day_of_month: '*',
        month_of_year: '*',
        day_of_week: '*'
    }
}

watch(() => props.isOpen, (val) => {
    if (val) {
        fetchWorkflows()
        if (props.editId) {
            loadTask(props.editId)
        } else {
            resetForm()
        }
    }
})

const close = () => {
    emit('close')
}

const save = async () => {
    try {
        // Validate cron slightly
        if (!form.value.name || !form.value.workflow) return
        
        const payload = { ...form.value }
        
        if (isEdit.value) {
            await axios.patch(`/api/tasks/periodic/${props.editId}/`, payload)
        } else {
            await axios.post('/api/tasks/periodic/', payload)
        }
        emit('saved')
        close()
    } catch (e) {
        console.error("Failed to save periodic task", e)
        alert('Failed to save task')
    }
}
</script>
