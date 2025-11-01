<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { usePusher } from '~/composables/usePusher'

definePageMeta({ middleware: 'auth' })
const { isLoaded, isSignedIn, userId } = useAuth()

const selectedTab = ref('contacts')
const contacts = ref([])
const loading = ref(false)
let pusherCleanup: (() => void) | null = null
const pendingRequestsReceived = ref([])
const loadingRequestsReceived = ref(false)
const pendingRequestsSent = ref([])
const loadingRequestsSent = ref(false)
const requestActionLoading = ref({}) // {id: true/false}
const searchQuery = ref('')
const showDropdown = ref(false)
const searchDropdown = ref([])
const searchLoading = ref(false)
const addUserLoading = ref({})

// Timer input management (anti-flood)
let searchTimeout = null
const onSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (searchQuery.value.length < 2) {
    searchDropdown.value = []
    showDropdown.value = false
    return
  }
  searchLoading.value = true
  searchTimeout = setTimeout(() => searchUsers(), 350)
}

const searchUsers = async () => {
  try {
    const data = await $fetch(`/api/users/search?query=${encodeURIComponent(searchQuery.value)}`, {
      credentials: 'include'
    })
    // On exclude ceux déjà dans contacts :
    searchDropdown.value = data.filter(
        user =>
            !contacts.value.some(c => c.id === user.id)
            && user.id !== userId.value
    )
    showDropdown.value = true
  } catch {
    searchDropdown.value = []
  }
  searchLoading.value = false
}

const addUser = async (user) => {
  addUserLoading.value[user.id] = true
  try {
    await $fetch(`/api/contacts/request/${user.id}`, { method: 'POST', credentials: 'include' })
    // Refresh demandes envoyées, dropdown, etc.
    await fetchRequestsSent()
    searchDropdown.value = searchDropdown.value.filter(u => u.id !== user.id)
  } finally {
    addUserLoading.value[user.id] = false
  }
}

// Fetch contacts (ACCEPTED)
const fetchContacts = async () => {
  loading.value = true
  try {
    contacts.value = await $fetch('/api/contacts', { credentials: 'include' })
  } catch (e) {
    contacts.value = []
  }
  loading.value = false
}
const fetchRequestsReceived = async () => {
  loadingRequestsReceived.value = true
  try {
    pendingRequestsReceived.value = await $fetch('/api/contacts/pending', { credentials: 'include' })
  } catch (e) {
    pendingRequestsReceived.value = []
  }
  loadingRequestsReceived.value = false
}
const fetchRequestsSent = async () => {
  loadingRequestsSent.value = true
  try {
    pendingRequestsSent.value = await $fetch('/api/contacts/sent', { credentials: 'include' })
  } catch (e) {
    pendingRequestsSent.value = []
  }
  loadingRequestsSent.value = false
}

