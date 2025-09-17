<template>
  <div class="upload-page">
    <div class="page-header">
      <n-button text @click="goBack" class="back-btn">
        <template #icon>
          <n-icon :component="ArrowBackOutline" />
        </template>
        Back to Datasets
      </n-button>
      
      <h1 class="page-title">Upload Dataset</h1>
      <p class="page-description">
        Upload and configure your research dataset with privacy protection options
      </p>
    </div>

    <div class="upload-content">
      <n-steps :current="currentStep" class="upload-steps">
        <n-step title="Prepare Dataset" description="Upload your raw data file" />
        <n-step title="Data Processing" description="Configure metadata and preprocessing" />
        <n-step title="Privacy Settings" description="Set privacy level and access controls" />
      </n-steps>

      <div class="step-content">
        <!-- Step 1: File Upload -->
        <div v-if="currentStep === 1" class="step-panel">
          <h2>Step 1: Prepare Dataset</h2>
          <div class="upload-section">
            <!-- Native file input for testing -->
            <input
              ref="nativeFileInputRef"
              type="file"
              multiple
              accept=".csv,.json,.xlsx,.txt,.parquet,.h5,.zip"
              @change="handleNativeFileSelect"
              style="display: none"
            />
            
            <!-- Custom upload area -->
            <div 
              class="custom-upload-area" 
              :class="{ 'drag-over': isDragOver }"
              @click="triggerNativeFileInput" 
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleDrop"
            >
              <div class="upload-icon">
                <n-icon size="48" :component="CloudUploadOutline" />
              </div>
              <n-text class="upload-text">
                {{ fileList.length > 0 ? 'Click to add more files or drag here' : 'Click or drag files to this area to upload' }}
              </n-text>
              <n-text depth="3" class="upload-hint">
                Supported formats: CSV, JSON, Excel, TXT, Parquet, HDF5, ZIP (Max 100MB each, up to 10 files)
              </n-text>
            </div>

            <div v-if="fileList.length > 0" class="file-info">
              <!-- File Summary -->
              <div class="file-summary-header">
                <h3>Files Selected ({{ fileList.length }})</h3>
                <n-button size="small" quaternary type="error" @click="clearAllFiles">
                  Clear All
                </n-button>
              </div>

              <!-- Summary Stats -->
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-label">TOTAL FILES:</span>
                  <span class="stat-value">{{ fileList.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">TOTAL SIZE:</span>
                  <span class="stat-value">{{ formatFileSize(totalFileSize) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">PRIMARY FILE:</span>
                  <span class="stat-value">{{ primaryFile?.name || 'Auto-detected' }}</span>
                </div>
              </div>

              <!-- File List -->
              <div class="file-list">
                <div 
                  v-for="(file, index) in fileList" 
                  :key="file.id" 
                  class="file-item"
                  :class="{ 'is-primary': file.id === primaryFile?.id }"
                >
                  <div class="file-header">
                    <div class="file-select">
                      <n-radio
                        :checked="file.id === primaryFile?.id"
                        @update:checked="() => setPrimaryFile(file.id)"
                        size="small"
                      />
                    </div>
                    <div class="file-icon">
                      <n-icon :component="getFileIcon(file)" size="20" />
                    </div>
                    <div class="file-info-content">
                      <div class="file-name">
                        {{ file.name }}
                        <n-tag v-if="file.id === primaryFile?.id" type="success" size="small">Primary</n-tag>
                      </div>
                      <div class="file-meta">
                        <span class="file-size">{{ formatFileSize(file.size) }}</span>
                        <span class="file-type">{{ formatFileType(file.type) }}</span>
                      </div>
                    </div>
                    <div class="file-actions">
                      <n-button
                        quaternary
                        size="tiny"
                        type="error"
                        @click="removeFile(file.id)"
                        class="remove-btn"
                      >
                        <template #icon>
                          <n-icon :component="CloseOutline" />
                        </template>
                      </n-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Data Processing -->
        <div v-if="currentStep === 2" class="step-panel">
          <h2>Step 2: Data Processing</h2>
          <div class="form-section">
            <n-form :model="datasetForm" :rules="formRules" ref="formRef">
              <n-form-item label="Dataset Name" path="name">
                <n-input 
                  v-model:value="datasetForm.name" 
                  placeholder="Enter a descriptive name for your dataset"
                  maxlength="100"
                  show-count
                />
              </n-form-item>

              <n-form-item label="Description" path="description">
                <n-input
                  v-model:value="datasetForm.description"
                  type="textarea"
                  placeholder="Describe your dataset, its purpose, and methodology"
                  :rows="4"
                  maxlength="500"
                  show-count
                />
              </n-form-item>

              <n-form-item label="Category" path="category">
                <n-select
                  v-model:value="datasetForm.category"
                  :options="categoryOptions"
                  placeholder="Select a category"
                />
              </n-form-item>

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
                      :placeholder="datasetTags.length === 0 ? 'Press Enter to create tag' : ''"
                      class="inline-tag-input"
                      maxlength="20"
                      :disabled="datasetTags.length >= 10"
                    />
                    
                    <!-- Remaining count -->
                    <span v-if="datasetTags.length < 10" class="remaining-count">
                      {{ 10 - datasetTags.length }} more tags allowed
                    </span>
                  </div>
                </div>
              </n-form-item>
            </n-form>
          </div>
        </div>

        <!-- Step 3: Privacy Settings -->
        <div v-if="currentStep === 3" class="step-panel">
          <h2>Step 3: Privacy Settings</h2>
          <div class="privacy-section">
            <n-alert type="info" class="privacy-info">
              Choose how you want to share this dataset. Privacy protection uses zero-knowledge proofs
              to enable secure computation without revealing sensitive data.
            </n-alert>

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

            <!-- Privacy Query Feature -->
            <div class="privacy-query-section">
              <h3 class="feature-title">Additional Privacy Features</h3>
              <n-card class="feature-card">
                <div class="feature-option">
                  <div class="feature-header">
                    <div class="feature-info">
                      <div class="feature-icon">
                        <n-icon :component="SearchOutline" />
                      </div>
                      <div class="feature-details">
                        <h4>Privacy Query</h4>
                        <p>Enable anonymous querying capabilities for this dataset</p>
                      </div>
                    </div>
                    <n-switch 
                      v-model:value="datasetForm.privacy_query_enabled"
                      :disabled="datasetForm.privacy_level === 'public'"
                    />
                  </div>
                  <div v-if="datasetForm.privacy_query_enabled" class="feature-description">
                    <n-alert type="info" size="small">
                      <template #icon>
                        <n-icon :component="InformationCircleOutline" />
                      </template>
                      Privacy Query allows authorized users to query your dataset without revealing the actual data content. This feature works best with Private, ZK-Proof Protected, and Encrypted datasets.
                    </n-alert>
                  </div>
                </div>
              </n-card>
            </div>
          </div>
        </div>

        <!-- Upload Success and Countdown -->
        <div v-if="isUploadCompleted" class="upload-success">
          <n-alert type="success" class="success-alert">
            <template #icon>
              <n-icon :component="CheckmarkCircleOutline" />
            </template>
            <div class="success-content">
                              <div class="success-title">🎉 Dataset Uploaded Successfully!</div>
              <div v-if="needsAdditionalProcessing" class="countdown-text">
                Redirecting to {{ datasetForm.privacy_level === 'zk_proof_protected' ? 'ZK Proof generation' : 'dataset encryption' }} page...
              </div>
              <div v-else class="countdown-text">
                Redirecting to datasets list in {{ redirectCountdown }} seconds...
              </div>
            </div>
          </n-alert>
          <div class="quick-actions">
            <n-button v-if="!needsAdditionalProcessing" @click="goBackEarly" type="primary">
              Go Now
            </n-button>
            <n-button 
              v-if="needsAdditionalProcessing && datasetForm.privacy_level === 'zk_proof_protected'" 
              @click="router.push(`/datasets/generate-proof?dataset_id=${uploadedDatasetId}`)" 
              type="primary"
            >
              Go to ZK Proof Generation
            </n-button>
            <n-button 
              v-if="needsAdditionalProcessing && datasetForm.privacy_level === 'encrypted'" 
              @click="router.push(`/datasets/encrypt?dataset_id=${uploadedDatasetId}`)" 
              type="primary"
            >
              Go to Encryption
            </n-button>
            <n-button @click="router.push(`/datasets/${uploadedDatasetId}`)" secondary>
              View Dataset
            </n-button>
          </div>
        </div>

        <!-- Navigation -->
        <div v-else class="step-navigation">
          <n-space justify="space-between">
            <n-button 
              @click="prevStep" 
              :disabled="currentStep === 1 || isUploading"
              secondary
            >
              Previous
            </n-button>
            
            <n-space>
              <n-button @click="saveDraft" :loading="isSavingDraft" secondary>
                Save Draft
              </n-button>
              
              <n-button 
                @click="nextStep" 
                :disabled="!canProceed"
                :loading="isUploading"
                type="primary"
              >
                {{ currentStep === 3 ? 'Upload Dataset' : 'Next' }}
              </n-button>
            </n-space>
          </n-space>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NButton, NIcon, NSteps, NStep, NText, NForm, NFormItem,
  NInput, NSelect, NRadioGroup, NRadio, NSpace, NAlert, NTag, NCard, NSwitch, useMessage
} from 'naive-ui'
import {
  ArrowBackOutline, CloudUploadOutline, GlobeOutline, LockClosedOutline,
  ShieldCheckmarkOutline, FolderOpenOutline, CheckmarkCircleOutline, AlertCircleOutline,
  DocumentTextOutline, DocumentAttachOutline, GridOutline, CodeOutline, ImageOutline,
  CloseOutline, ServerOutline, LinkOutline, PricetagOutline, InformationCircleOutline,
  SearchOutline
} from '@vicons/ionicons5'
import axios from 'axios'

const router = useRouter()
const message = useMessage()

// Refs
const uploadRef = ref(null)
const formRef = ref(null)
const fileList = ref([])
const currentStep = ref(1)
const isUploading = ref(false)
const isSavingDraft = ref(false)
const isUploadCompleted = ref(false)
const redirectCountdown = ref(0)
const uploadedDatasetId = ref(null)

// Form data
const datasetForm = ref({
  name: '',
  description: '',
  category: 'Other',
  association_type: null, // 'internal' or 'external' or null
  project_id: null, // for internal projects
  external_link: '', // for external links
  privacy_level: 'private', // Default to private
  privacy_query_enabled: false // Privacy query feature
})

const datasetTags = ref([])
const currentTagInput = ref('')
const tagInputRef = ref(null)

// User and projects data
const currentUser = ref(null)
const userProjects = ref([])
const selectedProject = ref(null)
const externalLinkValid = ref(false)
const isDragOver = ref(false)
const selectedPrimaryFileId = ref(null)

// Computed properties for multi-file support
const totalFileSize = computed(() => {
  return fileList.value.reduce((total, file) => {
    return total + (file.size || 0)
  }, 0)
})

const primaryFile = computed(() => {
  if (fileList.value.length === 0) return null
  
  // If user manually selected a primary file, use that
  if (selectedPrimaryFileId.value) {
    const selectedFile = fileList.value.find(f => f.id === selectedPrimaryFileId.value)
    if (selectedFile) return selectedFile
  }
  
  // Default: single file or largest file for multiple files
  if (fileList.value.length === 1) return fileList.value[0]
  
  // Find the largest file as default primary
  return fileList.value.reduce((largest, file) => {
    const fileSize = file.size || 0
    const largestSize = largest.size || 0
    return fileSize > largestSize ? file : largest
  })
})

// Options
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

// Form validation rules
const formRules = computed(() => ({
  name: [
    { required: true, message: 'Dataset name is required', trigger: ['input', 'blur'] },
    { min: 3, max: 100, message: 'Name should be 3-100 characters', trigger: ['input', 'blur'] }
  ],
  description: [
    { max: 500, message: 'Description should not exceed 500 characters', trigger: ['input', 'blur'] }
  ],
  category: [
    { required: true, message: 'Please select a category', trigger: ['change', 'blur'] }
  ],
  project_id: [
    { required: true, trigger: ['change', 'blur'] }
  ],
  external_link: [
    { required: true, message: 'Please enter a valid URL or DOI', trigger: ['input', 'blur'] }
  ],
}))

// Computed properties
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return fileList.value.length > 0
  }
  if (currentStep.value === 2) {
    return datasetForm.value.name && datasetForm.value.category && (datasetForm.value.association_type === 'internal' ? datasetForm.value.project_id : true) && (datasetForm.value.association_type === 'external' ? externalLinkValid.value : true)
  }
  if (currentStep.value === 3) {
    return datasetForm.value.privacy_level
  }
  return false
})

