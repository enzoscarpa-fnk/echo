<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <div class="bg-white border-b px-6 py-4">
      <div class="flex items-center gap-3">
        <UButton
            icon="i-heroicons-arrow-left"
            variant="ghost"
            size="sm"
            @click="navigateTo('/dashboard')"
        />
        <h1 class="text-xl font-bold">Pricing</h1>
      </div>
    </div>

    <div class="px-6 py-6 max-w-md mx-auto space-y-4">
      <!-- Free Plan -->
      <UCard>
        <div class="text-center p-6">
          <h3 class="text-2xl font-bold mb-2">Free</h3>
          <p class="text-5xl font-bold text-blue-600 mb-4">$0</p>
          <p class="text-gray-600 mb-6">Perfect for personal use</p>
          <ul class="text-left space-y-3 mb-6">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle-solid" class="text-green-500 text-xl" />
              <span>Unlimited messages</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle-solid" class="text-green-500 text-xl" />
              <span>Group conversations</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle-solid" class="text-green-500 text-xl" />
              <span>Contact management</span>
            </li>
          </ul>
          <UButton
              size="lg"
              block
              variant="outline"
              disabled
          >
            Current Plan
          </UButton>
        </div>
      </UCard>

      <!-- Premium Plan -->
      <UCard>
        <div class="text-center p-6 opacity-60">
          <div class="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            Coming Soon
          </div>
          <h3 class="text-2xl font-bold mb-2">Premium</h3>
          <p class="text-5xl font-bold text-gray-400 mb-4">$4.99</p>
          <p class="text-gray-600 mb-6">Advanced features</p>
          <ul class="text-left space-y-3 mb-6">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle-solid" class="text-gray-400 text-xl" />
              <span class="text-gray-500">Everything in Free</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle-solid" class="text-gray-400 text-xl" />
              <span class="text-gray-500">File sharing</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle-solid" class="text-gray-400 text-xl" />
              <span class="text-gray-500">Voice messages</span>
            </li>
          </ul>
          <UButton
              size="lg"
              block
              disabled
          >
            Coming Soon
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>