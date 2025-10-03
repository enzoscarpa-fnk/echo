<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { getConversations } = useConversations()
const { user } = useAuth()

const {  conversations } = await useAsyncData(
    'conversations',
    () => getConversations()
)

// Mock online friends - À remplacer par une vraie API
const onlineFriends = ref([
  { id: '1', username: 'John', imageUrl: null },
  { id: '2', username: 'Sarah', imageUrl: null },
  { id: '3', username: 'Mike', imageUrl: null },
])

const getConversationName = (conversation: any) => {
  if (conversation.name) return conversation.name
  // Si pas de nom, utiliser les noms des participants
  const otherParticipants = conversation.participants?.filter(
      (p: any) => p.userId !== user.value?.id
  )
  return otherParticipants?.map((p: any) => p.user.username).join(', ') || 'Unnamed'
}

const getConversationAvatar = (conversation: any) => {
  const otherParticipant = conversation.participants?.find(
      (p: any) => p.userId !== user.value?.id
  )
  return otherParticipant?.user.imageUrl || null
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
      <div class="space-y-2">
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

    <!-- Bottom Navigation -->
    <BottomMenu active="dashboard" />
  </div>
</template>