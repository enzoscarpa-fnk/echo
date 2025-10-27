<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePusher } from '~/composables/usePusher'

definePageMeta({
  middleware: 'auth',
})

// ✅ Use useAuth with cookie-based auth
const { isLoaded, isSignedIn, userId } = useAuth()
const contacts = ref<any[]>([])
const loading = ref(false)
let pusherCleanup: (() => void) | null = null

// Fetch contacts from API
const fetchContacts = async () => {
  try {
    loading.value = true

    if (!isLoaded.value || !isSignedIn.value) {
      console.warn('⚠️ Not ready to fetch contacts')
      loading.value = false
      return
    }

    console.log('📡 Fetching contacts...')

    // ✅ Use cookie-based auth (same as profile.vue)
    const data = await $fetch('/api/users/contacts', {
      credentials: 'include',
    })

    contacts.value = data
    console.log('✅ Contacts loaded:', data.length)
  } catch (error) {
    console.error('❌ Error fetching contacts:', error)
  } finally {
    loading.value = false
  }
}

// Update contact online status from Pusher events
const updateContactStatus = (contactId: string, isOnline: boolean) => {
  const contact = contacts.value.find(c => c.id === contactId)
  if (contact) {
    contact.isOnline = isOnline
    contact.lastSeenAt = new Date().toISOString()
    console.log(`📡 ${contact.username || contact.email} is now ${isOnline ? 'online' : 'offline'}`)
  }
}

// Computed: Online contacts
const onlineContacts = computed(() =>
    contacts.value.filter(c => c.isOnline)
)

// Computed: Offline contacts
const offlineContacts = computed(() =>
    contacts.value.filter(c => !c.isOnline)
)

// Format last seen time
const formatLastSeen = (lastSeenAt: string) => {
  const date = new Date(lastSeenAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// Get display name
const getDisplayName = (contact: any) => {
  if (contact.firstName && contact.lastName) {
    return `${contact.firstName} ${contact.lastName}`
  }
  return contact.username || contact.email || 'Unknown'
}

// Navigate to chat with contact
const startChat = (contact: any) => {
  // TODO: Create or find conversation with this contact
  console.log('Starting chat with:', contact)
  navigateTo(`/chat/${contact.id}`)
}

// ✅ Watch for auth ready, then fetch contacts
watch(
    [() => isLoaded.value, () => isSignedIn.value],
    ([loaded, signedIn]) => {
      console.log('👀 Auth watch:', { loaded, signedIn })
      if (loaded && signedIn) {
        console.log('🎉 Auth ready, fetching contacts')
        fetchContacts()
      }
    },
    { immediate: true }
)

// ✅ Setup Pusher when userId is available
watch(
    () => userId.value,
    (newUserId) => {
      if (newUserId && contacts.value.length > 0) {
        console.log('Setting up Pusher for user:', newUserId)

        const { contactStatusUpdates, cleanup } = usePusher(newUserId, 'use-cookie')

        // Watch for Pusher events
        watch(
            contactStatusUpdates,
            (updates) => {
              if (updates.length > 0) {
                const lastUpdate = updates[updates.length - 1]
                updateContactStatus(lastUpdate.userId, lastUpdate.isOnline)
              }
            }
        )

        pusherCleanup = cleanup
      }
    },
    { once: true }
)

// ✅ Cleanup on unmount
onUnmounted(() => {
  console.log('Component unmounting, cleaning up Pusher')
  if (pusherCleanup) {
    pusherCleanup()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Header -->
    <div class="bg-white border-b px-6 py-4 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Contacts</h1>
        <button
            @click="fetchContacts"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            :disabled="loading"
            title="Refresh contacts"
        >
          <svg
              class="w-5 h-5"
              :class="{ 'animate-spin': loading }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && contacts.length === 0" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Contacts List -->
    <div v-else class="px-6 py-4 space-y-6">
      <!-- Online Contacts -->
      <div v-if="onlineContacts.length > 0">
        <h2 class="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-green-500"></span>
          Online ({{ onlineContacts.length }})
        </h2>
        <div class="space-y-2">
          <div
              v-for="contact in onlineContacts"
              :key="contact.id"
              @click="startChat(contact)"
              class="bg-white rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
          >
            <div class="flex items-center gap-4">
              <div class="relative">
                <img
                    :src="contact.imageUrl"
                    :alt="getDisplayName(contact)"
                    class="w-12 h-12 rounded-full object-cover"
                />
                <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 truncate">
                  {{ getDisplayName(contact) }}
                </h3>
                <p class="text-sm text-gray-500 truncate">
                  {{ contact.email }}
                </p>
              </div>
              <div class="text-xs text-green-600 font-medium uppercase">
                Online
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Offline Contacts -->
      <div v-if="offlineContacts.length > 0">
        <h2 class="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-gray-400"></span>
          Offline ({{ offlineContacts.length }})
        </h2>
        <div class="space-y-2">
          <div
              v-for="contact in offlineContacts"
              :key="contact.id"
              @click="startChat(contact)"
              class="bg-white rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
          >
            <div class="flex items-center gap-4">
              <div class="relative">
                <img
                    :src="contact.imageUrl"
                    :alt="getDisplayName(contact)"
                    class="w-12 h-12 rounded-full object-cover opacity-75"
                />
                <div class="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-700 truncate">
                  {{ getDisplayName(contact) }}
                </h3>
                <p class="text-sm text-gray-500 truncate">
                  {{ contact.email }}
                </p>
              </div>
              <div class="text-xs text-gray-500">
                {{ formatLastSeen(contact.lastSeenAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="contacts.length === 0 && !loading" class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p class="text-gray-500 font-medium">No contacts yet</p>
        <p class="text-sm text-gray-400 mt-1">Invite your friends to join!</p>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomMenu active="contacts" />
  </div>
</template>
