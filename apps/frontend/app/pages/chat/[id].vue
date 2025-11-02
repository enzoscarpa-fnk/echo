<script setup lang="ts">
import Pusher from 'pusher-js'

definePageMeta({
  middleware: 'auth'
})

// ============================================================================
// ROUTE & COMPOSABLES
// ============================================================================

const route = useRoute()
const conversationId = route.params.id as string

const { getConversation } = useConversations()
const { getMessages, sendMessage: sendMsg, updateMessage, deleteMessage, markAsRead } = useMessages()
const { apiFetch } = useApi()

// ============================================================================
// REACTIVE STATE - DATA
// ============================================================================

const { data: currentUser } = await useAsyncData(
    'current-user',
    () => apiFetch('/users/me')
)

const { data: conversation } = await useAsyncData(
    `conversation-${conversationId}`,
    () => getConversation(conversationId)
)

const { data: messages, refresh: refreshMessages } = await useAsyncData(
    `messages-${conversationId}`,
    () => getMessages(conversationId)
)

// ============================================================================
// REACTIVE STATE - UI FLAGS
// ============================================================================

const headerMenuOpen = ref(false)
const messageMenuOpen = ref<string | null>(null)
const isMobile = ref(false)
const swipedMessageId = ref<string | null>(null)

const isRenameModalOpen = ref(false)
const isAddContactModalOpen = ref(false)

// ============================================================================
// REACTIVE STATE - MESSAGE INPUT & EDITING
// ============================================================================

const newMessage = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLInputElement>()

const editingMessageId = ref<string | null>(null)
const editingContent = ref('')

// ============================================================================
// REACTIVE STATE - CONVERSATION ACTIONS
// ============================================================================

const renamingConversationName = ref('')
const selectedContactsToAdd = ref<string[]>([])
const availableContacts = ref<any[]>([])

// ============================================================================
// REACTIVE STATE - INTERNAL TRACKING
// ============================================================================

const swipeStates = ref<Record<string, { startX: number; currentX: number }>>({})
const menuAlignment = ref<Record<string, 'left' | 'right'>>({})
const menuPosition = ref<Record<string, { top: number; left: number; width: number }>>({})

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================

const userId = computed(() => currentUser.value?.id)

const isCurrentUserAdmin = computed(() => {
  if (!conversation.value || !userId.value) return false
  const currentParticipant = conversation.value.participants.find(
      (p: any) => p.userId === userId.value
  )
  return currentParticipant?.role === 'ADMIN'
})

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================

onMounted(async () => {
  // Mark conversation as read
  try {
    await markAsRead(conversationId)
  } catch (error) {
    console.error('Failed to mark as read:', error)
  }

  // Setup mobile detection
  isMobile.value = 'ontouchstart' in window && window.innerWidth < 768
  window.addEventListener('resize', () => {
    isMobile.value = 'ontouchstart' in window && window.innerWidth < 768
  })

  // Setup Pusher for real-time updates
  setupPusherListener()
})

// ============================================================================
// MESSAGE EDITING
// ============================================================================

const startEditMessage = (message: any) => {
  editingMessageId.value = message.id
  newMessage.value = message.content
  swipedMessageId.value = null

  nextTick(() => {
    messageInput.value?.focus()
    messageInput.value?.setSelectionRange(
        messageInput.value.value.length,
        messageInput.value.value.length
    )
  })
}

const cancelEditMessage = () => {
  editingMessageId.value = null
  newMessage.value = ''
}

const saveEditMessage = async (messageId: string) => {
  if (!editingContent.value.trim()) return

  try {
    await updateMessage(conversationId, messageId, editingContent.value)
    editingMessageId.value = null
    editingContent.value = ''

    // Wait for Pusher to propagate
    await new Promise(resolve => setTimeout(resolve, 500))
    await refreshMessages()
  } catch (error) {
    console.error('Failed to save message:', error)
  }
}

