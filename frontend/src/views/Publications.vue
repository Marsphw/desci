<template>
  <div class="publications-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">My Publications</h1>
          <p class="page-description">
            Manage your research publications, track submission status, and monitor peer review progress
          </p>
        </div>
        <div class="header-actions">
          <n-button type="primary" @click="startSubmission">
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
            Submit New Paper
          </n-button>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="stats-section">
      <n-grid :cols="4" :x-gap="24">
        <n-gi>
          <n-statistic label="Total Papers" :value="papers.length" />
        </n-gi>
        <n-gi>
          <n-statistic label="Published" :value="publishedCount" />
        </n-gi>
        <n-gi>
          <n-statistic label="Under Review" :value="reviewingCount" />
        </n-gi>
        <n-gi>
          <n-statistic label="Draft" :value="draftCount" />
        </n-gi>
      </n-grid>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-container">
        <n-input
          v-model:value="searchQuery"
          placeholder="Search papers by title, authors, or keywords..."
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
          v-model:value="selectedCategory"
          :options="categoryOptions"
          placeholder="Category"
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

    <!-- Papers List -->
    <div class="papers-section">
      <div v-if="filteredPapers.length === 0" class="empty-state">
        <n-empty description="No papers found" size="large">
          <template #extra>
            <n-button type="primary" @click="startSubmission">
              Submit Your First Paper
            </n-button>
          </template>
        </n-empty>
      </div>
      
      <div v-else class="papers-list">
        <div
          v-for="paper in filteredPapers"
          :key="paper.id"
          class="paper-card"
          @click="viewPaper(paper)"
        >
          <div class="paper-header">
            <div class="paper-title-section">
              <h3 class="paper-title">{{ paper.title }}</h3>
              <div class="paper-meta">
                <span class="paper-authors">{{ paper.authors.join(', ') }}</span>
                <span class="paper-date">{{ formatDate(paper.createdAt) }}</span>
              </div>
            </div>
            <div class="paper-status-section">
              <n-tag 
                :type="getStatusType(paper.status)" 
                size="medium"
                class="status-tag"
              >
                {{ paper.status }}
              </n-tag>
            </div>
          </div>
          
          <div class="paper-content">
            <p class="paper-abstract">{{ paper.abstract }}</p>
            
            <div class="paper-tags">
              <n-tag 
                v-for="tag in paper.keywords.slice(0, 3)" 
                :key="tag" 
                size="small"
                class="keyword-tag"
              >
                {{ tag }}
              </n-tag>
              <span v-if="paper.keywords.length > 3" class="more-keywords">
                +{{ paper.keywords.length - 3 }} more
              </span>
            </div>
          </div>
          
          <div class="paper-actions">
            <div class="paper-progress">
              <div class="progress-info">
                <span class="progress-label">{{ getProgressLabel(paper.status) }}</span>
                <n-progress 
                  :percentage="getProgressPercentage(paper.status)"
                  :status="getProgressStatus(paper.status)"
                  :show-indicator="false"
                  class="progress-bar"
                />
              </div>
            </div>
            
            <div class="action-buttons">
              <n-button 
                size="small" 
                @click.stop="editPaper(paper)"
                :disabled="!canEdit(paper.status)"
              >
                <template #icon>
                  <n-icon :component="CreateOutline" />
                </template>
                Edit
              </n-button>
              
              <n-button 
                size="small" 
                @click.stop="previewPaper(paper)"
              >
                <template #icon>
                  <n-icon :component="EyeOutline" />
                </template>
                Preview
              </n-button>
              
              <n-dropdown
                :options="getActionOptions(paper)"
                @select="handleAction"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NButton, NInput, NSelect, NGrid, NGi, NStatistic, NTag, NIcon, 
  NPagination, NEmpty, NProgress, NDropdown, useMessage 
} from 'naive-ui'
import {
  AddOutline, SearchOutline, CreateOutline, EyeOutline, 
  EllipsisHorizontalOutline, DocumentOutline, TrashOutline,
  ShareOutline, DownloadOutline
} from '@vicons/ionicons5'
import dayjs from 'dayjs'

const router = useRouter()
const message = useMessage()

// Reactive data
const searchQuery = ref('')
const selectedStatus = ref(null)
const selectedCategory = ref(null)
const sortBy = ref('newest')
const currentPage = ref(1)
const pageSize = ref(10)