const needsAdditionalProcessing = computed(() => {
  return ['zk_proof_protected', 'encrypted'].includes(datasetForm.value.privacy_level)
})

// Methods
const goBack = () => {
  router.push('/datasets')
}

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i]
}

const formatFileType = (mimeType) => {
  if (!mimeType) return 'Unknown'
  
  const typeMap = {
    'text/csv': 'CSV File',
    'application/json': 'JSON File',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel File (.xlsx)',
    'application/vnd.ms-excel': 'Excel File (.xls)',
    'text/plain': 'Text File',
    'application/x-parquet': 'Parquet File',
    'application/x-hdf': 'HDF5 File',
    'application/zip': 'ZIP Archive',
    'application/x-zip-compressed': 'ZIP Archive'
  }
  
  return typeMap[mimeType] || mimeType
}

const nativeFileInputRef = ref(null)

const triggerNativeFileInput = () => {
  nativeFileInputRef.value?.click()
}

const handleNativeFileSelect = (event) => {
  const files = Array.from(event.target.files)
  processFiles(files)
}

const handleDragOver = (event) => {
  isDragOver.value = true
}

const handleDragLeave = (event) => {
  isDragOver.value = false
}

const handleDrop = (event) => {
  isDragOver.value = false
  const files = Array.from(event.dataTransfer.files)
  processFiles(files)
}

