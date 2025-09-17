<template>
  <div class="reviews-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">Review Tasks</h1>
          <p class="page-description">
            Manage your peer review assignments and track review progress
          </p>
        </div>
        <div class="header-actions">
          <n-button @click="refreshReviews">
            <template #icon>
              <n-icon :component="RefreshOutline" />
            </template>
            Refresh
          </n-button>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="stats-section">
      <n-grid :cols="4" :x-gap="24">
        <n-gi>
          <n-statistic label="Total Assignments" :value="reviews.length" />
        </n-gi>
        <n-gi>
          <n-statistic label="Pending" :value="pendingCount" />
        </n-gi>
        <n-gi>
          <n-statistic label="In Progress" :value="inProgressCount" />
        </n-gi>
        <n-gi>
          <n-statistic label="Completed" :value="completedCount" />
        </n-gi>
      </n-grid>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-container">
        <n-input
          v-model:value="searchQuery"
          placeholder="Search by paper title or authors..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <n-icon :component="SearchOutline" />
          </template>
        </n-input>
        
        <n-select
          v-model:value="selectedStatus"
          :options="statusOptions"
          placeholder="Status"
          clearable
          class="filter-select"
        />
        
        <n-select
          v-model:value="selectedUrgency"
          :options="urgencyOptions"
          placeholder="Urgency"
          clearable
          class="filter-select"
        />
        
        <n-select
          v-model:value="sortBy"
          :options="sortOptions"
          placeholder="Sort by"
          class="filter-select"
        />
      </div>
    </div>

    <!-- Reviews List -->
    <div class="reviews-section">
      <div v-if="filteredReviews.length === 0" class="empty-state">
        <n-empty description="No review assignments found" size="large">
          <template #extra>
            <n-button @click="refreshReviews">
              Check for New Assignments
            </n-button>
          </template>
        </n-empty>
      </div>
      
      <div v-else class="reviews-list">
        <div
          v-for="review in paginatedReviews"
          :key="review.id"
          class="review-card"
          :class="{ 'urgent': review.urgency === 'High' }"
          @click="viewReview(review)"
        >
          <div class="review-header">
            <div class="review-title-section">
              <h3 class="review-title">{{ review.paperTitle }}</h3>
              <div class="review-meta">
                <span class="review-authors">{{ review.authors.join(', ') }}</span>
                <span class="review-journal">{{ review.journal }}</span>
                <span class="review-assigned">Assigned: {{ formatDate(review.assignedAt) }}</span>
              </div>
            </div>
            <div class="review-status-section">
              <n-tag 
                :type="getStatusType(review.status)" 
                size="medium"
                class="status-tag"
              >
                {{ review.status }}
              </n-tag>
              <n-tag 
                v-if="review.urgency === 'High'"
                type="error" 
                size="small"
                class="urgency-tag"
              >
                Urgent
              </n-tag>
            </div>
          </div>
          
          <div class="review-content">
            <p class="review-abstract">{{ review.abstract }}</p>
            
            <div class="review-details">
              <div class="detail-item">
                <n-icon :component="CalendarOutline" class="detail-icon" />
                <span>Deadline: {{ formatDate(review.deadline) }}</span>
                <span :class="getDaysLeftClass(review.deadline)" class="days-left">
                  ({{ getDaysLeft(review.deadline) }})
                </span>
              </div>
              <div class="detail-item">
                <n-icon :component="DocumentTextOutline" class="detail-icon" />
                <span>Category: {{ review.category }}</span>
              </div>
              <div class="detail-item">
                <n-icon :component="TimeOutline" class="detail-icon" />
                <span>Estimated Time: {{ review.estimatedHours }}h</span>
              </div>
            </div>
            
            <div class="review-keywords">
              <n-tag 
                v-for="keyword in review.keywords.slice(0, 4)" 
                :key="keyword" 
                size="small"
                class="keyword-tag"
              >
                {{ keyword }}
              </n-tag>
              <span v-if="review.keywords.length > 4" class="more-keywords">
                +{{ review.keywords.length - 4 }} more
              </span>
            </div>
          </div>
          
          <div class="review-actions">
            <div class="review-progress">
              <div class="progress-info">
                <span class="progress-label">{{ getProgressLabel(review.status) }}</span>
                <n-progress 
                  :percentage="getProgressPercentage(review.status)"
                  :status="getProgressStatus(review.status)"
                  :show-indicator="false"
                  class="progress-bar"
                />
              </div>
            </div>
            
            <div class="action-buttons">
              <n-button 
                size="small" 
                type="primary"
                @click.stop="startReview(review)"
                v-if="review.status === 'Pending'"
              >
                <template #icon>
                  <n-icon :component="PlayOutline" />
                </template>
                Start Review
              </n-button>
              
              <n-button 
                size="small" 
                type="primary"
                @click.stop="continueReview(review)"
                v-else-if="review.status === 'In Progress'"
              >
                <template #icon>
                  <n-icon :component="CreateOutline" />
                </template>
                Continue
              </n-button>
              
              <n-button 
                size="small" 
                @click.stop="viewReviewDetails(review)"
                v-else
              >
                <template #icon>
                  <n-icon :component="EyeOutline" />
                </template>
                View Details
              </n-button>
              
              <n-button 
                size="small" 
                @click.stop="downloadPaper(review)"
              >
                <template #icon>
                  <n-icon :component="DownloadOutline" />
                </template>
                Download
              </n-button>
              
              <n-dropdown
                :options="getReviewActions(review)"
                @select="handleReviewAction"
                trigger="click"
              >
                <n-button size="small">
                  <template #icon>
                    <n-icon :component="EllipsisHorizontalOutline" />
                  </template>
                </n-button>
              </n-dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-container">
      <n-pagination
        v-model:page="currentPage"
        :page-count="totalPages"
        :page-size="pageSize"
        show-size-picker
        :page-sizes="[5, 10, 20, 50]"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NButton, NInput, NSelect, NGrid, NGi, NStatistic, NTag, NIcon, 
  NPagination, NEmpty, NProgress, NDropdown, useMessage 
} from 'naive-ui'
import {
  RefreshOutline, SearchOutline, CalendarOutline, DocumentTextOutline,
  TimeOutline, PlayOutline, CreateOutline, EyeOutline, DownloadOutline,
  EllipsisHorizontalOutline, ChatbubbleEllipsesOutline, CloseOutline
} from '@vicons/ionicons5'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const router = useRouter()
const message = useMessage()

