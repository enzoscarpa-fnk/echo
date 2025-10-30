<script setup lang="ts">
import Pusher from 'pusher-js'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const conversationId = route.params.id as string

const { getConversation } = useConversations()
const { getMessages, sendMessage: sendMsg } = useMessages()
const { apiFetch } = useApi()

const newMessage = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement>()

const { data: currentUser } = await useAsyncData(
    'current-user',
    () => apiFetch('/users/me')
)

const userId = computed(() => currentUser.value?.id)

// Load conversation
const { data: conversation } = await useAsyncData(
    `conversation-${conversationId}`,
    () => getConversation(conversationId)
)

// Load messages
const { data: messages, refresh: refreshMessages } = await useAsyncData(
    `messages-${conversationId}`,
    () => getMessages(conversationId)
)

// Check if messages are more than 2 hours apart
const hasLongTimeDifference = (index: number) => {
  if (index === 0) return false
  const current = new Date(messages.value?.[index]?.createdAt)
  const previous = new Date(messages.value?.[index - 1]?.createdAt)
  const diffInHours = Math.abs(current.getTime() - previous.getTime()) / (1000 * 60 * 60)
  return diffInHours > 2
}

// Check if the expeditor is the same as the previous message's (time constraint)
const isSameSenderAsPrevious = (index: number) => {
  if (index === 0) return false
  if (hasLongTimeDifference(index)) return false
  return messages.value?.[index - 1]?.senderId === messages.value?.[index]?.senderId
}

// Check if the expeditor is the same as the following message's
const isSameSenderAsNext = (index: number) => {
  if (!messages.value || index === messages.value.length - 1) return false
  const current = new Date(messages.value[index].createdAt)
  const next = new Date(messages.value[index + 1].createdAt)
  const diffInHours = Math.abs(next.getTime() - current.getTime()) / (1000 * 60 * 60)
  if (diffInHours > 2) return false
  return messages.value[index].senderId === messages.value[index + 1]?.senderId
}

// Check if date is different from today
const shouldShowDateSeparator = (index: number) => {
  if (index === 0) return true
  const current = new Date(messages.value?.[index]?.createdAt)
  const previous = new Date(messages.value?.[index - 1]?.createdAt)
  return current.toDateString() !== previous.toDateString()
}

// Separator's date format
const formatDateSeparator = (date: string) => {
  const messageDate = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (messageDate.toDateString() === today.toDateString()) {
    return "Aujourd'hui"
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Hier'
  } else {
    return messageDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

// Set message's position in a group of messages
const getMessagePosition = (index: number) => {
  const samePrev = isSameSenderAsPrevious(index)
  const sameNext = isSameSenderAsNext(index)

  if (!samePrev && !sameNext) return 'single'
  if (!samePrev && sameNext) return 'first'
  if (samePrev && sameNext) return 'middle'
  if (samePrev && !sameNext) return 'last'
  return 'single'
}

// Border radius classes from position
const getBorderRadiusClass = (index: number, isOwn: boolean) => {
  const position = getMessagePosition(index)

  if (isOwn) {
    // Messages sent (right, blue)
    switch (position) {
      case 'single': return 'rounded-2xl rounded-br-md'
      case 'first': return 'rounded-2xl rounded-br-md'
      case 'middle': return 'rounded-l-2xl rounded-r-md'
      case 'last': return 'rounded-l-2xl rounded-r-md'
    }
  } else {
    // Messages received (left, gray)
    switch (position) {
      case 'single': return 'rounded-2xl rounded-bl-md'
      case 'first': return 'rounded-2xl rounded-bl-md'
      case 'middle': return 'rounded-r-2xl rounded-l-md'
      case 'last': return 'rounded-r-2xl rounded-l-md'
    }
  }
}

// Space between messages
const getMessageSpacing = (index: number) => {
  return isSameSenderAsPrevious(index) ? 'mt-1' : 'mt-4'
}

// Listen to Pusher for new messages
onMounted(() => {
  const config = useRuntimeConfig()
  const pusher = new Pusher(config.public.pusherKey, {
    cluster: config.public.pusherCluster || 'eu',
  })

  const channel = pusher.subscribe(`conversation-${conversationId}`)

  channel.bind('new-message', (message: any) => {
    if (messages.value && !messages.value.find((m: any) => m.id === message.id)) {
      messages.value = [...messages.value, message]

      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    }
  })

  // Cleanup
  onUnmounted(() => {
    try {
      // Unbind all events from channel
      channel.unbind_all()
      // Unsubscribe from channel
      channel.unsubscribe()
    }

    catch (error) {
    }
  })

  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})

const getConversationName = () => {
  if (!conversation.value) return 'Loading...'
  if (!userId.value) return 'Loading...'

  if (conversation.value?.name) return conversation.value.name
  const otherParticipant = conversation.value?.participants?.find(
      (p: any) => p.userId !== userId.value
  )
  return otherParticipant?.user?.username || otherParticipant?.user?.firstName || 'Unknown'
}

const getConversationAvatar = () => {
  if (!conversation.value || !userId.value) return null

  const otherParticipant = conversation.value?.participants?.find(
      (p: any) => p.userId !== userId.value
  )
  return otherParticipant?.user?.imageUrl || null
}

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('fr-FR', {
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
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <div v-if="!conversation" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

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

        <div v-else class="max-w-4xl mx-auto">
          <template v-for="(message, index) in messages" :key="message.id">
            <div
                v-if="shouldShowDateSeparator(index)"
                class="flex justify-center my-6"
            >
              <div class="bg-gray-300 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                {{ formatDateSeparator(message.createdAt) }}
              </div>
            </div>

            <!-- Message -->
            <div :class="getMessageSpacing(index)">
              <div
                  :class="[
                    'flex',
                    message.senderId === userId ? 'justify-end' : 'justify-start'
                  ]"
              >
                <!-- Avatar (only for messages received) -->
                <div
                    v-if="message.senderId !== userId"
                    class="w-8 flex items-end mr-2"
                >
                  <UAvatar
                      v-if="!isSameSenderAsNext(index)"
                      :src="message.sender?.imageUrl"
                      :alt="message.sender?.username"
                      size="xs"
                  />
                </div>

                <!-- Message content -->
                <div
                    class="flex flex-col max-w-[75%]"
                    :class="message.senderId === userId ? 'items-end' : 'items-start'"
                >
                  <!-- Sender name (only on top of the first of a group of message) -->
                  <p
                      v-if="message.senderId !== userId && !isSameSenderAsPrevious(index)"
                      class="text-xs font-semibold text-gray-700 mb-1 px-2"
                  >
                    {{ message.sender?.username || message.sender?.firstName }}
                  </p>

                  <!-- Message bubble -->
                  <div
                      :class="[
                        'px-4 py-2 shadow-sm',
                        getBorderRadiusClass(index, message.senderId === userId),
                        message.senderId === userId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      ]"
                  >
                    <p class="text-sm whitespace-pre-wrap break-words">{{ message.content }}</p>
                  </div>

                  <!-- Timestamp (only under the last of a group of message) -->
                  <p
                      v-if="!isSameSenderAsNext(index)"
                      class="text-xs text-gray-500 mt-1 px-2"
                  >
                    {{ formatTime(message.createdAt) }}
                  </p>
                </div>
              </div>
            </div>
          </template>
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