const processFiles = (files) => {
  for (const file of files) {
    // Check file type
    const allowedTypes = ['.csv', '.json', '.xlsx', '.txt', '.parquet', '.h5', '.zip']
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      message.error(`File type "${fileExtension}" is not supported`)
      continue
    }
    
    // Validate file size (100MB limit per file)
    if (file.size > 100 * 1024 * 1024) {
      message.error(`File "${file.name}" is too large. Maximum size is 100MB.`)
      continue
    }
    
    // Check if total files would exceed limit
    if (fileList.value.length >= 10) {
      message.error('Maximum 10 files allowed')
      break
    }
    
    // Auto-generate name from first file if not set
    if (!datasetForm.value.name && fileList.value.length === 0) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      datasetForm.value.name = nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    
    // Add file to fileList
    const newFile = {
      id: Date.now().toString() + Math.random().toString(36),
      name: file.name,
      status: 'finished',
      file: file,
      size: file.size,
      type: file.type
    }
    
    fileList.value.push(newFile)
    message.success(`File "${file.name}" (${formatFileSize(file.size)}) selected successfully`)
  }
  
  // Clear the input so the same file can be selected again
  if (nativeFileInputRef.value) {
    nativeFileInputRef.value.value = ''
  }
}

const clearAllFiles = () => {
  fileList.value = []
  selectedPrimaryFileId.value = null
  // Clear auto-generated name when files are removed
  if (datasetForm.value.name) {
    datasetForm.value.name = ''
  }
}

