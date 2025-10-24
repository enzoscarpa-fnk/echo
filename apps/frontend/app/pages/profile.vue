<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePusher } from '~/composables/usePusher';
import { useFetch } from '#app';

const { user, session } = useClerk();
const profile = ref();
const contactStatusUpdates = ref([]);

onMounted(async () => {
  const token = await session.value.getToken();

  const { data } = await useFetch('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  profile.value = data.value;

  const { contactStatusUpdates: updates } = usePusher(profile.value.id, token);
  contactStatusUpdates.value = updates;
});
</script>

<template>
  <section class="p-6 max-w-xl mx-auto">
    <h1 class="text-2xl font-bold">My profile</h1>

    <div v-if="profile" class="mt-4 space-y-2">
      <img :src="profile.imageUrl" alt="Avatar" class="w-16 rounded-full" />
      <p class="text-lg">{{ profile.firstName }} {{ profile.lastName }}</p>
      <p class="text-gray-600">{{ profile.email }}</p>
      <p>
        Status:
        <span
            :class="{
            'text-green-600': profile.isOnline,
            'text-gray-500': !profile.isOnline,
          }"
        >
          {{ profile.isOnline ? 'Online' : 'Offline' }}
        </span>
      </p>
      <p>Last online: {{ new Date(profile.lastSeenAt).toLocaleString() }}</p>
    </div>

    <div class="mt-6">
      <h2 class="font-medium">Pusher event:</h2>
      <ul class="mt-2 space-y-1 text-sm text-gray-600">
        <li v-for="update in contactStatusUpdates" :key="update.userId">
          👁️ {{ update.userId }} → {{ update.isOnline ? 'online' : 'offline' }}
        </li>
      </ul>
    </div>
  </section>

  <!-- Bottom Navigation -->
  <BottomMenu active="profile" />
</template>
