<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { getConversations, getConversation, createConversation } = useConversations()
const { user } = useAuth()
const { apiFetch } = useApi()

const { data: conversations } = await useAsyncData(
    'conversations',
    () => getConversations()
)

const onlineFriends = ref([
  { id: '1', username: 'John', imageUrl: null },
  { id: '2', username: 'Sarah', imageUrl: null },
  { id: '3', username: 'Mike', imageUrl: null },
])

// ✅ Group creation state
const isCreateGroupModalOpen = ref(false)
const groupName = ref('')
const selectedContacts = ref<any[]>([])
const availableContacts = ref<any[]>([])
const searchQuery = ref('')
const isLoadingContacts = ref(false)

// ✅ Load available contacts
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

// ✅ Filter contacts based on search + exclude already selected
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

// ✅ Add contact to selection
const addContact = (contact: any) => {
  selectedContacts.value.push(contact)
  searchQuery.value = ''
}

// ✅ Remove contact from selection
const removeContact = (contactId: string) => {
  selectedContacts.value = selectedContacts.value.filter((c) => c.id !== contactId)
}

// ✅ Create group conversation
const createGroup = async () => {
  console.log('🚀 Creating group...')

  if (!groupName.value.trim()) {
    console.error('❌ Group name is required')
    return
  }

  if (selectedContacts.value.length < 2) {
    console.error('❌ At least 2 contacts are required')
    return
  }

  try {
    console.log('📝 Calling createConversation with:', {
      name: groupName.value,
      participantIds: selectedContacts.value.map((c) => c.id),
      isGroup: true,
    })

    await createConversation({
      name: groupName.value,
      participantIds: selectedContacts.value.map((c) => c.id),
      isGroup: true,
    })

    console.log('✅ Conversation created successfully')

    // Reset form
    groupName.value = ''
    selectedContacts.value = []
    searchQuery.value = ''
    isCreateGroupModalOpen.value = false

    console.log('🔄 Refreshing conversations...')

    // Refresh conversations
    await refreshConversations()

    console.log('✅ Conversations refreshed')
  } catch (error) {
    console.error('❌ Failed to create group:', error)
  }
}

const refreshConversations = async () => {
  try {
    console.log('📥 Fetching conversations...')
    const data = await $fetch('/api/conversations')
    console.log('📊 Got conversations:', data)
    console.log('🔍 Conversations details:', data?.map((c: any) => ({
      id: c.id,
      name: c.name,
      isGroup: c.isGroup,
      participantCount: c.participants?.length,
    })))
    conversations.value = data || []
    console.log('✅ Updated conversations.value:', conversations.value)
  } catch (error) {
    console.error('❌ Failed to refresh conversations:', error)
  }
}

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

const openCreateGroup = async () => {
  await loadContacts()
  isCreateGroupModalOpen.value = true
}

