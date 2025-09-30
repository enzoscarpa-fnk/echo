<script setup lang="ts">
const clerk = useClerk()

const onClick = () => {
  if (!clerk.value) return
  clerk.value.openSignIn({})
}
</script>

<template>
  <button class="rounded-full my-2 px-3 py-1 bg-yellow-400 border-2 border-yellow-500 text-white font-bold" @click="onClick">
    Custom Clerk Sign In
  </button>
</template>