// Reactive data
const searchQuery = ref('')
const selectedStatus = ref(null)
const selectedUrgency = ref(null)
const sortBy = ref('deadline')
const currentPage = ref(1)
const pageSize = ref(10)

// Mock reviews data
const reviews = ref([
  {
    id: 1,
    paperTitle: "Advanced Quantum Cryptography for Secure Communications",
    authors: ["Dr. Alice Johnson", "Prof. Bob Smith", "Dr. Charlie Brown"],
    abstract: "This paper presents novel approaches to quantum cryptography, focusing on enhanced security protocols for next-generation communication systems.",
    keywords: ["Quantum Cryptography", "Security", "Communications", "Protocols", "Quantum Computing"],
    category: "Computer Science",
    journal: "Journal of Quantum Computing",
    status: "Pending",
    urgency: "High",
    assignedAt: "2024-02-10",
    deadline: "2024-02-25",
    estimatedHours: 8,
    reviewId: "REV-2024-001"
  },
  {
    id: 2,
    paperTitle: "Machine Learning Applications in Climate Modeling",
    authors: ["Dr. Emma Wilson", "Prof. David Lee"],
    abstract: "We explore the integration of machine learning techniques with traditional climate modeling approaches to improve prediction accuracy and reduce computational costs.",
    keywords: ["Machine Learning", "Climate Modeling", "Prediction", "Environmental Science", "AI"],
    category: "Environmental Science",
    journal: "Climate Science Review",
    status: "In Progress",
    urgency: "Medium",
    assignedAt: "2024-02-01",
    deadline: "2024-02-28",
    estimatedHours: 12,
    reviewId: "REV-2024-002",
    progress: 60
  },
  {
    id: 3,
    paperTitle: "Blockchain-Based Supply Chain Transparency",
    authors: ["Prof. Sarah Chen", "Dr. Michael Zhang"],
    abstract: "This study examines the implementation of blockchain technology for enhancing transparency and traceability in global supply chain management.",
    keywords: ["Blockchain", "Supply Chain", "Transparency", "Traceability", "Management"],
    category: "Computer Science",
    journal: "Blockchain Technology Review",
    status: "Under Review",
    urgency: "Low",
    assignedAt: "2024-01-20",
    deadline: "2024-03-05",
    estimatedHours: 10,
    reviewId: "REV-2024-003",
    submittedAt: "2024-02-15"
  },
  {
    id: 4,
    paperTitle: "Gene Editing Ethics in Modern Medicine",
    authors: ["Dr. Lisa Garcia", "Prof. James Wilson", "Dr. Anna Lee"],
    abstract: "An ethical analysis of gene editing technologies in medical treatments, examining the moral implications and regulatory frameworks needed for responsible implementation.",
    keywords: ["Gene Editing", "Ethics", "Medicine", "Regulation", "Bioethics"],
    category: "Bioethics",
    journal: "Medical Ethics Quarterly",
    status: "Completed",
    urgency: "Medium",
    assignedAt: "2024-01-15",
    deadline: "2024-02-15",
    estimatedHours: 15,
    reviewId: "REV-2024-004",
    completedAt: "2024-02-10",
    rating: 4.5
  },
  {
    id: 5,
    paperTitle: "Sustainable Energy Storage Solutions",
    authors: ["Dr. Robert Green", "Prof. Maria Rodriguez"],
    abstract: "Investigation of novel materials and technologies for sustainable energy storage, focusing on environmental impact and economic viability.",
    keywords: ["Energy Storage", "Sustainability", "Materials Science", "Environment", "Economics"],
    category: "Environmental Science",
    journal: "Sustainable Energy Journal",
    status: "Revision Requested",
    urgency: "High",
    assignedAt: "2024-01-25",
    deadline: "2024-02-20",
    estimatedHours: 6,
    reviewId: "REV-2024-005",
    revisionRequested: true
  }
])

