<template>
  <div class="dataset-detail-page">
    <div class="page-header">
      <div class="header-content">
        <div class="dataset-title-section">
          <div class="title-row">
            <n-icon :component="getDatasetIcon(dataset)" class="dataset-icon" />
            <h1 class="dataset-title">{{ dataset.name || 'Loading...' }}</h1>
            <div class="title-tags">
              <n-tag :type="getStatusType(dataset.status)" size="small">
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
            </div>
          </div>
          
          <p class="dataset-description">{{ dataset.description || 'No description provided' }}</p>
        </div>
        
        <div class="header-actions">
          <n-button-group>
            <n-button @click="downloadDataset" :loading="isDownloading" type="primary">
              <template #icon>
                <n-icon :component="DownloadOutline" />
              </template>
              Download
            </n-button>
            
            <n-dropdown :options="actionOptions" @select="handleAction">
              <n-button type="primary">
                <template #icon>
                  <n-icon :component="EllipsisVerticalOutline" />
                </template>
              </n-button>
            </n-dropdown>
          </n-button-group>
        </div>
      </div>
    </div>

    <div class="dataset-content">
      <n-spin :show="isLoading">
        <div class="content-grid">
          <!-- Left Column: Main Info -->
          <div class="main-column">
            <n-card title="Dataset Information" class="info-card">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">
                    <n-icon :component="PersonOutline" />
                    Owner
                  </div>
                  <div class="info-value">{{ dataset.owner_username || 'Unknown' }}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">
                    <n-icon :component="FolderOutline" />
                    Category
                  </div>
                  <div class="info-value">{{ dataset.category || 'Other' }}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">
                    <n-icon :component="DocumentOutline" />
                    File Size
                  </div>
                  <div class="info-value">{{ formatFileSize(dataset.file_size) }}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">
                    <n-icon :component="CodeOutline" />
                    File Type
                  </div>
                  <div class="info-value">{{ dataset.file_type || 'Unknown' }}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">
                    <n-icon :component="CalendarOutline" />
                    Created
                  </div>
                  <div class="info-value">{{ formatDate(dataset.created_at) }}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">
                    <n-icon :component="TimeOutline" />
                    Updated
                  </div>
                  <div class="info-value">{{ formatDate(dataset.updated_at) }}</div>
                </div>
              </div>
            </n-card>

            <n-card v-if="dataset.project_name" title="Project Association" class="project-card">
              <div class="project-info">
                <n-icon :component="LayersOutline" class="project-icon" />
                <div class="project-details">
                  <h4 class="project-name">{{ dataset.project_name }}</h4>
                  <p class="project-description">This dataset is associated with a research project</p>
                </div>
              </div>
            </n-card>

            <n-card title="Tags" class="tags-card">
              <div v-if="datasetTags.length > 0" class="bilibili-tags-display">
                <div class="tags-count-info">
                  <n-icon :component="PricetagOutline" class="tags-icon" />
                  <span class="tags-count-text">{{ datasetTags.length }} tags</span>
                </div>
                <div class="bilibili-tags-list">
                  <div 
                    v-for="tag in datasetTags" 
                    :key="tag" 
                    class="bilibili-display-tag"
                  >
                    <n-icon :component="PricetagOutline" class="tag-icon" />
                    <span class="tag-content">{{ tag }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-tags-display">
                <div class="empty-icon-wrapper">
                  <n-icon :component="PricetagOutline" class="empty-tags-icon" />
                </div>
                <div class="empty-text">
                  <span class="empty-title">No Tags</span>
                  <span class="empty-description">This dataset has no tags yet</span>
                </div>
              </div>
            </n-card>
          </div>

          <!-- Right Column: Stats & Actions -->
          <div class="side-column">
            <n-card title="Usage Statistics" class="stats-card">
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-icon">
                    <n-icon :component="EyeOutline" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-number">{{ dataset.access_count || 0 }}</div>
                    <div class="stat-label">Views</div>
                  </div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-icon">
                    <n-icon :component="DownloadOutline" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-number">{{ dataset.download_count || 0 }}</div>
                    <div class="stat-label">Downloads</div>
                  </div>
                </div>
              </div>
              
              <n-button text @click="goToAnalytics" class="view-analytics-btn">
                View Detailed Analytics
                <template #icon>
                  <n-icon :component="AnalyticsOutline" />
                </template>
              </n-button>
            </n-card>

            <n-card title="Privacy & Security" class="privacy-card">
              <div class="privacy-info">
                <div class="privacy-level">
                  <n-icon :component="getPrivacyIcon(dataset.effective_privacy_level)" class="privacy-icon" />
                  <div class="privacy-details">
                    <h4>{{ getPrivacyLabel(dataset.effective_privacy_level) }}</h4>
                    <p>{{ getPrivacyDescription(dataset.effective_privacy_level) }}</p>
                  </div>
                </div>
                
                <div v-if="dataset.zk_proof_id" class="zk-proof-status">
                  <n-alert type="success" size="small">
                    <template #icon>
                      <n-icon :component="ShieldCheckmarkOutline" />
                    </template>
                    Zero-Knowledge Proof Generated
                  </n-alert>
                </div>
              </div>
              
              <div class="privacy-actions">
                <!-- Manage Permissions - Hide for public datasets -->
                <n-button 
                  v-if="dataset.privacy_level !== 'public'"
                  @click="goToPermissions" 
                  secondary 
                  block
                >
                  <template #icon>
                    <n-icon :component="SettingsOutline" />
                  </template>
                  Manage Permissions
                </n-button>
                
                <!-- Generate ZK Proof - Only for ZK-protected datasets without proof -->
                <n-button 
                  v-if="isZKProtectedDataset(dataset) && !dataset.zk_proof_id" 
                  @click="generateZKProof" 
                  type="primary" 
                  block
                >
                  <template #icon>
                    <n-icon :component="ShieldCheckmarkOutline" />
                  </template>
                  Generate ZK Proof
                </n-button>
                
                <!-- View Details - For datasets with existing proof -->
                <n-button 
                  v-if="dataset.zk_proof_id" 
                  @click="viewProofDetails" 
                  type="primary" 
                  block
                >
                  <template #icon>
                    <n-icon :component="EyeOutline" />
                  </template>
                  View Details
                </n-button>
              </div>
            </n-card>


          </div>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  NButton, NIcon, NCard, NTag, NButtonGroup, NDropdown, NSpin, NSpace, 
  NAlert, NModal, NText, useMessage, useDialog
} from 'naive-ui'
import {
  ArrowBackOutline, DownloadOutline, EllipsisVerticalOutline, PersonOutline,
  FolderOutline, DocumentOutline, CodeOutline, CalendarOutline, TimeOutline,
  LayersOutline, EyeOutline, AnalyticsOutline, SettingsOutline, SearchOutline,
  ShareOutline, DocumentTextOutline, ShieldCheckmarkOutline, GlobeOutline,
  LockClosedOutline, KeyOutline, CheckmarkCircleOutline, AlertCircleOutline,
  ServerOutline, DocumentAttachOutline, GridOutline, TrashOutline, PricetagOutline,
  CreateOutline
} from '@vicons/ionicons5'
import axios from 'axios'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()

