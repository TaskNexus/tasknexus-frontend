<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-white flex flex-col transition-all duration-300">
      <div class="h-16 flex items-center px-6 border-b border-slate-800">
        <span class="text-xl font-bold tracking-wider">{{ t('app.title') }}</span>
      </div>

      <nav class="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <template v-for="item in navItems" :key="item.name">
            <!-- Single Link -->
            <router-link 
              v-if="!item.children"
              :to="item.to!"
              class="flex items-center px-3 py-2.5 rounded-lg transition-colors group"
              :class="[
                isActive(item) 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              ]"
            >
              <component :is="item.icon" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
              <span class="font-medium text-sm">{{ item.name }}</span>
            </router-link>

            <!-- Parent Menu -->
            <div v-else>
                <button 
                    @click="toggleMenu(item.key!)"
                    class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                    <div class="flex items-center">
                        <component :is="item.icon" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
                        <span class="font-medium text-sm">{{ item.name }}</span>
                    </div>
                    <component 
                        :is="expandedMenus[item.key!] ? ChevronDown : ChevronRight" 
                        class="w-4 h-4 text-slate-500 transition-transform"
                    />
                </button>
                
                <!-- Children -->
                <div v-if="expandedMenus[item.key!]" class="mt-1 ml-4 pl-3 border-l border-slate-700 space-y-1">
                    <router-link 
                      v-for="child in item.children" 
                      :key="child.name" 
                      :to="child.to"
                      class="flex items-center px-3 py-2 rounded-lg transition-colors group"
                      :class="[
                        $route.name === child.routeName 
                          ? 'text-blue-400 bg-blue-500/10' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      ]"
                    >
                      <span class="font-medium text-sm">{{ child.name }}</span>
                    </router-link>
                </div>
            </div>
        </template>
      </nav>

      <div class="p-4 border-t border-slate-800">
        <div class="flex items-center gap-3 px-2">
            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                {{ userInitials }}
            </div>
            <div class="overflow-hidden">
                <p class="text-sm font-medium truncate">{{ authStore.user?.username || 'User' }}</p>
                <p class="text-xs text-slate-400 truncate">{{ t('header.online') }}</p>
            </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="h-16 bg-white shadow-sm border-b border-gray-100 flex items-center justify-between px-6 z-10">
        <!-- Breadcrumbs / Title -->
        <div class="flex items-center text-gray-500 text-sm">
             <span class="hover:text-gray-900 cursor-pointer">{{ t('header.workplace') }}</span>
             <ChevronRight class="w-4 h-4 mx-2" />
             <span class="font-semibold text-gray-800">{{ currentRouteName }}</span>
        </div>

        <!-- Right Actions -->
        <div class="flex items-center gap-4">
             <LanguageSelector />
             
             <div class="relative">
                 <input 
                    type="text" 
                    :placeholder="t('app.searchPlaceholder')" 
                    class="w-64 pl-9 pr-4 py-1.5 text-sm bg-gray-100 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                 />
                 <Search class="w-4 h-4 absolute left-3 top-2 text-gray-400" />
             </div>
             
             <button class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors" @click="handleLogout" :title="t('header.logout')">
                 <LogOut class="w-5 h-5" />
             </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-auto p-6 relative">
         <router-view v-slot="{ Component }">
             <transition name="fade" mode="out-in">
                 <component :is="Component" />
             </transition>
         </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import LanguageSelector from '@/components/LanguageSelector.vue'
import { 
  LayoutDashboard, 
  FolderKanban, 
  Workflow, 
  CheckSquare, 
  Search, 
  LogOut,
  ChevronRight,
  ChevronDown,
  Users,
  MessageSquare,
  Server,
  Settings,
} from 'lucide-vue-next'

const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

// Navigation State
const expandedMenus = ref<Record<string, boolean>>({
    'tasks': true // Default expand for demo
})

const toggleMenu = (name: string) => {
    expandedMenus.value[name] = !expandedMenus.value[name]
}

const isActive = (item: any) => {
  if (item.children) return false 
  if (!item.to) return false
  if (item.to === '/') return route.path === '/'
  return route.path.startsWith(item.to)
}

const navItems = computed(() => {
  const items: any[] = [
  { name: t('nav.home'), to: '/', routeName: 'home', icon: LayoutDashboard },
  { name: t('nav.aiChat'), to: '/chat', routeName: 'ai-chat', icon: MessageSquare },
  { name: t('nav.projects'), to: '/projects', routeName: 'projects', icon: FolderKanban },
  { name: t('nav.workflows'), to: '/workflows', routeName: 'workflows', icon: Workflow },
  { 
      name: t('nav.tasks'),
      icon: CheckSquare,
      key: 'tasks',
      children: [
          { name: t('nav.taskRecords'), to: '/tasks', routeName: 'tasks' },
          { name: t('nav.periodicTasks'), to: '/tasks/periodic', routeName: 'tasks-periodic' },
          { name: t('nav.scheduledTasks'), to: '/tasks/scheduled', routeName: 'tasks-scheduled' },
          { name: t('nav.webhookTasks'), to: '/tasks/webhook', routeName: 'tasks-webhook' },
      ]
  },
  { name: t('nav.members'), to: '/members', routeName: 'platform-members', icon: Users },
  { name: t('nav.clientAgents'), to: '/client-agents', routeName: 'client-agents', icon: Server },
  ]
  // Maintainer+ only: Platform Settings (includes permissions matrix)
  const role = authStore.user?.platform_role || authStore.user?.role
  if (role === 'OWNER' || role === 'MAINTAINER') {
      items.push({ name: '平台设置', to: '/platform/settings', routeName: 'platform-settings', icon: Settings })
  }
  return items
})

const currentRouteName = computed(() => {
    // Find matching child
    for (const item of navItems.value) {
        if (item.children) {
            const child = item.children.find(c => c.routeName === route.name)
            if (child) return child.name
        } else if (item.routeName === route.name) {
            return item.name
        }
    }
    return t('header.dashboard') || 'Dashboard'
})

const userInitials = computed(() => {
    const name = authStore.user?.username || 'U'
    return name.substring(0, 2).toUpperCase()
})

const handleLogout = () => {
    authStore.logout()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
