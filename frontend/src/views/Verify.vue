<template>
  <div class="verify-page">
    <n-card class="verify-card" :bordered="false">
      <n-grid :cols="1" y-gap="32">
        <n-gi>
          <n-card hoverable class="option-card large-card">
            <div class="large-card-content">
              <n-icon :component="BeakerOutline" size="40" />
              <div class="text-content">
                <h2>Set Research Interests</h2>
                <p>Update your profile with your specific fields of study to help us recommend relevant content.</p>
              </div>
              <n-button @click="toggleInterestEditMode" type="primary" class="add-button" :loading="isSavingInterests">
                {{ isEditingInterests ? 'Close' : 'Set' }}
              </n-button>
            </div>
            <div class="interest-section">
              <div v-if="isEditingInterests" class="interest-input-wrapper">
                <n-input
                  v-model:value="newInterest"
                  placeholder="Enter an interest and press Enter"
                  @keydown.enter.prevent="addInterest"
                />
              </div>
              <n-list v-if="interests.length > 0" bordered class="interest-list">
                <n-list-item v-for="(interest, index) in interests" :key="index">
                  {{ interest }}
                  <template #suffix>
                    <n-popconfirm v-if="isEditingInterests" @positive-click="removeInterest(index)">
                      <template #trigger>
                        <n-button text style="color: #e88080;"><n-icon :component="TrashOutline" /></n-button>
                      </template>
                      Are you sure you want to delete this interest?
                    </n-popconfirm>
                  </template>
                </n-list-item>
              </n-list>
            </div>
          </n-card>
        </n-gi>
        
        <n-gi>
          <n-divider>verify with one of the following methods</n-divider>
        </n-gi>

        <n-gi>
          <n-grid x-gap="24" y-gap="24" :cols="3">
            <n-gi>
              <n-card hoverable class="option-card" @click="openVerificationModal('upload')">
                <template #header>
                  <n-tag type="info" :bordered="false">Option 1</n-tag>
                  <n-icon :component="CloudUploadOutline" size="32" />
                  <h3>Upload Academic Proof</h3>
                </template>
                Submit a document as proof of your academic affiliation.
              </n-card>
            </n-gi>
            <n-gi>
              <n-card hoverable class="option-card" @click="openVerificationModal('orcid')">
                <template #header>
                  <n-tag type="info" :bordered="false">Option 2</n-tag>
                  <n-icon :component="Orcid" size="32" />
                  <h3>Connect with ORCID</h3>
                </template>
                Link your ORCID iD for secure verification.
              </n-card>
            </n-gi>
            <n-gi>
              <n-card hoverable class="option-card" @click="openVerificationModal('email')">
                <template #header>
                  <n-tag type="info" :bordered="false">Option 3</n-tag>
                  <n-icon :component="SchoolOutline" size="32" />
                  <h3>Verify with Institutional Email</h3>
                </template>
                Use an email from a recognized academic institution.
              </n-card>
            </n-gi>
          </n-grid>
        </n-gi>
      </n-grid>
    </n-card>

    <n-modal v-model:show="showModal" preset="card" :style="{ width: '600px' }" :title="modalTitle">
      <div v-if="selectedMethod === 'upload'">
        <p>Please upload your academic proof (e.g., student ID, degree certificate).</p>
        <n-upload action="#" :max="1">
          <n-button>Select File</n-button>
        </n-upload>
      </div>
      <div v-if="selectedMethod === 'orcid'">
        <p>You will be redirected to the ORCID website to authenticate and authorize the connection.</p>
        <n-button type="primary" @click="handleOrcidVerification">Proceed to ORCID</n-button>
      </div>
      <div v-if="selectedMethod === 'email'">
        <p>Enter your institutional email address to receive a verification link.</p>
        <n-input placeholder="e.g., your.name@edu.ac.me" />
        <n-button type="primary" style="margin-top: 12px;">Send Verification Email</n-button>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { NCard, NGrid, NGi, NIcon, NDivider, NTag, NModal, NUpload, NButton, NInput, NList, NListItem, NPopconfirm, useMessage } from 'naive-ui';
import { BeakerOutline, CloudUploadOutline, SchoolOutline, TrashOutline } from '@vicons/ionicons5';
import { Orcid } from '@vicons/fa';
import { useRouter } from 'vue-router';
import axios from 'axios';

const message = useMessage();
const showModal = ref(false);
const selectedMethod = ref(null);

const user = ref(null);
const newInterest = ref('');
const interests = ref([]);
const isEditingInterests = ref(false);
const isSavingInterests = ref(false);

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
    try {
      if (user.value.research_interests && typeof user.value.research_interests === 'string') {
        interests.value = JSON.parse(user.value.research_interests);
      } else if (Array.isArray(user.value.research_interests)) {
        interests.value = user.value.research_interests;
      } else {
        interests.value = [];
      }
    } catch (e) {
      interests.value = [];
    }
  }
});

const handleOrcidVerification = () => {
  if (user.value && user.value.wallet_address) {
    window.location.href = `http://localhost:3000/api/auth/orcid?walletAddress=${user.value.wallet_address}`;
  } else {
    message.error('Wallet address not found. Please connect your wallet.');
  }
};

const addInterest = () => {
  if (newInterest.value.trim()) {
    interests.value.unshift(newInterest.value.trim());
    newInterest.value = '';
  }
};

const removeInterest = (index) => {
  interests.value.splice(index, 1);
};

const saveInterests = async () => {
  isSavingInterests.value = true;
  try {
    const payload = {
      walletAddress: user.value.wallet_address,
      interests: interests.value
    };
    const { data } = await axios.put('http://localhost:3000/api/auth/interests', payload);
    localStorage.setItem('user', JSON.stringify(data.user));
    user.value = data.user; // Update local user state
    message.success('Research interests updated successfully!');
  } catch (error) {
    message.error(error.response?.data?.error || 'Failed to update interests');
  } finally {
    isSavingInterests.value = false;
  }
};

const toggleInterestEditMode = () => {
  if (isEditingInterests.value) {
    saveInterests();
  }
  isEditingInterests.value = !isEditingInterests.value;
};

const modalTitle = computed(() => {
  switch (selectedMethod.value) {
    case 'upload': return 'Upload Academic Proof';
    case 'orcid': return 'Connect with ORCID';
    case 'email': return 'Verify with Institutional Email';
    default: return 'Verification';
  }
});

const openVerificationModal = (method) => {
  selectedMethod.value = method;
  showModal.value = true;
};
</script>

<style scoped>
.verify-page {
  padding: 48px;
  background-color: #101014;
}
.verify-card {
  background-color: transparent;
}
.large-card {
  cursor: pointer;
}
.large-card-content {
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
}
.large-card .text-content h2 {
  margin: 0 0 8px 0;
}
.large-card .text-content p {
  margin: 0;
  color: #a0a0a0;
}
.option-card {
  cursor: pointer;
  text-align: center;
  height: 100%;
}
.option-card .n-tag {
  position: absolute;
  top: 12px;
  left: 12px;
}
.option-card h3 {
  margin-top: 12px;
  font-size: 1.1rem;
}
.add-button {
  margin-left: auto;
}
.interest-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #2d2d2d;
}
.interest-input-wrapper {
  margin-bottom: 16px;
}
.interest-list {
  margin-top: 16px;
}
</style> 