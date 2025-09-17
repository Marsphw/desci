<template>
  <div class="profile-page">
    <!-- Success Overlay -->
    <div v-if="showSuccessOverlay" class="success-overlay">
      <n-card class="success-card">
        <n-h2>Profile Updated!</n-h2>
        <n-p>Your changes have been saved successfully.</n-p>
        <n-button type="primary" @click="closeSuccessOverlay">Close</n-button>
      </n-card>
    </div>

    <n-card class="profile-card">
      <div class="profile-header">
        <n-button v-if="!isEditing" @click="isEditing = true">Edit Profile</n-button>
      </div>

      <div v-if="!isEditing" class="profile-view">
        <n-h2>Public Profile</n-h2>
        <n-descriptions label-placement="top" :columns="2" bordered>
          <n-descriptions-item>
            <template #label><div class="desc-label"><n-icon :component="PersonOutline" /> Username</div></template>
            {{ user.username }}
          </n-descriptions-item>
          <n-descriptions-item>
            <template #label><div class="desc-label"><n-icon :component="MailOutline" /> Email</div></template>
            {{ user.email }}
          </n-descriptions-item>
          <n-descriptions-item v-if="user.organization">
            <template #label><div class="desc-label"><n-icon :component="BusinessOutline" /> Organization</div></template>
            {{ user.organization }}
          </n-descriptions-item>
          <n-descriptions-item v-if="user.research_interests">
            <template #label><div class="desc-label"><n-icon :component="FlaskOutline" /> Research Interests</div></template>
            <n-space>
              <n-tag v-for="interest in formattedInterests" :key="interest" type="info" :bordered="false">
                {{ interest }}
              </n-tag>
            </n-space>
          </n-descriptions-item>
          <n-descriptions-item v-if="user.github_username">
            <template #label><div class="desc-label"><n-icon :component="LogoGithub" /> GitHub</div></template>
            {{ user.github_username }}
          </n-descriptions-item>
          <n-descriptions-item v-if="user.personal_website">
            <template #label><div class="desc-label"><n-icon :component="LinkOutline" /> Website</div></template>
            {{ user.personal_website }}
          </n-descriptions-item>
        </n-descriptions>

        <n-divider />

        <n-h2>Academic Identity</n-h2>
        <n-card :bordered="true" class="academic-card">
          <div v-if="user.is_academically_verified" class="verified-state">
            <n-icon :component="CheckmarkCircleOutline" size="24" color="#63e2b7" />
            <p><strong>Verified:</strong> {{ user.orcid_id }}</p>
          </div>
          <div v-else class="unverified-state">
            <n-icon :component="CloseCircleOutline" size="24" color="#e88080" />
            <p>Academic identity not verified.</p>
            <n-button type="primary" size="small" @click="goToVerification">Verify your academic identity</n-button>
          </div>
        </n-card>

        <n-divider />

        <n-h2>On-Chain Identity</n-h2>
        <n-descriptions label-placement="top" :columns="1" bordered>
          <n-descriptions-item>
            <template #label><div class="desc-label"><n-icon :component="WalletOutline" /> Wallet Address</div></template>
            <n-text code>{{ user.wallet_address }}</n-text>
          </n-descriptions-item>
          <n-descriptions-item>
            <template #label><div class="desc-label"><n-icon :component="KeyOutline" /> Decentralized ID (DID)</div></template>
            <n-text code>{{ user.did }}</n-text>
          </n-descriptions-item>
        </n-descriptions>
      </div>

      <n-form v-else ref="formRef" :model="profileForm" :rules="rules" style="margin-top: 24px;">
        <n-form-item label="Username" path="username">
          <n-input v-model:value="profileForm.username" placeholder="Enter your username" />
        </n-form-item>
        <n-form-item label="Email Address" path="email">
          <n-input v-model:value="profileForm.email" placeholder="Enter your email" />
        </n-form-item>
        <n-form-item label="GitHub Username" path="github_username">
          <n-input v-model:value="profileForm.github_username" placeholder="e.g., vitalikbuterin" />
        </n-form-item>
        <n-form-item label="Personal Website" path="personal_website">
          <n-input v-model:value="profileForm.personal_website" placeholder="https://example.com" />
        </n-form-item>
        
        <n-p :style="{ 'font-size': '13px', 'color': '#a0a0a0', 'margin-top': '24px' }">
          To modify your research interests, please visit the 
          <router-link to="/verify" :style="{ color: '#63e2b7', 'text-decoration': 'none', 'font-weight': '500' }">
            academic identity verification page
          </router-link>.
        </n-p>
        
        <div style="margin-top: 24px;">
          <n-button type="primary" @click="handleSaveChanges" :loading="isSaving">Save Changes</n-button>
          <n-button @click="isEditing = false" style="margin-left: 10px;">Cancel</n-button>
        </div>
      </n-form>
    </n-card>
  </div>
</template>

<script setup>
import { h, ref, onMounted, computed } from 'vue';
import { NCard, NForm, NFormItem, NInput, NButton, NH2, NP, useMessage, NDescriptions, NDescriptionsItem, NIcon, NText, NDivider, NTag, NSpace } from 'naive-ui';
import { PersonOutline, MailOutline, BusinessOutline, FlaskOutline, LogoGithub, LinkOutline, WalletOutline, KeyOutline, CheckmarkCircleOutline, CloseCircleOutline } from '@vicons/ionicons5';
import { useRouter } from 'vue-router';
import axios from 'axios';

// Script logic remains largely the same, just removing tab-related state
const router = useRouter();
const message = useMessage();
const formRef = ref(null);
const user = ref({});
const profileForm = ref({});
const isEditing = ref(false);
const isSaving = ref(false);
const showSuccessOverlay = ref(false);

const rules = {
  username: { required: true, message: 'Username is required' },
  email: { required: true, type: 'email', message: 'A valid email is required' },
};

const formattedInterests = computed(() => {
  if (!user.value.research_interests) return [];
  try {
    const interests = JSON.parse(user.value.research_interests);
    return Array.isArray(interests) ? interests : [];
  } catch (e) {
    // If it's not a JSON string, it might be a comma-separated string
    if (typeof user.value.research_interests === 'string') {
      return user.value.research_interests.split(',').map(i => i.trim()).filter(Boolean);
    }
    return [];
  }
});

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const userData = JSON.parse(storedUser);
    user.value = userData;
    profileForm.value = { ...userData };
  }
});

const handleSaveChanges = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      isSaving.value = true;
      try {
        const payload = { ...profileForm.value, walletAddress: user.value.wallet_address };
        const { data } = await axios.put('http://localhost:3000/api/auth/profile', payload);
        localStorage.setItem('user', JSON.stringify(data.user));
        user.value = data.user;
        isEditing.value = false;
        showSuccessOverlay.value = true;
      } catch (error) {
        message.error(error.response?.data?.error || 'Failed to save profile');
      } finally {
        isSaving.value = false;
      }
    }
  });
};

const closeSuccessOverlay = () => {
  showSuccessOverlay.value = false;
};

const goToVerification = () => {
  router.push('/verify');
};
</script>

<style scoped>
/* Styles remain the same */
.profile-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20px;
}
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.success-card {
  max-width: 400px;
  text-align: center;
}
.profile-view {
  margin-top: 20px;
}
.n-h2 {
  font-weight: 600;
  margin-bottom: 16px;
  font-size: 1.25rem;
}
.desc-label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.academic-card {
  margin-top: 16px;
}
.verified-state, .unverified-state {
  display: flex;
  align-items: center;
  gap: 12px;
}
.verified-state p, .unverified-state p {
  margin: 0;
}
</style> 