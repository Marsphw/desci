<template>
  <div class="edit-page">
    <div class="page-header">
      <h1 class="page-title">Datasets</h1>
      <p class="page-description">
        Update your dataset's metadata and settings
      </p>
    </div>

    <div class="edit-content">
      <n-spin :show="isLoading">
        <div class="edit-form">
          <n-form :model="datasetForm" :rules="formRules" ref="formRef">
            <!-- Dataset Name -->
            <n-form-item label="Dataset Name" path="name" class="form-item">
              <n-input 
                v-model:value="datasetForm.name" 
                placeholder="Enter a descriptive name for your dataset"
                maxlength="100"
                show-count
              />
            </n-form-item>

            <!-- Description -->
            <n-form-item label="Description" path="description" class="form-item">
              <n-input
                v-model:value="datasetForm.description"
                type="textarea"
                placeholder="Describe your dataset, its purpose, and methodology"
                :rows="4"
                maxlength="500"
                show-count
              />
            </n-form-item>

            <!-- Category -->
            <n-form-item label="Category" path="category" class="form-item">
              <n-select
                v-model:value="datasetForm.category"
                :options="categoryOptions"
                placeholder="Select a category"
              />
            </n-form-item>

            <!-- Project Association -->
            <n-form-item label="Project Association" class="association-form-item">
              <n-radio-group v-model:value="datasetForm.association_type" class="association-radio-group">
                <n-space direction="vertical" size="medium">
                  <n-radio :value="null" class="association-radio">
                    <div class="radio-content">
                      <div class="radio-header">
                        <n-icon :component="CloseOutline" class="radio-icon" />
                        <span class="radio-title">No Association</span>
                      </div>
                      <p class="radio-description">This dataset will not be linked to any project or paper</p>
                    </div>
                  </n-radio>
                  <n-radio value="internal" class="association-radio">
                    <div class="radio-content">
                      <div class="radio-header">
                        <n-icon :component="FolderOpenOutline" class="radio-icon" />
                        <span class="radio-title">Link with Internal Project</span>
                      </div>
                      <p class="radio-description">Associate this dataset with one of your existing projects</p>
                    </div>
                  </n-radio>
                  <n-radio value="external" class="association-radio">
                    <div class="radio-content">
                      <div class="radio-header">
                        <n-icon :component="LinkOutline" class="radio-icon" />
                        <span class="radio-title">Link with External Resource</span>
                      </div>
                      <p class="radio-description">Link to an external project, paper, or research resource</p>
                    </div>
                  </n-radio>
                </n-space>
              </n-radio-group>
            </n-form-item>

            <!-- Project Selection -->
            <n-form-item 
              v-if="datasetForm.association_type === 'internal'" 
              label="Select Project" 
              path="project_id"
              class="project-selection-form-item"
            >
              <div class="project-selection-container">
                <n-select
                  v-model:value="datasetForm.project_id"
                  :options="projectOptions"
                  placeholder="Choose a project from your workspace"
                  clearable
                  filterable
                  @update:value="onProjectSelect"
                  class="project-select"
                />
                <div v-if="selectedProject" class="project-preview">
                  <n-alert type="info" size="medium" class="project-alert">
                    <template #icon>
                      <n-icon :component="FolderOpenOutline" />
                    </template>
                    <div class="project-info">
                      <div class="project-name">{{ selectedProject.name }}</div>
                      <div class="project-details">
                        Project successfully verified and linked
                      </div>
                    </div>
                  </n-alert>
                </div>
              </div>
            </n-form-item>

            <!-- External Link -->
            <n-form-item 
              v-if="datasetForm.association_type === 'external'" 
              label="External Resource Link" 
              path="external_link"
              class="external-link-form-item"
            >
              <div class="external-link-container">
                <n-input
                  v-model:value="datasetForm.external_link"
                  placeholder="https://example.com/project, DOI:10.1000/xyz123, or arXiv:2301.12345"
                  @input="validateExternalLink"
                  class="external-link-input"
                />
                <div v-if="datasetForm.external_link" class="link-preview">
                  <n-alert 
                    :type="externalLinkValid ? 'success' : 'warning'" 
                    size="medium" 
                    class="link-alert"
                  >
                    <template #icon>
                      <n-icon :component="externalLinkValid ? CheckmarkCircleOutline : AlertCircleOutline" />
                    </template>
                    <div class="link-info">
                      <div class="link-status">
                        {{ externalLinkValid ? 'Valid resource link detected' : 'Please enter a valid URL or DOI' }}
                      </div>
                      <div class="link-details">
                        {{ externalLinkValid ? 'External resource will be linked to this dataset' : 'Supported formats: https://, DOI:, arXiv:' }}
                      </div>
                    </div>
                  </n-alert>
                </div>
              </div>
            </n-form-item>

            <!-- Tags -->
            <n-form-item label="Tags" path="tags" class="tags-form-item">
              <div class="bilibili-inline-tags-container">
                <div class="inline-tags-wrapper">
                  <!-- Existing Tags -->
                  <div 
                    v-for="(tag, index) in datasetTags" 
                    :key="`tag-${index}`"
                    class="inline-tag"
                  >
                    <span class="tag-text">{{ tag }}</span>
                    <n-button 
                      @click="removeTag(index)"
                      size="tiny"
                      text
                      class="inline-tag-remove"
                    >
                      ×
                    </n-button>
                  </div>
                  
                  <!-- Input Field -->
                  <input
                    ref="tagInputRef"
                    v-model="currentTagInput"
                    @keyup.enter="addTag"
                    @keyup.escape="clearInput"
                    @input="handleTagInput"
                    :placeholder="datasetTags.length === 0 ? '按回车键Enter创建标签' : ''"
                    class="inline-tag-input"
                    maxlength="20"
                    :disabled="datasetTags.length >= 10"
                  />
                  
                  <!-- Remaining count -->
                  <span v-if="datasetTags.length < 10" class="remaining-count">
                    还可以添加{{ 10 - datasetTags.length }}个标签
                  </span>
                </div>
              </div>
            </n-form-item>

            <!-- Privacy Level -->
            <n-form-item label="Privacy Level" class="privacy-form-item">
              <n-radio-group v-model:value="datasetForm.privacy_level" class="privacy-options">
                <n-space direction="vertical" size="large">
                  <n-radio value="public" class="privacy-option">
                    <div class="option-content">
                      <div class="option-header">
                        <n-icon :component="GlobeOutline" />
                        <span class="option-title">Public Dataset</span>
                      </div>
                      <p class="option-description">
                        Dataset will be publicly accessible. Anyone can view and download the data.
                      </p>
                    </div>
                  </n-radio>

                  <n-radio value="private" class="privacy-option">
                    <div class="option-content">
                      <div class="option-header">
                        <n-icon :component="LockClosedOutline" />
                        <span class="option-title">Private Dataset</span>
                      </div>
                      <p class="option-description">
                        Dataset is private. You can grant specific permissions to other users.
                      </p>
                    </div>
                  </n-radio>

                  <n-radio value="zk_proof_protected" class="privacy-option">
                    <div class="option-content">
                      <div class="option-header">
                        <n-icon :component="ShieldCheckmarkOutline" />
                        <span class="option-title">ZK-Proof Protected</span>
                      </div>
                      <p class="option-description">
                        Dataset protected using zero-knowledge proofs for private queries.
                      </p>
                      
                      <!-- Privacy Query Feature - only shown when zk-proof protected is selected -->
                      <div v-if="datasetForm.privacy_level === 'zk_proof_protected'" class="nested-feature">
                        <div class="nested-feature-header">
                          <div class="nested-feature-info">
                            <n-icon :component="SearchOutline" class="nested-feature-icon" />
                            <div class="nested-feature-details">
                              <span class="nested-feature-title">Privacy Query</span>
                              <span class="nested-feature-desc">Enable anonymous querying capabilities</span>
                            </div>
                          </div>
                          <n-switch v-model:value="datasetForm.privacy_query_enabled" size="small" />
                        </div>
                        <div v-if="datasetForm.privacy_query_enabled" class="nested-feature-alert">
                          <n-alert type="info" size="small">
                            <template #icon>
                              <n-icon :component="InformationCircleOutline" />
                            </template>
                            Privacy Query allows authorized users to query your dataset without revealing the actual data content.
                          </n-alert>
                        </div>
                      </div>
                    </div>
                  </n-radio>

                  <n-radio value="encrypted" class="privacy-option">
                    <div class="option-content">
                      <div class="option-header">
                        <n-icon :component="LockClosedOutline" />
                        <span class="option-title">Encrypted</span>
                      </div>
                      <p class="option-description">
                        Dataset encrypted using advanced algorithms. Access requires decryption keys.
                      </p>
                    </div>
                  </n-radio>
                </n-space>
              </n-radio-group>
            </n-form-item>

            <!-- Files Information (Read-only) -->
            <n-form-item label="Files" class="files-info-item">
              <div class="files-readonly">
                <n-alert type="info" class="files-notice">
                  <template #icon>
                    <n-icon :component="InformationCircleOutline" />
                  </template>
                  Files cannot be modified. To change files, please create a new dataset.
                </n-alert>
                
                <div v-if="dataset.files && dataset.files.length > 0" class="files-list">
                  <div class="files-header">
                    <span>{{ dataset.files.length }} file(s) - {{ formatFileSize(dataset.total_size || dataset.file_size) }}</span>
                  </div>
                  <div class="file-items">
                    <div 
                      v-for="file in dataset.files" 
                      :key="file.id"
                      class="file-item-readonly"
                    >
                      <n-icon :component="getFileIcon(file)" class="file-icon" />
                      <div class="file-details">
                        <span class="file-name">{{ file.original_name }}</span>
                        <span v-if="file.is_primary" class="primary-badge">Primary</span>
                      </div>
                      <span class="file-size">{{ formatFileSize(file.file_size) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </n-form-item>
          </n-form>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <n-space justify="space-between">
              <n-button @click="goBack" secondary>
                Cancel
              </n-button>
              
              <n-space>
                <n-button @click="resetForm" secondary>
                  Reset Changes
                </n-button>
                
                <n-button 
                  @click="saveChanges" 
                  :loading="isSaving"
                  type="primary"
                  :disabled="!hasChanges"
                >
                  Save Changes
                </n-button>
              </n-space>
            </n-space>
          </div>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  NButton, NIcon, NText, NForm, NFormItem, NInput, NSelect, NRadioGroup, 
  NRadio, NSpace, NAlert, NTag, NSpin, NCard, NSwitch, useMessage
} from 'naive-ui'
import {
  GlobeOutline, LockClosedOutline, ShieldCheckmarkOutline,
  FolderOpenOutline, CheckmarkCircleOutline, AlertCircleOutline, LinkOutline,
  CloseOutline, InformationCircleOutline, DocumentTextOutline, DocumentAttachOutline, 
  GridOutline, CodeOutline, ImageOutline, ServerOutline, SearchOutline
} from '@vicons/ionicons5'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const message = useMessage()

// Refs
const formRef = ref(null)
const isLoading = ref(true)
const isSaving = ref(false)

// Data
const dataset = ref({})
const originalData = ref({})
const datasetForm = ref({
  name: '',
  description: '',
  category: 'Other',
  association_type: null,
  project_id: null,
  external_link: '',
  privacy_level: 'public',
  privacy_query_enabled: false
})

const datasetTags = ref([])
const currentTagInput = ref('')
const tagInputRef = ref(null)

// User and projects data
const currentUser = ref(null)
const userProjects = ref([])
const selectedProject = ref(null)
const externalLinkValid = ref(false)

// Computed
const datasetId = computed(() => route.params.dataset_id)

const categoryOptions = ref([
  { label: 'Research Data', value: 'Research' },
  { label: 'Healthcare', value: 'Healthcare' },
  { label: 'Finance', value: 'Finance' },
  { label: 'AI/ML', value: 'AI' },
  { label: 'IoT', value: 'IoT' },
  { label: 'Genomics', value: 'Genomics' },
  { label: 'Climate', value: 'Climate' },
  { label: 'Other', value: 'Other' }
])

const projectOptions = computed(() => {
  return userProjects.value.map(project => ({
    label: project.name,
    value: project.id
  }))
})

const formRules = {
  name: [
    { required: true, message: 'Dataset name is required', trigger: ['input', 'blur'] },
    { min: 3, max: 100, message: 'Name should be 3-100 characters', trigger: ['input', 'blur'] }
  ],
  description: [
    { max: 500, message: 'Description should not exceed 500 characters', trigger: ['input', 'blur'] }
  ],
  category: [
    { required: true, message: 'Please select a category', trigger: ['change', 'blur'] }
  ]
}

const hasChanges = computed(() => {
  const current = {
    name: datasetForm.value.name,
    description: datasetForm.value.description,
    category: datasetForm.value.category,
    association_type: datasetForm.value.association_type,
    project_id: datasetForm.value.project_id,
    external_link: datasetForm.value.external_link,
    privacy_level: datasetForm.value.privacy_level,
    privacy_query_enabled: datasetForm.value.privacy_query_enabled,
    tags: JSON.stringify(datasetTags.value)
  }
  
  return JSON.stringify(current) !== JSON.stringify(originalData.value)
})

// Methods
const goBack = () => {
  router.push(`/datasets/${datasetId.value}`)
}

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i]
}

