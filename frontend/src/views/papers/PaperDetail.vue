<template>
  <div class="paper-detail-page">
    <div v-if="isLoading" class="loading-container">
      <n-spin size="large">
        <template #description>Loading paper details...</template>
      </n-spin>
    </div>
    
    <div v-else-if="paper" class="paper-content">
      <!-- Paper Header -->
      <div class="paper-header">
        <div class="paper-title-section">
          <h1 class="paper-title">{{ paper.title }}</h1>
          <div class="paper-meta">
            <div class="authors">
              <span v-for="(author, index) in paper.authors" :key="index" class="author">
                {{ author.name }}{{ author.affiliation ? ` (${author.affiliation})` : '' }}{{ index < paper.authors.length - 1 ? ', ' : '' }}
              </span>
            </div>
            <div class="meta-info">
              <span>{{ formatDate(paper.createdAt) }}</span>
              <span v-if="paper.doi">DOI: {{ paper.doi }}</span>
              <span>Category: {{ paper.category }}</span>
            </div>
          </div>
        </div>
        <div class="paper-status-section">
          <n-tag :type="getStatusType(paper.status)" size="large">
            {{ paper.status }}
          </n-tag>
          <div class="paper-actions">
            <n-button v-if="canEdit" @click="editPaper">
              <template #icon>
                <n-icon :component="CreateOutline" />
              </template>
              Edit
            </n-button>
            <n-button @click="downloadPaper">
              <template #icon>
                <n-icon :component="DownloadOutline" />
              </template>
              Download
            </n-button>
            <n-button @click="sharePaper">
              <template #icon>
                <n-icon :component="ShareOutline" />
              </template>
              Share
            </n-button>
          </div>
        </div>
      </div>

      <!-- Paper Content Grid -->
      <div class="content-grid">
        <!-- Left Column -->
        <div class="left-column">
          <!-- Abstract -->
          <n-card title="Abstract" class="content-card">
            <p class="abstract-text">{{ paper.abstract }}</p>
          </n-card>

          <!-- Keywords -->
          <n-card title="Keywords" class="content-card">
            <div class="keywords-container">
              <n-tag v-for="keyword in paper.keywords" :key="keyword" size="medium">
                {{ keyword }}
              </n-tag>
            </div>
          </n-card>

          <!-- Funding Information -->
          <n-card v-if="paper.funding" title="Funding Information" class="content-card">
            <p>{{ paper.funding }}</p>
          </n-card>
        </div>

        <!-- Right Column -->
        <div class="right-column">
          <!-- Paper Statistics -->
          <n-card title="Statistics" class="content-card">
            <n-grid :cols="2" :x-gap="16" :y-gap="16">
              <n-gi>
                <n-statistic label="Views" :value="paper.views || 0" />
              </n-gi>
              <n-gi>
                <n-statistic label="Downloads" :value="paper.downloads || 0" />
              </n-gi>
              <n-gi>
                <n-statistic label="Citations" :value="paper.citations || 0" />
              </n-gi>
              <n-gi>
                <n-statistic label="Shares" :value="paper.shares || 0" />
              </n-gi>
            </n-grid>
          </n-card>

          <!-- Publication Info -->
          <n-card title="Publication Details" class="content-card">
            <div class="info-list">
              <div class="info-item">
                <span class="label">Status:</span>
                <n-tag :type="getStatusType(paper.status)">{{ paper.status }}</n-tag>
              </div>
              <div v-if="paper.venue" class="info-item">
                <span class="label">Venue:</span>
                <span>{{ paper.venue }}</span>
              </div>
              <div v-if="paper.publishedAt" class="info-item">
                <span class="label">Published:</span>
                <span>{{ formatDate(paper.publishedAt) }}</span>
              </div>
              <div class="info-item">
                <span class="label">License:</span>
                <span>{{ getLicenseName(paper.license) }}</span>
              </div>
              <div v-if="paper.peerReviewId" class="info-item">
                <span class="label">Review ID:</span>
                <span>{{ paper.peerReviewId }}</span>
              </div>
            </div>
          </n-card>

          <!-- Actions -->
          <n-card title="Actions" class="content-card">
            <n-space direction="vertical" size="small">
              <n-button block @click="viewReviews" v-if="paper.peerReviewId">
                <template #icon>
                  <n-icon :component="EyeOutline" />
                </template>
                View Review Status
              </n-button>
              <n-button block @click="mintNFT" v-if="paper.status === 'Published'">
                <template #icon>
                  <n-icon :component="DiamondOutline" />
                </template>
                Mint as NFT
              </n-button>
              <n-button block @click="generateProof" v-if="paper.status === 'Published'">
                <template #icon>
                  <n-icon :component="ShieldCheckmarkOutline" />
                </template>
                Generate ZK Proof
              </n-button>
            </n-space>
          </n-card>
        </div>
      </div>
    </div>

    <div v-else class="error-state">
      <n-empty description="Paper not found" size="large">
        <template #extra>
          <n-button @click="goBack">Go Back</n-button>
        </template>
      </n-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  NCard, NButton, NTag, NIcon, NSpin, NEmpty, NStatistic, NGrid, NGi, NSpace,
  useMessage
} from 'naive-ui'
import {
  CreateOutline, DownloadOutline, ShareOutline, EyeOutline,
  DiamondOutline, ShieldCheckmarkOutline
} from '@vicons/ionicons5'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const message = useMessage()

