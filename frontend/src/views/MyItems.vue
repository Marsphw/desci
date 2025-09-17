<template>
  <div class="my-items-page">
    <!-- Header with filters and actions -->
    <div class="items-header">
      <div class="header-nav">
        <div class="nav-links">
          <n-button-group>
            <n-button :type="activeTab === 'assigned' ? 'primary' : 'default'" @click="setActiveTab('assigned')">
              <template #icon>
                <n-icon :component="PersonOutline" />
              </template>
              Assigned to me
              <n-tag v-if="assignedCount > 0" :type="activeTab === 'assigned' ? 'info' : 'default'" size="small" style="margin-left: 8px;">
                {{ assignedCount }}
              </n-tag>
            </n-button>
            <n-button :type="activeTab === 'created' ? 'primary' : 'default'" @click="setActiveTab('created')">
              <template #icon>
                <n-icon :component="CreateOutline" />
              </template>
              Created by me
              <n-tag v-if="createdCount > 0" :type="activeTab === 'created' ? 'info' : 'default'" size="small" style="margin-left: 8px;">
                {{ createdCount }}
              </n-tag>
            </n-button>
            <n-button :type="activeTab === 'mentions' ? 'primary' : 'default'" @click="setActiveTab('mentions')">
              <template #icon>
                <n-icon :component="AtOutline" />
              </template>
              Mentions
              <n-tag v-if="mentionsCount > 0" :type="activeTab === 'mentions' ? 'info' : 'default'" size="small" style="margin-left: 8px;">
                {{ mentionsCount }}
              </n-tag>
            </n-button>
          </n-button-group>
        </div>
        <div class="header-actions">
          <n-button @click="showCreateModal = true">
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
            New item
          </n-button>
        </div>
      </div>

      <!-- Search and filters -->
      <div class="filters-section">
        <div class="search-and-filters">
          <n-input
            v-model:value="searchQuery"
            placeholder="Search items..."
            class="search-input"
            clearable
          >
            <template #prefix>
              <n-icon :component="SearchOutline" />
            </template>
          </n-input>
          
          <n-select
            v-model:value="selectedStatus"
            placeholder="Status"
            :options="statusOptions"
            style="width: 120px;"
            clearable
          />
          
          <n-select
            v-model:value="selectedPriority"
            placeholder="Priority"
            :options="priorityOptions"
            style="width: 120px;"
            clearable
          />
          
          <n-select
            v-model:value="selectedLabel"
            placeholder="Label"
            :options="labelOptions"
            style="width: 120px;"
            clearable
          />
        </div>
        
        <div class="results-info">
          <span class="results-count">{{ filteredItems.length }} items</span>
          <n-button text @click="clearFilters" v-if="hasActiveFilters">
            Clear filters
          </n-button>
        </div>
      </div>
    </div>

    <!-- Items list -->
    <div class="items-list">
      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>
      
      <div v-else-if="filteredItems.length === 0" class="empty-state">
        <div class="empty-icon">
          <n-icon :component="DocumentTextOutline" size="48" />
        </div>
        <h3>No items found</h3>
        <p>There are no items matching your current filters.</p>
        <n-button @click="clearFilters" v-if="hasActiveFilters">
          Clear filters
        </n-button>
        <n-button @click="showCreateModal = true" v-else>
          Create your first item
        </n-button>
      </div>
      
      <div v-else class="items-container">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="item-row"
          :class="{ 'item-closed': item.status === 'closed' }"
        >
          <div class="item-status">
            <n-icon
              :component="getStatusIcon(item.status)"
              :class="getStatusClass(item.status)"
              size="16"
            />
          </div>
          
          <div class="item-content">
            <div class="item-title">
              <a href="#" class="item-link" @click.prevent="openItem(item)">
                {{ item.title }}
              </a>
              <div class="item-labels" v-if="item.labels && item.labels.length > 0">
                <n-tag
                  v-for="label in item.labels"
                  :key="label"
                  size="small"
                  :type="getLabelType(label)"
                  class="item-label"
                >
                  {{ label }}
                </n-tag>
              </div>
            </div>
            
            <div class="item-meta">
              <span class="item-number">#{{ item.id }}</span>
              <span class="item-date">{{ formatDate(item.created_at) }}</span>
              <span class="item-author">by {{ item.author || 'You' }}</span>
              <span v-if="item.assignee" class="item-assignee">
                assigned to {{ item.assignee }}
              </span>
              <span v-if="item.comments_count > 0" class="item-comments">
                <n-icon :component="ChatboxOutline" size="14" />
                {{ item.comments_count }}
              </span>
            </div>
          </div>
          
          <div class="item-priority" v-if="item.priority">
            <n-tag
              :type="getPriorityType(item.priority)"
              size="small"
            >
              {{ item.priority }}
            </n-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- Create item modal -->
    <n-modal v-model:show="showCreateModal" preset="card" style="width: 600px;">
      <template #header>
        <h3>Create New Item</h3>
      </template>
      
      <n-form ref="createForm" :model="newItem">
        <n-form-item label="Title" path="title" :rule="{ required: true, message: 'Title is required' }">
          <n-input v-model:value="newItem.title" placeholder="Enter item title..." />
        </n-form-item>
        
        <n-form-item label="Description" path="description">
          <n-input
            v-model:value="newItem.description"
            type="textarea"
            placeholder="Add a description..."
            :rows="4"
          />
        </n-form-item>
        
        <div class="form-row">
          <n-form-item label="Priority" path="priority" style="flex: 1; margin-right: 12px;">
            <n-select
              v-model:value="newItem.priority"
              :options="priorityOptions"
              placeholder="Select priority"
            />
          </n-form-item>
          
          <n-form-item label="Labels" path="labels" style="flex: 1;">
            <n-select
              v-model:value="newItem.labels"
              :options="labelOptions"
              multiple
              placeholder="Add labels"
            />
          </n-form-item>
        </div>
      </n-form>
      
      <template #footer>
        <div class="modal-footer">
          <n-button @click="showCreateModal = false">Cancel</n-button>
          <n-button type="primary" @click="createItem">Create item</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton, NButtonGroup, NTag, NInput, NSelect, NSpin, NIcon,
  NModal, NForm, NFormItem, useMessage
} from 'naive-ui'
import {
  PersonOutline, CreateOutline, AtOutline, AddOutline, SearchOutline,
  DocumentTextOutline, CheckmarkCircleOutline, AlertCircleOutline,
  CloseCircleOutline, ChatboxOutline, TimeOutline
} from '@vicons/ionicons5'