const confirmDeleteMessage = async (messageId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return

  try {
    await deleteMessage(conversationId, messageId)
    swipedMessageId.value = null

    // Wait for Pusher to propagate
    await new Promise(resolve => setTimeout(resolve, 500))
    await refreshMessages()
  } catch (error) {
    console.error('Failed to delete message:', error)
  }
}

// ============================================================================
// MESSAGE SWIPE HANDLERS (MOBILE)
// ============================================================================

const getSwipeState = (messageId: string) => {
  if (!swipeStates.value[messageId]) {
    swipeStates.value[messageId] = { startX: 0, currentX: 0 }
  }
  return swipeStates.value[messageId]
}

const handleTouchStart = (e: TouchEvent, messageId: string) => {
  if (swipedMessageId.value !== null && swipedMessageId.value !== messageId) {
    swipedMessageId.value = null
  }

  const state = getSwipeState(messageId)
  state.startX = e.touches[0].clientX
  state.currentX = 0
}

const handleTouchMove = (e: TouchEvent, messageId: string) => {
  if (swipedMessageId.value !== null && swipedMessageId.value !== messageId) return

  const state = getSwipeState(messageId)
  const diff = state.startX - e.touches[0].clientX

  if (diff > 0 && diff < 100) {
    state.currentX = diff
  }
}

const handleTouchEnd = (e: TouchEvent, messageId: string) => {
  if (swipedMessageId.value !== null && swipedMessageId.value !== messageId) return

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
  if (swipedMessageId.value !== messageId) return 'translateX(0)'

  const state = getSwipeState(messageId)
  if (state.currentX > 0) {
    return `translateX(-${state.currentX}px)`
  }
  return 'translateX(-100px)'
}

// ============================================================================
// MESSAGE MENU HANDLERS (DESKTOP)
// ============================================================================

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

const calculateMenuAlignment = (messageId: string, element: HTMLElement) => {
  nextTick(() => {
    const button = element.querySelector('[data-menu-button]') as HTMLElement
    if (!button) return

    const buttonRect = button.getBoundingClientRect()
    const menuWidth = 160
    const padding = 20

    menuPosition.value[messageId] = {
      top: buttonRect.top,
      left: buttonRect.left,
      width: buttonRect.width,
    }

    const wouldExitRight = buttonRect.right + menuWidth + padding > window.innerWidth
    menuAlignment.value[messageId] = wouldExitRight ? 'right' : 'left'
  })
}

const getMenuStyle = (messageId: string) => {
  const pos = menuPosition.value[messageId]
  if (!pos) return {}

  const isRight = menuAlignment.value[messageId] === 'right'

  return {
    position: 'fixed' as const,
    top: `${pos.top - 12}px`,
    [isRight ? 'right' : 'left']: isRight
        ? `${window.innerWidth - (pos.left + pos.width)}px`
        : `${pos.left}px`,
    zIndex: 50,
  }
}

// ============================================================================
// CONVERSATION MANAGEMENT - RENAME
// ============================================================================

const handleRenameConversation = () => {
  renamingConversationName.value = conversation.value?.name || ''
  isRenameModalOpen.value = true
}

const confirmRenameConversation = async (newName: string) => {
  if (!newName.trim()) return

  try {
    await apiFetch(`/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: newName }),
    })

    if (conversation.value) {
      conversation.value.name = newName
    }

    renamingConversationName.value = ''
    isRenameModalOpen.value = false
    headerMenuOpen.value = false
  } catch (error) {
    console.error('Failed to rename conversation:', error)
  }
}

// ============================================================================
// CONVERSATION MANAGEMENT - ADD PARTICIPANTS
// ============================================================================

const handleAddContact = async () => {
  try {
    const { data } = await useAsyncData('available-contacts', () =>
        apiFetch('/users/contacts')
    )
    availableContacts.value = data.value || []
    selectedContactsToAdd.value = []
    isAddContactModalOpen.value = true
  } catch (error) {
    console.error('Failed to load contacts:', error)
  }
}

const confirmAddContacts = async () => {
  if (selectedContactsToAdd.value.length === 0) return

  try {
    await apiFetch(`/conversations/${conversationId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userIds: selectedContactsToAdd.value }),
    })

    selectedContactsToAdd.value = []
    isAddContactModalOpen.value = false
    headerMenuOpen.value = false

    await refreshMessages()
  } catch (error) {
    console.error('Failed to add contacts:', error)
  }
}

