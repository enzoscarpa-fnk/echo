<script setup lang="ts">
const { signIn } = useAuth()
</script>

<template>
  <button class="rounded-full my-4 px-3 py-1 bg-cyan-900 border-2 border-teal-400 text-teal-400 font-bold" @click="signIn">
    Sign in
  </button>
</template>