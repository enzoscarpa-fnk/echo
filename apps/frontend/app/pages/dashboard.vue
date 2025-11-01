<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

// ============================================================================
// COMPOSABLES & API
// ============================================================================

const { getConversations, createConversation } = useConversations()
const { user } = useAuth()
const { apiFetch } = useApi()

// ============================================================================
// DATA - CONVERSATIONS
// ============================================================================

const { data: conversations } = await useAsyncData(
    'conversations',
    () => getConversations()
)

// ============================================================================
// DATA - MOCK ONLINE FRIENDS
// ============================================================================

const onlineFriends = ref([
  { id: '1', username: 'John', imageUrl: null },
  { id: '2', username: 'Sarah', imageUrl: null },
  { id: '3', username: 'Mike', imageUrl: null },
])

// ============================================================================
// REACTIVE STATE - GROUP CREATION MODAL
// ============================================================================

const isCreateGroupModalOpen = ref(false)
const groupName = ref('')
const selectedContacts = ref<any[]>([])
const availableContacts = ref<any[]>([])
const searchQuery = ref('')
const isLoadingContacts = ref(false)

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================

const filteredContacts = computed(() => {
  if (!searchQuery.value.trim()) return availableContacts.value

  const query = searchQuery.value.toLowerCase()
  return availableContacts.value.filter(
      (contact) =>
          !selectedContacts.value.find((c) => c.id === contact.id) &&
          ((contact.firstName || '').toLowerCase().includes(query) ||
              (contact.lastName || '').toLowerCase().includes(query) ||
              (contact.email || '').toLowerCase().includes(query) ||
              (contact.username || '').toLowerCase().includes(query))
  )
})

// ============================================================================
// GROUP CREATION - CONTACT MANAGEMENT
// ============================================================================

const addContact = (contact: any) => {
  selectedContacts.value.push(contact)
  searchQuery.value = ''
}

const removeContact = (contactId: string) => {
  selectedContacts.value = selectedContacts.value.filter((c) => c.id !== contactId)
}

// ============================================================================
// GROUP CREATION - LOAD & CREATE
// ============================================================================

const loadContacts = async () => {
  try {
    isLoadingContacts.value = true
    const data = await $fetch('/api/users/contacts')
    availableContacts.value = data || []
  } catch (error) {
    console.error('Failed to load contacts:', error)
  } finally {
    isLoadingContacts.value = false
  }
}

const createGroup = async () => {
  if (!groupName.value.trim()) {
    console.error('Group name is required')
    return
  }

  if (selectedContacts.value.length < 2) {
    console.error('At least 2 contacts are required')
    return
  }

  try {
    await createConversation({
      name: groupName.value,
      participantIds: selectedContacts.value.map((c) => c.id),
      isGroup: true,
    })

    // Reset form
    groupName.value = ''
    selectedContacts.value = []
    searchQuery.value = ''
    isCreateGroupModalOpen.value = false

    // Refresh conversations
    await refreshConversations()
  } catch (error) {
    console.error('Failed to create group:', error)
  }
}

const refreshConversations = async () => {
  try {
    const data = await $fetch('/api/conversations')
    conversations.value = data || []
  } catch (error) {
    console.error('Failed to refresh conversations:', error)
  }
}

// ============================================================================
// MODAL HANDLERS
// ============================================================================

const openCreateGroup = async () => {
  await loadContacts()
  isCreateGroupModalOpen.value = true
}

