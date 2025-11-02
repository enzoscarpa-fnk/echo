<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePusher } from '~/composables/usePusher'
import type { FormError, FormSubmitEvent } from '#ui/types'

const { isLoaded, isSignedIn, userId, sessionId, sessionClaims } = useAuth()
const { openUserProfile } = useClerk()

const profile = ref<any>(null)
const contactStatusUpdates = ref([])
const loading = ref(false)
const editMode = ref(false)

let pusherCleanup: (() => void) | null = null

// Form state
const formState = reactive({
  firstName: '',
  lastName: '',
})

// Debug
onMounted(() => {
})

// Get token from __clerk_session cookie directly
const getClerkToken = async () => {
  try {
    // The token is stored in the __clerk_session cookie
    // Clerk automatically includes it in requests
    // We'll make the API call without manually adding the token
    // The backend ClerkStrategy will extract it from cookies
    return 'use-cookie'
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

// Fetch profile
const fetchProfile = async () => {
  try {
    loading.value = true

    if (!isLoaded.value) {
      loading.value = false
      return
    }

    if (!isSignedIn.value) {
      loading.value = false
      return
    }

    // Call API - Clerk cookie will be sent automatically
    const data = await $fetch('/api/users/me', {
      credentials: 'include', // Include cookies
    })

    profile.value = data
    formState.firstName = data?.firstName || ''
    formState.lastName = data?.lastName || ''

  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

// Fetch profile
watch(
    [() => isLoaded.value, () => isSignedIn.value],
    ([loaded, signedIn]) => {

      if (loaded && signedIn) {
        fetchProfile()
      }
    },
    { immediate: true }
)

// Setup Pusher when profile is loaded
watch(
    () => profile.value,
    (newProfile) => {
      if (newProfile?.id) {
        console.log('Setting up Pusher for user:', newProfile.id)

        const { contactStatusUpdates: updates, cleanup } = usePusher(
            newProfile.id,
            'use-cookie'
        )

        contactStatusUpdates.value = updates
        pusherCleanup = cleanup
      }
    },
    { once: true }
)

onUnmounted(() => {
  console.log('Component unmounting, cleaning up Pusher')
  if (pusherCleanup) {
    pusherCleanup()
  }
})

// Form validation
const validate = (state: any): FormError[] => {
  const errors = []
  if (!state.firstName?.trim()) {
    errors.push({ path: 'firstName', message: 'First name is required' })
  }
  if (!state.lastName?.trim()) {
    errors.push({ path: 'lastName', message: 'Last name is required' })
  }
  return errors
}

// Update profile
const onSubmit = async (event: FormSubmitEvent<typeof formState>) => {
  try {
    loading.value = true

    // Use cookie-based auth
    const data = await $fetch('/api/users/me', {
      method: 'PATCH',
      credentials: 'include',
      body: event.data,
    })

    profile.value = data
    editMode.value = false
  } catch (error) {
    console.error('Update error:', error)
  } finally {
    loading.value = false
  }
}

const cancelEdit = () => {
  editMode.value = false
  formState.firstName = profile.value?.firstName || ''
  formState.lastName = profile.value?.lastName || ''
}

const openClerkSettings = () => {
  if (openUserProfile) {
    openUserProfile()
  }
}

const fullName = computed(() => {
  if (profile.value?.firstName && profile.value?.lastName) {
    return `${profile.value.firstName} ${profile.value.lastName}`
  }
  return profile.value?.username || profile.value?.email || 'User'
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 pb-24">
    <!-- Header -->
    <div class="bg-slate-950/50 backdrop-blur border-b border-slate-800/30 px-6 py-4.5 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">Profile</h1>
        <button
            v-if="!editMode && profile"
            @click="editMode = true"
            class="px-4 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/30 rounded-lg transition"
        >
          Edit
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !profile" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profile" class="px-6 py-6 max-w-2xl mx-auto space-y-4">
      <!-- Profile Header Card -->
      <div class="bg-slate-800/20 border border-slate-700/20 rounded-3xl p-6">
        <div class="flex items-center gap-4">
          <img
              :src="profile.imageUrl"
              alt="Avatar"
              class="w-20 h-20 rounded-full object-cover ring-2 ring-slate-700/50"
          />
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-white">{{ fullName }}</h2>
            <p class="text-slate-400">{{ profile.email }}</p>
            <div class="flex items-center gap-2 mt-2">
              <span
                  class="inline-flex items-center gap-1.5 text-xs font-medium"
                  :class="profile.isOnline ? 'text-emerald-400' : 'text-slate-500'"
              >
                <span
                    class="w-2 h-2 rounded-full"
                    :class="profile.isOnline ? 'bg-emerald-400' : 'bg-slate-600'"
                />
                {{ profile.isOnline ? 'Online' : 'Offline' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Basic Information Card -->
      <div class="bg-slate-800/20 border border-slate-700/20 rounded-3xl p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Basic Information</h3>

        <!-- View Mode -->
        <div v-if="!editMode" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">First Name</label>
            <p class="text-base text-white">{{ profile.firstName || 'Not set' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Last Name</label>
            <p class="text-base text-white">{{ profile.lastName || 'Not set' }}</p>
          </div>
        </div>

        <!-- Edit Mode -->
        <form v-else @submit.prevent="onSubmit({  formState })" class="space-y-4">
          <div>
            <label for="firstName" class="block text-sm font-medium text-slate-300 mb-2">
              First Name *
            </label>
            <input
                id="firstName"
                v-model="formState.firstName"
                type="text"
                required
                class="w-full bg-slate-800/30 border border-slate-700/50 text-white placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/50 transition"
                placeholder="Enter your first name"
            />
          </div>

          <div>
            <label for="lastName" class="block text-sm font-medium text-slate-300 mb-2">
              Last Name *
            </label>
            <input
                id="lastName"
                v-model="formState.lastName"
                type="text"
                required
                class="w-full bg-slate-800/30 border border-slate-700/50 text-white placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/50 transition"
                placeholder="Enter your last name"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <button
                type="submit"
                :disabled="loading"
                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
            >
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
            <button
                type="button"
                @click="cancelEdit"
                class="px-4 py-2 bg-slate-800/30 hover:bg-slate-800/50 text-slate-300 font-medium rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Account Settings Card -->
      <div class="bg-slate-800/20 border border-slate-700/20 rounded-3xl p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Account Settings</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
            <p class="text-base text-white">{{ profile.email }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Username</label>
            <p class="text-base text-white">{{ profile.username || 'Not set' }}</p>
          </div>

          <div class="border-t border-slate-700/30 pt-4 mt-4">
            <p class="text-sm text-slate-400 mb-3">
              To update your email, username, password, or security settings, use Clerk's profile management.
            </p>
            <button
                @click="openClerkSettings"
                class="px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 text-white font-medium rounded-lg transition"
            >
              Open Clerk Settings
            </button>
          </div>
        </div>
      </div>

      <!-- Account Info Card -->
      <div class="bg-slate-800/20 border border-slate-700/20 rounded-3xl p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Account Information</h3>

        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-400">Account Created</span>
            <span class="font-medium text-white">
              {{ new Date(profile.createdAt).toLocaleDateString() }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Last Seen</span>
            <span class="font-medium text-white">
              {{ new Date(profile.lastSeenAt).toLocaleString() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Real-time Events Card -->
      <div class="bg-slate-800/20 border border-slate-700/20 rounded-3xl p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Real-time Events</h3>
        <ul v-if="contactStatusUpdates.length > 0" class="space-y-2 text-sm text-slate-400">
          <li v-for="update in contactStatusUpdates" :key="update.userId" class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" :class="update.isOnline ? 'bg-emerald-400' : 'bg-slate-600'" />
            {{ update.userId }} → {{ update.isOnline ? 'online' : 'offline' }}
          </li>
        </ul>
        <p v-else class="text-sm text-slate-500">No recent events</p>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomMenu active="profile" />
  </div>
</template>
