<script setup lang="ts">
defineProps<{
  active: 'profile' | 'dashboard' | 'contacts'
}>()
</script>

<style scoped>
.safe-area-bottom {
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
}
</style>

<template>
  <div class="fixed bottom-6 left-6 right-6 bg-slate-800/40 backdrop-blur-xl border border-slate-700/30 rounded-3xl px-2 py-2 shadow-2xl z-40">
    <div class="flex justify-around items-center gap-1">
      <NuxtLink
          to="/profile"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all"
          :class="active === 'profile'
            ? 'text-purple-300 bg-slate-700/40'
            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/20'"
      >
        <UIcon name="i-heroicons-user" class="w-5 h-5" />
        <span class="text-xs font-medium whitespace-nowrap">Profile</span>
      </NuxtLink>

      <NuxtLink
          to="/dashboard"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all"
          :class="active === 'dashboard'
            ? 'text-purple-300 bg-slate-700/40'
            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/20'"
      >
        <UIcon name="i-heroicons-chat-bubble-left-right" class="w-5 h-5" />
        <span class="text-xs font-medium whitespace-nowrap">Chats</span>
      </NuxtLink>

      <NuxtLink
          to="/contacts"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all"
          :class="active === 'contacts'
            ? 'text-purple-300 bg-slate-700/40'
            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/20'"
      >
        <UIcon name="i-heroicons-user-group" class="w-5 h-5" />
        <span class="text-xs font-medium whitespace-nowrap">Contacts</span>
      </NuxtLink>
    </div>
  </div>
</template>
