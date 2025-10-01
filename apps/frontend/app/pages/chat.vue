<template>
  <div class="flex flex-col h-screen max-w-4xl mx-auto p-4">
    <UCard class="flex-1 flex flex-col">
      <template #header>
        <h1 class="text-xl font-bold">Echo Chat</h1>
      </template>

      <!-- Messages -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto space-y-4 p-4" style="height: 80vh; min-height: 200px;">
        <div
            v-for="message in messages"
            :key="message.id"
            class="flex"
            :class="message.sender.id === currentUserId ? 'justify-end' : 'justify-start'"
        >
          <div
              class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
              :class="
              message.sender.id === currentUserId
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-900'
            "
          >
            <p class="text-sm font-medium">{{ message.sender.fullName }}</p>
            <p>{{ message.content }}</p>
            <p class="text-xs opacity-75 mt-1">
              {{ formatTime(message.createdAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <div class="border-t p-4 bg-white sticky bottom-0 z-10">
        <form @submit.prevent="sendMessage" class="flex space-x-2">
          <UInput
              v-model="newMessage"
              placeholder="Type a message..."
              class="flex-1"
              :disabled="loading"
          />
          <UButton
              type="submit"
              :loading="loading"
              :disabled="!newMessage.trim()"
          >
            Send
          </UButton>
        </form>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

interface Sender {
  id: string;
  fullName: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: Sender;
}

const messages = ref<Message[]>([])
const newMessage = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)


const currentUserId = '550e8400-e29b-41d4-a716-446655440001' // UUID à récupérer sur Clerk
const conversationId = '550e8400-e29b-41d4-a716-446655440003' // UUID de la conversation

// Formate l'heure pour affichage
const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Scroll vers le bas des messages
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Charge les messages depuis l'API
const loadMessages = async () => {
  try {
    const response = await $fetch<Message[]>(`http://localhost:3001/messages?conversationId=${conversationId}`)
    messages.value = response
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Error loading messages:', error)
  }
}

// Envoie un nouveau message via l'API
const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  loading.value = true
  try {
    const response = await $fetch<Message>('http://localhost:3001/messages', {
      method: 'POST',
      body: {
        content: newMessage.value,
        conversationId,
        senderId: currentUserId,
      },
    })

    messages.value.push(response)
    newMessage.value = ''
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Error sending message:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMessages()
  // Mise à jour régulière des messages toutes les 2 secondes
  //COMMENTER TEMPORAIREMENT
  //const interval = setInterval(loadMessages, 2000)
  //onUnmounted(() => clearInterval(interval))
})
</script>
