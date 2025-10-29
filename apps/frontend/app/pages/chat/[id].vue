<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const conversationId = route.params.id as string

console.log('🔍 Loading conversation:', conversationId)

const { getConversation } = useConversations()
const { getMessages, sendMessage: sendMsg } = useMessages()
const { user } = useAuth()

const newMessage = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement>()

// ✅ Ajoute des logs
const {  conversation, error: conversationError } = await useAsyncData(
    `conversation-${conversationId}`,
    async () => {
      try {
        console.log('📡 Fetching conversation...')
        const data = await getConversation(conversationId)
        console.log('✅ Conversation loaded:', data)
        return data
      } catch (err) {
        console.error('❌ Error fetching conversation:', err)
        throw err
      }
    }
)

const {  messages, refresh: refreshMessages, error: messagesError } = await useAsyncData(
    `messages-${conversationId}`,
    async () => {
      try {
        console.log('📡 Fetching messages...')
        const data = await getMessages(conversationId)
        console.log('✅ Messages loaded:', data)
        return data
      } catch (err) {
        console.error('❌ Error fetching messages:', err)
        throw err
      }
    }
)

// Log errors
if (conversationError.value) {
  console.error('🔴 Conversation error:', conversationError.value)
}
if (messagesError.value) {
  console.error('🔴 Messages error:', messagesError.value)
}

// Log final state
console.log('🎯 Final state:')
console.log('  conversation:', conversation?.value)
console.log('  messages:', messages?.value)

const getConversationName = () => {
  if (!conversation.value) return 'Loading...'
  if (conversation.value?.name) return conversation.value.name
  const otherParticipant = conversation.value?.participants?.find(
      (p: any) => p.userId !== user.value?.id
  )
  return otherParticipant?.user?.username || 'Unknown'
}

const getConversationAvatar = () => {
  if (!conversation.value) return null
  const otherParticipant = conversation.value?.participants?.find(
      (p: any) => p.userId !== user.value?.id
  )
  return otherParticipant?.user?.imageUrl || null
}

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  loading.value = true
  try {
    await sendMsg({
      content: newMessage.value,
      conversationId,
    })

    newMessage.value = ''
    await refreshMessages()

    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  } catch (error) {
    console.error('Failed to send message:', error)
  } finally {
    loading.value = false
  }
}

// Auto-scroll on mount
onMounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
})
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- Loading state -->
    <div v-if="!conversation" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Chat interface (only when loaded) -->
    <template v-else>
      <!-- Header -->
      <div class="bg-white border-b px-4 py-3 flex items-center gap-3">
        <UButton
            icon="i-heroicons-arrow-left"
            variant="ghost"
            size="sm"
            @click="navigateTo('/contacts')"
        />
        <UAvatar
            :src="getConversationAvatar()"
            :alt="getConversationName()"
            size="sm"
        />
        <div class="flex-1 min-w-0">
          <h2 class="font-semibold text-sm truncate">
            {{ getConversationName() }}
          </h2>
          <p class="text-xs text-gray-500">Online</p>
        </div>
        <UButton
            icon="i-heroicons-ellipsis-vertical"
            variant="ghost"
            size="sm"
        />
      </div>

      <!-- Messages -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-4">
        <div v-if="!messages || messages.length === 0" class="text-center text-gray-500 py-12">
          No messages yet. Start the conversation!
        </div>

        <div v-else class="space-y-4 max-w-md mx-auto">
          <div
              v-for="message in messages"
              :key="message.id"
              :class="[
              'flex',
              message.senderId === user?.id ? 'justify-end' : 'justify-start'
            ]"
          >
            <div
                :class="[
                'max-w-[75%] rounded-2xl px-4 py-2',
                message.senderId === user?.id
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-900 rounded-bl-sm'
              ]"
            >
              <p class="text-sm break-words">{{ message.content }}</p>
              <p
                  :class="[
                  'text-xs mt-1',
                  message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                ]"
              >
                {{ formatTime(message.createdAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="bg-white border-t px-4 py-3">
        <form @submit.prevent="sendMessage" class="flex items-center gap-2">
          <UButton
              icon="i-heroicons-plus"
              variant="ghost"
              size="sm"
              color="gray"
          />
          <UInput
              v-model="newMessage"
              placeholder="Type a message..."
              class="flex-1"
              size="lg"
              :disabled="loading"
          />
          <UButton
              type="submit"
              icon="i-heroicons-paper-airplane"
              size="sm"
              :disabled="!newMessage.trim() || loading"
              :loading="loading"
          />
        </form>
      </div>
    </template>
  </div>
</template>