const getFileIcon = (file) => {
  const mimeType = file.mime_type || ''
  const fileName = file.original_name || ''
  
  if (mimeType.includes('image/')) return ImageOutline
  if (mimeType.includes('text/csv') || fileName.endsWith('.csv')) return DocumentAttachOutline
  if (mimeType.includes('application/json') || fileName.endsWith('.json')) return GridOutline
  if (mimeType.includes('text/') || fileName.endsWith('.txt')) return DocumentTextOutline
  if (mimeType.includes('application/zip') || fileName.endsWith('.zip')) return DocumentAttachOutline
  if (fileName.endsWith('.py') || fileName.endsWith('.js') || fileName.endsWith('.ts')) return CodeOutline
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return GridOutline
  if (fileName.includes('database') || fileName.endsWith('.db')) return ServerOutline
  
  return DocumentTextOutline
}

const onProjectSelect = (projectId) => {
  if (projectId) {
    selectedProject.value = userProjects.value.find(p => p.id === projectId)
  } else {
    selectedProject.value = null
  }
}

const validateExternalLink = (value) => {
  if (!value) {
    externalLinkValid.value = false
    return
  }
  
  const urlPattern = /^https?:\/\/.+/
  const doiPattern = /^10\.\d{4,}\/\S+/
  
  externalLinkValid.value = urlPattern.test(value) || doiPattern.test(value)
}

