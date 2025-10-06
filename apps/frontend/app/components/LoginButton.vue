<script setup lang="ts">
const { isLoaded } = useAuth()
const clerk = useClerk()

const openSignIn = () => {
  if (isLoaded.value && clerk.value) {
    clerk.value.openSignIn()
  }
}
</script>

<template>
  <button
      class="rounded-full my-4 px-3 py-1 bg-cyan-900 border-2 border-teal-400 text-teal-400 font-bold"
      @click="openSignIn"
      :disabled="!isLoaded"
  >
    {{ isLoaded ? 'Sign in' : 'Loading...' }}
  </button>
</template>
