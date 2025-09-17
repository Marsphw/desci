<template>
  <div class="encrypt-dataset-page">
    <div class="page-header">
      <n-button text @click="goBack" class="back-btn">
        <template #icon>
          <n-icon :component="ArrowBackOutline" />
        </template>
        Back to Datasets
      </n-button>
      
      <h1 class="page-title">Encrypt Dataset</h1>
      <p class="page-description">
        Secure your dataset with advanced encryption algorithms to protect sensitive information.
      </p>
    </div>

    <div class="encrypt-content">
      <n-spin :show="isLoading">
        <div class="content-grid">
          <!-- Left: Dataset Info -->
          <div class="dataset-section">
            <n-card title="Dataset Information" class="dataset-card">
              <div v-if="dataset.id" class="dataset-info">
                <div class="info-item">
                  <n-icon :component="DocumentOutline" class="info-icon" />
                  <div class="info-content">
                    <h4>{{ dataset.name }}</h4>
                    <p>{{ dataset.description || 'No description provided' }}</p>
                  </div>
                </div>
                
                <div class="dataset-meta">
                  <div class="meta-item">
                    <span class="meta-label">File Size:</span>
                    <span class="meta-value">{{ formatFileSize(dataset.file_size) }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Privacy Level:</span>
                    <span class="meta-value">{{ dataset.privacy_level }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Category:</span>
                    <span class="meta-value">{{ dataset.category }}</span>
                  </div>
                </div>

                <div v-if="dataset.encryption_status === 'encrypted'" class="existing-encryption">
                  <n-alert type="info" show-icon>
                    <template #icon>
                      <n-icon :component="LockClosedOutline" />
                    </template>
                    This dataset is already encrypted.
                  </n-alert>
                </div>
              </div>
              
              <div v-else class="dataset-loading">
                <n-skeleton text :repeat="3" />
              </div>
            </n-card>
          </div>

          <!-- Right: Encryption Configuration -->
          <div class="encrypt-section">
            <n-card title="Encryption Configuration" class="config-card">
              <n-form :model="encryptConfig" :rules="configRules" ref="configFormRef">
                <n-form-item label="Encryption Algorithm" path="algorithm">
                  <n-select
                    v-model:value="encryptConfig.algorithm"
                    :options="algorithmOptions"
                    placeholder="Select encryption algorithm"
                  />
                </n-form-item>

                <n-form-item label="Key Size" path="key_size">
                  <n-select
                    v-model:value="encryptConfig.key_size"
                    :options="keySizeOptions"
                    placeholder="Select key size"
                  />
                </n-form-item>

                <n-form-item label="Access Control">
                  <n-checkbox-group v-model:value="encryptConfig.access_controls">
                    <n-space item-style="display: flex;" vertical>
                      <n-checkbox value="time_based" label="Time-based Access" />
                      <n-checkbox value="role_based" label="Role-based Access" />
                      <n-checkbox value="multi_signature" label="Multi-signature Required" />
                    </n-space>
                  </n-checkbox-group>
                </n-form-item>

                <n-form-item label="Key Management" path="key_management">
                  <n-radio-group v-model:value="encryptConfig.key_management">
                    <n-space vertical>
                      <n-radio value="self_managed">Self-managed Keys</n-radio>
                      <n-radio value="escrow">Key Escrow Service</n-radio>
                      <n-radio value="multi_party">Multi-party Key Sharing</n-radio>
                    </n-space>
                  </n-radio-group>
                </n-form-item>
              </n-form>
              
              <div class="encrypt-actions">
                <n-button
                  type="primary"
                  @click="encryptDataset"
                  :loading="isEncrypting"
                  :disabled="!canEncrypt"
                  block
                  size="large"
                >
                  <template #icon>
                    <n-icon :component="LockClosedOutline" />
                  </template>
                  {{ isEncrypting ? 'Encrypting Dataset...' : 'Encrypt Dataset' }}
                </n-button>
              </div>
            </n-card>

            <!-- Progress Section -->
            <n-card v-if="isEncrypting || encryptResult" title="Encryption Progress" class="progress-card">
              <div v-if="isEncrypting" class="encryption-progress">
                <div class="progress-steps">
                  <div 
                    v-for="(step, index) in encryptionSteps" 
                    :key="index"
                    :class="['step-item', { active: currentStep >= index, completed: currentStep > index }]"
                  >
                    <div class="step-icon">
                      <n-icon 
                        :component="currentStep > index ? CheckmarkCircleOutline : 
                                   currentStep === index ? RefreshOutline : TimeOutline" 
                      />
                    </div>
                    <div class="step-content">
                      <h4>{{ step.title }}</h4>
                      <p>{{ step.description }}</p>
                    </div>
                  </div>
                </div>

                <n-progress 
                  type="line" 
                  :percentage="progressPercentage" 
                  :show-indicator="true"
                  processing
                  style="margin-top: 24px;"
                />
              </div>

              <div v-if="encryptResult" class="encrypt-result">
                <n-alert type="success" show-icon>
                  <template #icon>
                    <n-icon :component="LockClosedOutline" />
                  </template>
                  <template #header>
                    Dataset Encrypted Successfully!
                  </template>
                  Your dataset is now securely encrypted and protected from unauthorized access.
                </n-alert>

                <div class="result-details">
                  <div class="detail-item">
                    <span class="detail-label">Encryption ID:</span>
                    <span class="detail-value">{{ encryptResult.encryption_id }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Algorithm:</span>
                    <span class="detail-value">{{ encryptResult.algorithm }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Key Fingerprint:</span>
                    <span class="detail-value">{{ formatKeyFingerprint(encryptResult.key_fingerprint) }}</span>
                  </div>
                </div>

                <div class="next-actions">
                  <n-space>
                    <n-button @click="goToDataset" type="primary">
                      View Dataset
                    </n-button>
                    <n-button @click="goToPermissions">
                      Set Permissions
                    </n-button>
                    <n-button @click="downloadKeyBackup">
                      Download Key Backup
                    </n-button>
                  </n-space>
                </div>
              </div>
            </n-card>
          </div>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  NButton, NIcon, NCard, NForm, NFormItem, NSelect, NCheckboxGroup, NCheckbox,
  NRadioGroup, NRadio, NSpin, NSkeleton, NAlert, NProgress, NSpace, useMessage
} from 'naive-ui'
import {
  ArrowBackOutline, DocumentOutline, LockClosedOutline, CheckmarkCircleOutline,
  TimeOutline, RefreshOutline
} from '@vicons/ionicons5'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const message = useMessage()

// Reactive data
const dataset = ref({})
const isLoading = ref(true)
const isEncrypting = ref(false)
const currentStep = ref(-1)
const encryptResult = ref(null)
const currentUser = ref(null)

// Form refs
const configFormRef = ref(null)

// Encryption configuration
const encryptConfig = ref({
  algorithm: 'AES-256-GCM',
  key_size: 256,
  access_controls: [],
  key_management: 'self_managed'
})

// Encryption steps
const encryptionSteps = ref([
  { title: 'Preparing Dataset', description: 'Analyzing data structure and preparing for encryption' },
  { title: 'Generating Keys', description: 'Creating encryption keys and certificates' },
  { title: 'Encrypting Data', description: 'Applying encryption algorithm to dataset' },
  { title: 'Key Management Setup', description: 'Setting up key management and access controls' },
  { title: 'Verification', description: 'Verifying encryption integrity and completeness' }
])

// Computed
const datasetId = computed(() => route.query.dataset_id || route.params.dataset_id)

const progressPercentage = computed(() => {
  if (currentStep.value < 0) return 0
  return Math.min(((currentStep.value + 1) / encryptionSteps.value.length) * 100, 100)
})

const canEncrypt = computed(() => {
  return dataset.value.id && 
         encryptConfig.value.algorithm && 
         encryptConfig.value.key_size && 
         encryptConfig.value.key_management &&
         dataset.value.encryption_status !== 'encrypted' &&
         !isEncrypting.value
})

// Options
const algorithmOptions = ref([
  { label: 'AES-256-GCM (Recommended)', value: 'AES-256-GCM' },
  { label: 'AES-192-GCM', value: 'AES-192-GCM' },
  { label: 'ChaCha20-Poly1305', value: 'ChaCha20-Poly1305' },
  { label: 'RSA-4096', value: 'RSA-4096' }
])

const keySizeOptions = ref([
  { label: '128 bits', value: 128 },
  { label: '192 bits', value: 192 },
  { label: '256 bits (Recommended)', value: 256 },
  { label: '512 bits', value: 512 }
])

// Form validation
const configRules = {
  algorithm: [
    { required: true, message: 'Please select an encryption algorithm', trigger: ['change', 'blur'] }
  ],
  key_size: [
    { required: true, message: 'Please select a key size', trigger: ['change', 'blur'] }
  ],
  key_management: [
    { required: true, message: 'Please select key management option', trigger: ['change', 'blur'] }
  ]
}

// Methods
const goBack = () => {
  if (datasetId.value) {
    router.push(`/datasets/${datasetId.value}`)
  } else {
    router.push('/datasets')
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown'
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i]
}

const formatKeyFingerprint = (fingerprint) => {
  if (!fingerprint) return 'N/A'
  return `${fingerprint.slice(0, 8)}...${fingerprint.slice(-8)}`
}

const encryptDataset = async () => {
  try {
    await configFormRef.value?.validate()
  } catch (error) {
    message.error('Please fill in all required fields')
    return
  }

  if (!currentUser.value?.wallet_address) {
    message.error('Please connect your wallet first')
    return
  }

  isEncrypting.value = true
  currentStep.value = 0
  encryptResult.value = null

  try {
    // Simulate step-by-step encryption
    for (let i = 0; i < encryptionSteps.value.length; i++) {
      currentStep.value = i
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    // Make actual API call
    const response = await axios.post(`http://localhost:3000/api/datasets/${datasetId.value}/encrypt`, {
      creator_wallet_address: currentUser.value.wallet_address,
      algorithm: encryptConfig.value.algorithm,
      key_size: encryptConfig.value.key_size,
      access_controls: encryptConfig.value.access_controls,
      key_management: encryptConfig.value.key_management
    })

    encryptResult.value = response.data
    message.success('Dataset encrypted successfully!')
    
    // Refresh dataset data
    await fetchDataset()
  } catch (error) {
    console.error('Failed to encrypt dataset:', error)
    message.error(error.response?.data?.error || 'Failed to encrypt dataset')
    currentStep.value = -1
  } finally {
    isEncrypting.value = false
  }
}

const goToDataset = () => {
  router.push(`/datasets/${datasetId.value}`)
}

const goToPermissions = () => {
  router.push(`/datasets/${datasetId.value}/permissions`)
}

const downloadKeyBackup = () => {
  // Create a mock key backup file
  const keyData = {
    dataset_id: datasetId.value,
    encryption_id: encryptResult.value?.encryption_id,
    algorithm: encryptResult.value?.algorithm,
    key_fingerprint: encryptResult.value?.key_fingerprint,
    created_at: new Date().toISOString(),
    warning: 'Keep this file secure and never share it with unauthorized parties'
  }
  
  const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `encryption-key-backup-${datasetId.value}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  message.success('Key backup downloaded successfully')
}

const fetchCurrentUser = async () => {
  try {
    const userData = localStorage.getItem('user')
    if (userData) {
      currentUser.value = JSON.parse(userData)
    }
  } catch (error) {
    console.error('Failed to get current user:', error)
  }
}

const fetchDataset = async () => {
  if (!datasetId.value) {
    message.error('No dataset ID provided')
    router.push('/datasets')
    return
  }

  try {
    const params = currentUser.value?.wallet_address 
      ? `?wallet_address=${currentUser.value.wallet_address}` 
      : ''
    
    const response = await axios.get(`http://localhost:3000/api/datasets/${datasetId.value}${params}`)
    dataset.value = response.data
  } catch (error) {
    console.error('Failed to fetch dataset:', error)
    message.error('Failed to load dataset')
    
    if (error.response?.status === 403) {
      message.error('Access denied. You do not have permission to encrypt this dataset.')
    } else if (error.response?.status === 404) {
      message.error('Dataset not found')
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchCurrentUser()
  await fetchDataset()
})
</script>

<style scoped>
.encrypt-dataset-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background-color: #0d1117;
  color: #c9d1d9;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
}

.back-btn {
  color: #8b949e;
  margin-bottom: 16px;
}

.back-btn:hover {
  color: #58a6ff;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #c9d1d9;
  margin: 0 0 8px 0;
}

.page-description {
  color: #8b949e;
  font-size: 16px;
  margin: 0;
}

.encrypt-content {
  min-height: 400px;
}

.content-grid {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 32px;
}

.dataset-section,
.encrypt-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dataset-card,
.config-card,
.progress-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.dataset-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-icon {
  font-size: 24px;
  color: #58a6ff;
  margin-top: 4px;
}

.info-content h4 {
  font-size: 18px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 4px 0;
}

.info-content p {
  font-size: 14px;
  color: #8b949e;
  margin: 0;
  line-height: 1.5;
}

.dataset-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(48, 54, 61, 0.3);
  border-radius: 8px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-label {
  font-size: 14px;
  color: #8b949e;
  font-weight: 500;
}

.meta-value {
  font-size: 14px;
  color: #c9d1d9;
  font-weight: 500;
}

.existing-encryption {
  margin-top: 16px;
}

.dataset-loading {
  padding: 20px 0;
}

.encrypt-actions {
  margin-top: 24px;
}

.encryption-progress {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.step-item.active {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.step-item.completed {
  background: rgba(46, 160, 67, 0.1);
  border: 1px solid rgba(46, 160, 67, 0.3);
}

.step-icon {
  font-size: 20px;
  color: #8b949e;
}

.step-item.active .step-icon {
  color: #ffc107;
}

.step-item.completed .step-icon {
  color: #2ea043;
}

.step-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 4px 0;
}

.step-content p {
  font-size: 14px;
  color: #8b949e;
  margin: 0;
}

.encrypt-result {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 193, 7, 0.05);
  border: 1px solid rgba(255, 193, 7, 0.2);
  border-radius: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 14px;
  color: #8b949e;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #c9d1d9;
  font-family: 'Courier New', monospace;
}

.next-actions {
  padding-top: 16px;
  border-top: 1px solid #30363d;
}

/* Responsive design */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .dataset-section {
    order: 1;
  }
  
  .encrypt-section {
    order: 0;
  }
}

@media (max-width: 768px) {
  .encrypt-dataset-page {
    padding: 16px;
  }
  
  .progress-steps {
    gap: 12px;
  }
  
  .step-item {
    padding: 8px;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style> 