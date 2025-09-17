<template>
  <div class="datasets-page">
    <div class="page-header">
      <div class="header-content">
        <n-button type="primary" @click="goToUpload" class="upload-btn">
          <template #icon>
            <n-icon :component="CloudUploadOutline" />
          </template>
          Upload Dataset
        </n-button>
      </div>
      
      <div class="page-description">
        Manage your research datasets with privacy protection and secure sharing capabilities.
      </div>
    </div>

    <div class="filters-section">
      <div class="filter-controls">
        <n-input 
          v-model:value="searchQuery" 
          placeholder="Search datasets..." 
          clearable 
          class="search-input"
          @input="applyFilters"
        >
          <template #prefix>
            <n-icon :component="SearchOutline" />
          </template>
        </n-input>
        
        <n-select
          v-model:value="selectedCategory"
          placeholder="Category"
          :options="categoryOptions"
          clearable
          style="width: 150px"
          @update:value="applyFilters"
        />
        
        <n-select
          v-model:value="selectedPrivacyLevel"
          placeholder="Privacy Level"
          :options="privacyOptions"
          clearable
          style="width: 160px"
          @update:value="applyFilters"
        />
        
        <n-select
          v-model:value="selectedStatus"
          placeholder="Status"
          :options="statusOptions"
          clearable
          style="width: 130px"
          @update:value="applyFilters"
        />
        
        <n-button 
          v-if="hasActiveFilters" 
          text 
          @click="clearFilters"
          class="clear-filters"
        >
          Clear Filters
        </n-button>
      </div>
    </div>

    <div class="datasets-content">
      <n-spin :show="isLoading">
        <div v-if="filteredDatasets.length === 0 && !isLoading" class="empty-state">
          <n-empty v-if="!currentUser?.wallet_address" description="Please connect your wallet to view your datasets">
            <template #icon>
              <n-icon :component="DocumentTextOutline" size="48" />
            </template>
            <template #extra>
              <n-button type="primary" @click="$router.push('/dashboard')">
                Go to Dashboard
              </n-button>
            </template>
          </n-empty>
          
          <n-empty v-else description="No datasets found">
            <template #icon>
              <n-icon :component="DocumentTextOutline" size="48" />
            </template>
            <template #extra>
              <n-button type="primary" @click="goToUpload">
                Upload Your First Dataset
              </n-button>
            </template>
          </n-empty>
        </div>
        
        <div v-else class="datasets-grid">
          <n-card
            v-for="dataset in filteredDatasets"
            :key="dataset.id"
            class="dataset-card"
            hoverable
            @click="goToDataset(dataset.id)"
          >
            <template #header>
              <div class="dataset-header">
                <div class="dataset-title">
                  <n-icon :component="getDatasetIcon(dataset)" class="dataset-icon" />
                  <span class="dataset-name">{{ dataset.name }}</span>
                </div>
                <div class="dataset-actions" @click.stop>
                  <n-dropdown :options="getDatasetActions(dataset)" @select="handleAction($event, dataset)">
                    <n-button text size="small">
                      <n-icon :component="EllipsisVerticalOutline" />
                    </n-button>
                  </n-dropdown>
                </div>
              </div>
            </template>
            
            <div class="dataset-info">
              <p class="dataset-description">{{ dataset.description || 'No description provided' }}</p>
              
              <div class="dataset-meta">
                <div class="meta-row">
                  <div class="meta-item">
                    <n-icon :component="DocumentOutline" />
                    <span>{{ formatFileSize(dataset.file_size) }}</span>
                  </div>
                  <div class="meta-item">
                    <n-icon :component="CalendarOutline" />
                    <span>{{ formatDate(dataset.created_at) }}</span>
                  </div>
                </div>
                
                <div class="meta-row">
                  <div class="meta-item">
                    <n-icon :component="EyeOutline" />
                    <span>{{ dataset.access_count }} views</span>
                  </div>
                  <div class="meta-item">
                    <n-icon :component="DownloadOutline" />
                    <span>{{ dataset.download_count }} downloads</span>
                  </div>
                </div>
              </div>
              
              <div class="dataset-tags">
                <n-tag :type="getStatusType(dataset.status)" size="small" class="status-tag">
                  <template #icon>
                    <n-icon :component="getStatusIcon(dataset.status)" />
                  </template>
                  {{ getStatusLabel(dataset.status) }}
                </n-tag>
                
                <n-tag :type="getPrivacyType(dataset.effective_privacy_level)" size="small">
                  <template #icon>
                    <n-icon :component="getPrivacyIcon(dataset.effective_privacy_level)" />
                  </template>
                  {{ getPrivacyLabel(dataset.effective_privacy_level) }}
                </n-tag>
                
                <n-tag v-if="dataset.zk_proof_id" type="success" size="small">
                  <template #icon>
                    <n-icon :component="ShieldCheckmarkOutline" />
                  </template>
                  ZK Protected
                </n-tag>
                
                <n-tag type="info" size="small" v-if="dataset.category !== 'Other'">
                  {{ dataset.category }}
                </n-tag>
              </div>
            </div>
          </n-card>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NButton, NIcon, NInput, NSelect, NCard, NTag, NDropdown, NSpin, NEmpty, useMessage, useDialog 
} from 'naive-ui'
import {
  CloudUploadOutline, SearchOutline, DocumentTextOutline, DocumentOutline,
  CalendarOutline, EyeOutline, DownloadOutline, EllipsisVerticalOutline,
  TimeOutline, CheckmarkCircleOutline, AlertCircleOutline, LockClosedOutline,
  GlobeOutline, ShieldCheckmarkOutline, KeyOutline, SettingsOutline,
  TrashOutline, AnalyticsOutline, ShareOutline, ServerOutline,
  DocumentAttachOutline, GridOutline, CreateOutline
} from '@vicons/ionicons5'
import axios from 'axios'
import dayjs from 'dayjs'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