// Reactive data
const dataset = ref({})
const isLoading = ref(true)
const isDownloading = ref(false)
const isDeleting = ref(false)
const currentUser = ref(null)

// Computed
const datasetId = computed(() => route.params.dataset_id)

const datasetTags = computed(() => {
  if (!dataset.value.tags) return []
  
  // If tags is already an array (from backend parsing), return it directly
  if (Array.isArray(dataset.value.tags)) {
    return dataset.value.tags
  }
  
  // If tags is a string, try to parse it
  if (typeof dataset.value.tags === 'string') {
    try {
      const parsed = JSON.parse(dataset.value.tags)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      // If JSON parsing fails, treat as comma-separated string
      console.warn('Tags not in JSON format, parsing as comma-separated string:', dataset.value.tags)
      return dataset.value.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    }
  }
  
  // Fallback for unexpected data types
  return []
})

const actionOptions = computed(() => {
  const options = []
  
  // Check if current user is the owner
  const isOwner = currentUser.value && dataset.value.owner_id === currentUser.value.id
  
  if (isOwner) {
    options.push({
      label: 'Edit Dataset',
      key: 'edit',
      icon: () => h(NIcon, { component: SettingsOutline })
    })
  }
  
  if (isOwner && isZKProtectedDataset(dataset.value)) {
    options.push({
      label: dataset.value.zk_proof_id ? 'View Proof Details' : 'Generate Proof',
      key: dataset.value.zk_proof_id ? 'view-proof-details' : 'generate-proof',
      icon: () => h(NIcon, { component: dataset.value.zk_proof_id ? EyeOutline : ShieldCheckmarkOutline })
    })
  }
  
  if (isOwner) {
    options.push({
      label: 'View Analytics',
      key: 'analytics',
      icon: () => h(NIcon, { component: AnalyticsOutline })
    })
  }
  
  if (isOwner && options.length > 0) {
    options.push({
      type: 'divider'
    })
    
    options.push({
      label: 'Delete Dataset',
      key: 'delete',
      icon: () => h(NIcon, { component: TrashOutline }),
      props: {
        style: 'color: #d03050'
      }
    })
  }
  
  return options
})

