<template>
  <div class="proof-page">
    <div class="proof-content">
      <n-spin :show="isLoading">
        <!-- Stats Overview -->
        <div class="stats-grid">
          <n-card 
            class="stat-card" 
            :class="{ active: statusFilter === null }"
            hoverable
            @click="handleStatClick(null)"
          >
            <div class="stat-content">
              <div class="stat-icon">
                <n-icon :component="ShieldCheckmarkOutline" />
              </div>
              <div class="stat-info">
                <h3>{{ totalProofs }}</h3>
                <p>Total Proofs</p>
              </div>
            </div>
          </n-card>

          <n-card 
            class="stat-card" 
            :class="{ active: statusFilter === 'generated' }"
            hoverable
            @click="handleStatClick('generated')"
          >
            <div class="stat-content">
              <div class="stat-icon generated">
                <n-icon :component="CheckmarkCircleOutline" />
              </div>
              <div class="stat-info">
                <h3>{{ generatedCount }}</h3>
                <p>Generated</p>
              </div>
            </div>
          </n-card>

          <n-card 
            class="stat-card" 
            :class="{ active: statusFilter === 'pending' }"
            hoverable
            @click="handleStatClick('pending')"
          >
            <div class="stat-content">
              <div class="stat-icon pending">
                <n-icon :component="RefreshOutline" />
              </div>
              <div class="stat-info">
                <h3>{{ pendingCount }}</h3>
                <p>Pending</p>
              </div>
            </div>
          </n-card>

          <n-card 
            class="stat-card" 
            :class="{ active: statusFilter === 'failed' }"
            hoverable
            @click="handleStatClick('failed')"
          >
            <div class="stat-content">
              <div class="stat-icon failed">
                <n-icon :component="AlertCircleOutline" />
              </div>
              <div class="stat-info">
                <h3>{{ failedCount }}</h3>
                <p>Failed</p>
              </div>
            </div>
          </n-card>
        </div>

        <!-- Filter and Search -->
        <div class="filter-section">
          <div class="filter-controls">
            <n-input
              v-model:value="searchQuery"
              placeholder="Search datasets by name..."
              clearable
              class="search-input"
            >
              <template #prefix>
                <n-icon :component="SearchOutline" />
              </template>
            </n-input>
          </div>
        </div>

        <!-- Datasets List -->
        <div class="datasets-grid">
          <n-card 
            v-for="dataset in filteredDatasets" 
            :key="dataset.id" 
            class="dataset-card"
            :class="getCardClass(dataset.zk_proof_status)"
            hoverable
          >
            <div class="dataset-header">
              <div class="dataset-info">
                <h3 class="dataset-name">{{ dataset.name }}</h3>
                <p class="dataset-description">{{ dataset.description || 'No description provided' }}</p>
              </div>
              <div class="dataset-status">
                <n-tag 
                  :type="getStatusType(dataset.zk_proof_status)" 
                  :bordered="false"
                  size="large"
                >
                  <template #icon>
                    <n-icon :component="getStatusIcon(dataset.zk_proof_status)" />
                  </template>
                  {{ getStatusText(dataset.zk_proof_status) }}
                </n-tag>
              </div>
            </div>

            <div class="dataset-meta">
              <div class="meta-item">
                <n-icon :component="CalendarOutline" class="meta-icon" />
                <span>{{ formatDate(dataset.created_at) }}</span>
              </div>
              <div class="meta-item">
                <n-icon :component="ServerOutline" class="meta-icon" />
                <span>{{ formatFileSize(dataset.file_size) }}</span>
              </div>
              <div class="meta-item">
                <n-icon :component="DocumentOutline" class="meta-icon" />
                <span>{{ dataset.category }}</span>
              </div>
            </div>

                         <div v-if="dataset.zk_proof_status === 'generated' && dataset.zk_proof_id" class="proof-details">
               <div class="proof-info">
                 <div class="proof-item">
                   <span class="proof-label">Proof ID:</span>
                   <span class="proof-value">{{ formatProofId(dataset.zk_proof_id) }}</span>
                 </div>
                 <div v-if="dataset.verification_key" class="proof-item">
                   <span class="proof-label">Verification Key:</span>
                   <span class="proof-value">{{ formatVerificationKey(dataset.verification_key) }}</span>
                 </div>
               </div>
             </div>

                         <div class="dataset-actions">
               <n-button-group size="small">
                 <n-button 
                   v-if="dataset.zk_proof_status === 'pending'"
                   @click.stop="generateProof(dataset)"
                   type="primary"
                 >
                   Generate Proof
                 </n-button>
                 <n-button 
                   v-else-if="dataset.zk_proof_status === 'failed'"
                   @click.stop="retryProof(dataset)"
                   type="warning"
                 >
                   Retry
                 </n-button>
                 <n-button 
                   v-else-if="dataset.zk_proof_status === 'generated'"
                   @click.stop="viewDetails(dataset)"
                   type="primary"
                 >
                   View Details
                 </n-button>
                 <n-button 
                   v-if="dataset.zk_proof_status === 'generated'"
                   @click.stop="testQuery(dataset)"
                   secondary
                 >
                   Test Query
                 </n-button>
               </n-button-group>
             </div>
          </n-card>
        </div>

        <!-- Empty State -->
        <div v-if="!isLoading && filteredDatasets.length === 0" class="empty-state">
          <div class="empty-icon">
            <n-icon :component="ShieldCheckmarkOutline" />
          </div>
          <h3>No ZK-Proof Protected Datasets</h3>
          <p>You don't have any datasets with zero-knowledge proof protection yet.</p>
          <n-button @click="router.push('/datasets/upload')" type="primary">
            Upload Dataset
          </n-button>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NCard, NSpin, NTag, NIcon, NInput, NSelect, NButton, NButtonGroup, useMessage
} from 'naive-ui'
import {
  ShieldCheckmarkOutline, CheckmarkCircleOutline, RefreshOutline, AlertCircleOutline,
  SearchOutline, CalendarOutline, ServerOutline, DocumentOutline, TimeOutline
} from '@vicons/ionicons5'
import axios from 'axios'

