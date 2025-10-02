<script setup lang="ts">
const clerk = useClerk()

const onClick = () => {
  if (!clerk.value) return
  clerk.value.openSignIn({})
}
</script>

<template>
  <button class="rounded-full my-4 px-3 py-1 bg-cyan-900 border-2 border-teal-400 text-teal-400 font-bold" @click="onClick">
    Sign in
  </button>
</template>