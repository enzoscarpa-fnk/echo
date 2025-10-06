<script setup lang="ts">
import LoginButton from '~/components/LoginButton.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Hero Section -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-b from-blue-50 to-white">
      <div class="text-center max-w-md">
        <div class="mb-8">
          <h1 class="text-7xl font-bold text-blue-600 mb-3">echo</h1>
          <p class="text-xl text-gray-600">Connect with friends instantly</p>
        </div>

        <!-- CTA Button -->
        <SignedOut>
          <div class="space-y-3">
            <LoginButton class="!block !w-full !text-center !text-lg !py-3" />
            <p class="text-sm text-gray-500">
              Create your account in seconds
            </p>
          </div>
        </SignedOut>

        <SignedIn>
          <NuxtLink to="/dashboard" class="block">
            <UButton
                size="xl"
                block
                color="primary"
                icon="i-heroicons-arrow-right"
                trailing
            >
              Go to Dashboard
            </UButton>
          </NuxtLink>
        </SignedIn>
      </div>
    </div>

    <!-- Features Section -->
    <div class="px-6 py-16 bg-white">
      <h2 class="text-3xl font-bold text-center mb-12 text-gray-900">Why choose echo?</h2>
      <div class="space-y-8 max-w-md mx-auto">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <UIcon name="i-heroicons-bolt" class="text-2xl text-blue-600" />
          </div>
          <div>
            <h3 class="font-semibold text-lg mb-1">Lightning Fast</h3>
            <p class="text-gray-600">Send messages in real-time with instant delivery</p>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <UIcon name="i-heroicons-user-group" class="text-2xl text-purple-600" />
          </div>
          <div>
            <h3 class="font-semibold text-lg mb-1">Group Chats</h3>
            <p class="text-gray-600">Create conversations with multiple friends</p>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <UIcon name="i-heroicons-shield-check" class="text-2xl text-green-600" />
          </div>
          <div>
            <h3 class="font-semibold text-lg mb-1">Secure & Private</h3>
            <p class="text-gray-600">Your conversations are protected and encrypted</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Pricing Section -->
    <div class="px-6 py-16 bg-gray-50">
      <h2 class="text-3xl font-bold text-center mb-4 text-gray-900">Simple Pricing</h2>
      <p class="text-center text-gray-600 mb-12">Start for free, upgrade when you need more</p>

      <div class="max-w-md mx-auto space-y-4">
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
              <li class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle-solid" class="text-green-500 text-xl" />
                <span>Mobile & web access</span>
              </li>
            </ul>

            <SignedOut>
              <LoginButton class="!block !w-full !text-center" />
            </SignedOut>

            <SignedIn>
              <NuxtLink to="/dashboard" class="block">
                <UButton
                    size="lg"
                    block
                >
                  Go to Dashboard
                </UButton>
              </NuxtLink>
            </SignedIn>
          </div>
        </UCard>

        <!-- Premium Plan (Coming Soon) -->
        <UCard>
          <div class="text-center p-6 opacity-60">
            <div class="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              Coming Soon
            </div>
            <h3 class="text-2xl font-bold mb-2">Premium</h3>
            <p class="text-5xl font-bold text-gray-400 mb-4">$4.99</p>
            <p class="text-gray-600 mb-6">Advanced features for power users</p>
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
              <li class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle-solid" class="text-gray-400 text-xl" />
                <span class="text-gray-500">Custom themes</span>
              </li>
            </ul>
            <UButton size="lg" block disabled>Coming Soon</UButton>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-8 px-6">
      <div class="max-w-md mx-auto text-center">
        <p class="text-2xl font-bold mb-2">echo</p>
        <p class="text-gray-400 text-sm mb-4">© 2025 Echo. All rights reserved.</p>
        <div class="flex justify-center gap-4 text-sm text-gray-400">
          <a href="#" class="hover:text-white">Privacy</a>
          <a href="#" class="hover:text-white">Terms</a>
          <a href="#" class="hover:text-white">Contact</a>
        </div>
      </div>
    </footer>
  </div>
</template>