const router = useRouter()
const message = useMessage()

// Reactive data
const datasets = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const statusFilter = ref(null)
const currentUser = ref(null)

// Status click handler
const handleStatClick = (status) => {
  statusFilter.value = status
}

// Computed properties
const totalProofs = computed(() => datasets.value.length)

const generatedCount = computed(() => 
  datasets.value.filter(d => d.zk_proof_status === 'generated').length
)

const pendingCount = computed(() => 
  datasets.value.filter(d => ['pending', 'generating'].includes(d.zk_proof_status)).length
)

const failedCount = computed(() => 
  datasets.value.filter(d => d.zk_proof_status === 'failed').length
)

const filteredDatasets = computed(() => {
  let filtered = datasets.value

  // Filter by search query (name only)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(dataset => 
      dataset.name.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (statusFilter.value) {
    if (statusFilter.value === 'pending') {
      // Pending includes both 'pending' and 'generating' statuses
      filtered = filtered.filter(dataset => 
        ['pending', 'generating'].includes(dataset.zk_proof_status)
      )
    } else {
      filtered = filtered.filter(dataset => dataset.zk_proof_status === statusFilter.value)
    }
  }

  return filtered
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
    case 'generated': return 'Generated'
    case 'generating': return 'Generating'
    case 'pending': return 'Pending'
    case 'failed': return 'Failed'
    default: return 'Unknown'
  }
}

const getCardClass = (status) => {
  return `status-${status}`
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString()
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown'
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i]
}

const formatProofId = (proofId) => {
  if (!proofId || typeof proofId !== 'string') return 'N/A'
  if (proofId.length <= 16) return proofId
  return `${proofId.slice(0, 8)}...${proofId.slice(-8)}`
}

const formatVerificationKey = (key) => {
  if (!key || typeof key !== 'string') return 'N/A'
  if (key.length <= 16) return key
  return `${key.slice(0, 8)}...${key.slice(-8)}`
}

const generateProof = (dataset) => {
  router.push(`/proof/generate?dataset_id=${dataset.id}`)
}

const retryProof = (dataset) => {
  router.push(`/proof/generate?dataset_id=${dataset.id}`)
}

const testQuery = (dataset) => {
  router.push(`/zkp/private-query?dataset_id=${dataset.id}`)
}

