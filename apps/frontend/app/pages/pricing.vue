<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 pb-24">
    <!-- Header -->
    <div class="h-16 bg-sky-950/80 backdrop-blur border-b border-slate-800/30 px-6 py-2 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <UButton
              icon="i-heroicons-arrow-left"
              variant="ghost"
              size="sm"
              color="slate"
              @click="navigateTo('/')"
          />
          <h1 class="text-xl font-bold text-white">Pricing</h1>
        </div>

        <div class="flex items-center gap-2">
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </div>


    <!-- Pricing Cards -->
    <div class="px-6 py-6 max-w-md mx-auto space-y-4">
      <!-- Free Plan -->
      <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
        <div class="text-center">
          <h3 class="text-2xl font-bold text-white mb-2">Free</h3>
          <p class="text-5xl font-bold text-blue-500 mb-4">$0</p>
          <p class="text-slate-400 mb-6">Perfect for personal use</p>
          <ul class="text-left space-y-3 mb-6">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle-solid" class="text-blue-500 text-xl flex-shrink-0" />
              <span class="text-slate-300">Unlimited messages</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle-solid" class="text-blue-500 text-xl flex-shrink-0" />
              <span class="text-slate-300">Group conversations</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle-solid" class="text-blue-500 text-xl flex-shrink-0" />
              <span class="text-slate-300">Contact management</span>
            </li>
          </ul>
          <UButton
              size="lg"
              block
              color="slate"
              variant="outline"
              disabled
              class="border-slate-600 text-slate-400"
          >
            Current Plan
          </UButton>
        </div>
      </div>

      <!-- Premium Plan (Coming Soon) -->
      <div class="bg-slate-800/20 border border-slate-700/30 rounded-2xl p-6 opacity-60">
        <div class="text-center">
          <div class="inline-block bg-slate-700/50 border border-slate-600/50 text-slate-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            Coming Soon
          </div>
          <h3 class="text-2xl font-bold text-slate-300 mb-2">Premium</h3>
          <p class="text-5xl font-bold text-slate-500 mb-4">$4.99</p>
          <p class="text-slate-500 mb-6">Advanced features for power users</p>
          <ul class="text-left space-y-3 mb-6">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle-solid" class="text-slate-600 text-xl flex-shrink-0" />
              <span class="text-slate-500">Everything in Free</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle-solid" class="text-slate-600 text-xl flex-shrink-0" />
              <span class="text-slate-500">File sharing</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle-solid" class="text-slate-600 text-xl flex-shrink-0" />
              <span class="text-slate-500">Voice messages</span>
            </li>
          </ul>
          <UButton
              size="lg"
              block
              color="slate"
              disabled
          >
            Coming Soon
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