const setPrimaryFile = (fileId) => {
  selectedPrimaryFileId.value = fileId
  message.info('Primary file updated')
}

const removeFile = (fileId) => {
  const fileIndex = fileList.value.findIndex(f => f.id === fileId)
  if (fileIndex > -1) {
    const fileName = fileList.value[fileIndex].name
    fileList.value.splice(fileIndex, 1)
    
    // If removed file was primary, clear selection
    if (selectedPrimaryFileId.value === fileId) {
      selectedPrimaryFileId.value = null
    }
    
    // If no files left, clear form name
    if (fileList.value.length === 0 && datasetForm.value.name) {
      datasetForm.value.name = ''
    }
    
    message.success(`File "${fileName}" removed`)
  }
}

const getFileIcon = (file) => {
  const mimeType = file.type || ''
  const fileName = file.name || ''
  
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

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const nextStep = async () => {
  if (currentStep.value === 2) {
    // Validate form before proceeding
    try {
      await formRef.value.validate()
      
      // Additional validation for external link
      if (datasetForm.value.association_type === 'external' && !externalLinkValid.value) {
        message.error('Please enter a valid external link')
        return
      }
    } catch (error) {
      message.error('Please fill in all required fields')
      return
    }
  }

  if (currentStep.value === 3) {
    // Final step - upload dataset
    await uploadDataset()
  } else {
    currentStep.value++
  }
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
  
  // Check if it's a valid URL or DOI
  const urlPattern = /^https?:\/\/.+/
  const doiPattern = /^10\.\d{4,}\/\S+/
  
  externalLinkValid.value = urlPattern.test(value) || doiPattern.test(value)
}

// Tag management methods
const handleTagInput = (value) => {
  // Remove any event object artifacts and clean the input
  if (typeof value === 'string') {
    currentTagInput.value = value.trim()
  }
}

const addTag = () => {
  const tagText = currentTagInput.value.trim()
  
  if (!tagText) return
  
  // Check tag constraints
  if (tagText.length > 20) {
    message.warning('Tag length cannot exceed 20 characters')
    return
  }
  
  if (datasetTags.value.length >= 10) {
    message.warning('Maximum 10 tags allowed')
    return
  }
  
  if (datasetTags.value.includes(tagText)) {
    message.warning('Tag already exists')
    currentTagInput.value = ''
    return
  }
  
  // Normalize tag format (lowercase, no special chars except hyphens)
  const normalizedTag = tagText.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5\-]/g, '-')
  
  // Add the tag
  datasetTags.value.push(normalizedTag)
  currentTagInput.value = ''
  
  // Focus back to input for continuous adding
  nextTick(() => {
    tagInputRef.value?.focus()
  })
  
  message.success(`Tag "${normalizedTag}" added successfully`)
}

