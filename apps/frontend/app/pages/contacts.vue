<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useFetch } from '#app';

const { session } = useClerk();
const contacts = ref([]);

onMounted(async () => {
  const token = await session.value.getToken();
  const { data } = await useFetch('/api/users/status/contacts', {
    headers: { Authorization: `Bearer ${token}` },
  });
  contacts.value = data.value || [];
});
</script>

<template>
  <section class="p-6 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold">Contacts</h1>

    <div class="mt-4">
      <div
          v-for="contact in contacts"
          :key="contact.id"
          class="border-b py-3 flex items-center justify-between"
      >
        <div class="flex items-center space-x-3">
          <img
              :src="contact.imageUrl"
              alt="Avatar"
              class="w-10 h-10 rounded-full"
          />
          <div>
            <p class="font-medium">
              {{ contact.firstName || contact.username || contact.email }}
            </p>
            <p class="text-sm text-gray-500">
              Last online:
              {{ new Date(contact.lastSeenAt).toLocaleTimeString() }}
            </p>
          </div>
        </div>

        <span
            class="text-xs uppercase font-semibold"
            :class="{
            'text-green-600': contact.isOnline,
            'text-gray-400': !contact.isOnline,
          }"
        >
          {{ contact.isOnline ? 'Online' : 'Offline' }}
        </span>
      </div>
    </div>
  </section>

  <!-- Bottom Navigation -->
  <BottomMenu active="contacts" />
</template>
