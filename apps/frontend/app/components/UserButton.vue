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
    <button
        ref="triggerRef"
        class="flex items-center gap-2 rounded-full my-4"
        @click="toggle"
        aria-haspopup="menu"
        :aria-expanded="isOpen"
    >
      <img
          :src="user.imageUrl"
          :alt="user.fullName || 'User'"
          class="h-8 w-8 rounded-full ring-2 ring-teal-400"
      />
      <span class="text-sm">{{ user.fullName }}</span>
    </button>

    <div
        v-show="isOpen"
        ref="menuRef"
        role="menu"
        class="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg z-50"
    >
      <button
          class="w-full px-4 py-2 text-left hover:bg-teal-50"
          role="menuitem"
          @click="onOpenProfile"
      >
        Profile
      </button>
      <NuxtLink
          class="block px-4 py-2 hover:bg-teal-50"
          role="menuitem"
          to="/settings"
          @click="close"
      >
        Settings
      </NuxtLink>
      <NuxtLink
          class="block px-4 py-2 hover:bg-teal-50"
          role="menuitem"
          to="/pricing"
          @click="close"
      >
        Pricing
      </NuxtLink>
      <hr class="my-1" />
      <button
          class="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
          role="menuitem"
          @click="onSignOut"
      >
        Sign out
      </button>
    </div>
  </div>
</template>
