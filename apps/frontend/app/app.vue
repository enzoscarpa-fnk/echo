<script setup lang="ts">
import LoginButton from "~~/components/LoginButton.vue";
import UserButton from "~~/components/UserButton.vue";
</script>

<template>
  <header class="fixed top-0 right-0 z-50 h-18 flex justify-end items-center gap-2 px-3">
    <SignedOut>
      <LoginButton />
    </SignedOut>
    <SignedIn>
      <UserButton />
    </SignedIn>
  </header>

  <main class="pt-18">
    <NuxtPage />
  </main>
</template>