// Options
const statusOptions = [
  { label: 'All Status', value: null },
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Under Review', value: 'Under Review' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Revision Requested', value: 'Revision Requested' }
]

const urgencyOptions = [
  { label: 'All Urgency', value: null },
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' }
]

const sortOptions = [
  { label: 'Deadline (Earliest)', value: 'deadline' },
  { label: 'Deadline (Latest)', value: 'deadline_desc' },
  { label: 'Assigned Date', value: 'assigned' },
  { label: 'Status', value: 'status' },
  { label: 'Urgency', value: 'urgency' }
]

// Computed properties
const pendingCount = computed(() => 
  reviews.value.filter(r => r.status === 'Pending').length
)

const inProgressCount = computed(() => 
  reviews.value.filter(r => r.status === 'In Progress').length
)

const completedCount = computed(() => 
  reviews.value.filter(r => r.status === 'Completed').length
)

const filteredReviews = computed(() => {
  let filtered = reviews.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(review => 
      review.paperTitle.toLowerCase().includes(query) ||
      review.authors.some(author => author.toLowerCase().includes(query)) ||
      review.keywords.some(keyword => keyword.toLowerCase().includes(query))
    )
  }

  // Status filter
  if (selectedStatus.value) {
    filtered = filtered.filter(review => review.status === selectedStatus.value)
  }

  // Urgency filter
  if (selectedUrgency.value) {
    filtered = filtered.filter(review => review.urgency === selectedUrgency.value)
  }

  // Sorting
  filtered = filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'deadline':
        return new Date(a.deadline) - new Date(b.deadline)
      case 'deadline_desc':
        return new Date(b.deadline) - new Date(a.deadline)
      case 'assigned':
        return new Date(b.assignedAt) - new Date(a.assignedAt)
      case 'status':
        return a.status.localeCompare(b.status)
      case 'urgency':
        const urgencyOrder = { 'High': 0, 'Medium': 1, 'Low': 2 }
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      default:
        return 0
    }
  })

  return filtered
})

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredReviews.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredReviews.value.length / pageSize.value)
})

// Methods
const formatDate = (date) => {
  return dayjs(date).format('MMM DD, YYYY')
}