const route = useRoute()
const message = useMessage()

// Reactive data
const activeTab = ref('assigned')
const searchQuery = ref('')
const selectedStatus = ref(null)
const selectedPriority = ref(null)
const selectedLabel = ref(null)
const loading = ref(false)
const showCreateModal = ref(false)

// Mock data - replace with API calls later
const items = ref([
  {
    id: 1,
    title: 'Implement user authentication system',
    description: 'Add JWT-based authentication with login/logout functionality',
    status: 'open',
    priority: 'High',
    labels: ['feature', 'backend'],
    author: 'alice',
    assignee: 'You',
    created_at: '2024-01-15T10:00:00Z',
    comments_count: 3
  },
  {
    id: 2,
    title: 'Fix responsive design issues on mobile',
    description: 'The navigation menu breaks on screens smaller than 768px',
    status: 'in-progress',
    priority: 'Medium',
    labels: ['bug', 'ui'],
    author: 'You',
    assignee: 'bob',
    created_at: '2024-01-14T14:30:00Z',
    comments_count: 1
  },
  {
    id: 3,
    title: 'Add data export functionality',
    description: 'Users should be able to export their project data as CSV/JSON',
    status: 'closed',
    priority: 'Low',
    labels: ['feature'],
    author: 'You',
    assignee: 'You',
    created_at: '2024-01-12T09:15:00Z',
    comments_count: 5
  },
  {
    id: 4,
    title: 'Update documentation with API examples',
    description: 'Add more comprehensive examples to the API documentation',
    status: 'open',
    priority: 'Medium',
    labels: ['documentation'],
    author: 'charlie',
    assignee: 'You',
    created_at: '2024-01-10T16:45:00Z',
    comments_count: 0
  }
])

const newItem = ref({
  title: '',
  description: '',
  priority: null,
  labels: []
})

// Options
const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Closed', value: 'closed' }
]

const priorityOptions = [
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' }
]

const labelOptions = [
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Documentation', value: 'documentation' },
  { label: 'UI', value: 'ui' },
  { label: 'Backend', value: 'backend' }
]

// Computed
const assignedCount = computed(() => 
  items.value.filter(item => item.assignee === 'You' && item.status !== 'closed').length
)

const createdCount = computed(() => 
  items.value.filter(item => item.author === 'You' && item.status !== 'closed').length
)

const mentionsCount = computed(() => 0) // Mock data

