<script setup lang="ts">
import Pusher from 'pusher-js'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const conversationId = route.params.id as string

const { getConversation } = useConversations()
const { getMessages, sendMessage: sendMsg, updateMessage, deleteMessage, markAsRead } = useMessages()
const { apiFetch } = useApi()

const headerMenuOpen = ref(false)
const messageMenuOpen = ref<string | null>(null)

const newMessage = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement>()

const editingMessageId = ref<string | null>(null)
const editingContent = ref('')

const isMobile = ref(false)

const swipedMessageId = ref<string | null>(null)

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

// Mark as read when conversation is loaded
onMounted(async () => {
  try {
    await markAsRead(conversationId)
  } catch (error) {
    console.error('Failed to mark as read:', error)
  }
})

// Message edition
const startEditMessage = (message: any) => {
  editingMessageId.value = message.id
  editingContent.value = message.content
  swipedMessageId.value = null // Reset swipe
}

const cancelEditMessage = () => {
  editingMessageId.value = null
  editingContent.value = ''
}

const saveEditMessage = async (messageId: string) => {
  console.log('🔵 saveEditMessage called with messageId:', messageId)
  console.log('📝 editingContent:', editingContent.value)

  if (!editingContent.value.trim()) {
    console.warn('⚠️ Content is empty')
    return
  }

  try {
    console.log('📤 Calling updateMessage API...')
    const result = await updateMessage(conversationId, messageId, editingContent.value)
    console.log('✅ updateMessage result:', result)

    editingMessageId.value = null
    editingContent.value = ''

    // Attends 500ms pour que Pusher propage l'événement
    await new Promise(resolve => setTimeout(resolve, 500))
    await refreshMessages()
  } catch (error) {
    console.error('❌ Failed to update message:', error)
  }
}

const confirmDeleteMessage = async (messageId: string) => {
  console.log('🔵 confirmDeleteMessage called with messageId:', messageId)

  if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
    try {
      console.log('📤 Calling deleteMessage API...')
      const result = await deleteMessage(conversationId, messageId)
      console.log('✅ deleteMessage result:', result)

      swipedMessageId.value = null

      // Attends 500ms pour que Pusher propage l'événement
      await new Promise(resolve => setTimeout(resolve, 500))
      await refreshMessages()
    } catch (error) {
      console.error('❌ Failed to delete message:', error)
    }
  }
}

// Swipe handlers
const swipeStates = ref<Record<string, { startX: number; currentX: number }>>({})

const getSwipeState = (messageId: string) => {
  if (!swipeStates.value[messageId]) {
    swipeStates.value[messageId] = { startX: 0, currentX: 0 }
  }
  return swipeStates.value[messageId]
}

const handleMessagesContainerClick = (e: Event) => {
  const target = e.target as HTMLElement

  // Mobile
  const isButtonClick = target.closest('button[data-action-button]')
  if (!isButtonClick) {
    swipedMessageId.value = null
  }

  // Desktop
  const isMenuClick = target.closest('[data-menu-item]')
  const isMenuButton = target.closest('button[data-menu-button]')

  if (!isMenuClick && !isMenuButton) {
    messageMenuOpen.value = null
  }
}

const handleTouchStart = (e: TouchEvent, messageId: string) => {
  const state = getSwipeState(messageId)
  state.startX = e.touches[0].clientX
  state.currentX = 0
}

const handleTouchMove = (e: TouchEvent, messageId: string) => {
  const state = getSwipeState(messageId)
  const diff = state.startX - e.touches[0].clientX

  // Swipe to the left only (diff > 0) and max 100px
  if (diff > 0 && diff < 100) {
    state.currentX = diff
  }
}

const handleTouchEnd = (e: TouchEvent, messageId: string) => {
  e.stopPropagation()
  const state = getSwipeState(messageId)

  if (state.currentX > 50) {
    swipedMessageId.value = messageId
  } else {
    swipedMessageId.value = null
  }
  state.currentX = 0
}

const getSwipeTransform = (messageId: string) => {
  const state = getSwipeState(messageId)

  if (swipedMessageId.value === messageId) {
    return 'translateX(-100px)'
  }
  if (state.currentX > 0) {
    return `translateX(-${state.currentX}px)`
  }
  return 'translateX(0)'
}

