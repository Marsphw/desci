<template>
  <div class="roadmap-page">
    <div class="roadmap-header">
      <div class="header-content">
        <h1 class="page-title">Project Timeline</h1>
        <p class="page-subtitle">Key milestones and achievements</p>
      </div>
      <div class="header-actions">
        <n-button type="primary" @click="showCreateModal = true">
          <template #icon>
            <n-icon :component="AddOutline" />
          </template>
          Add Milestone
        </n-button>
      </div>
    </div>

    <div class="timeline-container">
      <div class="timeline-content">
        <div 
          v-for="(milestone, index) in sortedMilestones" 
          :key="milestone.id"
          class="timeline-item"
          :class="getTimelineItemClass(milestone)"
        >
          <!-- Timeline connector -->
          <div class="timeline-connector">
            <div class="timeline-dot" :class="getMilestoneStatusClass(milestone)">
              <n-icon :component="getMilestoneIcon(milestone.type)" size="16" />
            </div>
            <div 
              v-if="index < sortedMilestones.length - 1" 
              class="timeline-line"
              :class="getTimelineLineClass(milestone, sortedMilestones[index + 1])"
            ></div>
          </div>

          <!-- Timeline content -->
          <div class="timeline-card">
            <div class="milestone-header">
              <div class="milestone-title-section">
                <h3 class="milestone-title">{{ milestone.title }}</h3>
                <n-tag 
                  :type="getMilestoneTypeColor(milestone.type)" 
                  size="small"
                  class="milestone-type-tag"
                >
                  {{ milestone.type }}
                </n-tag>
              </div>
              <div class="milestone-actions">
                <n-dropdown :options="milestoneActions" @select="(key) => handleMilestoneAction(key, milestone)">
                  <n-button text>
                    <n-icon :component="EllipsisHorizontal" />
                  </n-button>
                </n-dropdown>
              </div>
            </div>
            
            <p class="milestone-description">{{ milestone.description }}</p>
            
            <div class="milestone-footer">
              <div class="milestone-date">
                <n-icon :component="CalendarOutline" size="14" />
                {{ formatDate(milestone.date) }}
              </div>
              <div v-if="milestone.status" class="milestone-status">
                <n-tag :type="getStatusTagType(milestone.status)" size="small">
                  {{ milestone.status }}
                </n-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="milestones.length === 0" class="empty-timeline">
          <div class="empty-icon">
            <n-icon :component="TimeOutline" size="48" />
          </div>
          <h3>No milestones yet</h3>
          <p>Start building your project timeline by adding your first milestone.</p>
          <n-button type="primary" @click="showCreateModal = true">
            Add First Milestone
          </n-button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Milestone Modal -->
    <n-modal v-model:show="showCreateModal" preset="card" style="width: 600px;">
      <template #header>
        <h3>{{ editingMilestone ? 'Edit Milestone' : 'Add New Milestone' }}</h3>
      </template>

      <n-form ref="milestoneForm" :model="milestoneFormData" :rules="milestoneRules">
        <n-form-item label="Title" path="title">
          <n-input 
            v-model:value="milestoneFormData.title" 
            placeholder="Enter milestone title..."
            maxlength="100"
            show-count
          />
        </n-form-item>

        <n-form-item label="Description" path="description">
          <n-input
            v-model:value="milestoneFormData.description"
            type="textarea"
            placeholder="Describe this milestone..."
            :rows="3"
            maxlength="500"
            show-count
          />
        </n-form-item>

        <div class="form-row">
          <n-form-item label="Type" path="type" style="flex: 1; margin-right: 12px;">
            <n-select
              v-model:value="milestoneFormData.type"
              :options="milestoneTypeOptions"
              placeholder="Select milestone type"
            />
          </n-form-item>

          <n-form-item label="Date" path="date" style="flex: 1;">
            <n-date-picker
              v-model:value="milestoneFormData.date"
              type="date"
              placeholder="Select date"
              style="width: 100%;"
            />
          </n-form-item>
        </div>

        <n-form-item label="Status" path="status">
          <n-select
            v-model:value="milestoneFormData.status"
            :options="statusOptions"
            placeholder="Select status"
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="modal-footer">
          <n-button @click="cancelEdit">Cancel</n-button>
          <n-button type="primary" @click="saveMilestone">
            {{ editingMilestone ? 'Update' : 'Create' }}
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- Delete Confirmation Modal -->
    <n-modal v-model:show="showDeleteModal" preset="dialog" type="warning">
      <template #header>
        <span>Delete Milestone</span>
      </template>
      Are you sure you want to delete this milestone? This action cannot be undone.
      <template #action>
        <n-button @click="showDeleteModal = false">Cancel</n-button>
        <n-button type="error" @click="confirmDelete">Delete</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton, NIcon, NTag, NModal, NForm, NFormItem, NInput, NSelect, NDatePicker,
  NDropdown, useMessage
} from 'naive-ui'
import {
  AddOutline, EllipsisHorizontal, CalendarOutline, TimeOutline,
  FlagOutline, ShieldCheckmarkOutline, DiamondOutline, DocumentTextOutline,
  CheckmarkCircleOutline, AlertCircleOutline, PlayOutline
} from '@vicons/ionicons5'
import axios from 'axios'

