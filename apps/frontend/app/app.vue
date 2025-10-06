<script setup lang="ts">
import LoginButton from "~~/components/LoginButton.vue";
import UserButton from "~~/components/UserButton.vue";
</script>

<template>
  <div>
    <header
      v-if="$route.path === '/'"
      class="fixed top-0 right-0 z-50 h-16 flex justify-end items-center gap-2 px-6"
    >
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
  </div>
</template>

<style>
/* Custom colors based on the moodboard */
:root {
  --color-primary-50: #EBF5FF;
  --color-primary-100: #E1EFFE;
  --color-primary-200: #C3DDFD;
  --color-primary-300: #A4CAFE;
  --color-primary-400: #76A9FA;
  --color-primary-500: #5B8DEF;
  --color-primary-600: #3B82F6;
  --color-primary-700: #2563EB;
  --color-primary-800: #1D4ED8;
  --color-primary-900: #1E40AF;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
}
</style>