// Tag management methods
const handleTagInput = (value) => {
  if (typeof value === 'string') {
    currentTagInput.value = value.trim()
  }
}

const addTag = () => {
  const tagText = currentTagInput.value.trim()
  
  if (!tagText) return
  
  if (tagText.length > 20) {
    message.warning('标签长度不能超过20个字符')
    return
  }
  
  if (datasetTags.value.length >= 10) {
    message.warning('最多只能添加10个标签')
    return
  }
  
  if (datasetTags.value.includes(tagText)) {
    message.warning('该标签已存在')
    currentTagInput.value = ''
    return
  }
  
  const normalizedTag = tagText.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5\-]/g, '-')
  
  datasetTags.value.push(normalizedTag)
  currentTagInput.value = ''
  
  nextTick(() => {
    tagInputRef.value?.focus()
  })
  
  message.success(`已添加标签："${normalizedTag}"`)
}

const removeTag = (index) => {
  if (index >= 0 && index < datasetTags.value.length) {
    const removedTag = datasetTags.value[index]
    datasetTags.value.splice(index, 1)
    message.info(`已移除标签："${removedTag}"`)
  }
}

const clearInput = () => {
  currentTagInput.value = ''
}

const resetForm = () => {
  // Reset form to original values
  datasetForm.value = { ...originalData.value }
  datasetTags.value = [...(dataset.value.tags || [])]
  
  // Reset project selection
  if (datasetForm.value.project_id) {
    selectedProject.value = userProjects.value.find(p => p.id === datasetForm.value.project_id)
  } else {
    selectedProject.value = null
  }
  
  // Reset external link validation
  validateExternalLink(datasetForm.value.external_link)
  
  message.success('Changes reset to original values')
}

