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
  console.log('🔍 isLoaded:', isLoaded.value)
  console.log('🔍 isSignedIn:', isSignedIn.value)
  console.log('🔍 userId:', userId.value)
  console.log('🔍 sessionId:', sessionId.value)
  console.log('🔍 sessionClaims:', sessionClaims.value)
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
    console.log('📡 fetchProfile called')
    loading.value = true

    if (!isLoaded.value) {
      console.warn('⚠️ Not loaded')
      loading.value = false
      return
    }

    if (!isSignedIn.value) {
      console.warn('⚠️ Not signed in')
      loading.value = false
      return
    }

    console.log('✅ Calling API (using cookies for auth)')

    // Call API - Clerk cookie will be sent automatically
    const data = await $fetch('/api/users/me', {
      credentials: 'include', // Include cookies
    })

    console.log('✅ API response:', data)
    profile.value = data
    formState.firstName = data?.firstName || ''
    formState.lastName = data?.lastName || ''

    console.log('✅ Profile loaded')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    loading.value = false
  }
}

// Fetch profile
watch(
    [() => isLoaded.value, () => isSignedIn.value],
    ([loaded, signedIn]) => {
      console.log('👀 Watch:', { loaded, signedIn })

      if (loaded && signedIn) {
        console.log('🎉 Ready!')
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

    // ✅ Use cookie-based auth
    const data = await $fetch('/api/users/me', {
      method: 'PATCH',
      credentials: 'include',
      body: event.data,
    })

    profile.value = data
    editMode.value = false
    console.log('✅ Profile updated')
  } catch (error) {
    console.error('❌ Update error:', error)
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
  <section class="p-6 max-w-xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">My Profile</h1>
      <button
          v-if="!editMode && profile"
          @click="editMode = true"
          class="text-sm text-blue-600 hover:text-blue-800"
      >
        Edit
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !profile" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profile" class="space-y-6">
      <!-- Profile Header -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center gap-4">
          <img
              :src="profile.imageUrl"
              alt="Avatar"
              class="w-20 h-20 rounded-full object-cover"
          />
          <div class="flex-1">
            <h2 class="text-xl font-semibold">{{ fullName }}</h2>
            <p class="text-gray-600 dark:text-gray-400">{{ profile.email }}</p>
            <div class="flex items-center gap-2 mt-2">
              <span
                  class="inline-flex items-center gap-1.5 text-xs"
                  :class="profile.isOnline ? 'text-green-600' : 'text-gray-500'"
              >
                <span
                    class="w-2 h-2 rounded-full"
                    :class="profile.isOnline ? 'bg-green-600' : 'bg-gray-400'"
                />
                {{ profile.isOnline ? 'Online' : 'Offline' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Basic Information Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">Basic Information</h3>

        <!-- View Mode -->
        <div v-if="!editMode" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name
            </label>
            <p class="text-base">{{ profile.firstName || 'Not set' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name
            </label>
            <p class="text-base">{{ profile.lastName || 'Not set' }}</p>
          </div>
        </div>

        <!-- Edit Mode -->
        <form v-else @submit.prevent="onSubmit({ data: formState })" class="space-y-4">
          <div>
            <label
                for="firstName"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              First Name *
            </label>
            <input
                id="firstName"
                v-model="formState.firstName"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter your first name"
            />
          </div>

          <div>
            <label
                for="lastName"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Last Name *
            </label>
            <input
                id="lastName"
                v-model="formState.lastName"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter your last name"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <button
                type="submit"
                :disabled="loading"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
            <button
                type="button"
                @click="cancelEdit"
                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Account Settings Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">Account Settings</h3>

        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <p class="text-base">{{ profile.email }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <p class="text-base">{{ profile.username || 'Not set' }}</p>
          </div>

          <div class="border-t pt-4 mt-4">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              To update your email, username, password, or security settings, use Clerk's profile management.
            </p>
            <button
                @click="openClerkSettings"
                class="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Open Clerk Settings
            </button>
          </div>
        </div>
      </div>

      <!-- Account Info Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">Account Information</h3>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Account Created</span>
            <span class="font-medium">
              {{ new Date(profile.createdAt).toLocaleDateString() }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Last Seen</span>
            <span class="font-medium">
              {{ new Date(profile.lastSeenAt).toLocaleString() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pusher Events Card (Debug) -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">Real-time Events</h3>
        <ul v-if="contactStatusUpdates.length > 0" class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li v-for="update in contactStatusUpdates" :key="update.userId">
            👁️ {{ update.userId }} → {{ update.isOnline ? 'online' : 'offline' }}
          </li>
        </ul>
        <p v-else class="text-sm text-gray-500">No recent events</p>
      </div>
    </div>
  </section>

  <!-- Bottom Navigation -->
  <BottomMenu active="profile" />
</template>