// Mock papers data
const papers = ref([
  {
    id: 1,
    title: "Quantum Machine Learning for Drug Discovery: A Comprehensive Survey",
    authors: ["Dr. Sarah Chen", "Prof. Michael Zhang", "Dr. Lisa Wang"],
    abstract: "This paper presents a comprehensive survey of quantum machine learning applications in drug discovery, exploring the potential of quantum algorithms to accelerate pharmaceutical research and development processes.",
    keywords: ["Quantum Computing", "Machine Learning", "Drug Discovery", "Pharmaceutical Research", "Quantum Algorithms"],
    category: "Computer Science",
    status: "Published",
    createdAt: "2024-01-15",
    publishedAt: "2024-02-20",
    citationCount: 45,
    downloadCount: 1250,
    doi: "10.1000/xyz123",
    peerReviewId: null
  },
  {
    id: 2,
    title: "Sustainable Energy Storage Systems: A Machine Learning Approach",
    authors: ["Prof. David Liu", "Dr. Emma Thompson"],
    abstract: "We propose novel machine learning algorithms for optimizing sustainable energy storage systems, focusing on battery management and grid integration for renewable energy sources.",
    keywords: ["Energy Storage", "Machine Learning", "Sustainability", "Battery Management", "Grid Integration"],
    category: "Environmental Science",
    status: "Under Review",
    createdAt: "2024-01-20",
    submittedAt: "2024-02-01",
    reviewDeadline: "2024-03-15",
    peerReviewId: "PR-2024-001"
  },
  {
    id: 3,
    title: "Blockchain-Based Healthcare Data Management with Zero-Knowledge Proofs",
    authors: ["Dr. Alex Kim", "Prof. Jennifer Lee", "Dr. Robert Brown"],
    abstract: "This study explores the implementation of blockchain technology with zero-knowledge proofs for secure and private healthcare data management systems.",
    keywords: ["Blockchain", "Healthcare", "Zero-Knowledge Proofs", "Data Management", "Privacy"],
    category: "Computer Science",
    status: "Draft",
    createdAt: "2024-02-01",
    lastModified: "2024-02-15"
  },
  {
    id: 4,
    title: "Gene Therapy Optimization Using Artificial Intelligence",
    authors: ["Dr. Maria Garcia", "Prof. James Wilson"],
    abstract: "An innovative approach to gene therapy optimization leveraging artificial intelligence algorithms to improve treatment efficacy and reduce side effects.",
    keywords: ["Gene Therapy", "Artificial Intelligence", "Medical Treatment", "Optimization", "Biotechnology"],
    category: "Biotechnology",
    status: "Revision Required",
    createdAt: "2024-01-10",
    submittedAt: "2024-01-25",
    reviewComments: "Minor revisions needed in methodology section",
    peerReviewId: "PR-2024-002"
  },
  {
    id: 5,
    title: "Climate Change Impact on Marine Biodiversity: A Deep Learning Analysis",
    authors: ["Dr. Ocean Blue", "Prof. Green Earth"],
    abstract: "Using deep learning techniques to analyze the impact of climate change on marine biodiversity patterns across different oceanic regions.",
    keywords: ["Climate Change", "Marine Biology", "Deep Learning", "Biodiversity", "Ocean Science"],
    category: "Marine Biology",
    status: "Preprint",
    createdAt: "2024-02-05",
    publishedAt: "2024-02-10",
    preprintServer: "bioRxiv",
    downloadCount: 680
  }
])

// Options
const statusOptions = [
  { label: 'All Status', value: null },
  { label: 'Draft', value: 'Draft' },
  { label: 'Under Review', value: 'Under Review' },
  { label: 'Revision Required', value: 'Revision Required' },
  { label: 'Published', value: 'Published' },
  { label: 'Preprint', value: 'Preprint' }
]

const categoryOptions = [
  { label: 'All Categories', value: null },
  { label: 'Computer Science', value: 'Computer Science' },
  { label: 'Environmental Science', value: 'Environmental Science' },
  { label: 'Biotechnology', value: 'Biotechnology' },
  { label: 'Marine Biology', value: 'Marine Biology' },
  { label: 'Physics', value: 'Physics' },
  { label: 'Chemistry', value: 'Chemistry' }
]

const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Title A-Z', value: 'title_asc' },
  { label: 'Title Z-A', value: 'title_desc' },
  { label: 'Status', value: 'status' }
]

// Computed properties
const publishedCount = computed(() => 
  papers.value.filter(p => p.status === 'Published' || p.status === 'Preprint').length
)

const reviewingCount = computed(() => 
  papers.value.filter(p => p.status === 'Under Review' || p.status === 'Revision Required').length
)

const draftCount = computed(() => 
  papers.value.filter(p => p.status === 'Draft').length
)

