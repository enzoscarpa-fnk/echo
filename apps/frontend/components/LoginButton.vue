<script setup lang="ts">
const { isLoaded } = useAuth()
const clerk = useClerk()

// Debug logs
watch([isLoaded], ([loaded]) => {
  console.log('Clerk isLoaded:', loaded)
  console.log('Clerk instance:', clerk)
})

const openSignIn = () => {
  console.log('Button clicked!')
  console.log('isLoaded:', isLoaded.value)
  console.log('clerk:', clerk)

  if (isLoaded.value && clerk.value) {
    console.log('Opening sign in modal...')
    clerk.value.openSignIn()
  } else {
    console.log('Clerk not ready yet')
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