const getDisplayName = (user) => user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.username || user.email || 'Unknown'
const formatLastSeen = (lastSeenAt) => {
  const date = new Date(lastSeenAt)
  const now = new Date()
  const diff = Math.floor((now - date) / 60000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`
  return `${Math.floor(diff/1440)}d ago`
}

// Real-time
const updateContactStatus = (contactId, isOnline) => {
  const contact = contacts.value.find(c => c.id === contactId)
  if (contact) {
    contact.isOnline = isOnline
    contact.lastSeenAt = new Date().toISOString()
  }
}
watch(
    [() => isLoaded.value, () => isSignedIn.value],
    ([loaded, signedIn]) => {
      if (loaded && signedIn) {
        fetchContacts()
        fetchRequestsReceived()
        fetchRequestsSent()
      }
    },
    { immediate: true }
)
watch(
    () => userId.value,
    (newUserId) => {
      if (newUserId && contacts.value.length > 0) {
        const { contactStatusUpdates, cleanup } = usePusher(newUserId, 'use-cookie')
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
onUnmounted(() => {
  if (pusherCleanup) pusherCleanup()
})

const startChat = async (contact) => {
  try {
    // Find or create conversation
    const conversation = await $fetch(`/api/conversations/find-or-create/${contact.id}`, {
      method: 'POST',
      credentials: 'include',
    })

    // Navigate to conversation
    navigateTo(`/chat/${conversation.id}`)
  } catch (error) {
    console.error('Error creating conversation:', error)
  }
}

// ---- ACTIONS ----
const handleAccept = async (contactId) => {
  requestActionLoading.value[contactId] = true
  try {
    await $fetch(`/api/contacts/accept/${contactId}`, { method: 'POST', credentials: 'include' })
    // Après action : refresh contacts et demandes reçues
    await fetchContacts()
    await fetchRequestsReceived()
  } catch {}
  requestActionLoading.value[contactId] = false
}
const handleReject = async (contactId) => {
  requestActionLoading.value[contactId] = true
  try {
    await $fetch(`/api/contacts/${contactId}`, { method: 'DELETE', credentials: 'include' })
    await fetchRequestsReceived()
    await fetchRequestsSent()
  } catch {}
  requestActionLoading.value[contactId] = false
}
const handleCancel = async (contactId) => {
  requestActionLoading.value[contactId] = true
  try {
    await $fetch(`/api/contacts/${contactId}`, { method: 'DELETE', credentials: 'include' })
    await fetchRequestsSent()
  } catch {}
  requestActionLoading.value[contactId] = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 pb-24">
    <!-- Header with Title -->
    <div class="bg-slate-950/50 backdrop-blur border-b border-slate-800/30 px-6 py-4 sticky top-0 z-10">
      <h1 class="text-2xl font-bold text-white">Contacts</h1>
    </div>

    <!-- Floating Tab Switch -->
    <div class="px-6 py-4">
      <div class="bg-slate-800/40 backdrop-blur-xl border border-slate-700/30 rounded-2xl px-1 py-1 inline-flex gap-1 w-fit mx-auto">
        <button
            :class="[
              'flex-1 px-4 py-1.5 rounded-xl text-xs font-medium transition-all',
              selectedTab === 'contacts'
                ? 'bg-slate-700/40 text-purple-300'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/20'
            ]"
            @click="selectedTab = 'contacts'"
        >
          Contacts
        </button>
        <button
            :class="[
              'flex-1 px-4 py-1.5 rounded-xl text-xs font-medium transition-all',
              selectedTab === 'requests'
                ? 'bg-slate-700/40 text-purple-300'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/20'
            ]"
            @click="selectedTab = 'requests'"
        >
          Requests
        </button>
      </div>
    </div>

    <!-- Search Input -->
    <div class="px-6 pb-4 relative">
      <input
          v-model="searchQuery"
          type="text"
          class="w-full bg-slate-800/30 border border-slate-700/50 text-white placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/50 transition"
          placeholder="Search users by name, email, username..."
          @input="onSearchInput"
          @blur="showDropdown = false"
          @focus="showDropdown = !!searchDropdown.length"
      />

      <!-- Search Dropdown -->
      <div
          v-if="searchDropdown.length > 0 && showDropdown"
          class="absolute top-full left-6 right-6 mt-2 bg-slate-800/90 border border-slate-700/50 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50"
      >
        <button
            v-for="user in searchDropdown"
            :key="user.id"
            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30 border-b border-slate-700/30 last:border-b-0 transition text-left"
            @mousedown.prevent="addUser(user)"
        >
          <img :src="user.imageUrl" class="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700/50" />
          <div class="flex-1 min-w-0">
            <div class="font-medium text-white truncate">{{ getDisplayName(user) }}</div>
            <div class="text-xs text-slate-400 truncate">{{ user.email }}</div>
          </div>
          <button
              class="px-3 py-1 bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 rounded text-xs font-medium whitespace-nowrap transition"
              :disabled="addUserLoading[user.id]"
          >
            {{ addUserLoading[user.id] ? 'Adding...' : 'Add' }}
          </button>
        </button>
      </div>
    </div>

    <!-- Tab: Contacts -->
    <div v-if="selectedTab === 'contacts'" class="px-6 py-4">
      <div v-if="loading && contacts.length === 0" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>

      <div v-else-if="contacts.length === 0" class="text-center text-slate-400 py-12">
        You have no contacts yet.
      </div>

      <div v-else class="space-y-2">
        <button
            v-for="contact in contacts"
            :key="contact.id"
            class="w-full bg-slate-800/20 hover:bg-slate-800/40 border border-slate-700/20 hover:border-slate-600/40 rounded-3xl px-4 py-3 transition-all duration-200 text-left"
            @click="startChat(contact)"
        >
          <div class="flex items-center gap-3">
            <img :src="contact.imageUrl" class="w-12 h-12 rounded-full object-cover ring-1 ring-slate-700/50" />
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-white">{{ getDisplayName(contact) }}</div>
              <div class="text-xs text-slate-500">last seen: {{ formatLastSeen(contact.lastSeenAt) }}</div>
            </div>
            <span
                :class="[
                  'px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
                  contact.isOnline
                    ? 'bg-emerald-400/20 text-emerald-300'
                    : 'bg-slate-700/30 text-slate-400'
                ]"
            >
              {{ contact.isOnline ? 'Online' : 'Offline' }}
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Tab: Requests -->
    <div v-else class="px-6 py-4 space-y-8">
      <!-- Received Requests -->
      <div>
        <h3 class="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Received Requests</h3>

        <div v-if="loadingRequestsReceived" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        </div>

        <div v-else-if="pendingRequestsReceived.length === 0" class="text-slate-400 text-sm">
          No incoming requests
        </div>

        <div v-else class="space-y-2">
          <div
              v-for="req in pendingRequestsReceived"
              :key="req.contactId"
              class="bg-slate-800/20 border border-slate-700/20 rounded-3xl px-4 py-3 flex items-center gap-3"
          >
            <img :src="req.imageUrl" class="w-10 h-10 rounded-full object-cover ring-1 ring-slate-700/50" />
            <div class="flex-1 min-w-0">
              <div class="font-medium text-white">{{ getDisplayName(req) }}</div>
              <div class="text-xs text-slate-500">{{ new Date(req.requestedAt).toLocaleString() }}</div>
            </div>
            <div class="flex gap-2">
              <button
                  class="px-3 py-1 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 rounded-lg text-xs font-medium transition"
                  :disabled="requestActionLoading[req.contactId]"
                  @click="handleAccept(req.contactId)"
              >
                {{ requestActionLoading[req.contactId] ? '...' : 'Accept' }}
              </button>
              <button
                  class="px-3 py-1 bg-red-600/20 text-red-300 hover:bg-red-600/40 rounded-lg text-xs font-medium transition"
                  :disabled="requestActionLoading[req.contactId]"
                  @click="handleReject(req.contactId)"
              >
                {{ requestActionLoading[req.contactId] ? '...' : 'Reject' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sent Requests -->
      <div>
        <h3 class="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Sent Requests</h3>

        <div v-if="loadingRequestsSent" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        </div>

        <div v-else-if="pendingRequestsSent.length === 0" class="text-slate-400 text-sm">
          No sent requests
        </div>

        <div v-else class="space-y-2">
          <div
              v-for="req in pendingRequestsSent"
              :key="req.contactId"
              class="bg-slate-800/20 border border-slate-700/20 rounded-3xl px-4 py-3 flex items-center gap-3"
          >
            <img :src="req.receiver?.imageUrl" class="w-10 h-10 rounded-full object-cover ring-1 ring-slate-700/50" />
            <div class="flex-1 min-w-0">
              <div class="font-medium text-white">{{ getDisplayName(req.receiver || req) }}</div>
            </div>
            <button
                class="px-3 py-1 bg-slate-800/50 hover:bg-slate-800/70 text-slate-300 rounded-lg text-xs font-medium transition"
                :disabled="requestActionLoading[req.contactId]"
                @click="handleCancel(req.contactId)"
            >
              {{ requestActionLoading[req.contactId] ? '...' : 'Cancel' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomMenu active="contacts" />
  </div>
</template>