const filteredPapers = computed(() => {
  let filtered = papers.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(paper => 
      paper.title.toLowerCase().includes(query) ||
      paper.authors.some(author => author.toLowerCase().includes(query)) ||
      paper.keywords.some(keyword => keyword.toLowerCase().includes(query)) ||
      paper.abstract.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (selectedStatus.value) {
    filtered = filtered.filter(paper => paper.status === selectedStatus.value)
  }

  // Category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(paper => paper.category === selectedCategory.value)
  }

  // Sorting
  filtered = filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt)
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt)
      case 'title_asc':
        return a.title.localeCompare(b.title)
      case 'title_desc':
        return b.title.localeCompare(a.title)
      case 'status':
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  return filtered
})

const paginatedPapers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredPapers.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredPapers.value.length / pageSize.value)
})

// Methods
const formatDate = (date) => {
  return dayjs(date).format('MMM DD, YYYY')
}

const getStatusType = (status) => {
  switch (status) {
    case 'Published': return 'success'
    case 'Preprint': return 'info'
    case 'Under Review': return 'warning'
    case 'Revision Required': return 'error'
    case 'Draft': return 'default'
    default: return 'default'
  }
}

const getProgressLabel = (status) => {
  switch (status) {
    case 'Draft': return 'In Progress'
    case 'Under Review': return 'Under Review'
    case 'Revision Required': return 'Needs Revision'
    case 'Published': return 'Published'
    case 'Preprint': return 'Published as Preprint'
    default: return status
  }
}

const getProgressPercentage = (status) => {
  switch (status) {
    case 'Draft': return 25
    case 'Under Review': return 60
    case 'Revision Required': return 40
    case 'Published': return 100
    case 'Preprint': return 80
    default: return 0
  }
}

const getProgressStatus = (status) => {
  switch (status) {
    case 'Published': return 'success'
    case 'Revision Required': return 'error'
    case 'Under Review': return 'warning'
    default: return 'info'
  }
}

const canEdit = (status) => {
  return ['Draft', 'Revision Required'].includes(status)
}

const getActionOptions = (paper) => {
  const options = [
    {
      label: 'View Details',
      key: `view-${paper.id}`,
      icon: () => h(NIcon, null, { default: () => h(DocumentOutline) })
    },
    {
      label: 'Share',
      key: `share-${paper.id}`,
      icon: () => h(NIcon, null, { default: () => h(ShareOutline) })
    }
  ]

  if (paper.status === 'Published' || paper.status === 'Preprint') {
    options.push({
      label: 'Download',
      key: `download-${paper.id}`,
      icon: () => h(NIcon, null, { default: () => h(DownloadOutline) })
    })
  }

  if (paper.status === 'Draft') {
    options.push({
      label: 'Delete',
      key: `delete-${paper.id}`,
      icon: () => h(NIcon, null, { default: () => h(TrashOutline) })
    })
  }

  return options
}

const handlePageSizeChange = (newPageSize) => {
  pageSize.value = newPageSize
  currentPage.value = 1
}

const startSubmission = () => {
  router.push('/papers/submit')
}

const viewPaper = (paper) => {
  router.push(`/papers/${paper.id}`)
}

const editPaper = (paper) => {
  if (canEdit(paper.status)) {
    router.push(`/papers/${paper.id}/edit`)
  } else {
    message.warning('This paper cannot be edited in its current status')
  }
}

const previewPaper = (paper) => {
  router.push(`/papers/${paper.id}/preview`)
}

const handleAction = (key) => {
  const [action, paperId] = key.split('-')
  const paper = papers.value.find(p => p.id === parseInt(paperId))
  
  switch (action) {
    case 'view':
      viewPaper(paper)
      break
    case 'share':
      navigator.clipboard.writeText(`${window.location.origin}/papers/${paperId}`)
      message.success('Paper link copied to clipboard!')
      break
    case 'download':
      message.success(`Downloading: ${paper.title}`)
      // TODO: Implement download
      break
    case 'delete':
      // TODO: Implement delete confirmation dialog
      message.info('Delete functionality will be implemented')
      break
  }
}

onMounted(() => {
  // Initialize page
})
</script>

<style scoped>
.publications-page {
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

.papers-section {
  margin-bottom: 32px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
}

.papers-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.paper-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.paper-card:hover {
  border-color: #58a6ff;
  box-shadow: 0 4px 16px rgba(88, 166, 255, 0.1);
}

.paper-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
}

.paper-title-section {
  flex: 1;
}

.paper-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.paper-meta {
  display: flex;
  gap: 16px;
  font-size: 0.875rem;
  color: #8b949e;
}

.paper-status-section {
  flex-shrink: 0;
}

.status-tag {
  font-weight: 500;
}

.paper-content {
  margin-bottom: 20px;
}

.paper-abstract {
  font-size: 0.875rem;
  color: #8b949e;
  line-height: 1.6;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.paper-tags {
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

.paper-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.paper-progress {
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