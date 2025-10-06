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
  <div class="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-3 safe-area-bottom">
    <div class="flex justify-around items-center max-w-md mx-auto">
      <NuxtLink
          to="/profile"
          class="flex flex-col items-center gap-1"
          :class="active === 'profile' ? 'text-blue-600' : 'text-gray-400'"
      >
        <UIcon name="i-heroicons-user" class="text-2xl" />
        <span class="text-xs">Profile</span>
      </NuxtLink>

      <NuxtLink
          to="/dashboard"
          class="flex flex-col items-center gap-1"
          :class="active === 'dashboard' ? 'text-blue-600' : 'text-gray-400'"
      >
        <UIcon name="i-heroicons-chat-bubble-left-right" class="text-2xl" />
        <span class="text-xs">Chats</span>
      </NuxtLink>

      <NuxtLink
          to="/contacts"
          class="flex flex-col items-center gap-1"
          :class="active === 'contacts' ? 'text-blue-600' : 'text-gray-400'"
      >
        <UIcon name="i-heroicons-user-group" class="text-2xl" />
        <span class="text-xs">Contacts</span>
      </NuxtLink>
    </div>
  </div>
</template>