// Methods

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown'
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i]
}

const formatDate = (date) => {
  if (!date) return 'Unknown'
  return dayjs(date).format('MMM D, YYYY HH:mm')
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
    case 'zk_proof_protected': return 'success'
    case 'privacy_protected': return 'success'  // For backward compatibility
    default: return 'default'
  }
}

const getPrivacyIcon = (privacyLevel) => {
  switch (privacyLevel) {
    case 'public': return GlobeOutline
    case 'private': return LockClosedOutline
    case 'encrypted': return KeyOutline
    case 'zk_proof_protected': return ShieldCheckmarkOutline
    case 'privacy_protected': return ShieldCheckmarkOutline  // For backward compatibility
    default: return GlobeOutline
  }
}

const getPrivacyLabel = (privacyLevel) => {
  switch (privacyLevel) {
    case 'public': return 'Public'
    case 'private': return 'Private'
    case 'encrypted': return 'Encrypted'
    case 'zk_proof_protected': return 'ZK Protected'
    case 'privacy_protected': return 'ZK Protected'  // For backward compatibility
    default: return 'Unknown'
  }
}

const getPrivacyDescription = (privacyLevel) => {
  switch (privacyLevel) {
    case 'public': return 'Anyone can access this dataset'
    case 'private': return 'Only authorized users can access'
    case 'encrypted': return 'Dataset is encrypted and secure'
    case 'zk_proof_protected': return 'Protected by zero-knowledge proofs'
    case 'privacy_protected': return 'Protected by zero-knowledge proofs'  // For backward compatibility
    default: return 'Privacy level unknown'
  }
}

