<template>
  <div class="private-query-page">
    <div class="page-header">
      <h1 class="page-title">Private Query</h1>
      <p class="page-description">
        Execute privacy-preserving computations on encrypted datasets using zero-knowledge proofs.
      </p>
    </div>

    <div class="query-content">
      <n-spin :show="isLoading">
        <div class="content-grid">
          <!-- Left: Dataset Info & Query History -->
          <div class="dataset-section">
            <n-card title="Query History" class="history-card">
              <div v-if="queryHistory.length === 0" class="empty-history">
                <n-empty description="No queries executed yet" size="small" />
              </div>
              
              <div v-else class="history-list">
                <div 
                  v-for="query in queryHistory" 
                  :key="query.id" 
                  class="history-item"
                  @click="loadQuery(query)"
                >
                  <div class="history-content">
                    <h5>{{ query.query_type }}</h5>
                    <p>{{ formatDate(query.created_at) }}</p>
                  </div>
                  <div class="history-status">
                    <n-tag :type="query.status === 'completed' ? 'success' : 'warning'" size="small">
                      {{ query.status }}
                    </n-tag>
                  </div>
                </div>
              </div>
            </n-card>
          </div>

          <!-- Right: Query Interface -->
          <div class="query-section">
            <n-card title="Query Configuration" class="query-card">
              <n-form :model="queryForm" :rules="rules" ref="queryFormRef">
                <n-form-item label="Query Type" path="query_type">
                  <n-select
                    v-model:value="queryForm.query_type"
                    :options="queryTypeOptions"
                    placeholder="Select computation type"
                    @update:value="onQueryTypeChange"
                  />
                </n-form-item>

                <n-form-item label="Parameters" path="parameters">
                  <div class="parameter-section">
                    <div v-for="param in currentParameters" :key="param.key" class="parameter-item">
                      <n-form-item :label="param.label" :path="`parameters.${param.key}`">
                        <n-input
                          v-if="param.type === 'text'"
                          v-model:value="queryForm.parameters[param.key]"
                          :placeholder="param.placeholder"
                        />
                        <n-input-number
                          v-else-if="param.type === 'number'"
                          v-model:value="queryForm.parameters[param.key]"
                          :placeholder="param.placeholder"
                          :min="param.min"
                          :max="param.max"
                          style="width: 100%"
                        />
                        <n-date-picker
                          v-else-if="param.type === 'date-range'"
                          v-model:value="queryForm.parameters[param.key]"
                          type="daterange"
                          style="width: 100%"
                        />
                      </n-form-item>
                    </div>
                  </div>
                </n-form-item>

                <n-form-item label="Privacy Settings">
                  <div class="privacy-settings">
                    <n-checkbox v-model:checked="queryForm.use_differential_privacy">
                      Apply Differential Privacy
                    </n-checkbox>
                    <n-checkbox v-model:checked="queryForm.hide_intermediate_results">
                      Hide Intermediate Results
                    </n-checkbox>
                  </div>
                </n-form-item>
              </n-form>

              <div class="query-actions">
                <n-space>
                  <n-button @click="resetQuery" :disabled="isExecuting">
                    Reset
                  </n-button>
                  <n-button 
                    type="primary" 
                    @click="executeQuery" 
                    :loading="isExecuting"
                    :disabled="!canExecuteQuery"
                    size="large"
                  >
                    <template #icon>
                      <n-icon :component="PlayOutline" />
                    </template>
                    Execute Query
                  </n-button>
                </n-space>
              </div>
            </n-card>

            <!-- Query Execution & Results -->
            <n-card v-if="isExecuting || queryResult" title="Execution Results" class="results-card">
              <div v-if="isExecuting" class="execution-progress">
                <div class="progress-info">
                  <h4>{{ currentExecutionStep.title }}</h4>
                  <p>{{ currentExecutionStep.description }}</p>
                </div>
                
                <n-progress 
                  type="line" 
                  :percentage="executionProgress" 
                  :show-indicator="true"
                  processing
                />
                
                <div class="progress-details">
                  <div class="detail-item">
                    <span class="detail-label">Proof Generation:</span>
                    <span class="detail-value">{{ executionProgress > 40 ? 'Complete' : 'In Progress' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Computation:</span>
                    <span class="detail-value">{{ executionProgress > 70 ? 'Complete' : 'Pending' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Verification:</span>
                    <span class="detail-value">{{ executionProgress > 90 ? 'Complete' : 'Pending' }}</span>
                  </div>
                </div>
              </div>

              <div v-if="queryResult" class="query-result">
                <n-alert type="success" show-icon>
                  <template #icon>
                    <n-icon :component="CheckmarkCircleOutline" />
                  </template>
                  <template #header>
                    Query Executed Successfully!
                  </template>
                  The computation has been verified using zero-knowledge proofs without revealing sensitive data.
                </n-alert>

                <div class="result-data">
                  <h4>Computation Result:</h4>
                  <div class="result-value">{{ queryResult.result }}</div>
                  
                  <div class="result-metadata">
                    <div class="metadata-item">
                      <span class="metadata-label">Query ID:</span>
                      <span class="metadata-value">{{ queryResult.query_id }}</span>
                    </div>
                    <div class="metadata-item">
                      <span class="metadata-label">Verification Hash:</span>
                      <span class="metadata-value">{{ formatHash(queryResult.verification_hash) }}</span>
                    </div>
                    <div class="metadata-item">
                      <span class="metadata-label">Execution Time:</span>
                      <span class="metadata-value">{{ queryResult.execution_time }}ms</span>
                    </div>
                    <div class="metadata-item">
                      <span class="metadata-label">Privacy Level:</span>
                      <span class="metadata-value">{{ queryResult.privacy_level }}</span>
                    </div>
                  </div>
                </div>

                <div class="result-actions">
                  <n-space>
                    <n-button @click="exportResult">
                      <template #icon>
                        <n-icon :component="DownloadOutline" />
                      </template>
                      Export Result
                    </n-button>
                    <n-button @click="verifyResult">
                      <template #icon>
                        <n-icon :component="ShieldCheckmarkOutline" />
                      </template>
                      Verify Proof
                    </n-button>
                    <n-button @click="shareResult">
                      <template #icon>
                        <n-icon :component="ShareOutline" />
                      </template>
                      Share Result
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  NButton, NIcon, NCard, NForm, NFormItem, NSelect, NInput, NInputNumber,
  NDatePicker, NCheckbox, NSpace, NSpin, NEmpty, NTag, NAlert, NProgress,
  useMessage
} from 'naive-ui'
import {
  DocumentOutline, WarningOutline, PlayOutline, 
  CheckmarkCircleOutline, DownloadOutline, ShieldCheckmarkOutline, ShareOutline
} from '@vicons/ionicons5'
import axios from 'axios'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const message = useMessage()

// Reactive data
const queryHistory = ref([])
const isLoading = ref(true)
const isExecuting = ref(false)
const executionProgress = ref(0)
const queryResult = ref(null)
const currentUser = ref(null)

// Form refs
const queryFormRef = ref(null)

// Form data
const queryForm = ref({
  query_type: null,
  parameters: {},
  use_differential_privacy: true,
  hide_intermediate_results: true
})

// Execution steps
const executionSteps = ref([
  { title: 'Initializing Query', description: 'Preparing secure computation environment' },
  { title: 'Generating Proof', description: 'Creating zero-knowledge proof for computation' },
  { title: 'Executing Computation', description: 'Running privacy-preserving computation' },
  { title: 'Verifying Results', description: 'Validating computation integrity' }
])

// Computed
const currentExecutionStep = computed(() => {
  const stepIndex = Math.floor(executionProgress.value / 25)
  return Math.min(stepIndex, executionSteps.value.length - 1)
})

const canExecuteQuery = computed(() => {
  return queryForm.value.query_type && !isExecuting.value
})

// Query types and their parameters
const queryTypeConfigs = {
  statistical_summary: {
    label: 'Statistical Summary',
    parameters: [
      { key: 'columns', label: 'Target Columns', type: 'text', placeholder: 'column1,column2' },
      { key: 'operations', label: 'Operations', type: 'text', placeholder: 'mean,median,std' }
    ]
  },
  range_query: {
    label: 'Range Query',
    parameters: [
      { key: 'column', label: 'Target Column', type: 'text', placeholder: 'temperature' },
      { key: 'min_value', label: 'Minimum Value', type: 'number', placeholder: '0', min: 0 },
      { key: 'max_value', label: 'Maximum Value', type: 'number', placeholder: '100' }
    ]
  },
  count_query: {
    label: 'Count Query',
    parameters: [
      { key: 'conditions', label: 'Conditions', type: 'text', placeholder: 'age > 18 AND status = active' }
    ]
  },
  temporal_analysis: {
    label: 'Temporal Analysis',
    parameters: [
      { key: 'date_column', label: 'Date Column', type: 'text', placeholder: 'timestamp' },
      { key: 'date_range', label: 'Date Range', type: 'date-range' },
      { key: 'aggregation', label: 'Aggregation', type: 'text', placeholder: 'daily,weekly,monthly' }
    ]
  },
  correlation_analysis: {
    label: 'Correlation Analysis',
    parameters: [
      { key: 'column1', label: 'First Column', type: 'text', placeholder: 'temperature' },
      { key: 'column2', label: 'Second Column', type: 'text', placeholder: 'humidity' }
    ]
  }
}

const queryTypeOptions = computed(() => {
  return Object.keys(queryTypeConfigs).map(key => ({
    label: queryTypeConfigs[key].label,
    value: key
  }))
})

const currentParameters = computed(() => {
  if (!queryForm.value.query_type) return []
  return queryTypeConfigs[queryForm.value.query_type]?.parameters || []
})

// Form validation
const rules = {
  query_type: [
    { required: true, message: 'Please select a query type', trigger: ['change', 'blur'] }
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

const formatDate = (date) => {
  if (!date) return 'Unknown'
  return dayjs(date).format('MMM D, YYYY HH:mm')
}

const formatHash = (hash) => {
  if (!hash) return 'N/A'
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`
}

const onQueryTypeChange = () => {
  // Reset parameters when query type changes
  queryForm.value.parameters = {}
}

const initializeQuery = async () => {
  try {
    isLoading.value = true
    await fetchCurrentUser()
    
    // Get dataset_id from URL query params
    const datasetId = route.query.dataset_id
    if (datasetId) {
      await fetchQueryHistory(parseInt(datasetId))
    }
  } catch (error) {
    console.error('Failed to initialize query:', error)
    message.error('Failed to initialize query interface')
  } finally {
    isLoading.value = false
  }
}

const executeQuery = async () => {
  try {
    await queryFormRef.value?.validate()
  } catch (error) {
    message.error('Please fill in all required fields')
    return
  }

  if (!currentUser.value?.wallet_address) {
    message.error('Please connect your wallet first')
    return
  }

  isExecuting.value = true
  executionProgress.value = 0
  queryResult.value = null

  try {
    // Simulate progressive execution
    const progressInterval = setInterval(() => {
      if (executionProgress.value < 90) {
        executionProgress.value += Math.random() * 15
      }
    }, 800)

    // Simulate API call (replace with actual implementation)
    await new Promise(resolve => setTimeout(resolve, 4000))
    
    clearInterval(progressInterval)
    executionProgress.value = 100

    // Mock successful result
    queryResult.value = {
      query_id: Date.now().toString(),
      result: generateMockResult(queryForm.value.query_type),
      verification_hash: 'zk_' + Math.random().toString(36).substr(2, 16),
      execution_time: Math.floor(Math.random() * 2000) + 500,
      privacy_level: 'Zero-Knowledge Verified'
    }

    message.success('Query executed successfully!')
    
    // Refresh query history
    await fetchQueryHistory(queryForm.value.dataset_id)
  } catch (error) {
    console.error('Failed to execute query:', error)
    message.error('Failed to execute query')
  } finally {
    isExecuting.value = false
  }
}

const generateMockResult = (queryType) => {
  switch (queryType) {
    case 'statistical_summary':
      return 'Mean: 25.4, Median: 24.8, Std: 3.2'
    case 'range_query':
      return '847 records found'
    case 'count_query':
      return '1,234 matching records'
    case 'temporal_analysis':
      return 'Peak activity: 14:30-16:00'
    case 'correlation_analysis':
      return 'Correlation coefficient: 0.73'
    default:
      return 'Computation completed successfully'
  }
}

const resetQuery = () => {
  queryForm.value = {
    dataset_id: queryForm.value.dataset_id,
    query_type: null,
    parameters: {},
    use_differential_privacy: true,
    hide_intermediate_results: true
  }
  queryResult.value = null
}

const loadQuery = (query) => {
  queryForm.value.query_type = query.query_type
  queryForm.value.parameters = query.parameters || {}
  message.info('Query configuration loaded')
}

const exportResult = () => {
  // TODO: Implement result export
  message.info('Export functionality coming soon')
}

const verifyResult = () => {
  // TODO: Implement proof verification
  message.info('Proof verification functionality coming soon')
}

const shareResult = () => {
  // TODO: Implement result sharing
  message.info('Share functionality coming soon')
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

const fetchQueryHistory = async (datasetId) => {
  try {
    // Mock query history (replace with actual API call)
    queryHistory.value = [
      {
        id: 1,
        query_type: 'statistical_summary',
        parameters: { columns: 'temperature,humidity' },
        status: 'completed',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        query_type: 'range_query',
        parameters: { column: 'temperature', min_value: 20, max_value: 30 },
        status: 'completed',
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  } catch (error) {
    console.error('Failed to fetch query history:', error)
  }
}

onMounted(async () => {
  await initializeQuery()
})
</script>

<style scoped>
.private-query-page {
  max-width: 1400px;
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

.query-content {
  min-height: 400px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.dataset-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.query-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.history-card,
.query-card,
.results-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.empty-history {
  padding: 20px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(48, 54, 61, 0.3);
  border: 1px solid #30363d;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-item:hover {
  background: rgba(56, 139, 253, 0.05);
  border-color: rgba(56, 139, 253, 0.2);
}

.history-content h5 {
  font-size: 14px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 4px 0;
}

.history-content p {
  font-size: 12px;
  color: #8b949e;
  margin: 0;
}

.parameter-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.parameter-item {
  background: rgba(48, 54, 61, 0.3);
  padding: 16px;
  border-radius: 8px;
}

.privacy-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.query-actions {
  margin-top: 24px;
}

.execution-progress {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.progress-info h4 {
  font-size: 18px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 4px 0;
}

.progress-info p {
  font-size: 14px;
  color: #8b949e;
  margin: 0;
}

.progress-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(56, 139, 253, 0.05);
  border: 1px solid rgba(56, 139, 253, 0.2);
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
  font-weight: 500;
}

.query-result {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-data h4 {
  font-size: 18px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 12px 0;
}

.result-value {
  font-size: 24px;
  font-weight: 700;
  color: #2ea043;
  padding: 16px;
  background: rgba(46, 160, 67, 0.1);
  border: 1px solid rgba(46, 160, 67, 0.3);
  border-radius: 8px;
  text-align: center;
  margin-bottom: 16px;
}

.result-metadata {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(48, 54, 61, 0.3);
  border-radius: 8px;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metadata-label {
  font-size: 14px;
  color: #8b949e;
  font-weight: 500;
}

.metadata-value {
  font-size: 14px;
  color: #c9d1d9;
  font-family: 'Courier New', monospace;
}

.result-actions {
  padding-top: 16px;
  border-top: 1px solid #30363d;
}

/* Responsive design */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .dataset-section {
    order: 1;
  }
  
  .query-section {
    order: 0;
  }
}

@media (max-width: 768px) {
  .private-query-page {
    padding: 16px;
  }
  
  .progress-details,
  .result-metadata {
    gap: 6px;
  }
  
  .metadata-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style> 