// Reactive data
const datasets = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref(null)
const selectedPrivacyLevel = ref(null)
const selectedStatus = ref(null)

// User data
const currentUser = ref(null)

// Filter options
const categoryOptions = ref([
  { label: 'Research Data', value: 'Research' },
  { label: 'Healthcare', value: 'Healthcare' },
  { label: 'Finance', value: 'Finance' },
  { label: 'AI/ML', value: 'AI' },
  { label: 'IoT', value: 'IoT' },
  { label: 'Other', value: 'Other' }
])

const privacyOptions = ref([
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Encrypted', value: 'encrypted' },
  { label: 'Privacy Protected', value: 'privacy_protected' }
])

const statusOptions = ref([
  { label: 'Processing', value: 'processing' },
  { label: 'Ready', value: 'ready' },
  { label: 'Failed', value: 'failed' }
])

// Computed properties
const hasActiveFilters = computed(() => {
  return searchQuery.value || selectedCategory.value || selectedPrivacyLevel.value || selectedStatus.value
})

const filteredDatasets = computed(() => {
  let filtered = [...datasets.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(dataset => 
      dataset.name.toLowerCase().includes(query) ||
      dataset.description?.toLowerCase().includes(query) ||
      dataset.category?.toLowerCase().includes(query)
    )
  }
  
  if (selectedCategory.value) {
    filtered = filtered.filter(dataset => dataset.category === selectedCategory.value)
  }
  
  if (selectedPrivacyLevel.value) {
    filtered = filtered.filter(dataset => dataset.effective_privacy_level === selectedPrivacyLevel.value)
  }
  
  if (selectedStatus.value) {
    filtered = filtered.filter(dataset => dataset.status === selectedStatus.value)
  }
  
  return filtered
})

// Methods
const goToUpload = () => {
  router.push('/datasets/upload')
}

const goToDataset = (datasetId) => {
  router.push(`/datasets/${datasetId}`)
}

const applyFilters = () => {
  // Filters are applied automatically through computed property
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
  selectedPrivacyLevel.value = null
  selectedStatus.value = null
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown'
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i]
}

const formatDate = (date) => {
  if (!date) return 'Unknown'
  return dayjs(date).format('MMM D, YYYY')
}

const getDatasetIcon = (dataset) => {
  const fileType = dataset.file_type?.toLowerCase()
  if (fileType?.includes('json')) return GridOutline
  if (fileType?.includes('csv')) return DocumentAttachOutline
  if (fileType?.includes('database')) return ServerOutline
  return DocumentOutline
}

const getStatusType = (status) => {
  switch (status) {
    case 'ready': return 'success'
    case 'processing': return 'warning'
    case 'failed': return 'error'
    case 'draft': return 'info'
    default: return 'default'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'ready': return CheckmarkCircleOutline
    case 'processing': return TimeOutline
    case 'failed': return AlertCircleOutline
    case 'draft': return CreateOutline
    default: return TimeOutline
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'ready': return 'Ready'
    case 'processing': return 'Processing'
    case 'failed': return 'Failed'
    case 'draft': return 'Draft'
    default: return 'Unknown'
  }
}

const getPrivacyType = (privacyLevel) => {
  switch (privacyLevel) {
    case 'public': return 'info'
    case 'private': return 'warning'
    case 'encrypted': return 'error'
    case 'privacy_protected': return 'success'
    default: return 'default'
  }
}

const getPrivacyIcon = (privacyLevel) => {
  switch (privacyLevel) {
    case 'public': return GlobeOutline
    case 'private': return LockClosedOutline
    case 'encrypted': return KeyOutline
    case 'privacy_protected': return ShieldCheckmarkOutline
    default: return GlobeOutline
  }
}

const getPrivacyLabel = (privacyLevel) => {
  switch (privacyLevel) {
    case 'public': return 'Public'
    case 'private': return 'Private'
    case 'encrypted': return 'Encrypted'
    case 'privacy_protected': return 'ZK Protected'
    default: return 'Unknown'
  }
}