const route = useRoute()
const message = useMessage()

// Reactive data
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const editingMilestone = ref(null)
const milestoneToDelete = ref(null)
const loading = ref(false)
const milestones = ref([])

// Get project ID from route params
const projectId = computed(() => route.params.projectId)

// Get current user
const currentUser = ref(null)

const milestoneFormData = ref({
  title: '',
  description: '',
  type: null,
  date: null,
  status: 'planned'
})

// Form validation rules
const milestoneRules = {
  title: {
    required: true,
    message: 'Title is required',
    trigger: 'blur'
  },
  type: {
    required: true,
    message: 'Please select a milestone type',
    trigger: 'change'
  },
  date: {
    type: 'number',
    required: true,
    message: 'Please select a date',
    trigger: 'change'
  }
}

// Options
const milestoneTypeOptions = [
  { label: 'Milestone', value: 'milestone' },
  { label: 'Proof', value: 'proof' },
  { label: 'Verification', value: 'verification' },
  { label: 'NFT', value: 'nft' },
  { label: 'Publication', value: 'publication' },
  { label: 'Achievement', value: 'achievement' }
]

const statusOptions = [
  { label: 'Planned', value: 'planned' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' }
]

const milestoneActions = [
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete', props: { style: 'color: #d03050;' } }
]

// Computed
const sortedMilestones = computed(() => {
  return [...milestones.value].sort((a, b) => new Date(b.date) - new Date(a.date))
})

// API functions
const fetchMilestones = async () => {
  if (!projectId.value) return
  
  loading.value = true
  try {
    const response = await axios.get(`http://localhost:3000/api/projects/${projectId.value}/milestones`)
    milestones.value = response.data.map(milestone => ({
      ...milestone,
      date: new Date(milestone.date)
    }))
  } catch (error) {
    console.error('Failed to fetch milestones:', error)
    message.error('Failed to load milestones')
  } finally {
    loading.value = false
  }
}

const createMilestone = async (milestoneData) => {
  if (!projectId.value || !currentUser.value) return
  
  try {
    const response = await axios.post(`http://localhost:3000/api/projects/${projectId.value}/milestones`, {
      ...milestoneData,
      creator_wallet_address: currentUser.value.wallet_address,
      date: milestoneData.date.toISOString()
    })
    
    const newMilestone = {
      ...response.data,
      date: new Date(response.data.date)
    }
    
    milestones.value.unshift(newMilestone)
    message.success('Milestone created successfully!')
  } catch (error) {
    console.error('Failed to create milestone:', error)
    message.error('Failed to create milestone')
  }
}

const updateMilestone = async (milestoneId, milestoneData) => {
  if (!projectId.value) return
  
  try {
    const response = await axios.put(`http://localhost:3000/api/projects/${projectId.value}/milestones/${milestoneId}`, {
      ...milestoneData,
      date: milestoneData.date.toISOString()
    })
    
    const updatedMilestone = {
      ...response.data,
      date: new Date(response.data.date)
    }
    
    const index = milestones.value.findIndex(m => m.id === milestoneId)
    if (index !== -1) {
      milestones.value[index] = updatedMilestone
    }
    
    message.success('Milestone updated successfully!')
  } catch (error) {
    console.error('Failed to update milestone:', error)
    message.error('Failed to update milestone')
  }
}

const deleteMilestone = async (milestoneId) => {
  if (!projectId.value) return
  
  try {
    await axios.delete(`http://localhost:3000/api/projects/${projectId.value}/milestones/${milestoneId}`)
    
    const index = milestones.value.findIndex(m => m.id === milestoneId)
    if (index !== -1) {
      milestones.value.splice(index, 1)
    }
    
    message.success('Milestone deleted successfully!')
  } catch (error) {
    console.error('Failed to delete milestone:', error)
    message.error('Failed to delete milestone')
  }
}

// Methods
const getMilestoneStatusClass = (milestone) => {
  const now = new Date()
  const milestoneDate = new Date(milestone.date)
  
  if (milestone.status === 'completed') {
    return 'timeline-dot-completed'
  } else if (milestone.status === 'in-progress') {
    return 'timeline-dot-current'
  } else if (milestoneDate > now) {
    return 'timeline-dot-future'
  } else {
    return 'timeline-dot-past'
  }
}

const getTimelineItemClass = (milestone) => {
  return {
    'timeline-item-completed': milestone.status === 'completed',
    'timeline-item-current': milestone.status === 'in-progress',
    'timeline-item-future': milestone.status === 'planned'
  }
}

const getTimelineLineClass = (current, next) => {
  if (current.status === 'completed' && next.status === 'completed') {
    return 'timeline-line-completed'
  } else if (current.status === 'completed' || next.status === 'completed') {
    return 'timeline-line-mixed'
  } else {
    return 'timeline-line-future'
  }
}

const getMilestoneIcon = (type) => {
  switch (type) {
    case 'milestone': return FlagOutline
    case 'proof': return ShieldCheckmarkOutline
    case 'verification': return CheckmarkCircleOutline
    case 'nft': return DiamondOutline
    case 'publication': return DocumentTextOutline
    case 'achievement': return PlayOutline
    default: return FlagOutline
  }
}

const getMilestoneTypeColor = (type) => {
  switch (type) {
    case 'milestone': return 'info'
    case 'proof': return 'success'
    case 'verification': return 'warning'
    case 'nft': return 'error'
    case 'publication': return 'default'
    case 'achievement': return 'info'
    default: return 'default'
  }
}

const getStatusTagType = (status) => {
  switch (status) {
    case 'completed': return 'success'
    case 'in-progress': return 'warning'
    case 'planned': return 'info'
    default: return 'default'
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const handleMilestoneAction = (action, milestone) => {
  if (action === 'edit') {
    editMilestone(milestone)
  } else if (action === 'delete') {
    milestoneToDelete.value = milestone
    showDeleteModal.value = true
  }
}

const editMilestone = (milestone) => {
  editingMilestone.value = milestone
  milestoneFormData.value = {
    title: milestone.title,
    description: milestone.description,
    type: milestone.type,
    date: new Date(milestone.date).getTime(),
    status: milestone.status
  }
  showCreateModal.value = true
}

const saveMilestone = async () => {
  if (!milestoneFormData.value.title.trim()) {
    message.error('Title is required')
    return
  }

  if (!milestoneFormData.value.type) {
    message.error('Please select a milestone type')
    return
  }

  if (!milestoneFormData.value.date) {
    message.error('Please select a date')
    return
  }

  const milestoneData = {
    title: milestoneFormData.value.title,
    description: milestoneFormData.value.description,
    type: milestoneFormData.value.type,
    date: new Date(milestoneFormData.value.date),
    status: milestoneFormData.value.status
  }

  if (editingMilestone.value) {
    // Update existing milestone
    await updateMilestone(editingMilestone.value.id, milestoneData)
  } else {
    // Create new milestone
    await createMilestone(milestoneData)
  }

  cancelEdit()
}

const cancelEdit = () => {
  showCreateModal.value = false
  editingMilestone.value = null
  milestoneFormData.value = {
    title: '',
    description: '',
    type: null,
    date: null,
    status: 'planned'
  }
}

const confirmDelete = async () => {
  if (milestoneToDelete.value) {
    await deleteMilestone(milestoneToDelete.value.id)
  }
  showDeleteModal.value = false
  milestoneToDelete.value = null
}

onMounted(async () => {
  // Load current user from localStorage
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    currentUser.value = JSON.parse(storedUser)
  }
  
  // Load timeline data
  await fetchMilestones()
})
</script>

<style scoped>
.roadmap-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #0d1117;
  color: #c9d1d9;
}

.roadmap-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 0;
  border-bottom: 1px solid #30363d;
  margin-bottom: 32px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #c9d1d9;
}

