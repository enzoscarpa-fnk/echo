<script setup lang="ts">
import LoginButton from "~~/components/LoginButton.vue";
</script>

<template>
  <header>
    <SignedOut>
      <LoginButton />
    </SignedOut>
    <SignedIn>
      <UserButton />
    </SignedIn>
  </header>

  <main>
    <NuxtPage />
  </main>
</template>