const viewDetails = (dataset) => {
  router.push(`/proof/details/${dataset.id}`)
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

const fetchZKProofDatasets = async () => {
  if (!currentUser.value?.wallet_address) {
    message.error('Please connect your wallet first')
    return
  }

  isLoading.value = true
  
  try {
    const response = await axios.get(`http://localhost:3000/api/datasets`, {
      params: {
        wallet_address: currentUser.value.wallet_address,
        privacy_level: 'zk_proof_protected'
      }
    })

    // Ensure response.data is an array
    const dataArray = Array.isArray(response.data) ? response.data : []
    
    datasets.value = dataArray.map(dataset => {
      return {
        ...dataset,
        zk_proof_status: dataset.zk_proof_id ? 'generated' : 'pending',
        zk_proof_id: dataset.zk_proof_id ? String(dataset.zk_proof_id) : null,
        verification_key: dataset.verification_key ? String(dataset.verification_key) : null
      }
    })
  } catch (error) {
    console.error('Failed to fetch ZK proof datasets:', error)
    message.error('Failed to load datasets')
    datasets.value = [] // Ensure datasets is an empty array on error
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchCurrentUser()
  await fetchZKProofDatasets()
})
</script>

<style scoped>
.proof-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background-color: #0d1117;
  color: #c9d1d9;
  min-height: 100vh;
}

.proof-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #161b22;
  border: 1px solid #30363d;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: #58a6ff;
  background: rgba(56, 139, 253, 0.05);
}

.stat-card.active {
  border-color: #58a6ff;
  background: rgba(56, 139, 253, 0.1);
  box-shadow: 0 0 0 2px rgba(56, 139, 253, 0.2);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(56, 139, 253, 0.1);
  color: #58a6ff;
  font-size: 24px;
}

.stat-icon.generated {
  background: rgba(46, 160, 67, 0.1);
  color: #2ea043;
}

.stat-icon.pending {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

.stat-icon.failed {
  background: rgba(248, 81, 73, 0.1);
  color: #f85149;
}

.stat-info h3 {
  font-size: 24px;
  font-weight: 700;
  color: #c9d1d9;
  margin: 0;
}

.stat-info p {
  font-size: 14px;
  color: #8b949e;
  margin: 4px 0 0 0;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.datasets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.dataset-card {
  background: #161b22;
  border: 1px solid #30363d;
  transition: all 0.2s ease;
}

.dataset-card:hover {
  border-color: #58a6ff;
  background: rgba(56, 139, 253, 0.05);
}

.dataset-card.status-generated {
  border-left: 4px solid #2ea043;
}

.dataset-card.status-pending {
  border-left: 4px solid #fbbf24;
}

.dataset-card.status-generating {
  border-left: 4px solid #58a6ff;
}

.dataset-card.status-failed {
  border-left: 4px solid #f85149;
}

.dataset-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.dataset-info {
  flex: 1;
}

.dataset-name {
  font-size: 18px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 8px 0;
}

.dataset-description {
  font-size: 14px;
  color: #8b949e;
  margin: 0;
  line-height: 1.4;
}

.dataset-status {
  flex-shrink: 0;
}

.dataset-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8b949e;
}

.meta-icon {
  font-size: 14px;
}

.proof-details {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(46, 160, 67, 0.05);
  border: 1px solid rgba(46, 160, 67, 0.2);
  border-radius: 8px;
}

.proof-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.proof-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.proof-label {
  font-size: 12px;
  color: #8b949e;
  font-weight: 500;
}

.proof-value {
  font-size: 12px;
  color: #c9d1d9;
  font-family: 'Courier New', monospace;
}

.dataset-actions {
  border-top: 1px solid #30363d;
  padding-top: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: #8b949e;
  margin-bottom: 24px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 12px 0;
}

.empty-state p {
  font-size: 16px;
  color: #8b949e;
  margin: 0 0 24px 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .proof-page {
    padding: 16px;
  }
  
  .filter-controls {
    justify-content: center;
  }
  
  .datasets-grid {
    grid-template-columns: 1fr;
  }
  
  .dataset-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .dataset-meta {
    gap: 12px;
  }
}
</style> 