const createNewConversation = () => {
  navigateTo('/search')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Header -->
    <div class="bg-white border-b px-6 py-4 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">echo</h1>
        <div class="flex gap-2">
          <!-- ✅ Bouton créer groupe -->
          <UButton
              icon="i-heroicons-users"
              size="sm"
              color="gray"
              variant="ghost"
              @click="openCreateGroup"
              title="Create group"
          />
          <!-- Bouton existant -->
          <UButton
              icon="i-heroicons-plus"
              size="sm"
              color="primary"
              @click="createNewConversation"
          />
        </div>
      </div>
    </div>

    <!-- Online Friends Section -->
    <div class="px-6 py-4 bg-white mb-2">
      <h2 class="text-sm font-semibold text-gray-600 mb-3">Online Now</h2>
      <div class="flex gap-4 overflow-x-auto pb-2">
        <div
            v-for="friend in onlineFriends"
            :key="friend.id"
            class="flex flex-col items-center gap-1 flex-shrink-0"
        >
          <div class="relative">
            <UAvatar
                :src="friend.imageUrl"
                :alt="friend.username"
                size="lg"
            />
            <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <span class="text-xs text-gray-600">{{ friend.username }}</span>
        </div>
      </div>
    </div>

    <!-- Conversations List -->
    <div class="px-6 py-4">
      <h2 class="text-sm font-semibold text-gray-600 mb-3">Messages</h2>
      <p class="text-xs text-gray-500 mb-2">
        user: {{ user ? 'loaded' : 'loading' }} | conversations: {{ conversations?.length ?? 0 }}
      </p>
      <div class="space-y-2">
        <NuxtLink
            v-for="conversation in conversations ?? []"
            :key="conversation.id"
            :to="`/chat/${conversation.id}`"
            class="block"
        >
          <UCard class="hover:shadow-md transition">
            <div class="flex items-center gap-3">
              <UAvatar
                  :src="getConversationAvatar(conversation)"
                  :alt="getConversationName(conversation)"
                  size="md"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="font-semibold text-sm truncate">
                    {{ getConversationName(conversation) }}
                  </h3>
                  <span class="text-xs text-gray-500">
                    {{ formatTime(conversation.updatedAt) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 truncate">
                  {{ conversation.lastMessage || 'No messages yet' }}
                </p>
              </div>
              <UBadge
                  v-if="conversation.unreadCount > 0"
                  color="primary"
                  variant="solid"
              >
                {{ conversation.unreadCount }}
              </UBadge>
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </div>

    <!-- Create Group Modal -->
    <div
        v-if="isCreateGroupModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click="isCreateGroupModalOpen = false"
    >
      <UCard
          class="w-96"
          @click.stop
          :ui="{ divide: 'divide-y divide-gray-100 dark:divide-gray-800' }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900">
              Create Group Chat
            </h3>
            <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="isCreateGroupModalOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Group Name Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <UInput
                v-model="groupName"
                placeholder="e.g., Project Team"
                autofocus
            />
          </div>

          <!-- Search Contacts -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Add Members
            </label>
            <UInput
                v-model="searchQuery"
                placeholder="Search contacts..."
                icon="i-heroicons-magnifying-glass"
            />

            <!-- Filtered Contacts Dropdown -->
            <div
                v-if="searchQuery && filteredContacts.length > 0"
                class="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              <button
                  v-for="contact in filteredContacts"
                  :key="contact.id"
                  class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 border-b last:border-b-0"
                  @click="addContact(contact)"
              >
                <UAvatar
                    :src="contact.imageUrl"
                    :alt="contact.firstName"
                    size="sm"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm">
                    {{ contact.firstName }} {{ contact.lastName }}
                  </p>
                  <p class="text-xs text-gray-500 truncate">{{ contact.email }}</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Selected Contacts -->
          <div v-if="selectedContacts.length > 0">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Members ({{ selectedContacts.length }})
            </label>
            <div class="space-y-2">
              <div
                  v-for="contact in selectedContacts"
                  :key="contact.id"
                  class="flex items-center justify-between bg-gray-100 p-2 rounded"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <UAvatar
                      :src="contact.imageUrl"
                      :alt="contact.firstName"
                      size="xs"
                  />
                  <span class="text-sm truncate">
                    {{ contact.firstName }} {{ contact.lastName }}
                  </span>
                </div>
                <UButton
                    icon="i-heroicons-x-mark"
                    color="gray"
                    variant="ghost"
                    size="2xs"
                    @click="removeContact(contact.id)"
                />
              </div>
            </div>
          </div>

          <!-- Info message -->
          <p class="text-xs text-gray-500">
            At least 2 members are required to create a group
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
                color="gray"
                variant="ghost"
                @click="isCreateGroupModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton
                @click="createGroup"
                :disabled="!groupName.trim() || selectedContacts.length < 2"
            >
              Create Group
            </UButton>
          </div>
        </template>
      </UCard>
    </div>

    <!-- Bottom Navigation -->
    <BottomMenu active="dashboard" />
  </div>
</template>