// ============================================================================
// CONVERSATION MANAGEMENT - DELETE/LEAVE
// ============================================================================

const handleDeleteConversation = () => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
    deleteConversation()
  }
}

const deleteConversation = async () => {
  try {
    await apiFetch(`/conversations/${conversationId}`, {
      method: 'DELETE',
    })
    navigateTo('/contacts')
  } catch (error) {
    console.error('Failed to delete conversation:', error)
  }
}

const leaveConversation = async () => {
  try {
    await apiFetch(`/conversations/${conversationId}`, {
      method: 'DELETE',
    })
    navigateTo('/dashboard')
  } catch (error) {
    console.error('Failed to leave conversation:', error)
  }
}

// ============================================================================
// MESSAGE SENDING
// ============================================================================

const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  loading.value = true
  try {
    if (editingMessageId.value) {
      await updateMessage(conversationId, editingMessageId.value, newMessage.value)
      editingMessageId.value = null
      newMessage.value = ''

      await new Promise(resolve => setTimeout(resolve, 500))
      await refreshMessages()
    } else {
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
    }
  } catch (error) {
    console.error('Failed to send/edit message:', error)
  } finally {
    loading.value = false
  }
}

// ============================================================================
// MESSAGE FORMATTING & GROUPING
// ============================================================================

const hasLongTimeDifference = (index: number) => {
  if (index === 0) return false
  const current = new Date(messages.value?.[index]?.createdAt)
  const previous = new Date(messages.value?.[index - 1]?.createdAt)
  const diffInHours = Math.abs(current.getTime() - previous.getTime()) / (1000 * 60 * 60)
  return diffInHours > 2
}

const isSameSenderAsPrevious = (index: number) => {
  if (index === 0) return false
  if (hasLongTimeDifference(index)) return false
  return messages.value?.[index - 1]?.senderId === messages.value?.[index]?.senderId
}

const isSameSenderAsNext = (index: number) => {
  if (!messages.value || index === messages.value.length - 1) return false
  const current = new Date(messages.value[index].createdAt)
  const next = new Date(messages.value[index + 1].createdAt)
  const diffInHours = Math.abs(next.getTime() - current.getTime()) / (1000 * 60 * 60)
  if (diffInHours > 2) return false
  return messages.value[index].senderId === messages.value[index + 1]?.senderId
}

const shouldShowDateSeparator = (index: number) => {
  if (index === 0) return true
  const current = new Date(messages.value?.[index]?.createdAt)
  const previous = new Date(messages.value?.[index - 1]?.createdAt)
  return current.toDateString() !== previous.toDateString()
}

const getMessagePosition = (index: number) => {
  const samePrev = isSameSenderAsPrevious(index)
  const sameNext = isSameSenderAsNext(index)

  if (!samePrev && !sameNext) return 'single'
  if (!samePrev && sameNext) return 'first'
  if (samePrev && sameNext) return 'middle'
  if (samePrev && !sameNext) return 'last'
  return 'single'
}

const getBorderRadiusClass = (index: number, isOwn: boolean) => {
  const position = getMessagePosition(index)

  if (isOwn) {
    switch (position) {
      case 'single': return 'rounded-2xl rounded-br-md'
      case 'first': return 'rounded-2xl rounded-br-md'
      case 'middle': return 'rounded-l-2xl rounded-r-md'
      case 'last': return 'rounded-l-2xl rounded-r-md'
    }
  } else {
    switch (position) {
      case 'single': return 'rounded-2xl rounded-bl-md'
      case 'first': return 'rounded-2xl rounded-bl-md'
      case 'middle': return 'rounded-r-2xl rounded-l-md'
      case 'last': return 'rounded-r-2xl rounded-l-md'
    }
  }
}

