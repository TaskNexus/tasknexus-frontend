<template>
  <div class="relative">
    <button 
      @click="isOpen = !isOpen"
      class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2"
      :title="t('common.language')"
    >
      <Languages class="w-5 h-5" />
      <!-- <span class="text-sm font-medium hidden md:block">{{ currentLanguageLabel }}</span> -->
    </button>

    <!-- Dropdown -->
    <div 
      v-if="isOpen"
      class="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
    >
      <button
        v-for="(label, key) in languageMap"
        :key="key"
        @click="changeLanguage(key)"
        class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
        :class="locale === key ? 'text-blue-600 font-medium' : 'text-gray-700'"
      >
        {{ label }}
        <Check v-if="locale === key" class="w-4 h-4" />
      </button>
    </div>

    <!-- Backdrop to close -->
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-40 cursor-default" 
      @click="isOpen = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Languages, Check } from 'lucide-vue-next'

const { locale, t } = useI18n()
const isOpen = ref(false)

const languageMap: Record<string, string> = {
  'zh': '中文',
  'en': 'English'
}

const currentLanguageLabel = computed(() => {
  return languageMap[locale.value as string] || locale.value
})

const changeLanguage = (lang: string) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
  isOpen.value = false
}
</script>
