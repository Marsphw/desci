<template>
  <div>
    <!-- Profile Completion Alert -->
    <n-alert
      v-if="user && !isProfileComplete"
      title="Complete Your Profile"
      type="info"
      class="profile-alert"
    >
      To get the most out of DeSci-Proof, please take a moment to complete your user profile.
      <template #action>
        <n-button type="primary" size="small" @click="goToProfile">
          Go to Profile
        </n-button>
      </template>
    </n-alert>

    <!-- Stats Cards -->
    <n-grid x-gap="24" y-gap="24" :cols="4" style="margin-bottom: 24px;">
      <n-gi>
        <n-card title="My Projects">
          <n-statistic label="Active" :value="5" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="Contributions">
          <n-statistic label="Reviews" :value="12" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="Citations">
          <n-statistic label="Total" :value="89" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="Reputation">
          <n-statistic label="Score" :value="1200" />
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Recent Activity List -->
    <n-card title="Recent Activity">
        <n-list>
            <n-list-item>
                You reviewed the paper "The Future of Decentralized AI".
            </n-list-item>
            <n-list-item>
                A new dataset was added to your project "Quantum Entanglement Simulations".
            </n-list-item>
             <n-list-item>
                Your paper "Proof of Concept for..." was cited.
            </n-list-item>
        </n-list>
    </n-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { NGrid, NGi, NCard, NStatistic, NList, NListItem, NAlert, NButton } from 'naive-ui';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref(null);
const isProfileComplete = ref(false);

onMounted(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        user.value = userData;
        isProfileComplete.value = !!userData.email && !!userData.username;
    }
});

const goToProfile = () => {
    router.push('/profile');
}
</script>

<style scoped>
.profile-alert {
    margin-bottom: 24px;
    background-color: #161b22;
    border: 1px solid #30363d;
}

.profile-alert :deep(.n-alert-header__title) {
    color: #ffffff !important;
}

.profile-alert :deep(.n-alert__content) {
    color: #e2e8f0 !important;
}
</style> 