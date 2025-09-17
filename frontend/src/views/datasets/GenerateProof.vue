<template>
  <div class="generate-proof-page">
    <div class="page-header">
      <h1 class="page-title">Generate Zero-Knowledge Proof</h1>
      <p class="page-description">
        Create privacy-preserving proofs for your dataset to enable secure computation without revealing sensitive data.
      </p>
    </div>

    <div class="proof-content">
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

                <div v-if="dataset.zk_proof_id" class="existing-proof">
                  <n-alert type="info" show-icon>
                    <template #icon>
                      <n-icon :component="ShieldCheckmarkOutline" />
                    </template>
                    This dataset already has a ZK proof generated.
                  </n-alert>
                </div>
              </div>
              
              <div v-else class="dataset-loading">
                <n-skeleton text :repeat="3" />
              </div>
            </n-card>
          </div>

          <!-- Right: Proof Generation -->
          <div class="proof-section">
            <n-card title="Proof Configuration" class="config-card">
              <n-form :model="proofConfig" :rules="configRules" ref="configFormRef">
                <n-form-item label="Proof Type" path="proof_type">
                  <n-select
                    v-model:value="proofConfig.proof_type"
                    :options="proofTypeOptions"
                    placeholder="Select proof type"
                  />
                </n-form-item>

                <n-form-item label="Public Inputs" path="public_inputs">
                  <n-dynamic-tags 
                    v-model:value="proofConfig.public_inputs" 
                    :max="10"
                    placeholder="Add public parameters"
                  >
                    <template #input="{ submit, deactivate }">
                      <n-input
                        @blur="deactivate"
                        @keyup.enter="submit"
                        placeholder="e.g., min_value, max_value"
                        size="small"
                      />
                    </template>
                  </n-dynamic-tags>
                </n-form-item>

                <n-form-item label="Computation Circuit">
                  <n-select
                    v-model:value="proofConfig.circuit_type"
                    :options="circuitOptions"
                    placeholder="Select computation circuit"
                  />
                </n-form-item>
              </n-form>
              
              <div class="proof-actions">
                <n-button
                  type="primary"
                  @click="generateProof"
                  :loading="isGenerating"
                  :disabled="!canGenerate"
                  block
                  size="large"
                >
                  <template #icon>
                    <n-icon :component="ShieldCheckmarkOutline" />
                  </template>
                  {{ isGenerating ? 'Generating Proof...' : 'Generate ZK Proof' }}
                </n-button>
              </div>
            </n-card>

            <!-- Progress Section -->
            <n-card v-if="isGenerating || proofResult" title="Generation Progress" class="progress-card">
              <div v-if="isGenerating" class="generation-progress">
                <div class="progress-steps">
                  <div 
                    v-for="(step, index) in generationSteps" 
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

              <div v-if="proofResult" class="proof-result">
                <n-alert type="success" show-icon>
                  <template #icon>
                    <n-icon :component="ShieldCheckmarkOutline" />
                  </template>
                  <template #header>
                    Zero-Knowledge Proof Generated Successfully!
                  </template>
                  Your dataset is now protected with cryptographic proof that enables private computation.
                </n-alert>

                <div class="result-details">
                  <div class="detail-item">
                    <span class="detail-label">Proof ID:</span>
                    <span class="detail-value">{{ proofResult.proof_id }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Verification Key:</span>
                    <span class="detail-value">{{ formatVerificationKey(proofResult.verification_key) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Circuit Hash:</span>
                    <span class="detail-value">{{ proofResult.circuit_hash || 'Generated' }}</span>
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
                    <n-button @click="goToPrivateQuery">
                      Test Private Query
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
  NButton, NIcon, NCard, NForm, NFormItem, NSelect, NDynamicTags, NInput,
  NSpin, NSkeleton, NAlert, NProgress, NSpace, useMessage
} from 'naive-ui'
import {
  DocumentOutline, ShieldCheckmarkOutline, CheckmarkCircleOutline,
  TimeOutline, RefreshOutline
} from '@vicons/ionicons5'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const message = useMessage()

// Reactive data
const dataset = ref({})
const isLoading = ref(true)
const isGenerating = ref(false)
const currentStep = ref(-1)
const proofResult = ref(null)
const currentUser = ref(null)

// Form refs
const configFormRef = ref(null)

// Proof configuration
const proofConfig = ref({
  proof_type: 'privacy',
  public_inputs: [],
  circuit_type: 'privacy_preserving_v1'
})

// Generation steps
const generationSteps = ref([
  { title: 'Preparing Dataset', description: 'Analyzing data structure and constraints' },
  { title: 'Building Circuit', description: 'Creating cryptographic circuit for computation' },
  { title: 'Generating Witnesses', description: 'Computing private witnesses and commitments' },
  { title: 'Creating Proof', description: 'Generating zero-knowledge proof' },
  { title: 'Verification', description: 'Verifying proof validity' }
])

// Computed
const datasetId = computed(() => route.query.dataset_id || route.params.dataset_id)

const progressPercentage = computed(() => {
  if (currentStep.value < 0) return 0
  return Math.min(((currentStep.value + 1) / generationSteps.value.length) * 100, 100)
})

const canGenerate = computed(() => {
  return dataset.value.id && 
         proofConfig.value.proof_type && 
         proofConfig.value.circuit_type && 
         !dataset.value.zk_proof_id &&
         !isGenerating.value
})

// Options
const proofTypeOptions = ref([
  { label: 'Privacy Protection', value: 'privacy' },
  { label: 'Data Integrity', value: 'integrity' },
  { label: 'Computation Correctness', value: 'computation' },
  { label: 'Access Control', value: 'access' }
])

const circuitOptions = ref([
  { label: 'Privacy Preserving V1', value: 'privacy_preserving_v1' },
  { label: 'Statistical Computation', value: 'statistical_v1' },
  { label: 'Range Proof', value: 'range_proof_v1' },
  { label: 'Membership Proof', value: 'membership_v1' }
])

// Form validation
const configRules = {
  proof_type: [
    { required: true, message: 'Please select a proof type', trigger: ['change', 'blur'] }
  ],
  circuit_type: [
    { required: true, message: 'Please select a circuit type', trigger: ['change', 'blur'] }
  ]
}

// Methods

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown'
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i]
}

