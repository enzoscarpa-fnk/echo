<script setup lang="ts">
import LoginButton from '~/components/LoginButton.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-900">
    <!-- Hero Section -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <div class="text-center max-w-md">
        <div class="mb-8">
          <h1 class="text-7xl font-bold text-white mb-3">echo</h1>
          <p class="text-xl text-slate-400">Connect with friends, instantly</p>
        </div>

        <!-- CTA Button -->
        <SignedOut>
          <div class="space-y-3">
            <LoginButton class="!block !w-full !text-center !text-lg !py-3 clerk-button-blue" />
            <p class="text-sm text-slate-500">
              or create your account in seconds
            </p>
          </div>
        </SignedOut>

        <SignedIn>
          <NuxtLink to="/dashboard" class="block">
            <div class="bg-white/10 backdrop-blur-sm border-2 border-cyan-700 text-teal-300 rounded-full px-2 py-1">
              <UButton
                  size="xl"
                  block
                  color="blue"
                  icon="i-heroicons-arrow-right"
                  trailing
              >
                Go to Dashboard
              </UButton>
            </div>
          </NuxtLink>
        </SignedIn>
      </div>
    </div>

    <!-- Features Section -->
    <div class="px-6 py-16 bg-slate-800/50 border-y border-slate-700/30">
      <h2 class="text-3xl font-bold text-center mb-12 text-white">Why choose echo?</h2>
      <div class="space-y-8 max-w-md mx-auto">
        <!-- Feature 1: Blue (comme messages envoyés) -->
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 bg-blue-600/20 border border-blue-600/50 rounded-xl flex items-center justify-center">
            <UIcon name="i-heroicons-bolt" class="text-2xl text-blue-400" />
          </div>
          <div>
            <h3 class="font-semibold text-lg text-white mb-1">Lightning Fast</h3>
            <p class="text-slate-400">Send messages in real-time with instant delivery</p>
          </div>
        </div>

        <!-- Feature 2: Slate/Neutral -->
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 bg-slate-600/20 border border-slate-600/50 rounded-xl flex items-center justify-center">
            <UIcon name="i-heroicons-user-group" class="text-2xl text-slate-300" />
          </div>
          <div>
            <h3 class="font-semibold text-lg text-white mb-1">Group Chats</h3>
            <p class="text-slate-400">Create conversations with multiple friends</p>
          </div>
        </div>

        <!-- Feature 3: Emerald (live indicator) -->
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 bg-emerald-600/20 border border-emerald-600/50 rounded-xl flex items-center justify-center">
            <UIcon name="i-heroicons-shield-check" class="text-2xl text-emerald-400" />
          </div>
          <div>
            <h3 class="font-semibold text-lg text-white mb-1">Secure & Private</h3>
            <p class="text-slate-400">Your conversations are protected and encrypted</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Pricing Section -->
    <div class="px-6 py-16 bg-gray-900">
      <h2 class="text-3xl font-bold text-center mb-4 text-white">Simple Pricing</h2>
      <p class="text-center text-slate-400 mb-12">Start for free, upgrade when you need more</p>

      <div class="max-w-md mx-auto space-y-4">
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
              <li class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle-solid" class="text-blue-500 text-xl flex-shrink-0" />
                <span class="text-slate-300">Mobile & web access</span>
              </li>
            </ul>

            <SignedOut>
              <LoginButton class="!block !w-full !text-center clerk-button-blue" />
            </SignedOut>

            <SignedIn>
              <NuxtLink to="/dashboard" class="block">
                <UButton
                    size="lg"
                    block
                    color="blue"
                >
                  Go to Dashboard
                </UButton>
              </NuxtLink>
            </SignedIn>
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
              <li class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle-solid" class="text-slate-600 text-xl flex-shrink-0" />
                <span class="text-slate-500">Custom themes</span>
              </li>
            </ul>
            <UButton size="lg" block disabled color="slate">Coming Soon</UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-slate-950 border-t border-slate-800/30 py-8 px-6">
      <div class="max-w-md mx-auto text-center">
        <p class="text-2xl font-bold text-white mb-2">echo</p>
        <p class="text-slate-500 text-sm mb-4">© 2025 Echo. All rights reserved.</p>
        <div class="flex justify-center gap-4 text-sm text-slate-500 hover:text-slate-400 transition">
          <a href="#" class="hover:text-slate-300 transition">Privacy</a>
          <a href="#" class="hover:text-slate-300 transition">Terms</a>
          <a href="#" class="hover:text-slate-300 transition">Contact</a>
        </div>
      </div>
    </footer>
  </div>
</template>