const removeTag = (index) => {
  if (index >= 0 && index < datasetTags.value.length) {
    const removedTag = datasetTags.value[index]
    datasetTags.value.splice(index, 1)
    message.info(`Tag "${removedTag}" removed`)
  }
}

const clearInput = () => {
  currentTagInput.value = ''
}

const uploadDataset = async () => {
  if (!currentUser.value?.wallet_address) {
    message.error('Please connect your wallet first')
    return
  }

  if (fileList.value.length === 0) {
    message.error('Please select at least one file to upload')
    return
  }

  // Prevent duplicate uploads
  if (isUploading.value || isUploadCompleted.value) {
    message.warning('Upload is already in progress or completed')
    return
  }

  isUploading.value = true
  
  try {
    const formData = new FormData()
    
    // Add all files to formData
    fileList.value.forEach((fileItem) => {
      formData.append('datasets', fileItem.file)
    })
    
    formData.append('name', datasetForm.value.name)
    formData.append('description', datasetForm.value.description)
    formData.append('owner_wallet_address', currentUser.value.wallet_address)
    formData.append('privacy_level', datasetForm.value.privacy_level)
    formData.append('category', datasetForm.value.category)
    formData.append('tags', JSON.stringify(datasetTags.value))
    formData.append('privacy_query_enabled', datasetForm.value.privacy_query_enabled)
    
    // For special privacy levels, set status as 'uploaded' instead of 'ready'
    formData.append('status', needsAdditionalProcessing.value ? 'uploaded' : 'ready')
    
    // Handle project association
    if (datasetForm.value.association_type === 'internal' && datasetForm.value.project_id) {
      formData.append('project_id', datasetForm.value.project_id)
    } else if (datasetForm.value.association_type === 'external' && datasetForm.value.external_link) {
      formData.append('external_link', datasetForm.value.external_link)
    }
    
    const response = await axios.post('http://localhost:3000/api/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    uploadedDatasetId.value = response.data.id
    message.success('Dataset uploaded successfully!')
    isUploadCompleted.value = true
    
    if (needsAdditionalProcessing.value) {
      // Show additional steps needed message and redirect to appropriate page
      message.info('Dataset uploaded successfully. Additional processing steps are required.')
      
      console.log('Privacy level:', datasetForm.value.privacy_level)
      console.log('Dataset ID:', uploadedDatasetId.value)
      
      setTimeout(() => {
        console.log('Starting redirect...')
        if (datasetForm.value.privacy_level === 'zk_proof_protected') {
          const targetUrl = `/datasets/generate-proof?dataset_id=${uploadedDatasetId.value}`
          console.log('Redirecting to ZK proof page:', targetUrl)
          router.push(targetUrl)
        } else if (datasetForm.value.privacy_level === 'encrypted') {
          const targetUrl = `/datasets/encrypt?dataset_id=${uploadedDatasetId.value}`
          console.log('Redirecting to encrypt page:', targetUrl)
          router.push(targetUrl)
        }
      }, 3000)
    } else {
      // Regular flow - redirect to datasets list
      redirectCountdown.value = 3
      
      const countdownTimer = setInterval(() => {
        redirectCountdown.value--
        if (redirectCountdown.value <= 0) {
          clearInterval(countdownTimer)
          router.push('/datasets')
        }
      }, 1000)
    }

  } catch (error) {
    console.error('Upload failed:', error)
    message.error(error.response?.data?.error || 'Failed to upload dataset')
    isUploadCompleted.value = false
    redirectCountdown.value = 0
  } finally {
    isUploading.value = false
  }
}

const saveDraft = async () => {
  if (!currentUser.value?.wallet_address) {
    message.error('Please connect your wallet first')
    return
  }

  if (!datasetForm.value.name.trim()) {
    message.error('Please provide a dataset name before saving draft')
    return
  }

  isSavingDraft.value = true
  
  try {
    const formData = new FormData()
    
    // Add files if any
    if (fileList.value.length > 0) {
      fileList.value.forEach((fileItem) => {
        formData.append('datasets', fileItem.file)
      })
    }
    
    formData.append('name', datasetForm.value.name)
    formData.append('description', datasetForm.value.description || '')
    formData.append('owner_wallet_address', currentUser.value.wallet_address)
    formData.append('privacy_level', datasetForm.value.privacy_level)
    formData.append('category', datasetForm.value.category)
    formData.append('tags', JSON.stringify(datasetTags.value))
    formData.append('privacy_query_enabled', datasetForm.value.privacy_query_enabled)
    formData.append('status', 'draft') // Mark as draft
    
    // Handle project association
    if (datasetForm.value.association_type === 'internal' && datasetForm.value.project_id) {
      formData.append('project_id', datasetForm.value.project_id)
    } else if (datasetForm.value.association_type === 'external' && datasetForm.value.external_link) {
      formData.append('external_link', datasetForm.value.external_link)
    }
    
    const response = await axios.post('http://localhost:3000/api/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    message.success('Draft saved successfully!')
    uploadedDatasetId.value = response.data.id

  } catch (error) {
    console.error('Save draft failed:', error)
    message.error(error.response?.data?.error || 'Failed to save draft')
  } finally {
    isSavingDraft.value = false
  }
}

const goBackEarly = () => {
  router.push('/datasets')
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

onMounted(async () => {
  await fetchCurrentUser()
  await fetchUserProjects()
})
</script>

<style scoped>
.upload-page {
  max-width: 1000px;
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

.upload-content {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 16px;
  overflow: hidden;
}

.upload-steps {
  padding: 32px;
  border-bottom: 1px solid #30363d;
  background: #0d1117;
}

.step-content {
  padding: 32px;
}

.step-panel h2 {
  font-size: 24px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 24px 0;
}

.upload-section {
  margin-bottom: 24px;
}

.upload-icon {
  color: #58a6ff;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  color: #c9d1d9;
  display: block;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: #8b949e;
}

.file-info {
  margin-top: 24px;
  padding: 20px;
  background: rgba(56, 139, 253, 0.05);
  border: 1px solid rgba(56, 139, 253, 0.2);
  border-radius: 12px;
}

.file-details h3 {
  font-size: 18px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 16px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 13px;
  color: #8b949e;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #c9d1d9;
  word-break: break-all;
}

.form-section {
  max-width: 600px;
}

.privacy-section {
  max-width: 700px;
}

.privacy-info {
  margin-bottom: 24px;
}

.privacy-options {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.privacy-options :deep(.n-space) {
  width: 100%;
  align-items: stretch;
}

.privacy-options :deep(.n-space-item) {
  flex: 1;
  min-width: 400px;
}

/* Privacy Query Feature Styles */
.privacy-query-section {
  margin-top: 32px;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 16px 0;
}

.feature-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.feature-option {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feature-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(88, 166, 255, 0.1);
  color: #58a6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.feature-details h4 {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 4px 0;
}

.feature-details p {
  font-size: 14px;
  color: #8b949e;
  margin: 0;
  line-height: 1.4;
}

.feature-description {
  margin-top: 8px;
}

.privacy-option {
  width: 100%;
  max-width: none;
  min-width: 400px;
  padding: 20px;
  border: 1px solid #30363d;
  border-radius: 12px;
  background: rgba(48, 54, 61, 0.3);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.privacy-option:hover {
  border-color: #58a6ff;
  background: rgba(56, 139, 253, 0.05);
}

.option-content {
  margin-left: 8px;
  flex: 1;
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

/* Upload Success Styles */
.upload-success {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid #30363d;
  text-align: center;
}

.success-alert {
  margin-bottom: 20px;
  background: rgba(46, 160, 67, 0.1);
  border: 1px solid rgba(46, 160, 67, 0.3);
}

.success-content {
  text-align: center;
}

.success-title {
  font-size: 18px;
  font-weight: 600;
  color: #2ea043;
  margin-bottom: 8px;
}

.countdown-text {
  font-size: 16px;
  color: #c9d1d9;
  background: rgba(46, 160, 67, 0.05);
  padding: 8px 16px;
  border-radius: 6px;
  display: inline-block;
  font-weight: 500;
}

.quick-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.step-navigation {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid #30363d;
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

/* Steps styling */
:deep(.n-steps .n-step .n-step-splitor) {
  background: #30363d;
}

/* Project Association Styles */
.association-form-item {
  margin-bottom: 32px;
}

.association-radio-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.association-radio-group :deep(.n-space) {
  width: 100%;
  align-items: stretch;
}

.association-radio-group :deep(.n-space-item) {
  flex: 1;
  min-width: 400px;
}

.association-radio {
  width: 100%;
  max-width: none;
  min-width: 400px;
  padding: 16px;
  border: 1px solid #30363d;
  border-radius: 12px;
  background: rgba(48, 54, 61, 0.2);
  transition: all 0.2s ease;
  margin: 0;
  display: flex;
  align-items: center;
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
  flex: 1;
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

/* Project Selection Styles */
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

/* External Link Styles */
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

.link-alert[data-type="warning"] {
  background: rgba(251, 191, 36, 0.08);
  border-color: rgba(251, 191, 36, 0.3);
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

/* Custom Upload Area Styles */
.custom-upload-area {
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.02);
}

.custom-upload-area:hover {
  border-color: rgba(56, 139, 253, 0.6);
  background: rgba(56, 139, 253, 0.05);
}

.custom-upload-area.drag-over {
  border-color: rgba(56, 139, 253, 0.8);
  background: rgba(56, 139, 253, 0.1);
}

.upload-icon {
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.upload-text {
  display: block;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #ffffff;
}

.upload-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

/* File List Styles */
.file-info {
  margin-top: 20px;
}

.file-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.file-summary-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(56, 139, 253, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(56, 139, 253, 0.2);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  padding: 0;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
  overflow: hidden;
}

.file-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(56, 139, 253, 0.3);
}

.file-item.is-primary {
  border-color: rgba(56, 139, 253, 0.4);
  background: rgba(56, 139, 253, 0.06);
}

.file-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.file-select {
  flex-shrink: 0;
}

.file-icon {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.7);
}

.file-info-content {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #ffffff;
  font-size: 14px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.file-size {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.file-type {
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.file-actions {
  flex-shrink: 0;
}

.remove-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.file-item:hover .remove-btn {
  opacity: 1;
}

/* Responsive design */
@media (max-width: 768px) {
  .upload-page {
    padding: 16px;
  }
  
  .upload-steps,
  .step-content {
    padding: 20px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  /* Mobile upload success */
  .success-title {
    font-size: 16px;
  }
  
  .countdown-text {
    font-size: 14px;
    padding: 6px 12px;
  }
  
  .quick-actions {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .quick-actions .n-button {
    width: 100%;
    max-width: 200px;
  }
  
  /* Mobile-friendly inline tags */
  .inline-tags-wrapper {
    padding: 6px 10px;
    gap: 6px;
  }
  
  .inline-tag {
    font-size: 12px;
    padding: 3px 6px 3px 8px;
    max-width: calc(100% - 80px); /* Leave space for remaining count */
  }
  
  .inline-tag-input {
    min-width: 80px;
    font-size: 13px;
  }
  
  .remaining-count {
    font-size: 11px;
    padding-left: 4px;
  }
  
  /* Mobile adjustments for option cards */
  .association-radio,
  .privacy-option {
    min-width: auto;
    width: 100%;
  }
  
  .association-radio-group :deep(.n-space-item),
  .privacy-options :deep(.n-space-item) {
    min-width: auto;
  }
  
  /* Mobile adjustments for privacy query feature */
  .feature-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .feature-info {
    gap: 12px;
  }
  
  .feature-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .inline-tag {
    max-width: calc(100% - 60px);
    font-size: 11px;
    padding: 2px 5px 2px 7px;
  }
  
  .inline-tag-input {
    min-width: 60px;
    font-size: 12px;
  }
  
  .remaining-count {
    font-size: 10px;
    display: none; /* Hide on very small screens */
  }
}
</style> 