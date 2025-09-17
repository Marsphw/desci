<template>
  <div class="proof-details-page">
    <div class="page-header">
      <h1 class="page-title">Zero-Knowledge Proof Details</h1>
      <p class="page-description">
        Detailed information about the zero-knowledge proof for this dataset
      </p>
    </div>

    <div class="proof-details-content">
      <n-spin :show="isLoading">
        <div class="details-grid">
          <!-- Dataset Information -->
          <div class="section">
            <n-card title="Dataset Information" class="info-card">
              <div v-if="dataset.id" class="dataset-info">
                <div class="info-item">
                  <n-icon :component="DocumentOutline" class="info-icon" />
                  <div class="info-content">
                    <h4>{{ dataset.name }}</h4>
                    <p>{{ dataset.description || 'No description provided' }}</p>
                  </div>
                </div>
                
                <div class="dataset-meta">
                  <div class="meta-row">
                    <span class="meta-label">File Size:</span>
                    <span class="meta-value">{{ formatFileSize(dataset.file_size) }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Privacy Level:</span>
                    <span class="meta-value">{{ dataset.privacy_level }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Category:</span>
                    <span class="meta-value">{{ dataset.category }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Created:</span>
                    <span class="meta-value">{{ formatDate(dataset.created_at) }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Status:</span>
                    <n-tag :type="getStatusType(proofStatus)" size="medium">
                      <template #icon>
                        <n-icon :component="getStatusIcon(proofStatus)" />
                      </template>
                      {{ getStatusText(proofStatus) }}
                    </n-tag>
                  </div>
                </div>
              </div>
              
              <div v-else class="loading-skeleton">
                <n-skeleton text :repeat="4" />
              </div>
            </n-card>
          </div>

          <!-- Proof Information -->
          <div class="section">
            <n-card title="Proof Information" class="info-card">
              <div v-if="proofInfo.proof_id" class="proof-info">
                <div class="proof-status-banner" :class="proofStatus">
                  <n-icon :component="getStatusIcon(proofStatus)" class="status-icon" />
                  <div class="status-content">
                    <h3>{{ getStatusText(proofStatus) }}</h3>
                    <p>{{ getStatusDescription(proofStatus) }}</p>
                  </div>
                </div>

                <div class="proof-details-grid">
                  <div class="detail-item">
                    <span class="detail-label">Proof ID</span>
                    <div class="detail-value">
                      <span class="code-text">{{ proofInfo.proof_id }}</span>
                      <n-button size="tiny" @click="copyToClipboard(proofInfo.proof_id)">
                        <template #icon>
                          <n-icon :component="CopyOutline" />
                        </template>
                      </n-button>
                    </div>
                  </div>

                  <div class="detail-item" v-if="proofInfo.verification_key">
                    <span class="detail-label">Verification Key</span>
                    <div class="detail-value">
                      <span class="code-text">{{ proofInfo.verification_key }}</span>
                      <n-button size="tiny" @click="copyToClipboard(proofInfo.verification_key)">
                        <template #icon>
                          <n-icon :component="CopyOutline" />
                        </template>
                      </n-button>
                    </div>
                  </div>

                  <div class="detail-item" v-if="proofInfo.circuit_hash">
                    <span class="detail-label">Circuit Hash</span>
                    <div class="detail-value">
                      <span class="code-text">{{ proofInfo.circuit_hash }}</span>
                      <n-button size="tiny" @click="copyToClipboard(proofInfo.circuit_hash)">
                        <template #icon>
                          <n-icon :component="CopyOutline" />
                        </template>
                      </n-button>
                    </div>
                  </div>

                  <div class="detail-item" v-if="proofInfo.proof_type">
                    <span class="detail-label">Proof Type</span>
                    <span class="detail-value">{{ formatProofType(proofInfo.proof_type) }}</span>
                  </div>

                  <div class="detail-item" v-if="proofInfo.circuit_type">
                    <span class="detail-label">Circuit Type</span>
                    <span class="detail-value">{{ formatCircuitType(proofInfo.circuit_type) }}</span>
                  </div>

                  <div class="detail-item" v-if="proofInfo.created_at">
                    <span class="detail-label">Generated At</span>
                    <span class="detail-value">{{ formatDateTime(proofInfo.created_at) }}</span>
                  </div>
                </div>

                               <div v-if="proofInfo.public_inputs && proofInfo.public_inputs.length > 0" class="public-inputs">
                 <h4>Public Inputs</h4>
                 <div class="inputs-list">
                   <n-tag v-for="input in proofInfo.public_inputs" :key="input" size="small">
                     {{ input }}
                   </n-tag>
                 </div>
               </div>
             </div>
             
             <div v-else class="loading-skeleton">
               <n-skeleton text :repeat="3" />
             </div>
            </n-card>
          </div>
        </div>

        <!-- Actions Section -->
        <div v-if="proofStatus === 'generated'" class="actions-section">
          <n-card title="Available Actions" class="actions-card">
            <div class="actions-grid">
              <n-button @click="testPrivateQuery" type="primary" size="large">
                <template #icon>
                  <n-icon :component="SearchOutline" />
                </template>
                Test Private Query
              </n-button>
              
              <n-button @click="downloadProof" secondary size="large">
                <template #icon>
                  <n-icon :component="DownloadOutline" />
                </template>
                Download Proof
              </n-button>
              
              <n-button @click="viewDataset" secondary size="large">
                <template #icon>
                  <n-icon :component="DocumentOutline" />
                </template>
                View Dataset
              </n-button>

              <n-button @click="regenerateProof" secondary size="large">
                <template #icon>
                  <n-icon :component="RefreshOutline" />
                </template>
                Regenerate Proof
              </n-button>
            </div>
          </n-card>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  NButton, NIcon, NCard, NSpin, NSkeleton, NTag, useMessage
} from 'naive-ui'
import {
  ArrowBackOutline, DocumentOutline, ShieldCheckmarkOutline, CheckmarkCircleOutline,
  TimeOutline, AlertCircleOutline, CopyOutline, SearchOutline, DownloadOutline, RefreshOutline
} from '@vicons/ionicons5'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const message = useMessage()

// Reactive data
const dataset = ref({})
const proofInfo = ref({})
const isLoading = ref(true)
const currentUser = ref(null)

// Computed properties
const datasetId = computed(() => route.params.dataset_id)

const proofStatus = computed(() => {
  if (proofInfo.value.proof_id) return 'generated'
  if (dataset.value.privacy_level === 'zk_proof_protected') return 'pending'
  return 'unknown'
})

// Methods
const getStatusType = (status) => {
  switch (status) {
    case 'generated': return 'success'
    case 'generating': return 'info'
    case 'pending': return 'warning'
    case 'failed': return 'error'
    default: return 'default'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'generated': return CheckmarkCircleOutline
    case 'generating': return RefreshOutline
    case 'pending': return TimeOutline
    case 'failed': return AlertCircleOutline
    default: return ShieldCheckmarkOutline
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'generated': return 'Proof Generated'
    case 'generating': return 'Generating Proof'
    case 'pending': return 'Proof Pending'
    case 'failed': return 'Generation Failed'
    default: return 'Unknown Status'
  }
}

const getStatusDescription = (status) => {
  switch (status) {
    case 'generated': return 'Zero-knowledge proof has been successfully generated and verified.'
    case 'generating': return 'Zero-knowledge proof generation is currently in progress.'
    case 'pending': return 'Dataset is configured for ZK proof protection but proof has not been generated yet.'
    case 'failed': return 'Proof generation encountered an error and needs to be retried.'
    default: return 'Status information unavailable.'
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown'
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString()
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleString()
}

const formatProofType = (type) => {
  const types = {
    'privacy': 'Privacy Protection',
    'integrity': 'Data Integrity',
    'computation': 'Computation Correctness',
    'access': 'Access Control'
  }
  return types[type] || type
}

const formatCircuitType = (type) => {
  const types = {
    'privacy_preserving_v1': 'Privacy Preserving V1',
    'statistical_v1': 'Statistical Computation',
    'range_proof_v1': 'Range Proof V1',
    'membership_v1': 'Membership Proof'
  }
  return types[type] || type
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success('Copied to clipboard')
  } catch (error) {
    message.error('Failed to copy to clipboard')
  }
}

const generateProof = () => {
  router.push(`/proof/generate?dataset_id=${datasetId.value}`)
}

const testPrivateQuery = () => {
  router.push(`/zkp/private-query?dataset_id=${datasetId.value}`)
}

const viewDataset = () => {
  router.push(`/datasets/${datasetId.value}`)
}

const regenerateProof = () => {
  router.push(`/proof/generate?dataset_id=${datasetId.value}`)
}

const downloadProof = async () => {
  try {
    const response = await axios.get(`http://localhost:3000/api/datasets/${datasetId.value}/zk-proof/download`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `zk-proof-${datasetId.value}.json`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    message.success('Proof downloaded successfully')
  } catch (error) {
    console.error('Failed to download proof:', error)
    message.error('Failed to download proof')
  }
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

const fetchDatasetAndProof = async () => {
  if (!datasetId.value) {
    message.error('No dataset ID provided')
    router.push('/proof')
    return
  }

  try {
    const params = currentUser.value?.wallet_address 
      ? `?wallet_address=${currentUser.value.wallet_address}` 
      : ''
    
    // Fetch dataset details
    const datasetResponse = await axios.get(`http://localhost:3000/api/datasets/${datasetId.value}${params}`)
    dataset.value = datasetResponse.data

    // Fetch proof details if proof exists
    if (datasetResponse.data.zk_proof_id) {
      try {
        const proofResponse = await axios.get(`http://localhost:3000/api/datasets/${datasetId.value}/zk-proof${params}`)
        proofInfo.value = proofResponse.data
      } catch (proofError) {
        console.warn('Failed to fetch proof details:', proofError)
        // Don't show error for proof details as it's optional
      }
    }
  } catch (error) {
    console.error('Failed to fetch dataset and proof:', error)
    message.error('Failed to load dataset information')
    
    if (error.response?.status === 403) {
      message.error('Access denied. You do not have permission to view this dataset.')
    } else if (error.response?.status === 404) {
      message.error('Dataset not found')
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchCurrentUser()
  await fetchDatasetAndProof()
})
</script>

<style scoped>
.proof-details-page {
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

.proof-details-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.info-card {
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
  gap: 12px;
  padding: 16px;
  background: rgba(48, 54, 61, 0.3);
  border-radius: 8px;
}

.meta-row {
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

.proof-status-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.proof-status-banner.generated {
  background: rgba(46, 160, 67, 0.1);
  border: 1px solid rgba(46, 160, 67, 0.3);
}

.proof-status-banner.pending {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.proof-status-banner.failed {
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid rgba(248, 81, 73, 0.3);
}

.status-icon {
  font-size: 32px;
}

.proof-status-banner.generated .status-icon {
  color: #2ea043;
}

.proof-status-banner.pending .status-icon {
  color: #fbbf24;
}

.proof-status-banner.failed .status-icon {
  color: #f85149;
}

.status-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 4px 0;
}

.status-content p {
  font-size: 14px;
  color: #8b949e;
  margin: 0;
}

.proof-details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(48, 54, 61, 0.3);
  border-radius: 8px;
}

.detail-label {
  font-size: 12px;
  color: #8b949e;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #c9d1d9;
}

.code-text {
  font-family: 'Courier New', monospace;
  background: rgba(48, 54, 61, 0.5);
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
  flex: 1;
}

.public-inputs {
  margin-top: 24px;
}

.public-inputs h4 {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 12px 0;
}

.inputs-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}



.actions-section {
  margin-top: 24px;
}

.actions-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.loading-skeleton {
  padding: 20px 0;
}

/* Responsive design */
@media (max-width: 1024px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .proof-details-page {
    padding: 16px;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .proof-status-banner {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .detail-value {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style> 