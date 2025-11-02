<script setup lang="ts">
import LoginButton from "~/components/LoginButton.vue";
import UserButton from "~/components/UserButton.vue";

const route = useRoute()
const isHomePage = computed(() => route.path === '/')
</script>

<template>
  <div>
    <header
      v-if="isHomePage"
      class="fixed top-0 left-0 right-0 w-full h-16 flex justify-end items-center gap-2 px-6 bg-sky-950/80 backdrop-blur-sm z-50 shadow-sm"
    >
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
  </div>
</template>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  margin: 0;
  padding: 0;
  background-color: black;
}

* {
  box-sizing: border-box;
}
</style>