.page-subtitle {
  font-size: 16px;
  color: #8b949e;
  margin: 0;
}

.timeline-container {
  flex: 1;
  overflow-y: auto;
}

.timeline-content {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.timeline-item {
  display: flex;
  margin-bottom: 32px;
  position: relative;
}

.timeline-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 24px;
  position: relative;
}

.timeline-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid;
  background-color: #0d1117;
  position: relative;
  z-index: 2;
}

.timeline-dot-completed {
  border-color: #238636;
  color: #238636;
}

.timeline-dot-current {
  border-color: #d29922;
  color: #d29922;
  box-shadow: 0 0 0 4px rgba(210, 153, 34, 0.2);
}

.timeline-dot-future {
  border-color: #58a6ff;
  color: #58a6ff;
}

.timeline-dot-past {
  border-color: #6e7681;
  color: #6e7681;
}

.timeline-line {
  width: 3px;
  height: 60px;
  margin-top: 8px;
}

.timeline-line-completed {
  background-color: #238636;
}

.timeline-line-mixed {
  background: linear-gradient(to bottom, #238636 0%, #6e7681 100%);
}

.timeline-line-future {
  background-color: #6e7681;
}

.timeline-card {
  flex: 1;
  background-color: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
}

.timeline-card:hover {
  border-color: #58a6ff;
  box-shadow: 0 0 0 1px rgba(88, 166, 255, 0.2);
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.milestone-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.milestone-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #c9d1d9;
}

.milestone-type-tag {
  font-size: 12px;
  text-transform: uppercase;
}

.milestone-description {
  color: #8b949e;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.milestone-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.milestone-date {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8b949e;
  font-size: 14px;
}

.empty-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  color: #8b949e;
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-timeline h3 {
  margin: 0 0 8px 0;
  color: #c9d1d9;
}

.empty-timeline p {
  margin: 0 0 24px 0;
  max-width: 400px;
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

/* Animation for timeline items */
.timeline-item-current .timeline-card {
  border-color: #d29922;
  background-color: rgba(210, 153, 34, 0.05);
}

.timeline-item-completed .timeline-card {
  border-color: rgba(35, 134, 54, 0.3);
}

.timeline-item-future .timeline-card {
  border-color: rgba(88, 166, 255, 0.3);
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

:deep(.n-date-picker) {
  background-color: #0d1117;
}

:deep(.n-tag) {
  background-color: rgba(56, 139, 253, 0.15);
  border-color: rgba(56, 139, 253, 0.4);
  color: #58a6ff;
}

/* Responsive design */
@media (max-width: 768px) {
  .roadmap-header {
    flex-direction: column;
    gap: 16px;
  }

  .timeline-connector {
    margin-right: 16px;
  }

  .timeline-dot {
    width: 32px;
    height: 32px;
  }

  .timeline-card {
    padding: 16px;
  }

  .milestone-header {
    flex-direction: column;
    gap: 8px;
  }

  .milestone-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style> 