const saveChanges = async () => {
  try {
    await formRef.value.validate()
    
    if (datasetForm.value.association_type === 'external' && datasetForm.value.external_link && !externalLinkValid.value) {
      message.error('Please enter a valid external link')
      return
    }
  } catch (error) {
    message.error('Please fix form validation errors')
    return
  }

  isSaving.value = true
  
  try {
    const updateData = {
      name: datasetForm.value.name,
      description: datasetForm.value.description,
      category: datasetForm.value.category,
      privacy_level: datasetForm.value.privacy_level,
      privacy_query_enabled: datasetForm.value.privacy_query_enabled,
      tags: JSON.stringify(datasetTags.value),
      owner_wallet_address: currentUser.value.wallet_address
    }

    // Handle project association
    if (datasetForm.value.association_type === 'internal' && datasetForm.value.project_id) {
      updateData.project_id = datasetForm.value.project_id
      updateData.external_link = null
    } else if (datasetForm.value.association_type === 'external' && datasetForm.value.external_link) {
      updateData.external_link = datasetForm.value.external_link
      updateData.project_id = null
    } else {
      updateData.project_id = null
      updateData.external_link = null
    }

    await axios.put(`http://localhost:3000/api/datasets/${datasetId.value}`, updateData)
    
    message.success('Dataset updated successfully!')
    
    // Redirect back to dataset detail page
    setTimeout(() => {
      router.push(`/datasets/${datasetId.value}`)
    }, 1000)

  } catch (error) {
    console.error('Failed to update dataset:', error)
    message.error(error.response?.data?.error || 'Failed to update dataset')
  } finally {
    isSaving.value = false
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

const fetchUserProjects = async () => {
  try {
    if (!currentUser.value?.wallet_address) return

    const response = await axios.get(`http://localhost:3000/api/projects?wallet_address=${currentUser.value.wallet_address}`)
    userProjects.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch user projects:', error)
  }
}

const fetchDataset = async () => {
  try {
    const params = currentUser.value?.wallet_address 
      ? `?wallet_address=${currentUser.value.wallet_address}` 
      : ''
    
    const response = await axios.get(`http://localhost:3000/api/datasets/${datasetId.value}${params}`)
    dataset.value = response.data
    
    // Parse tags - handle different formats from backend
    let tags = []
    if (dataset.value.tags) {
      // If tags is already an array (from backend parsing), use it directly
      if (Array.isArray(dataset.value.tags)) {
        tags = dataset.value.tags
      } else if (typeof dataset.value.tags === 'string') {
        // If tags is a string, try to parse it
        try {
          tags = JSON.parse(dataset.value.tags)
          if (!Array.isArray(tags)) {
            tags = []
          }
        } catch (error) {
          // If JSON parsing fails, treat as comma-separated string
          console.warn('Tags not in JSON format, parsing as comma-separated string:', dataset.value.tags)
          tags = dataset.value.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        }
      }
    }
    datasetTags.value = [...tags]
    
    // Setup form data
    datasetForm.value = {
      name: dataset.value.name || '',
      description: dataset.value.description || '',
      category: dataset.value.category || 'Other',
      association_type: dataset.value.project_id ? 'internal' : (dataset.value.external_link ? 'external' : null),
      project_id: dataset.value.project_id || null,
      external_link: dataset.value.external_link || '',
      privacy_level: dataset.value.privacy_level || 'public',
      privacy_query_enabled: dataset.value.privacy_query_enabled || false
    }
    
    // Store original data for comparison
    originalData.value = {
      name: datasetForm.value.name,
      description: datasetForm.value.description,
      category: datasetForm.value.category,
      association_type: datasetForm.value.association_type,
      project_id: datasetForm.value.project_id,
      external_link: datasetForm.value.external_link,
      privacy_level: datasetForm.value.privacy_level,
      privacy_query_enabled: datasetForm.value.privacy_query_enabled,
      tags: JSON.stringify(tags)
    }
    
    // Setup project selection
    if (datasetForm.value.project_id) {
      selectedProject.value = userProjects.value.find(p => p.id === datasetForm.value.project_id)
    }
    
    // Validate external link
    validateExternalLink(datasetForm.value.external_link)
    
  } catch (error) {
    console.error('Failed to fetch dataset:', error)
    message.error('Failed to load dataset')
    
    if (error.response?.status === 403) {
      message.error('Access denied. You do not have permission to edit this dataset.')
      router.push('/datasets')
    } else if (error.response?.status === 404) {
      message.error('Dataset not found')
      router.push('/datasets')
    }
  } finally {
    isLoading.value = false
  }
}

// Watch privacy level to auto-disable privacy query when not zk-proof protected
watch(() => datasetForm.value.privacy_level, (newLevel) => {
  if (newLevel !== 'zk_proof_protected') {
    datasetForm.value.privacy_query_enabled = false
  }
})

onMounted(async () => {
  await fetchCurrentUser()
  await fetchUserProjects()
  await fetchDataset()
})
</script>

<style scoped>
.edit-page {
  max-width: 800px;
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

.edit-content {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 16px;
  padding: 32px;
}

.edit-form {
  max-width: 100%;
}

.form-item {
  margin-bottom: 24px;
}

.action-buttons {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid #30363d;
}

/* Reuse styles from DatasetUpload */
.association-form-item {
  margin-bottom: 32px;
}

.association-radio-group {
  width: 100%;
}

.association-radio {
  width: 100%;
  padding: 16px;
  border: 1px solid #30363d;
  border-radius: 12px;
  background: rgba(48, 54, 61, 0.2);
  transition: all 0.2s ease;
  margin: 0;
}

.association-radio:hover {
  border-color: #58a6ff;
  background: rgba(56, 139, 253, 0.05);
}

.association-radio:has(:checked) {
  border-color: #58a6ff;
  background: rgba(56, 139, 253, 0.08);
}

.radio-content {
  margin-left: 8px;
}

.radio-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.radio-icon {
  font-size: 18px;
  color: #58a6ff;
}

.radio-title {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
}

.radio-description {
  margin: 0;
  font-size: 14px;
  color: #8b949e;
  line-height: 1.4;
}

.project-selection-form-item {
  margin-bottom: 24px;
}

.project-selection-container {
  width: 100%;
}

.project-select {
  margin-bottom: 16px;
}

.project-preview {
  margin-top: 16px;
}

.project-alert {
  background: rgba(56, 139, 253, 0.08);
  border: 1px solid rgba(56, 139, 253, 0.3);
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-name {
  font-weight: 600;
  font-size: 15px;
  color: #c9d1d9;
}

.project-details {
  font-size: 13px;
  color: #58a6ff;
}

.external-link-form-item {
  margin-bottom: 24px;
}

.external-link-container {
  width: 100%;
}

.external-link-input {
  margin-bottom: 16px;
}

.link-preview {
  margin-top: 16px;
}

.link-alert {
  background: rgba(56, 139, 253, 0.08);
  border: 1px solid rgba(56, 139, 253, 0.3);
}

.link-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.link-status {
  font-weight: 600;
  font-size: 15px;
  color: #c9d1d9;
}

.link-details {
  font-size: 13px;
  color: #8b949e;
}

/* Bilibili-style Inline Tags */
.tags-form-item {
  margin-bottom: 24px;
}

.bilibili-inline-tags-container {
  width: 100%;
}

.inline-tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid #373e47;
  border-radius: 6px;
  background: #0d1117;
  transition: border-color 0.2s ease;
}

.inline-tags-wrapper:focus-within {
  border-color: #58a6ff;
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.1);
}

.inline-tag {
  display: inline-flex;
  align-items: center;
  background: #2188ff;
  color: #ffffff;
  border-radius: 14px;
  padding: 4px 8px 4px 10px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  max-width: 150px;
  transition: all 0.15s ease;
}

.inline-tag:hover {
  background: #1976d2;
  transform: translateY(-1px);
}

.inline-tag .tag-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 4px;
}

.inline-tag-remove {
  padding: 0;
  margin: 0;
  width: 16px;
  height: 16px;
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.15s ease;
}

.inline-tag-remove:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.inline-tag-input {
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  background: transparent;
  color: #c9d1d9;
  font-size: 14px;
  padding: 4px 0;
  line-height: 1.4;
}

.inline-tag-input::placeholder {
  color: #6e7681;
  font-style: italic;
}

.inline-tag-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.remaining-count {
  color: #6e7681;
  font-size: 12px;
  white-space: nowrap;
  margin-left: auto;
  padding-left: 8px;
}

.privacy-form-item {
  margin-bottom: 24px;
}

.privacy-options {
  width: 100%;
}

.privacy-option {
  width: 100%;
  padding: 20px;
  border: 1px solid #30363d;
  border-radius: 12px;
  background: rgba(48, 54, 61, 0.3);
  transition: all 0.2s ease;
}

.privacy-option:hover {
  border-color: #58a6ff;
  background: rgba(56, 139, 253, 0.05);
}

.option-content {
  margin-left: 8px;
}

.option-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.option-header .n-icon {
  font-size: 20px;
  color: #58a6ff;
}

.option-title {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
}

.option-description {
  margin: 0;
  color: #8b949e;
  line-height: 1.5;
  font-size: 14px;
}

/* Nested Privacy Feature Styles */
.nested-feature {
  margin-top: 16px;
  padding: 16px;
  background: rgba(56, 139, 253, 0.05);
  border: 1px solid rgba(56, 139, 253, 0.2);
  border-radius: 8px;
}

.nested-feature-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nested-feature-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.nested-feature-icon {
  font-size: 18px;
  color: #58a6ff;
}

.nested-feature-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nested-feature-title {
  font-size: 14px;
  font-weight: 600;
  color: #c9d1d9;
}

.nested-feature-desc {
  font-size: 12px;
  color: #8b949e;
  line-height: 1.3;
}

.nested-feature-alert {
  margin-top: 12px;
}

.files-info-item {
  margin-bottom: 24px;
}

.files-readonly {
  width: 100%;
}

.files-notice {
  margin-bottom: 16px;
  background: rgba(56, 139, 253, 0.08);
  border: 1px solid rgba(56, 139, 253, 0.3);
}

.files-list {
  background: rgba(22, 27, 34, 0.6);
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
}

.files-header {
  font-weight: 500;
  color: #c9d1d9;
  margin-bottom: 12px;
  font-size: 14px;
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item-readonly {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.file-icon {
  font-size: 16px;
  color: #58a6ff;
}

.file-details {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  color: #c9d1d9;
  font-size: 14px;
  font-weight: 500;
}

.primary-badge {
  background: #2ea043;
  color: #ffffff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.file-size {
  color: #8b949e;
  font-size: 12px;
}

/* Form styling overrides */
:deep(.n-form-item-label) {
  color: #c9d1d9;
  font-weight: 500;
}

:deep(.n-input__input-el) {
  background: #0d1117;
  color: #c9d1d9;
}

:deep(.n-base-selection) {
  background: #0d1117;
}

:deep(.n-base-selection-label) {
  color: #c9d1d9;
}

/* Responsive design */
@media (max-width: 768px) {
  .edit-page {
    padding: 16px;
  }
  
  .edit-content {
    padding: 20px;
  }
  
  /* Mobile adjustments for nested privacy feature */
  .nested-feature-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .nested-feature-info {
    gap: 8px;
  }
  
  .nested-feature-icon {
    font-size: 16px;
  }
}
</style> 