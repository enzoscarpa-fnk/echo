<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const conversationId = route.params.id as string

const { getConversation } = useConversations()
const { getMessages, sendMessage: sendMsg } = useMessages()
const { user } = useAuth()

const newMessage = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement>()

const {  conversation } = await useAsyncData(
    `conversation-${conversationId}`,
    () => getConversation(conversationId)
)

const {  messages, refresh: refreshMessages } = await useAsyncData(
    `messages-${conversationId}`,
    () => getMessages(conversationId)
)

const getConversationName = () => {
  if (conversation.value?.name) return conversation.value.name
  const otherParticipant = conversation.value?.participants?.find(
      (p: any) => p.userId !== user.value?.id
  )
  return otherParticipant?.user.username || 'Unknown'
}

const getConversationAvatar = () => {
  const otherParticipant = conversation.value?.participants?.find(
      (p: any) => p.userId !== user.value?.id
  )
  return otherParticipant?.user.imageUrl || null
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
    <!-- Header -->
    <div class="bg-white border-b px-4 py-3 flex items-center gap-3">
      <UButton
          icon="i-heroicons-arrow-left"
          variant="ghost"
          size="sm"
          @click="navigateTo('/dashboard')"
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
      <div class="space-y-4 max-w-md mx-auto">
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
  </div>
</template>