const createNewConversation = () => {
  navigateTo('/search')
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

const getConversationName = (conversation: any) => {
  if (conversation.name) return conversation.name
  if (!conversation.participants?.length) return 'Unnamed'

  const currentUserId = user?.id
  if (!currentUserId) return 'Unnamed'

  const otherParticipants = conversation.participants.filter(
      (p: any) => p.userId !== currentUserId
  )
  return otherParticipants?.map((p: any) => p.user?.username).join(', ') || 'Unnamed'
}

const getConversationAvatar = (conversation: any) => {
  if (!conversation.participants?.length) return null

  const currentUserId = user?.id
  if (!currentUserId) return null

  const otherParticipant = conversation.participants.find(
      (p: any) => p.userId !== currentUserId
  )
  return otherParticipant?.user?.imageUrl || null
}

const formatTime = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 pb-24">
    <!-- Header -->
    <div class="bg-slate-950/50 backdrop-blur border-b border-slate-800/30 px-6 py-4 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">Chats</h1>
        <!-- ✅ Bouton groupe, plus grand -->
        <UButton
            icon="i-heroicons-users"
            size="lg"
            color="slate"
            variant="soft"
            @click="openCreateGroup"
            title="Create group"
        />
      </div>
    </div>

    <!-- Online Friends Section -->
    <div class="px-6 py-6">
      <h2 class="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Online Now</h2>
      <div class="flex gap-4 overflow-x-auto pb-2">
        <div
            v-for="friend in onlineFriends"
            :key="friend.id"
            class="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer"
        >
          <div class="relative">
            <UAvatar
                :src="friend.imageUrl"
                :alt="friend.username"
                size="lg"
                class="ring-2 ring-slate-700/50 group-hover:ring-slate-600 transition-all"
            />
            <div class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 shadow-lg" />
          </div>
          <span class="text-xs text-slate-400 group-hover:text-slate-300 transition">{{ friend.username }}</span>
        </div>
      </div>
    </div>

    <!-- Conversations List -->
    <div class="px-6 py-4">
      <h2 class="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Conversations</h2>
      <div class="space-y-2">
        <NuxtLink
            v-for="conversation in conversations ?? []"
            :key="conversation.id"
            :to="`/chat/${conversation.id}`"
            class="block group"
        >
          <div class="bg-slate-800/20 hover:bg-slate-800/40 border border-slate-700/20 hover:border-slate-600/40 rounded-3xl px-4 py-3 transition-all duration-200">
            <div class="flex items-center gap-3">
              <UAvatar
                  :src="getConversationAvatar(conversation)"
                  :alt="getConversationName(conversation)"
                  size="md"
                  class="ring-1 ring-slate-700/50"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="font-semibold text-sm text-white truncate group-hover:text-slate-100 transition">
                    {{ getConversationName(conversation) }}
                  </h3>
                  <span class="text-xs text-slate-500 group-hover:text-slate-400 transition">
                    {{ formatTime(conversation.updatedAt) }}
                  </span>
                </div>
                <p class="text-sm text-slate-400 truncate">
                  {{ conversation.lastMessage || 'No messages yet' }}
                </p>
              </div>
              <div v-if="conversation.unreadCount > 0" class="ml-auto">
                <div class="bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {{ conversation.unreadCount }}
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Create Group Modal -->
    <div
        v-if="isCreateGroupModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        @click="isCreateGroupModalOpen = false"
    >
      <div
          class="w-96 bg-slate-900 border border-slate-800/50 rounded-xl shadow-2xl"
          @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800/30">
          <h3 class="text-base font-semibold text-white">Create Group Chat</h3>
          <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isCreateGroupModalOpen = false"
          />
        </div>

        <!-- Content -->
        <div class="px-6 py-4 space-y-4">
          <!-- Group Name Input -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Group Name</label>
            <input
                v-model="groupName"
                placeholder="e.g., Project Team"
                autofocus
                class="w-full bg-slate-800/30 border border-slate-700/50 text-white placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/50 transition"
            />
          </div>

          <!-- Search Contacts -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Add Members</label>
            <input
                v-model="searchQuery"
                placeholder="Search contacts..."
                class="w-full bg-slate-800/30 border border-slate-700/50 text-white placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/50 transition"
            />

            <!-- Filtered Contacts Dropdown -->
            <div
                v-if="searchQuery && filteredContacts.length > 0"
                class="mt-3 bg-slate-800/60 border border-slate-700/50 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              <button
                  v-for="contact in filteredContacts"
                  :key="contact.id"
                  class="w-full px-4 py-3 text-left hover:bg-slate-700/30 flex items-center gap-3 border-b border-slate-700/30 last:border-b-0 transition"
                  @click="addContact(contact)"
              >
                <UAvatar
                    :src="contact.imageUrl"
                    :alt="contact.firstName"
                    size="sm"
                    class="ring-1 ring-slate-700/50"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm text-white">
                    {{ contact.firstName }} {{ contact.lastName }}
                  </p>
                  <p class="text-xs text-slate-400 truncate">{{ contact.email }}</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Selected Contacts -->
          <div v-if="selectedContacts.length > 0">
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Members ({{ selectedContacts.length }})
            </label>
            <div class="space-y-2">
              <div
                  v-for="contact in selectedContacts"
                  :key="contact.id"
                  class="flex items-center justify-between bg-slate-800/30 border border-slate-700/50 p-2 rounded-lg"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <UAvatar
                      :src="contact.imageUrl"
                      :alt="contact.firstName"
                      size="xs"
                      class="ring-1 ring-slate-700/50"
                  />
                  <span class="text-sm text-white truncate">
                    {{ contact.firstName }} {{ contact.lastName }}
                  </span>
                </div>
                <button
                    class="text-slate-400 hover:text-red-400 transition"
                    @click="removeContact(contact.id)"
                >
                  <i class="i-heroicons-x-mark w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Info message -->
          <p class="text-xs text-slate-500 py-2">
            At least 2 members are required to create a group
          </p>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-6 py-4 border-t border-slate-800/30">
          <UButton
              color="gray"
              variant="ghost"
              @click="isCreateGroupModalOpen = false"
          >
            Cancel
          </UButton>
          <UButton
              color="slate"
              @click="createGroup"
              :disabled="!groupName.trim() || selectedContacts.length < 2"
          >
            Create Group
          </UButton>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation - ✅ FLOATING -->
    <BottomMenu active="dashboard" />
  </div>
</template>