const getMessageSpacing = (index: number) => {
  return isSameSenderAsPrevious(index) ? 'mt-1' : 'mt-4'
}

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

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

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

// ============================================================================
// PUSHER REAL-TIME LISTENER
// ============================================================================

const setupPusherListener = () => {
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

  channel.bind('message-deleted', ( data: any) => {
    if (messages.value) {
      messages.value = messages.value.filter((m: any) => m.id !== data.messageId)
    }
  })

  onUnmounted(() => {
    try {
      channel.unbind_all()
      channel.unsubscribe()
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-900">
    <div v-if="!conversation" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="bg-slate-950/50 backdrop-blur border-b border-slate-800/30 px-4 py-3 flex items-center gap-3 z-20 relative">
        <UButton
            icon="i-heroicons-arrow-left"
            variant="ghost"
            size="sm"
            color="slate"
            @click="navigateTo('/dashboard')"
        />
        <UAvatar
            :src="getConversationAvatar()"
            :alt="getConversationName()"
            size="sm"
            class="ring-1 ring-slate-700/50"
        />
        <div class="flex-1 min-w-0">
          <h2 class="font-semibold text-sm text-white truncate">
            {{ getConversationName() }}
          </h2>
          <p class="text-xs text-slate-400">Online</p>
        </div>

        <div class="relative">
          <UButton
              icon="i-heroicons-ellipsis-vertical"
              variant="ghost"
              size="sm"
              color="slate"
              @click="headerMenuOpen = !headerMenuOpen"
          />
          <div
              v-if="headerMenuOpen"
              class="absolute right-0 top-full mt-2 w-56 bg-slate-800 rounded-2xl shadow-lg border border-slate-700/50 p-1 z-50"
              @click="headerMenuOpen = false"
          >
            <!-- Admin menu -->
            <template v-if="isCurrentUserAdmin">
              <button
                  v-if="conversation?.isGroup"
                  class="w-full px-4 py-2 text-left text-sm hover:bg-slate-700/30 flex rounded-xl items-center gap-2 text-slate-300 hover:text-white transition"
                  @click="handleAddContact"
              >
                <UIcon name="i-heroicons-user-plus" class="w-4 h-4" />
                Add members
              </button>
              <button
                  class="w-full px-4 py-2 text-left text-sm hover:bg-slate-700/30 flex rounded-xl items-center gap-2 text-slate-300 hover:text-white transition"
                  @click="handleRenameConversation"
              >
                <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                Rename
              </button>
              <button
                  class="w-full px-4 py-2 text-left text-sm hover:bg-slate-700/30 flex rounded-xl items-center gap-2 text-red-400 hover:text-red-300 transition"
                  @click="handleDeleteConversation"
              >
                <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                Delete
              </button>
            </template>

            <!-- User menu -->
            <template v-else>
              <button
                  class="w-full px-4 py-2 text-left text-sm hover:bg-slate-700/30 flex rounded-xl items-center gap-2 text-red-400 hover:text-red-300 transition"
                  @click="leaveConversation"
              >
                <UIcon name="i-heroicons-arrow-left-on-rectangle" class="w-4 h-4" />
                Leave chat
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4"
          @click="handleMessagesContainerClick"
      >
        <div v-if="!messages || messages.length === 0" class="text-center text-slate-400 py-12">
          No messages yet. Start the conversation!
        </div>

        <div v-else class="max-w-4xl mx-auto">
          <template v-for="(message, index) in messages" :key="message.id">
            <div
                v-if="shouldShowDateSeparator(index)"
                class="flex justify-center my-6"
            >
              <div class="bg-slate-800/50 text-slate-300 text-xs font-medium px-3 py-1 rounded-full border border-slate-700/30">
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
                      class="ring-1 ring-slate-700/50"
                  />
                </div>

                <div
                    class="flex flex-col max-w-[75%]"
                    :class="message.senderId === userId ? 'items-end' : 'items-start'"
                >
                  <p
                      v-if="message.senderId !== userId && !isSameSenderAsPrevious(index)"
                      class="text-xs font-semibold text-slate-400 mb-1 px-2"
                  >
                    {{ message.sender?.username || message.sender?.firstName }}
                  </p>

                  <!-- Message sent -->
                  <div v-if="message.senderId === userId" class="relative w-full">
                    <!-- Mobile: swipe actions -->
                    <div
                        v-if="isMobile"
                        class="absolute top-0 bottom-0 w-[100px] flex items-center justify-end gap-2 pr-2"
                        :style="swipedMessageId === message.id ? 'right: 0' : 'right: -100px'"
                    >
                      <button
                          data-action-button="edit"
                          class="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center transition"
                          @click.stop="startEditMessage(message)"
                      >
                        <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                      </button>
                      <button
                          data-action-button="delete"
                          class="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center transition"
                          @click.stop="confirmDeleteMessage(message.id)"
                      >
                        <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                      </button>
                    </div>

                    <!-- Message container -->
                    <div
                        class="relative flex items-center gap-2 overflow-hidden"
                        :class="isMobile ? 'transition-transform' : ''"
                        :style="isMobile && swipedMessageId === message.id ? { transform: getSwipeTransform(message.id) } : {}"
                    >
                      <!-- Desktop menu -->
                      <Teleport v-if="!isMobile && messageMenuOpen === message.id" to="body">
                        <div
                            v-if="messageMenuOpen === message.id"
                            :style="getMenuStyle(message.id)"
                            class="bg-slate-800 rounded-2xl shadow-lg border border-slate-700/50 p-1 flex gap-2 z-50"
                            data-menu-item
                        >
                          <button
                              class="px-2 py-1 text-xs hover:bg-slate-700/30 flex items-center justify-center gap-1 rounded-xl whitespace-nowrap text-slate-300 hover:text-white transition"
                              @click="startEditMessage(message)"
                          >
                            <UIcon name="i-heroicons-pencil" class="w-3 h-3" />
                            Edit
                          </button>
                          <button
                              class="px-2 py-1 text-xs hover:bg-slate-700/30 flex items-center justify-center gap-1 rounded-xl text-red-400 hover:text-red-300 whitespace-nowrap transition"
                              @click="confirmDeleteMessage(message.id)"
                          >
                            <UIcon name="i-heroicons-trash" class="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </Teleport>

                      <!-- Button -->
                      <div v-if="!isMobile" class="relative">
                        <UButton
                            icon="i-heroicons-ellipsis-vertical"
                            size="2xs"
                            color="slate"
                            variant="ghost"
                            class="opacity-0 group-hover:opacity-100 transition-opacity"
                            data-menu-button
                            @click="(e) => {
                              calculateMenuAlignment(message.id, (e.target as HTMLElement).closest('.relative') || document.body)
                              messageMenuOpen = messageMenuOpen === message.id ? null : message.id
                            }"
                        />
                      </div>

                      <!-- Bubble -->
                      <div
                          class="flex-1"
                          @touchstart="isMobile ? handleTouchStart($event, message.id) : null"
                          @touchmove="isMobile ? handleTouchMove($event, message.id) : null"
                          @touchend="isMobile ? handleTouchEnd($event, message.id) : null"
                      >
                        <div
                            :class="[
                              'px-4 py-2 w-full',
                              getBorderRadiusClass(index, true),
                              'bg-blue-600/70 text-white shadow-sm'
                            ]"
                            @click.stop
                        >
                          <p class="text-sm whitespace-pre-wrap break-words">{{ message.content }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Message received -->
                  <div v-else>
                    <div
                        :class="[
                          'px-4 py-2 shadow-sm',
                          getBorderRadiusClass(index, false),
                          'bg-slate-800/40 text-slate-100 border border-slate-700/20'
                        ]"
                    >
                      <p class="text-sm whitespace-pre-wrap break-words">{{ message.content }}</p>
                    </div>
                  </div>

                  <p
                      v-if="!isSameSenderAsNext(index) && editingMessageId !== message.id"
                      class="text-xs text-slate-500 mt-1 px-2"
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
      <div class="bg-slate-950/50 backdrop-blur border-t border-slate-800/30 px-4 py-3">
        <div v-if="editingMessageId" class="flex items-center justify-between mb-2 px-2">
          <span class="text-xs text-amber-400 font-medium">Editing message...</span>
          <button
              @click="cancelEditMessage"
              class="text-xs text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
        </div>

        <form @submit.prevent="sendMessage" class="flex items-center gap-2">
          <UButton
              icon="i-heroicons-plus"
              variant="ghost"
              size="sm"
              color="slate"
          />
          <input
              ref="messageInput"
              v-model="newMessage"
              :placeholder="editingMessageId ? 'Edit your message...' : 'Type a message...'"
              class="flex-1 bg-slate-800/30 border border-slate-700/50 text-white placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/50 transition"
              :disabled="loading"
          />
          <UButton
              type="submit"
              :icon="editingMessageId ? 'i-heroicons-check' : 'i-heroicons-paper-airplane'"
              size="sm"
              :color="editingMessageId ? 'amber' : 'purple'"
              :disabled="!newMessage.trim() || loading"
              :loading="loading"
          />
        </form>
      </div>
    </template>
  </div>

  <!-- Rename Conversation Modal -->
  <div
      v-if="isRenameModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      @click="isRenameModalOpen = false"
  >
    <div
        class="w-96 bg-slate-900 border border-slate-800/50 rounded-xl shadow-2xl"
        @click.stop
    >
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800/30">
        <h3 class="text-base font-semibold text-white">Rename Chat</h3>
        <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="-my-1"
            @click="isRenameModalOpen = false"
        />
      </div>

      <div class="px-6 py-4 space-y-4">
        <input
            v-model="renamingConversationName"
            placeholder="New name..."
            class="w-full bg-slate-800/30 border border-slate-700/50 text-white placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/50 transition"
            autofocus
        />
      </div>

      <div class="flex justify-end gap-2 px-6 py-4 border-t border-slate-800/30">
        <UButton
            color="gray"
            variant="ghost"
            @click="isRenameModalOpen = false"
        >
          Cancel
        </UButton>
        <UButton
            color="purple"
            @click="confirmRenameConversation(renamingConversationName)"
            :disabled="!renamingConversationName.trim()"
        >
          Rename
        </UButton>
      </div>
    </div>
  </div>

  <!-- Add Contacts Modal -->
  <div
      v-if="isAddContactModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      @click="isAddContactModalOpen = false"
  >
    <div
        class="w-96 bg-slate-900 border border-slate-800/50 rounded-xl shadow-2xl"
        @click.stop
    >
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800/30">
        <h3 class="text-base font-semibold text-white">Add Members</h3>
        <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="-my-1"
            @click="isAddContactModalOpen = false"
        />
      </div>

      <div class="px-6 py-4 space-y-3 max-h-96 overflow-y-auto">
        <div
            v-for="contact in availableContacts"
            :key="contact.id"
            class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/30 transition"
        >
          <UCheckbox
              :model-value="selectedContactsToAdd.includes(contact.id)"
              @update:model-value="(checked) => {
              if (checked) {
                selectedContactsToAdd.push(contact.id)
              } else {
                selectedContactsToAdd = selectedContactsToAdd.filter(id => id !== contact.id)
              }
            }"
          />
          <UAvatar
              :src="contact.imageUrl"
              :alt="contact.firstName"
              size="sm"
              class="ring-1 ring-slate-700/50"
          />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm text-white truncate">
              {{ contact.firstName }} {{ contact.lastName }}
            </p>
            <p class="text-xs text-slate-400 truncate">
              {{ contact.email }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 px-6 py-4 border-t border-slate-800/30">
        <UButton
            color="gray"
            variant="ghost"
            @click="isAddContactModalOpen = false"
        >
          Cancel
        </UButton>
        <UButton
            color="purple"
            @click="confirmAddContacts"
            :disabled="selectedContactsToAdd.length === 0"
        >
          Add ({{ selectedContactsToAdd.length }})
        </UButton>
      </div>
    </div>
  </div>
</template>