const formatVerificationKey = (key) => {
  if (!key) return 'N/A'
  return `${key.slice(0, 8)}...${key.slice(-8)}`
}

const generateProof = async () => {
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

  isGenerating.value = true
  currentStep.value = 0
  proofResult.value = null

  try {
    // Simulate step-by-step generation
    for (let i = 0; i < generationSteps.value.length; i++) {
      currentStep.value = i
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate processing time
    }

    // Make actual API call
    const response = await axios.post(`http://localhost:3000/api/datasets/${datasetId.value}/zk-proof`, {
      creator_wallet_address: currentUser.value.wallet_address,
      proof_type: proofConfig.value.proof_type,
      public_inputs: proofConfig.value.public_inputs,
      circuit_type: proofConfig.value.circuit_type
    })

    proofResult.value = response.data
    message.success('Zero-Knowledge Proof generated successfully!')
    
    // Refresh dataset data
    await fetchDataset()
  } catch (error) {
    console.error('Failed to generate ZK proof:', error)
    message.error(error.response?.data?.error || 'Failed to generate proof')
    currentStep.value = -1
  } finally {
    isGenerating.value = false
  }
}

const goToDataset = () => {
  router.push(`/datasets/${datasetId.value}`)
}

const goToPermissions = () => {
  router.push(`/datasets/${datasetId.value}/permissions`)
}

const goToPrivateQuery = () => {
  router.push(`/zkp/private-query?dataset_id=${datasetId.value}`)
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
      message.error('Access denied. You do not have permission to generate proofs for this dataset.')
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
.generate-proof-page {
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

.proof-content {
  min-height: 400px;
}

.content-grid {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 32px;
}

.dataset-section,
.proof-section {
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

.existing-proof {
  margin-top: 16px;
}

.dataset-loading {
  padding: 20px 0;
}

.proof-actions {
  margin-top: 24px;
}

.generation-progress {
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
  background: rgba(56, 139, 253, 0.1);
  border: 1px solid rgba(56, 139, 253, 0.3);
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
  color: #58a6ff;
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

.proof-result {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(46, 160, 67, 0.05);
  border: 1px solid rgba(46, 160, 67, 0.2);
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
  
  .proof-section {
    order: 0;
  }
}

@media (max-width: 768px) {
  .generate-proof-page {
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