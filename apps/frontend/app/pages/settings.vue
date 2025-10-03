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
        <h1 class="text-xl font-bold">Settings</h1>
      </div>
    </div>

    <div class="px-6 py-6 max-w-md mx-auto">
      <UCard>
        <div class="p-4 text-center text-gray-600">
          <UIcon name="i-heroicons-cog-6-tooth" class="text-4xl mx-auto mb-4 text-gray-400" />
          <p>Settings page coming soon...</p>
        </div>
      </UCard>
    </div>
  </div>
</template>