const getDaysLeft = (deadline) => {
  const days = dayjs(deadline).diff(dayjs(), 'day')
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Due today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

const getDaysLeftClass = (deadline) => {
  const days = dayjs(deadline).diff(dayjs(), 'day')
  if (days < 0) return 'overdue'
  if (days <= 2) return 'urgent'
  if (days <= 7) return 'warning'
  return 'normal'
}

const getStatusType = (status) => {
  switch (status) {
    case 'Completed': return 'success'
    case 'In Progress': return 'info'
    case 'Under Review': return 'warning'
    case 'Pending': return 'default'
    case 'Revision Requested': return 'error'
    default: return 'default'
  }
}

const getProgressLabel = (status) => {
  switch (status) {
    case 'Pending': return 'Not Started'
    case 'In Progress': return 'In Progress'
    case 'Under Review': return 'Under Review'
    case 'Completed': return 'Completed'
    case 'Revision Requested': return 'Revision Requested'
    default: return status
  }
}

const getProgressPercentage = (status) => {
  switch (status) {
    case 'Pending': return 0
    case 'In Progress': return 50
    case 'Under Review': return 80
    case 'Completed': return 100
    case 'Revision Requested': return 30
    default: return 0
  }
}

const getProgressStatus = (status) => {
  switch (status) {
    case 'Completed': return 'success'
    case 'Revision Requested': return 'error'
    case 'Under Review': return 'warning'
    default: return 'info'
  }
}

const getReviewActions = (review) => {
  const actions = [
    {
      label: 'Contact Editor',
      key: `contact-${review.id}`,
      icon: () => h(NIcon, null, { default: () => h(ChatbubbleEllipsesOutline) })
    }
  ]

  if (review.status === 'Pending' || review.status === 'In Progress') {
    actions.push({
      label: 'Decline Review',
      key: `decline-${review.id}`,
      icon: () => h(NIcon, null, { default: () => h(CloseOutline) })
    })
  }

  return actions
}

const handlePageSizeChange = (newPageSize) => {
  pageSize.value = newPageSize
  currentPage.value = 1
}

const refreshReviews = () => {
  message.success('Reviews refreshed')
  // TODO: Implement actual refresh logic
}

const viewReview = (review) => {
  router.push(`/reviews/${review.id}`)
}

const startReview = (review) => {
  router.push(`/reviews/${review.id}/review`)
}

const continueReview = (review) => {
  router.push(`/reviews/${review.id}/review`)
}

const viewReviewDetails = (review) => {
  router.push(`/reviews/${review.id}/details`)
}

const downloadPaper = (review) => {
  message.success(`Downloading: ${review.paperTitle}`)
  // TODO: Implement download
}

const handleReviewAction = (key) => {
  const [action, reviewId] = key.split('-')
  const review = reviews.value.find(r => r.id === parseInt(reviewId))
  
  switch (action) {
    case 'contact':
      message.info('Opening contact editor dialog')
      // TODO: Implement contact editor
      break
    case 'decline':
      message.warning('Declining review assignment')
      // TODO: Implement decline logic
      break
  }
}

onMounted(() => {
  // Initialize page
})
</script>

<style scoped>
.reviews-page {
  padding: 24px;
  max-width: 1400px;
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

.stats-section {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
}

.filters-section {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
}

.filter-container {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 300px;
}

.filter-select {
  min-width: 140px;
}

.reviews-section {
  margin-bottom: 32px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.review-card:hover {
  border-color: #58a6ff;
  box-shadow: 0 4px 16px rgba(88, 166, 255, 0.1);
}

.review-card.urgent {
  border-left: 4px solid #f85149;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
}

.review-title-section {
  flex: 1;
}

.review-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.review-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.875rem;
  color: #8b949e;
}

.review-status-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.status-tag {
  font-weight: 500;
}

.urgency-tag {
  font-size: 0.75rem;
}

.review-content {
  margin-bottom: 20px;
}

.review-abstract {
  font-size: 0.875rem;
  color: #8b949e;
  line-height: 1.6;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.review-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #8b949e;
}

.detail-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.days-left {
  font-weight: 500;
}

.days-left.overdue {
  color: #f85149;
}

.days-left.urgent {
  color: #ff8c42;
}

.days-left.warning {
  color: #f0d000;
}

.days-left.normal {
  color: #7c3aed;
}

.review-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.keyword-tag {
  font-size: 0.75rem;
}

.more-keywords {
  font-size: 0.75rem;
  color: #8b949e;
}

.review-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.review-progress {
  flex: 1;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-label {
  font-size: 0.75rem;
  color: #8b949e;
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  max-width: 200px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
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

:deep(.n-statistic .n-statistic-value) {
  color: #c9d1d9;
}

:deep(.n-statistic .n-statistic-label) {
  color: #8b949e;
}

:deep(.n-progress .n-progress-rail) {
  background-color: #30363d;
}
</style> 