// Reactive data
const isLoading = ref(true)
const paper = ref(null)

// Mock paper data (would be fetched from API)
const mockPaper = {
  id: 1,
  title: "Quantum Machine Learning for Drug Discovery: A Comprehensive Survey",
  authors: [
    { name: "Dr. Sarah Chen", affiliation: "MIT", email: "s.chen@mit.edu" },
    { name: "Prof. Michael Zhang", affiliation: "Stanford University", email: "m.zhang@stanford.edu" },
    { name: "Dr. Lisa Wang", affiliation: "Google Research", email: "l.wang@google.com" }
  ],
  abstract: "This paper presents a comprehensive survey of quantum machine learning applications in drug discovery, exploring the potential of quantum algorithms to accelerate pharmaceutical research and development processes. We examine current approaches, challenges, and future directions in the intersection of quantum computing and computational biology. Our analysis reveals significant opportunities for quantum advantage in molecular simulation, drug-target interaction prediction, and optimization of pharmaceutical compounds. The survey covers both theoretical foundations and practical implementations, providing insights for researchers working at the intersection of quantum computing and pharmaceutical sciences.",
  keywords: ["Quantum Computing", "Machine Learning", "Drug Discovery", "Pharmaceutical Research", "Quantum Algorithms", "Molecular Simulation", "Computational Biology"],
  category: "Computer Science",
  status: "Published",
  createdAt: "2024-01-15",
  publishedAt: "2024-02-20",
  venue: "Nature Quantum Information",
  doi: "10.1038/s41534-024-00123-4",
  license: "cc-by",
  funding: "This research was supported by NSF Grant No. 12345678 and NIH Grant No. R01-987654321.",
  views: 1250,
  downloads: 890,
  citations: 45,
  shares: 78,
  peerReviewId: null
}

// Computed properties
const canEdit = computed(() => {
  return ['Draft', 'Revision Required'].includes(paper.value?.status)
})

// Methods
const formatDate = (date) => {
  return dayjs(date).format('MMMM DD, YYYY')
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

const getLicenseName = (license) => {
  const licenses = {
    'cc-by': 'CC BY 4.0',
    'cc-by-sa': 'CC BY-SA 4.0',
    'cc-by-nc': 'CC BY-NC 4.0',
    'all-rights-reserved': 'All Rights Reserved'
  }
  return licenses[license] || license
}

const editPaper = () => {
  router.push(`/papers/${route.params.paper_id}/edit`)
}

const downloadPaper = () => {
  message.success(`Downloading: ${paper.value.title}`)
  // TODO: Implement download
}

const sharePaper = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    message.success('Paper link copied to clipboard!')
  } catch (error) {
    message.error('Failed to copy link')
  }
}

const viewReviews = () => {
  router.push(`/reviews/${paper.value.peerReviewId}`)
}

const mintNFT = () => {
  router.push(`/nft/mint?paper_id=${paper.value.id}`)
}

const generateProof = () => {
  router.push(`/proof/generate?paper_id=${paper.value.id}`)
}

const goBack = () => {
  router.push('/publications')
}

const fetchPaper = async () => {
  try {
    isLoading.value = true
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    paper.value = mockPaper
  } catch (error) {
    console.error('Failed to fetch paper:', error)
    paper.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchPaper()
})
</script>

<style scoped>
.paper-detail-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.paper-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 32px;
  padding: 32px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
}

.paper-title-section {
  flex: 1;
}

.paper-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #c9d1d9;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.paper-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.authors {
  font-size: 1.1rem;
  color: #8b949e;
  line-height: 1.5;
}

.author {
  color: #58a6ff;
}

.meta-info {
  display: flex;
  gap: 16px;
  font-size: 0.875rem;
  color: #8b949e;
}

.meta-info span {
  display: flex;
  align-items: center;
}

.paper-status-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
}

.paper-actions {
  display: flex;
  gap: 8px;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.abstract-text {
  font-size: 1rem;
  line-height: 1.7;
  color: #c9d1d9;
  margin: 0;
  text-align: justify;
}

.keywords-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.info-item .label {
  font-weight: 500;
  color: #8b949e;
  min-width: 80px;
}

/* Dark theme adjustments */
:deep(.n-card) {
  background-color: #161b22;
  border-color: #30363d;
}

:deep(.n-statistic .n-statistic-value) {
  color: #c9d1d9;
}

:deep(.n-statistic .n-statistic-label) {
  color: #8b949e;
}
</style> 