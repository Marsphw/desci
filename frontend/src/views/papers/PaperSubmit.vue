<template>
  <div class="paper-submit-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">Submit New Paper</h1>
          <p class="page-description">
            Submit your research paper for publication or peer review
          </p>
        </div>
        <div class="step-indicator">
          <n-steps :current="currentStep" size="small">
            <n-step title="Upload" description="Upload paper file" />
            <n-step title="Metadata" description="Fill paper details" />
            <n-step title="License" description="Choose license" />
            <n-step title="Preview" description="Review submission" />
            <n-step title="Publish" description="Choose publication type" />
          </n-steps>
        </div>
      </div>
    </div>

    <!-- Form Steps -->
    <div class="form-container">
      <!-- Step 1: File Upload -->
      <div v-if="currentStep === 1" class="step-content">
        <n-card title="Upload Paper File" class="step-card">
          <template #header-extra>
            <n-tag type="info" size="small">Step 1 of 5</n-tag>
          </template>
          
          <div class="upload-section">
            <n-upload
              ref="uploadRef"
              :file-list="fileList"
              :max="1"
              accept=".pdf,.doc,.docx"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :custom-request="handleCustomRequest"
              directory-dnd
              drag
              class="upload-area"
            >
              <n-upload-dragger>
                <n-icon size="48" :component="CloudUploadOutline" class="upload-icon" />
                <n-text style="font-size: 16px">
                  Click or drag your paper file to this area to upload
                </n-text>
                <n-p depth="3" style="margin: 8px 0 0 0">
                  Supported formats: PDF, DOC, DOCX (Max size: 50MB)
                </n-p>
              </n-upload-dragger>
            </n-upload>
            
            <div v-if="fileList.length > 0" class="file-info">
              <div class="file-details">
                <n-icon :component="DocumentOutline" class="file-icon" />
                <div class="file-meta">
                  <h4>{{ fileList[0].name }}</h4>
                  <p>{{ formatFileSize(fileList[0].file?.size) }} • {{ getFileType(fileList[0].name) }}</p>
                </div>
                <n-tag :type="getUploadStatusType()" size="small">
                  {{ uploadStatus }}
                </n-tag>
              </div>
              
              <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
                <n-progress :percentage="uploadProgress" :show-indicator="false" />
                <span class="progress-text">{{ uploadProgress }}% uploaded</span>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <n-button @click="goBack">Cancel</n-button>
            <n-button 
              type="primary" 
              @click="nextStep"
              :disabled="fileList.length === 0 || uploadStatus !== 'completed'"
              :loading="uploadStatus === 'uploading'"
            >
              Next: Fill Metadata
            </n-button>
          </div>
        </n-card>
      </div>

      <!-- Step 2: Metadata -->
      <div v-if="currentStep === 2" class="step-content">
        <n-card title="Paper Information" class="step-card">
          <template #header-extra>
            <n-tag type="info" size="small">Step 2 of 5</n-tag>
          </template>
          
          <n-form :model="paperForm" :rules="paperRules" ref="paperFormRef" label-placement="top">
            <n-grid :cols="2" :x-gap="24">
              <n-gi>
                <n-form-item label="Paper Title" path="title">
                  <n-input 
                    v-model:value="paperForm.title" 
                    placeholder="Enter the title of your paper"
                    :maxlength="200"
                    show-count
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Category" path="category">
                  <n-select 
                    v-model:value="paperForm.category" 
                    :options="categoryOptions"
                    placeholder="Select research category"
                  />
                </n-form-item>
              </n-gi>
            </n-grid>
            
            <n-form-item label="Authors" path="authors">
              <n-dynamic-input
                v-model:value="paperForm.authors"
                :on-create="() => ({ name: '', affiliation: '', email: '' })"
                #="{ index, value }"
              >
                <n-grid :cols="3" :x-gap="12">
                  <n-gi>
                    <n-input 
                      v-model:value="value.name" 
                      placeholder="Author name"
                      :maxlength="100"
                    />
                  </n-gi>
                  <n-gi>
                    <n-input 
                      v-model:value="value.affiliation" 
                      placeholder="Affiliation"
                      :maxlength="150"
                    />
                  </n-gi>
                  <n-gi>
                    <n-input 
                      v-model:value="value.email" 
                      placeholder="Email (optional)"
                      :maxlength="100"
                    />
                  </n-gi>
                </n-grid>
              </n-dynamic-input>
            </n-form-item>
            
            <n-form-item label="Abstract" path="abstract">
              <n-input
                v-model:value="paperForm.abstract"
                type="textarea"
                placeholder="Enter the abstract of your paper (minimum 100 words)"
                :rows="6"
                :maxlength="2000"
                show-count
              />
            </n-form-item>
            
            <n-grid :cols="2" :x-gap="24">
              <n-gi>
                <n-form-item label="Keywords" path="keywords">
                  <n-dynamic-tags v-model:value="paperForm.keywords" :max="10" />
                  <template #feedback>
                    Add relevant keywords to help others discover your research
                  </template>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Journal/Conference" path="venue">
                  <n-input 
                    v-model:value="paperForm.venue" 
                    placeholder="Target journal or conference (optional)"
                  />
                </n-form-item>
              </n-gi>
            </n-grid>
            
            <n-form-item label="Funding Information">
              <n-input
                v-model:value="paperForm.funding"
                type="textarea"
                placeholder="List funding sources, grant numbers, etc. (optional)"
                :rows="2"
              />
            </n-form-item>
          </n-form>
          
          <div class="form-actions">
            <n-button @click="prevStep">Previous</n-button>
            <n-button type="primary" @click="validateAndNext">
              Next: Choose License
            </n-button>
          </div>
        </n-card>
      </div>

      <!-- Step 3: License Selection -->
      <div v-if="currentStep === 3" class="step-content">
        <n-card title="Choose License" class="step-card">
          <template #header-extra>
            <n-tag type="info" size="small">Step 3 of 5</n-tag>
          </template>
          
          <div class="license-section">
            <n-radio-group v-model:value="paperForm.license" class="license-options">
              <div 
                v-for="license in licenseOptions" 
                :key="license.value"
                class="license-card"
                :class="{ 'selected': paperForm.license === license.value }"
                @click="paperForm.license = license.value"
              >
                <n-radio :value="license.value" />
                <div class="license-content">
                  <h4>{{ license.name }}</h4>
                  <p>{{ license.description }}</p>
                  <div class="license-features">
                    <n-tag 
                      v-for="feature in license.features" 
                      :key="feature"
                      size="small"
                      :type="license.recommended ? 'success' : 'default'"
                    >
                      {{ feature }}
                    </n-tag>
                  </div>
                  <div v-if="license.recommended" class="recommended-badge">
                    <n-tag type="success" size="small">Recommended</n-tag>
                  </div>
                </div>
              </div>
            </n-radio-group>
          </div>
          
          <div class="form-actions">
            <n-button @click="prevStep">Previous</n-button>
            <n-button 
              type="primary" 
              @click="nextStep"
              :disabled="!paperForm.license"
            >
              Next: Preview
            </n-button>
          </div>
        </n-card>
      </div>

      <!-- Step 4: Preview -->
      <div v-if="currentStep === 4" class="step-content">
        <n-card title="Preview Submission" class="step-card">
          <template #header-extra>
            <n-tag type="info" size="small">Step 4 of 5</n-tag>
          </template>
          
          <div class="preview-section">
            <div class="preview-item">
              <h3>Paper File</h3>
              <div class="file-preview">
                <n-icon :component="DocumentOutline" />
                <span>{{ fileList[0]?.name }}</span>
                <n-tag size="small">{{ formatFileSize(fileList[0]?.file?.size) }}</n-tag>
              </div>
            </div>
            
            <div class="preview-item">
              <h3>Basic Information</h3>
              <div class="info-grid">
                <div class="info-row">
                  <span class="label">Title:</span>
                  <span class="value">{{ paperForm.title }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Category:</span>
                  <span class="value">{{ paperForm.category }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Authors:</span>
                  <span class="value">
                    {{ paperForm.authors.map(a => a.name).join(', ') }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Keywords:</span>
                  <div class="keywords-preview">
                    <n-tag 
                      v-for="keyword in paperForm.keywords" 
                      :key="keyword"
                      size="small"
                    >
                      {{ keyword }}
                    </n-tag>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="preview-item">
              <h3>Abstract</h3>
              <p class="abstract-preview">{{ paperForm.abstract }}</p>
            </div>
            
            <div class="preview-item">
              <h3>License</h3>
              <div class="license-preview">
                <span>{{ getLicenseName(paperForm.license) }}</span>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <n-button @click="prevStep">Previous</n-button>
            <n-button type="primary" @click="nextStep">
              Next: Choose Publication Type
            </n-button>
          </div>
        </n-card>
      </div>

      <!-- Step 5: Publication Type -->
      <div v-if="currentStep === 5" class="step-content">
        <n-card title="Choose Publication Method" class="step-card">
          <template #header-extra>
            <n-tag type="info" size="small">Step 5 of 5</n-tag>
          </template>
          
          <div class="publication-options">
            <div 
              class="publication-card"
              :class="{ 'selected': publicationType === 'peer-review' }"
              @click="publicationType = 'peer-review'"
            >
              <n-radio value="peer-review" />
              <div class="publication-content">
                <div class="publication-header">
                  <n-icon :component="PeopleOutline" class="publication-icon" />
                  <h3>Peer Review</h3>
                </div>
                <p>Submit your paper for formal peer review process</p>
                <div class="publication-features">
                  <ul>
                    <li>Professional peer review</li>
                    <li>Higher credibility</li>
                    <li>Journal/conference publication</li>
                    <li>Longer processing time</li>
                  </ul>
                </div>
                <div class="timeline">
                  <span>Estimated timeline: 2-6 months</span>
                </div>
              </div>
            </div>
            
            <div 
              class="publication-card"
              :class="{ 'selected': publicationType === 'preprint' }"
              @click="publicationType = 'preprint'"
            >
              <n-radio value="preprint" />
              <div class="publication-content">
                <div class="publication-header">
                  <n-icon :component="FlashOutline" class="publication-icon" />
                  <h3>Preprint Server</h3>
                </div>
                <p>Publish immediately as a preprint for early sharing</p>
                <div class="publication-features">
                  <ul>
                    <li>Immediate publication</li>
                    <li>Early community feedback</li>
                    <li>Establish priority</li>
                    <li>Can submit for review later</li>
                  </ul>
                </div>
                <div class="timeline">
                  <span>Available immediately</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <n-button @click="prevStep">Previous</n-button>
            <n-button 
              type="primary" 
              @click="submitPaper"
              :disabled="!publicationType"
              :loading="isSubmitting"
            >
              {{ publicationType === 'peer-review' ? 'Submit for Review' : 'Publish as Preprint' }}
            </n-button>
          </div>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NCard, NButton, NSteps, NStep, NUpload, NUploadDragger, NIcon, NText, NP,
  NForm, NFormItem, NInput, NSelect, NDynamicInput, NDynamicTags, NGrid, NGi,
  NRadioGroup, NRadio, NTag, NProgress, useMessage
} from 'naive-ui'
import {
  CloudUploadOutline, DocumentOutline, PeopleOutline, FlashOutline
} from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()

// Reactive data
const currentStep = ref(1)
const fileList = ref([])
const uploadProgress = ref(0)
const uploadStatus = ref('waiting') // waiting, uploading, completed, error
const publicationType = ref('')
const isSubmitting = ref(false)

// Form refs
const paperFormRef = ref(null)
const uploadRef = ref(null)

// Paper form data
const paperForm = ref({
  title: '',
  category: '',
  authors: [{ name: '', affiliation: '', email: '' }],
  abstract: '',
  keywords: [],
  venue: '',
  funding: '',
  license: ''
})

// Options
const categoryOptions = [
  { label: 'Computer Science', value: 'computer-science' },
  { label: 'Physics', value: 'physics' },
  { label: 'Chemistry', value: 'chemistry' },
  { label: 'Biology', value: 'biology' },
  { label: 'Medicine', value: 'medicine' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Mathematics', value: 'mathematics' },
  { label: 'Environmental Science', value: 'environmental-science' },
  { label: 'Social Sciences', value: 'social-sciences' },
  { label: 'Economics', value: 'economics' },
  { label: 'Psychology', value: 'psychology' },
  { label: 'Other', value: 'other' }
]

const licenseOptions = [
  {
    value: 'cc-by',
    name: 'CC BY 4.0',
    description: 'Allows others to distribute, remix, adapt, and build upon the material in any medium or format, as long as attribution is given to the creator.',
    features: ['Attribution Required', 'Commercial Use OK', 'Derivative Works OK'],
    recommended: true
  },
  {
    value: 'cc-by-sa',
    name: 'CC BY-SA 4.0',
    description: 'Allows others to distribute, remix, adapt, and build upon the material, but derivative works must be licensed under identical terms.',
    features: ['Attribution Required', 'Share Alike', 'Commercial Use OK']
  },
  {
    value: 'cc-by-nc',
    name: 'CC BY-NC 4.0',
    description: 'Allows others to distribute, remix, adapt, and build upon the material for non-commercial purposes only.',
    features: ['Attribution Required', 'Non-Commercial Only', 'Derivative Works OK']
  },
  {
    value: 'all-rights-reserved',
    name: 'All Rights Reserved',
    description: 'Traditional copyright - others cannot use, distribute, or modify the work without explicit permission.',
    features: ['Full Copyright Protection', 'Permission Required for Use']
  }
]

// Form validation rules
const paperRules = {
  title: [
    { required: true, message: 'Please enter paper title', trigger: 'blur' },
    { min: 10, message: 'Title should be at least 10 characters', trigger: 'blur' }
  ],
  category: [
    { required: true, message: 'Please select a category', trigger: 'change' }
  ],
  authors: [
    { 
      required: true, 
      validator: (rule, value) => {
        if (!value || value.length === 0) return new Error('At least one author is required')
        if (value.some(author => !author.name.trim())) return new Error('All authors must have names')
        return true
      },
      trigger: 'blur'
    }
  ],
  abstract: [
    { required: true, message: 'Please enter abstract', trigger: 'blur' },
    { min: 100, message: 'Abstract should be at least 100 characters', trigger: 'blur' }
  ],
  keywords: [
    { 
      required: true, 
      validator: (rule, value) => {
        if (!value || value.length < 3) return new Error('At least 3 keywords are required')
        return true
      },
      trigger: 'change'
    }
  ]
}

// Methods
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileType = (filename) => {
  const ext = filename.split('.').pop().toUpperCase()
  return ext === 'PDF' ? 'PDF Document' : `${ext} Document`
}

const getUploadStatusType = () => {
  switch (uploadStatus.value) {
    case 'completed': return 'success'
    case 'uploading': return 'info'
    case 'error': return 'error'
    default: return 'default'
  }
}

const getLicenseName = (value) => {
  const license = licenseOptions.find(l => l.value === value)
  return license ? license.name : value
}

const handleFileChange = ({ fileList: newFileList }) => {
  fileList.value = newFileList
  if (newFileList.length > 0) {
    // Simulate file upload
    uploadStatus.value = 'uploading'
    uploadProgress.value = 0
    
    const interval = setInterval(() => {
      uploadProgress.value += 10
      if (uploadProgress.value >= 100) {
        clearInterval(interval)
        uploadStatus.value = 'completed'
        message.success('File uploaded successfully!')
      }
    }, 200)
  }
}

const handleFileRemove = () => {
  fileList.value = []
  uploadProgress.value = 0
  uploadStatus.value = 'waiting'
}

const handleCustomRequest = ({ file, onFinish, onError, onProgress }) => {
  // Custom upload logic would go here
  // For now, just simulate success
  setTimeout(() => onFinish(), 2000)
}

const nextStep = () => {
  if (currentStep.value < 5) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const validateAndNext = async () => {
  try {
    await paperFormRef.value?.validate()
    nextStep()
  } catch (error) {
    message.error('Please fill in all required fields correctly')
  }
}

const goBack = () => {
  router.push('/publications')
}

const submitPaper = async () => {
  try {
    isSubmitting.value = true
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const paperId = Math.floor(Math.random() * 1000) + 1
    
    if (publicationType.value === 'peer-review') {
      message.success('Paper submitted for peer review!')
      router.push(`/papers/${paperId}`)
    } else {
      message.success('Paper published as preprint!')
      router.push(`/papers/${paperId}`)
    }
  } catch (error) {
    message.error('Failed to submit paper')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  // Initialize form
})
</script>

<style scoped>
.paper-submit-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #c9d1d9;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 1rem;
  color: #8b949e;
  margin: 0;
  line-height: 1.5;
}

.step-indicator {
  flex-shrink: 0;
  min-width: 500px;
}

.form-container {
  margin-bottom: 32px;
}

.step-card {
  background: #161b22;
  border: 1px solid #30363d;
  min-height: 500px;
}

.upload-section {
  margin-bottom: 24px;
}

.upload-area {
  width: 100%;
}

.upload-icon {
  color: #58a6ff;
  margin-bottom: 12px;
}

.file-info {
  margin-top: 24px;
  padding: 16px;
  background: rgba(48, 54, 61, 0.3);
  border-radius: 8px;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.file-icon {
  font-size: 24px;
  color: #58a6ff;
}

.file-meta h4 {
  margin: 0 0 4px 0;
  color: #c9d1d9;
  font-size: 1rem;
}

.file-meta p {
  margin: 0;
  color: #8b949e;
  font-size: 0.875rem;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-text {
  font-size: 0.875rem;
  color: #8b949e;
}

.license-section {
  margin-bottom: 24px;
}

.license-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.license-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  border: 1px solid #30363d;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.license-card:hover {
  border-color: #58a6ff;
}

.license-card.selected {
  border-color: #58a6ff;
  background: rgba(88, 166, 255, 0.1);
}

.license-content {
  flex: 1;
}

.license-content h4 {
  margin: 0 0 8px 0;
  color: #c9d1d9;
  font-size: 1.1rem;
}

.license-content p {
  margin: 0 0 12px 0;
  color: #8b949e;
  line-height: 1.5;
}

.license-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.recommended-badge {
  margin-top: 8px;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 24px;
}

.preview-item h3 {
  margin: 0 0 12px 0;
  color: #c9d1d9;
  font-size: 1.1rem;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(48, 54, 61, 0.3);
  border-radius: 8px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  gap: 12px;
}

.info-row .label {
  min-width: 100px;
  color: #8b949e;
  font-weight: 500;
}

.info-row .value {
  color: #c9d1d9;
}

.keywords-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.abstract-preview {
  color: #8b949e;
  line-height: 1.6;
  margin: 0;
}

.license-preview {
  color: #c9d1d9;
  font-weight: 500;
}

.publication-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.publication-card {
  display: flex;
  gap: 16px;
  padding: 24px;
  border: 1px solid #30363d;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.publication-card:hover {
  border-color: #58a6ff;
}

.publication-card.selected {
  border-color: #58a6ff;
  background: rgba(88, 166, 255, 0.1);
}

.publication-content {
  flex: 1;
}

.publication-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.publication-icon {
  font-size: 24px;
  color: #58a6ff;
}

.publication-content h3 {
  margin: 0;
  color: #c9d1d9;
  font-size: 1.2rem;
}

.publication-content p {
  margin: 0 0 16px 0;
  color: #8b949e;
  line-height: 1.5;
}

.publication-features ul {
  margin: 0;
  padding-left: 20px;
  color: #8b949e;
}

.publication-features li {
  margin-bottom: 4px;
}

.timeline {
  margin-top: 12px;
  font-size: 0.875rem;
  color: #58a6ff;
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid #30363d;
}

/* Dark theme adjustments */
:deep(.n-card) {
  background-color: #161b22;
  border-color: #30363d;
}

:deep(.n-input) {
  background-color: #0d1117;
  border-color: #30363d;
}

:deep(.n-select) {
  background-color: #0d1117;
}

:deep(.n-upload-dragger) {
  background-color: #0d1117;
  border-color: #30363d;
}

:deep(.n-steps .n-step .n-step-indicator) {
  background-color: #161b22;
  border-color: #30363d;
}
</style> 