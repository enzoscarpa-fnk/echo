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
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Tabs -->
    <div class="flex border-b bg-white sticky top-0 z-10">
      <button
          :class="['flex-1 py-4 text-center font-medium transition', selectedTab === 'contacts' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500']"
          @click="selectedTab = 'contacts'"
      >Contacts</button>
      <button
          :class="['flex-1 py-4 text-center font-medium transition', selectedTab === 'requests' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500']"
          @click="selectedTab = 'requests'"
      >Requests</button>
    </div>

    <!-- Tab: Contacts -->
    <!-- Combobox -->
    <div class="mb-4 flex flex-col gap-2">
      <input
          v-model="searchQuery"
          type="text"
          class="rounded shadow-sm border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-neutral-800"
          placeholder="Search users by name, email, username..."
          @input="onSearchInput"
          @blur="showDropdown = false"
          @focus="showDropdown = !!searchDropdown.length"
      />
      <div
          v-if="searchDropdown.length > 0 && showDropdown"
          class="bg-white border shadow rounded w-full max-h-60 overflow-auto absolute z-50 mt-12"
      >
        <div
            v-for="user in searchDropdown"
            :key="user.id"
            class="flex items-center p-2 hover:bg-blue-50 cursor-pointer border-b last:border-0"
        >
          <img :src="user.imageUrl" class="w-8 h-8 rounded-full" />
          <div class="flex-1 ml-2 min-w-0">
            <div class="font-medium truncate">{{ getDisplayName(user) }}</div>
            <div class="text-xs text-gray-400 truncate">{{ user.email }}</div>
          </div>
          <button
              class="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs cursor-pointer"
              @mousedown.prevent="addUser(user)"
              :disabled="addUserLoading[user.id]"
          >
            {{ addUserLoading[user.id] ? 'Adding...' : 'Add' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="selectedTab === 'contacts'" class="px-6 py-4 space-y-6">
      <div v-if="loading && contacts.length === 0" class="text-center py-6">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-2"></div>
        Loading contacts...
      </div>
      <div v-else-if="contacts.length === 0" class="text-center text-gray-500 py-8">
        You have no contacts yet.
      </div>
      <div v-else class="divide-y">
        <div
            v-for="contact in contacts"
            :key="contact.id"
            class="flex items-center py-4 gap-4 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
            @click="startChat(contact)"
        >
          <img :src="contact.imageUrl" class="w-12 h-12 rounded-full object-cover" />
          <div class="flex-1 min-w-0">
            <div class="font-semibold">{{ getDisplayName(contact) }}</div>
            <div class="text-xs text-gray-500">last seen: {{ formatLastSeen(contact.lastSeenAt) }}</div>
          </div>
          <span class="px-2 py-1 rounded text-xs font-semibold"
                :class="contact.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
            {{ contact.isOnline ? 'Online' : 'Offline' }}
          </span>
        </div>

      </div>
    </div>

    <!-- Tab: Requests -->
    <div v-else class="px-6 py-4 space-y-10">
      <!-- Received requests -->
      <div>
        <div class="font-semibold text-gray-700 mb-2">Received requests</div>
        <div v-if="loadingRequestsReceived" class="py-4 text-center text-gray-400">Loading…</div>
        <div v-else-if="pendingRequestsReceived.length === 0" class="text-gray-400 text-sm">No incoming request</div>
        <div v-else class="space-y-2">
          <div v-for="req in pendingRequestsReceived" :key="req.contactId" class="flex items-center gap-5 py-2">
            <img :src="req.imageUrl" class="w-10 h-10 rounded-full" />
            <div class="flex-1 min-w-0">
              <div class="font-medium">{{ getDisplayName(req) }}</div>
              <div class="text-xs text-gray-500">Requested at {{ new Date(req.requestedAt).toLocaleString() }}</div>
            </div>
            <button
                class="bg-green-100 text-green-600 px-3 py-1 rounded text-xs mr-2"
                :disabled="requestActionLoading[req.contactId]"
                @click="handleAccept(req.contactId)">
              Accept
            </button>
            <button
                class="bg-red-100 text-red-600 px-2 py-1 rounded text-xs"
                :disabled="requestActionLoading[req.contactId]"
                @click="handleReject(req.contactId)">
              Reject
            </button>
          </div>
        </div>
      </div>
      <!-- Sent requests -->
      <div>
        <div class="font-semibold text-gray-700 mb-2">Sent requests</div>
        <div v-if="loadingRequestsSent" class="py-4 text-center text-gray-400">Loading…</div>
        <div v-else-if="pendingRequestsSent.length === 0" class="text-gray-400 text-sm">No sent request</div>
        <div v-else class="space-y-2">
          <div v-for="req in pendingRequestsSent" :key="req.contactId" class="flex items-center gap-5 py-2">
            <img :src="req.receiver?.imageUrl" class="w-10 h-10 rounded-full" />
            <div class="flex-1 min-w-0">
              <div class="font-medium">{{ getDisplayName(req.receiver || req) }}</div>
            </div>
            <button
                class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                :disabled="requestActionLoading[req.contactId]"
                @click="handleCancel(req.contactId)">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
    <BottomMenu active="contacts" />
  </div>
</template>
