<script setup lang="ts">
const { user, isLoaded } = useUser()
const { signOut } = useAuth()
const clerk = useClerk()

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

const toggle = () => { isOpen.value = !isOpen.value }
const close = () => { isOpen.value = false }

const onDocClick = (e: MouseEvent) => {
  const t = e.target as Node
  if (!menuRef.value || !triggerRef.value) return
  if (menuRef.value.contains(t) || triggerRef.value.contains(t)) return
  close()
}

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})

const onOpenProfile = () => {
  if (isLoaded.value && clerk.value) {
    clerk.value.openUserProfile()
  }
}

const onSignOut = async () => {
  if (isLoaded.value && clerk.value) {
    await clerk.value.signOut()
    await navigateTo('/')
  }
}
</script>

<template>
  <div v-if="isLoaded && user" class="relative">
    <!-- Trigger Button -->
    <button
        ref="triggerRef"
        class="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-slate-800/50 transition-all"
        @click="toggle"
        aria-haspopup="menu"
        :aria-expanded="isOpen"
    >
      <img
          :src="user.imageUrl"
          :alt="user.fullName || 'User'"
          class="h-8 w-8 rounded-full ring-2 ring-blue-500/50"
      />
      <span class="text-sm text-slate-300 hover:text-white">{{ user.fullName }}</span>
    </button>

    <!-- Dropdown Menu -->
    <div
        v-show="isOpen"
        ref="menuRef"
        role="menu"
        class="absolute right-0 mt-2 w-56 p-1 rounded-2xl border border-slate-700/50 bg-slate-800 shadow-lg z-50"
    >
      <button
          class="w-full px-4 py-2.5 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all flex items-center gap-2"
          role="menuitem"
          @click="onOpenProfile"
      >
        <UIcon name="i-heroicons-user" class="w-4 h-4" />
        Profile
      </button>
      <NuxtLink
          class="block px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all flex items-center gap-2"
          role="menuitem"
          to="/pricing"
          @click="close"
      >
        <UIcon name="i-heroicons-star" class="w-4 h-4" />
        Pricing
      </NuxtLink>
      <button
          class="w-full px-4 py-2.5 rounded-xl text-left text-red-400 hover:text-red-300 hover:bg-slate-700/30 transition-all flex items-center gap-2"
          role="menuitem"
          @click="onSignOut"
      >
        <UIcon name="i-heroicons-arrow-left-on-rectangle" class="w-4 h-4" />
        Sign out
      </button>
    </div>
  </div>
</template>