const getDatasetActions = (dataset) => {
  return [
    {
      label: 'View Details',
      key: 'view',
      icon: () => h(NIcon, { component: EyeOutline })
    },
    {
      label: 'Edit Dataset',
      key: 'edit',
      icon: () => h(NIcon, { component: CreateOutline })
    },
    {
      label: 'Manage Permissions',
      key: 'permissions',
      icon: () => h(NIcon, { component: SettingsOutline })
    },
    {
      label: 'View Analytics',
      key: 'analytics',
      icon: () => h(NIcon, { component: AnalyticsOutline })
    },
    {
      label: 'Generate ZK Proof',
      key: 'zk-proof',
      icon: () => h(NIcon, { component: ShieldCheckmarkOutline }),
      disabled: !!dataset.zk_proof_id
    },
    {
      label: 'Share Dataset',
      key: 'share',
      icon: () => h(NIcon, { component: ShareOutline })
    },
    {
      type: 'divider'
    },
    {
      label: 'Delete',
      key: 'delete',
      icon: () => h(NIcon, { component: TrashOutline }),
      props: {
        style: 'color: #d03050'
      }
    }
  ]
}

const handleAction = (key, dataset) => {
  switch (key) {
    case 'view':
      goToDataset(dataset.id)
      break
    case 'edit':
      router.push(`/datasets/${dataset.id}/edit`)
      break
    case 'permissions':
      router.push(`/datasets/${dataset.id}/permissions`)
      break
    case 'analytics':
      router.push(`/datasets/${dataset.id}/analytics`)
      break
    case 'zk-proof':
      router.push(`/zkp/generate-proof?dataset_id=${dataset.id}`)
      break
    case 'share':
      // TODO: Implement share functionality
      message.info('Share functionality coming soon')
      break
    case 'delete':
      showDeleteConfirmation(dataset)
      break
  }
}

const showDeleteConfirmation = (dataset) => {
  dialog.warning({
    title: 'Delete Dataset',
    content: () => h('div', [
      h('p', `Are you sure you want to delete dataset "${dataset.name}"?`),
      h('p', { style: { color: '#f56565', fontSize: '14px', marginTop: '8px' } }, 
        'This action cannot be undone. All related files and metadata will be permanently deleted.'
      )
    ]),
    positiveText: 'Delete',
    negativeText: 'Cancel',
    positiveButtonProps: {
      type: 'error'
    },
    onPositiveClick: () => {
      deleteDataset(dataset)
    }
  })
}

const deleteDataset = async (dataset) => {
  if (!currentUser.value?.wallet_address) {
    message.error('Please connect your wallet first')
    return
  }

  try {
    await axios.delete(`http://localhost:3000/api/datasets/${dataset.id}`, {
      data: {
        owner_wallet_address: currentUser.value.wallet_address
      }
    })
    
    message.success('Dataset deleted successfully!')
    
    // Remove dataset from local list
    const index = datasets.value.findIndex(d => d.id === dataset.id)
    if (index > -1) {
      datasets.value.splice(index, 1)
    }

  } catch (error) {
    console.error('Failed to delete dataset:', error)
    message.error(error.response?.data?.error || 'Failed to delete dataset')
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

const fetchDatasets = async () => {
  try {
    if (!currentUser.value?.wallet_address) {
      message.warning('Please connect your wallet to view your datasets')
      isLoading.value = false
      return
    }

    const response = await axios.get(`http://localhost:3000/api/datasets?wallet_address=${currentUser.value.wallet_address}`)
    datasets.value = response.data
  } catch (error) {
    console.error('Failed to fetch datasets:', error)
    message.error('Failed to load datasets')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchCurrentUser()
  await fetchDatasets()
})
</script>

<style scoped>
.datasets-page {
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

.header-content {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 8px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #c9d1d9;
  margin: 0;
}

.upload-btn {
  height: 40px;
  font-weight: 500;
}

.page-description {
  color: #8b949e;
  font-size: 16px;
  line-height: 1.5;
}

.filters-section {
  margin-bottom: 24px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-input {
  min-width: 300px;
  flex: 1;
  max-width: 400px;
}

.clear-filters {
  color: #58a6ff;
  font-size: 14px;
}

.clear-filters:hover {
  text-decoration: underline;
}

.datasets-content {
  min-height: 400px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.datasets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.dataset-card {
  background: linear-gradient(to bottom right, #161b22, #0d1117);
  border: 1px solid #30363d;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.dataset-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border-color: #58a6ff;
}

.dataset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.dataset-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.dataset-icon {
  font-size: 20px;
  color: #58a6ff;
}

.dataset-name {
  font-size: 18px;
  font-weight: 600;
  color: #c9d1d9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dataset-actions {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.dataset-card:hover .dataset-actions {
  opacity: 1;
}

.dataset-info {
  padding: 0;
}

.dataset-description {
  color: #8b949e;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dataset-meta {
  margin-bottom: 16px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.meta-row:last-child {
  margin-bottom: 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8b949e;
  font-size: 13px;
}

.meta-item .n-icon {
  font-size: 14px;
}

.dataset-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-tag {
  font-weight: 500;
}

/* Responsive design */
@media (max-width: 768px) {
  .datasets-page {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    min-width: auto;
    max-width: none;
  }
  
  .datasets-grid {
    grid-template-columns: 1fr;
  }
}
</style> 