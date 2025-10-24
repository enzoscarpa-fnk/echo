<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})


const { getConversations, createConversation } = useConversations()
const { getUsers } = useUsers()
const { user } = useAuth()
const router = useRouter()
const toast = useToast()

// Load conversations and users
const {  conversations, refresh: refreshConversations } = await useAsyncData(
    'conversations',
    () => getConversations()
)

const {  availableUsers, pending: loadingUsers } = await useAsyncData(
    'availableUsers',
    () => getUsers()
)

// Handle click on user to create conversation
const handleUserClick = async (selectedUser: any) => {
  try {
    // Show loading toast
    toast.add({
      title: 'Creating conversation...',
      icon: 'i-heroicons-chat-bubble-left-right',
      timeout: 2000,
    })

    // Create or get existing conversation
    const conversation = await createConversation(selectedUser.id)

    // Refresh conversations list
    await refreshConversations()

    // Navigate to the conversation
    await router.push(`/chat/${conversation.id}`)
  } catch (error: any) {
    console.error('Error creating conversation:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to create conversation',
      color: 'red',
      timeout: 3000,
    })
  }
}

const getConversationName = (conversation: any) => {
  if (conversation.name) return conversation.name
  // If no name, use participant names
  const otherParticipants = conversation.participants?.filter(
      (p: any) => p.userId !== user.value?.id
  )
  return otherParticipants?.map((p: any) => p.user.username || p.user.firstName || p.user.email).join(', ') || 'Unnamed'
}

const getConversationAvatar = (conversation: any) => {
  const otherParticipant = conversation.participants?.find(
      (p: any) => p.userId !== user.value?.id
  )
  return otherParticipant?.user.imageUrl || null
}

const getLastMessage = (conversation: any) => {
  if (conversation.messages && conversation.messages.length > 0) {
    const lastMsg = conversation.messages[0]
    return lastMsg.content
  }
  return 'No messages yet'
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
        <UButton
            icon="i-heroicons-plus"
            size="sm"
            color="primary"
            @click="createNewConversation"
        />
      </div>
    </div>

    <!-- Available Users Section -->
    <div class="px-6 py-4 bg-white mb-2">
      <h2 class="text-sm font-semibold text-gray-600 mb-3">Start a Conversation</h2>

      <!-- Loading State -->
      <div v-if="loadingUsers" class="flex justify-center py-4">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-gray-400" />
      </div>

      <!-- Users List -->
      <div v-else-if="availableUsers && availableUsers.length > 0" class="flex gap-4 overflow-x-auto pb-2">
        <div
            v-for="availableUser in availableUsers"
            :key="availableUser.id"
            class="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer hover:opacity-80 transition"
            @click="handleUserClick(availableUser)"
        >
          <div class="relative">
            <UAvatar
                :src="availableUser.imageUrl"
                :alt="availableUser.username || availableUser.email"
                size="lg"
            />
            <!-- Green dot for visual consistency (you can add real online status later) -->
            <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <span class="text-xs text-gray-600 text-center max-w-[60px] truncate">
            {{ availableUser.username || availableUser.firstName || availableUser.email.split('@')[0] }}
          </span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-4 text-gray-500 text-sm">
        No users available. Create more accounts to start chatting!
      </div>
    </div>

    <!-- Conversations List -->
    <div class="px-6 py-4">
      <h2 class="text-sm font-semibold text-gray-600 mb-3">Messages</h2>

      <!-- Empty State -->
      <div v-if="!conversations || conversations.length === 0" class="text-center py-8">
        <UIcon name="i-heroicons-chat-bubble-left-right" class="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p class="text-gray-500 text-sm mb-4">No conversations yet</p>
        <p class="text-gray-400 text-xs">Click on a user above to start chatting</p>
      </div>

      <!-- Conversations -->
      <div v-else class="space-y-2">
        <NuxtLink
            v-for="conversation in conversations"
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
                  {{ getLastMessage(conversation) }}
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

    <!-- Bottom Navigation -->
    <BottomMenu active="dashboard" />
  </div>
</template>