const filteredItems = computed(() => {
  let result = items.value

  // Filter by tab
  if (activeTab.value === 'assigned') {
    result = result.filter(item => item.assignee === 'You')
  } else if (activeTab.value === 'created') {
    result = result.filter(item => item.author === 'You')
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (selectedStatus.value) {
    result = result.filter(item => item.status === selectedStatus.value)
  }

  // Filter by priority
  if (selectedPriority.value) {
    result = result.filter(item => item.priority === selectedPriority.value)
  }

  // Filter by label
  if (selectedLabel.value) {
    result = result.filter(item => 
      item.labels && item.labels.includes(selectedLabel.value)
    )
  }

  return result
})

const hasActiveFilters = computed(() => 
  searchQuery.value || selectedStatus.value || selectedPriority.value || selectedLabel.value
)

// Methods
const setActiveTab = (tab) => {
  activeTab.value = tab
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = null
  selectedPriority.value = null
  selectedLabel.value = null
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'open': return AlertCircleOutline
    case 'in-progress': return TimeOutline
    case 'closed': return CheckmarkCircleOutline
    default: return AlertCircleOutline
  }
}

const getStatusClass = (status) => {
  return `status-${status}`
}

const getPriorityType = (priority) => {
  switch (priority) {
    case 'High': return 'error'
    case 'Medium': return 'warning'
    case 'Low': return 'info'
    default: return 'default'
  }
}

const getLabelType = (label) => {
  switch (label) {
    case 'bug': return 'error'
    case 'feature': return 'info'
    case 'documentation': return 'warning'
    default: return 'default'
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
  
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} days ago`
  }
}

const openItem = (item) => {
  // Navigate to item detail page
  message.info(`Opening item: ${item.title}`)
}

const createItem = () => {
  if (!newItem.value.title.trim()) {
    message.error('Title is required')
    return
  }

  // Mock creation - replace with API call
  const item = {
    id: items.value.length + 1,
    title: newItem.value.title,
    description: newItem.value.description,
    status: 'open',
    priority: newItem.value.priority || 'Medium',
    labels: newItem.value.labels || [],
    author: 'You',
    assignee: 'You',
    created_at: new Date().toISOString(),
    comments_count: 0
  }

  items.value.unshift(item)
  
  // Reset form
  newItem.value = {
    title: '',
    description: '',
    priority: null,
    labels: []
  }
  
  showCreateModal.value = false
  message.success('Item created successfully!')
}

onMounted(() => {
  // Load items data
})
</script>

<style scoped>
.my-items-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #0d1117;
  color: #c9d1d9;
}

.items-header {
  border-bottom: 1px solid #30363d;
  background-color: #0d1117;
  padding: 16px 0;
}

.header-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.search-and-filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 300px;
}

.results-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.results-count {
  color: #8b949e;
  font-size: 14px;
}

.items-list {
  flex: 1;
  overflow-y: auto;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  text-align: center;
  color: #8b949e;
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #c9d1d9;
}

.empty-state p {
  margin: 0 0 16px 0;
}

.items-container {
  padding: 0;
}

.item-row {
  display: flex;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid #21262d;
  gap: 12px;
  transition: background-color 0.2s;
}

.item-row:hover {
  background-color: rgba(56, 139, 253, 0.05);
}

.item-row.item-closed {
  opacity: 0.6;
}

.item-row.item-closed .item-link {
  text-decoration: line-through;
}

.item-status {
  margin-top: 2px;
}

.status-open {
  color: #238636;
}

.status-in-progress {
  color: #d29922;
}

.status-closed {
  color: #8b949e;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.item-link {
  color: #c9d1d9;
  text-decoration: none;
  font-weight: 500;
  font-size: 16px;
}

.item-link:hover {
  color: #58a6ff;
}

.item-labels {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.item-label {
  font-size: 12px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #8b949e;
}

.item-number {
  font-weight: 500;
}

.item-comments {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-priority {
  margin-top: 2px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Dark theme overrides */
:deep(.n-button) {
  color: #c9d1d9;
  background-color: #21262d;
  border-color: #30363d;
}

:deep(.n-button:hover) {
  background-color: #30363d;
  border-color: #6e7681;
}

:deep(.n-button.n-button--primary-type) {
  background-color: #238636;
  border-color: #238636;
  color: #ffffff;
}

:deep(.n-button.n-button--primary-type:hover) {
  background-color: #2ea043;
  border-color: #2ea043;
}

:deep(.n-input) {
  background-color: #0d1117;
  border-color: #30363d;
  color: #c9d1d9;
}

:deep(.n-select) {
  background-color: #0d1117;
}

:deep(.n-tag) {
  background-color: rgba(56, 139, 253, 0.15);
  border-color: rgba(56, 139, 253, 0.4);
  color: #58a6ff;
}
</style> 