// Header dropdown menu
const conversationMenuItems = [
  [{
    label: 'Ajouter des contacts',
    icon: 'i-heroicons-user-plus',
    click: () => console.log('Add contacts') // TODO: Implémenter
  }],
  [{
    label: 'Renommer',
    icon: 'i-heroicons-pencil',
    click: () => console.log('Rename') // TODO: Implémenter
  }],
  [{
    label: 'Supprimer',
    icon: 'i-heroicons-trash',
    click: () => console.log('Delete') // TODO: Implémenter
  }]
]

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

  // Detects mobile with touch support + screen size
  isMobile.value = 'ontouchstart' in window && window.innerWidth < 768

  // Update on resize
  window.addEventListener('resize', () => {
    isMobile.value = 'ontouchstart' in window && window.innerWidth < 768
  })

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

  channel.bind('message-updated', (updatedMessage: any) => {
    if (messages.value) {
      const index = messages.value.findIndex((m: any) => m.id === updatedMessage.id)
      if (index !== -1) {
        messages.value = [
          ...messages.value.slice(0, index),
          updatedMessage,
          ...messages.value.slice(index + 1)
        ]
      }
    }
  })

  channel.bind('message-deleted', (data: any) => {
    if (messages.value) {
      messages.value = messages.value.filter((m: any) => m.id !== data.messageId)
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

        <div class="relative">
          <UButton
              icon="i-heroicons-ellipsis-vertical"
              variant="ghost"
              size="sm"
              @click="headerMenuOpen = !headerMenuOpen"
          />
          <div
              v-if="headerMenuOpen"
              class="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
              @click="headerMenuOpen = false"
          >
            <button
                class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                @click="console.log('Add contacts')"
            >
              <UIcon name="i-heroicons-user-plus" class="w-4 h-4" />
              Ajouter des contacts
            </button>
            <button
                class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                @click="console.log('Rename')"
            >
              <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
              Renommer
            </button>
            <button
                class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                @click="console.log('Delete')"
            >
              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto px-4 py-4"
          @click="handleMessagesContainerClick"
      >
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

            <div :class="getMessageSpacing(index)">
              <div
                  :class="[
              'flex group',
              message.senderId === userId ? 'justify-end' : 'justify-start'
            ]"
              >
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

                <div
                    class="flex flex-col max-w-[75%]"
                    :class="message.senderId === userId ? 'items-end' : 'items-start'"
                >
                  <p
                      v-if="message.senderId !== userId && !isSameSenderAsPrevious(index)"
                      class="text-xs font-semibold text-gray-700 mb-1 px-2"
                  >
                    {{ message.sender?.username || message.sender?.firstName }}
                  </p>

                  <div v-if="editingMessageId === message.id" class="flex flex-col gap-2 w-full">
                    <UTextarea v-model="editingContent" :rows="2" autofocus class="w-full" />
                    <div class="flex gap-2">
                      <UButton size="xs" @click="saveEditMessage(message.id)">Sauvegarder</UButton>
                      <UButton size="xs" color="gray" variant="ghost" @click="cancelEditMessage">Annuler</UButton>
                    </div>
                  </div>

                  <!-- Message sent (with swipe on mobile) -->
                  <div v-else-if="message.senderId === userId" class="relative w-full">
                    <!-- Hidden actions (revealed by swiping on mobile) -->
                    <div
                        v-if="isMobile"
                        class="absolute top-0 bottom-0 w-[100px] flex items-center justify-end gap-2 pr-2"
                        :style="swipedMessageId === message.id ? 'right: 0' : 'right: -100px'"
                    >
                      <button
                          data-action-button="edit"
                          class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
                          @click.stop="startEditMessage(message)"
                      >
                        <UIcon name="i-heroicons-pencil" class="w-5 h-5" />
                      </button>
                      <button
                          data-action-button="delete"
                          class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          @click.stop="confirmDeleteMessage(message.id)"
                      >
                        <UIcon name="i-heroicons-trash" class="w-5 h-5" />
                      </button>
                    </div>

                    <!-- Message container (horizontal swipe on mobile) -->
                    <div
                        class="relative flex items-center gap-2 transition-transform"
                        :style="isMobile && swipedMessageId === message.id ? { transform: 'translateX(-100px)' } : {}"
                        @touchstart="isMobile ? handleTouchStart($event, message.id) : null"
                        @touchmove="isMobile ? handleTouchMove($event, message.id) : null"
                        @touchend="isMobile ? handleTouchEnd($event, message.id) : null"
                    >
                      <!-- Desktop menu -->
                      <div v-if="!isMobile" class="relative">
                        <UButton
                            icon="i-heroicons-ellipsis-vertical"
                            size="2xs"
                            color="gray"
                            variant="ghost"
                            class="opacity-0 group-hover:opacity-100 transition-opacity"
                            data-menu-button
                            @click="messageMenuOpen = messageMenuOpen === message.id ? null : message.id"
                        />
                        <div
                            v-if="messageMenuOpen === message.id"
                            class="absolute left-0 bottom-full mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 px-2 z-50 flex gap-2"
                            data-menu-item
                        >
                          <button
                              class="flex-1 px-2 py-1 text-xs hover:bg-gray-100 flex items-center justify-center gap-1 rounded"
                              @click="startEditMessage(message)"
                          >
                            <UIcon name="i-heroicons-pencil" class="w-3 h-3" />
                            Modifier
                          </button>
                          <button
                              class="flex-1 px-2 py-1 text-xs hover:bg-gray-100 flex items-center justify-center gap-1 rounded text-red-600"
                              @click="confirmDeleteMessage(message.id)"
                          >
                            <UIcon name="i-heroicons-trash" class="w-3 h-3" />
                            Supprimer
                          </button>
                        </div>
                      </div>

                      <!-- Bubble (with swipe on mobile) -->
                      <div
                          :class="[
                            'px-4 py-2 shadow-sm flex-1',
                            getBorderRadiusClass(index, true),
                            'bg-blue-600 text-white'
                          ]"
                          @click.stop
                      >
                        <p class="text-sm whitespace-pre-wrap break-words">{{ message.content }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Message received -->
                  <div v-else>
                    <div
                        :class="[
                    'px-4 py-2 shadow-sm',
                    getBorderRadiusClass(index, false),
                    'bg-gray-200 text-gray-900'
                  ]"
                    >
                      <p class="text-sm whitespace-pre-wrap break-words">{{ message.content }}</p>
                    </div>
                  </div>

                  <p
                      v-if="!isSameSenderAsNext(index) && editingMessageId !== message.id"
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