const downloadDataset = async () => {
  isDownloading.value = true
  try {
    // TODO: Implement actual download functionality
    /* 1. Request file stream */
    const res = await axios.get(
      `http://localhost:3000/api/datasets/${datasetId.value}/download`,
      { responseType: 'blob', timeout: 0 }   // large file: no timeout
    )

    /* 2. Extract file name from response header (back-end Content-Disposition) */
    const fileName =
      res.headers['content-disposition']
        ?.split('filename=')?.[1]?.replace(/"/g, '') ||
      `dataset_${datasetId.value}.zip`

    /* 3. Create a temporary URL and trigger download */
    const blob = new Blob([res.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    /* 4. Success toast + usage log */
    message.success('Download started')
    if (currentUser.value?.wallet_address) {
      await axios.post(
        `http://localhost:3000/api/datasets/${datasetId.value}/usage`,
        {
          action_type: 'download',
          wallet_address: currentUser.value.wallet_address
        }
      )
    }
  } catch (error) {
    message.error('Download failed')
  } finally {
    isDownloading.value = false
  }
}

const handleAction = (key) => {
  switch (key) {
    case 'edit':
      goToEdit()
      break
    case 'generate-proof':
      generateZKProof()
      break
    case 'view-proof-details':
      viewProofDetails()
      break
    case 'analytics':
      goToAnalytics()
      break
    case 'delete':
      showDeleteConfirmation()
      break
  }
}

const generateZKProof = () => {
  // Navigate to proof generation page
  router.push(`/proof/generate?dataset_id=${datasetId.value}`)
}

const goToAnalytics = () => {
  router.push(`/datasets/${datasetId.value}/analytics`)
}

const goToPermissions = () => {
  router.push(`/datasets/${datasetId.value}/permissions`)
}

const isZKProtectedDataset = (dataset) => {
  return dataset.privacy_level === 'zk_proof_protected' || 
         dataset.effective_privacy_level === 'privacy_protected'
}

const viewProofDetails = () => {
  router.push(`/proof/details/${datasetId.value}`)
}

const goToEdit = () => {
  router.push(`/datasets/${datasetId.value}/edit`)
}

const showDeleteConfirmation = () => {
  dialog.warning({
    title: 'Delete Dataset',
    content: () => h('div', [
      h('p', `Are you sure you want to delete dataset "${dataset.value.name}"?`),
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
      deleteDataset()
    }
  })
}

const deleteDataset = async () => {
  if (!currentUser.value?.wallet_address) {
    message.error('Please connect your wallet first')
    return
  }

  if (dataset.value.owner_id !== currentUser.value.id) {
    message.error('Only the dataset owner can delete this dataset')
    return
  }

  isDeleting.value = true
  
  try {
    await axios.delete(`http://localhost:3000/api/datasets/${datasetId.value}`, {
      data: {
        owner_wallet_address: currentUser.value.wallet_address
      }
    })
    
    message.success('Dataset deleted successfully!')
    
    // Redirect to datasets list
    setTimeout(() => {
      router.push('/datasets')
    }, 1000)

  } catch (error) {
    console.error('Failed to delete dataset:', error)
    message.error(error.response?.data?.error || 'Failed to delete dataset')
  } finally {
    isDeleting.value = false
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

const fetchDataset = async () => {
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
  await fetchDataset()
})
</script>

<style scoped>
.dataset-detail-page {
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
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
}

.dataset-title-section {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.dataset-icon {
  font-size: 32px;
  color: #58a6ff;
}

.dataset-title {
  font-size: 32px;
  font-weight: 700;
  color: #c9d1d9;
  margin: 0;
  flex: 1;
}

.title-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dataset-description {
  color: #8b949e;
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
}

.header-actions {
  flex-shrink: 0;
}

.dataset-content {
  min-height: 400px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 32px;
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card,
.project-card,
.tags-card,
.stats-card,
.privacy-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8b949e;
  font-size: 14px;
  font-weight: 500;
}

.info-label .n-icon {
  font-size: 16px;
}

.info-value {
  color: #c9d1d9;
  font-size: 15px;
  font-weight: 500;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.project-icon {
  font-size: 24px;
  color: #58a6ff;
}

.project-details {
  flex: 1;
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 4px 0;
}

.project-description {
  font-size: 14px;
  color: #8b949e;
  margin: 0;
}

/* Bilibili-style tags display for detail page */
.bilibili-tags-display {
  padding: 4px 0;
}

.tags-count-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #30363d;
}

.tags-icon {
  font-size: 16px;
  color: #58a6ff;
}

.tags-count-text {
  font-size: 13px;
  color: #8b949e;
  font-weight: 500;
}

.bilibili-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bilibili-display-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #21262d;
  border: 1px solid #373e47;
  border-radius: 12px;
  padding: 6px 10px;
  font-size: 13px;
  color: #c9d1d9;
  transition: all 0.15s ease;
  cursor: default;
}

.bilibili-display-tag:hover {
  background: #30363d;
  border-color: #58a6ff;
  transform: translateY(-1px);
}

.tag-icon {
  font-size: 12px;
  color: #58a6ff;
  opacity: 0.8;
}

.tag-content {
  font-weight: 500;
  user-select: text;
}

.empty-tags-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  text-align: center;
  border: 1px dashed #373e47;
  border-radius: 8px;
  background: rgba(22, 27, 34, 0.3);
}

.empty-icon-wrapper {
  margin-bottom: 12px;
}

.empty-tags-icon {
  font-size: 32px;
  color: #373e47;
  opacity: 0.6;
}

.empty-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-title {
  font-size: 14px;
  color: #8b949e;
  font-weight: 500;
}

.empty-description {
  font-size: 12px;
  color: #6e7681;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(56, 139, 253, 0.05);
  border: 1px solid rgba(56, 139, 253, 0.2);
  border-radius: 8px;
}

.stat-icon {
  font-size: 20px;
  color: #58a6ff;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: #c9d1d9;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.view-analytics-btn {
  color: #58a6ff;
  width: 100%;
  justify-content: center;
}

.privacy-info {
  margin-bottom: 20px;
}

.privacy-level {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.privacy-icon {
  font-size: 24px;
  color: #58a6ff;
  margin-top: 2px;
}

.privacy-details h4 {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 4px 0;
}

.privacy-details p {
  font-size: 14px;
  color: #8b949e;
  margin: 0;
}

.zk-proof-status {
  margin-top: 12px;
}

.privacy-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Responsive design */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .side-column {
    order: -1;
  }
}

@media (max-width: 768px) {
  .dataset-detail-page {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }
  
  .title-row {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .dataset-title {
    font-size: 24px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  /* Mobile-friendly tags display */
  .bilibili-tags-list {
    gap: 6px;
  }
  
  .bilibili-display-tag {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 10px;
  }
  
  .tag-icon {
    font-size: 10px;
  }
  
  .empty-tags-display {
    padding: 16px;
  }
  
  .empty-tags-icon {
    font-size: 24px;
  }
  
  .empty-title {
    font-size: 13px;
  }
  
  .empty-description {
    font-size: 11px;
  }
}
</style> 