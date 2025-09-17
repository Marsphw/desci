<template>
  <div class="explore-project-page">
    <div class="project-header">
      <div class="header-content">
        <div class="project-tags">
          <n-tag :type="getCategoryType(project.category)" class="category-tag">
            {{ getCategoryLabel(project.category) }}
          </n-tag>
          <n-tag :type="getStatusType(project.status)" class="status-tag">
            <template #icon>
              <n-icon :component="TimeOutline" />
            </template>
            {{ project.status }}
          </n-tag>
        </div>
        
        <h1 class="project-title">{{ project.name || 'Loading...' }}</h1>
        
        <div class="project-meta">
          <div class="meta-item leader-item" @click="goToUserProfile(project.owner_username || project.owner_wallet_address)">
            <n-icon :component="PersonOutline" />
            <span>Led by {{ project.owner_username || project.owner }}</span>
          </div>
          <div class="meta-item">
            <n-icon :component="CalendarOutline" />
            <span>Started {{ formatDate(project.start_date) }}</span>
          </div>
          <div class="meta-item">
            <n-icon :component="CashOutline" />
            <span>{{ project.funding || 'None' }}</span>
          </div>
        </div>
        

        
        <div class="project-stats">
          <div class="stat-card">
            <div class="stat-label">Started:</div>
            <div class="stat-value">{{ formatDate(project.start_date) }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Funding:</div>
            <div class="stat-value">{{ project.funding || 'None' }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Proofs:</div>
            <div class="stat-value">{{ proofs.length }} submitted</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">NFTs:</div>
            <div class="stat-value">{{ nfts.length }} minted</div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-tabs">
      <n-tabs v-model:value="activeTab" type="line" size="large" class="project-tabs">
        <n-tab-pane name="description" tab="Description">
          <div class="tab-content">
            <div class="content-section">
              <h2>Project Description</h2>
              <div class="description-content">
                {{ project.description || 'No detailed description provided for this project.' }}
              </div>
            </div>
            

          </div>
        </n-tab-pane>
        
        <n-tab-pane name="timeline" tab="Timeline">
          <div class="tab-content">
            <div class="timeline-container" v-if="milestones.length > 0">
              <div class="timeline-item" v-for="(milestone, index) in sortedMilestones" :key="milestone.id">
                <div class="timeline-dot" :class="getMilestoneStatusClass(milestone)">
                  <n-icon :component="getMilestoneIcon(milestone.type)" size="14" />
                </div>
                <div class="timeline-content">
                  <div class="milestone-header">
                    <h4 class="milestone-title">{{ milestone.title }}</h4>
                    <n-tag :type="getMilestoneTypeColor(milestone.type)" size="small">
                      {{ milestone.type }}
                    </n-tag>
                  </div>
                  <p class="milestone-description">{{ milestone.description }}</p>
                  <div class="milestone-date">
                    <n-icon :component="CalendarOutline" size="14" />
                    {{ formatDate(milestone.date) }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <n-icon :component="TimeOutline" size="48" />
              <h3>No timeline available</h3>
              <p>This project hasn't published its timeline yet.</p>
            </div>
          </div>
        </n-tab-pane>
        
        <n-tab-pane :name="`proofs`" :tab="`Research Proofs (${proofs.length})`">
          <div class="tab-content">
            <div v-if="proofs.length > 0" class="proofs-grid">
              <div v-for="proof in proofs" :key="proof.id" class="proof-card">
                <div class="proof-header">
                  <h4>{{ proof.title }}</h4>
                  <n-tag type="success" size="small">
                    <template #icon>
                      <n-icon :component="ShieldCheckmarkOutline" />
                    </template>
                    Verified
                  </n-tag>
                </div>
                <p class="proof-description">{{ proof.description }}</p>
                <div class="proof-meta">
                  <span class="proof-date">{{ formatDate(proof.created_at) }}</span>
                  <span class="proof-creator">by {{ proof.creator_username }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <n-icon :component="ShieldCheckmarkOutline" size="48" />
              <h3>No proofs submitted</h3>
              <p>This project hasn't submitted any research proofs yet.</p>
            </div>
          </div>
        </n-tab-pane>
        
        <n-tab-pane :name="`nfts`" :tab="`Research NFTs (${nfts.length})`">
          <div class="tab-content">
            <div v-if="nfts.length > 0" class="nfts-grid">
              <div v-for="nft in nfts" :key="nft.id" class="nft-card">
                <div class="nft-preview">
                  <n-icon :component="DiamondOutline" size="32" />
                </div>
                <div class="nft-info">
                  <h4>Research NFT #{{ nft.token_id }}</h4>
                  <p class="nft-description">{{ nft.description || 'Research achievement NFT' }}</p>
                  <div class="nft-meta">
                    <span class="nft-date">{{ formatDate(nft.created_at) }}</span>
                    <span class="nft-owner">{{ nft.owner_username }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <n-icon :component="DiamondOutline" size="48" />
              <h3>No NFTs minted</h3>
              <p>This project hasn't minted any research NFTs yet.</p>
            </div>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  NTag, NIcon, NTabs, NTabPane, useMessage 
} from 'naive-ui'
import {
  TimeOutline, PersonOutline, CalendarOutline, CashOutline,
  ShieldCheckmarkOutline, DiamondOutline, FlagOutline,
  CheckmarkCircleOutline, DocumentTextOutline
} from '@vicons/ionicons5'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const message = useMessage()

// Reactive data
const project = ref({})
const proofs = ref([])
const nfts = ref([])
const milestones = ref([])
const activeTab = ref('description')
const loading = ref(true)

// Get project ID from route
const projectId = computed(() => route.params.projectId)

// Computed
const sortedMilestones = computed(() => {
  return [...milestones.value].sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Methods
const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getCategoryType = (category) => {
  switch (category) {
    case 'Biomedical': return 'success'
    case 'AI': return 'info'
    case 'Climate': return 'warning'
    case 'Quantum': return 'error'
    default: return 'default'
  }
}

const getCategoryLabel = (category) => {
  const labels = {
    'Biomedical': '生物医学',
    'AI': '人工智能',
    'Climate': '气候科学',
    'Quantum': '量子计算',
    'Materials': '材料科学',
    'Neuroscience': '神经科学',
    'Other': '其他'
  }
  return labels[category] || category || '其他'
}

const getStatusType = (status) => {
  switch (status) {
    case 'Active': return 'success'
    case 'Under Review': return 'warning'
    case 'Completed': return 'info'
    default: return 'default'
  }
}

const getMilestoneStatusClass = (milestone) => {
  if (milestone.status === 'completed') {
    return 'timeline-dot-completed'
  } else if (milestone.status === 'in-progress') {
    return 'timeline-dot-current'
  } else {
    return 'timeline-dot-future'
  }
}

const getMilestoneIcon = (type) => {
  switch (type) {
    case 'milestone': return FlagOutline
    case 'proof': return ShieldCheckmarkOutline
    case 'verification': return CheckmarkCircleOutline
    case 'nft': return DiamondOutline
    case 'publication': return DocumentTextOutline
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
    default: return 'default'
  }
}

const goToUserProfile = (userIdentifier) => {
  if (userIdentifier) {
    router.push(`/profile/${userIdentifier}`)
  }
}

// API calls
const fetchProjectData = async () => {
  if (!projectId.value) return
  
  try {
    const [projectRes, proofsRes, nftsRes, milestonesRes] = await Promise.all([
      axios.get(`http://localhost:3000/api/projects/${projectId.value}`),
      axios.get(`http://localhost:3000/api/projects/${projectId.value}/proofs`).catch(() => ({ data: [] })),
      axios.get(`http://localhost:3000/api/projects/${projectId.value}/nfts`).catch(() => ({ data: [] })),
      axios.get(`http://localhost:3000/api/projects/${projectId.value}/milestones`).catch(() => ({ data: [] }))
    ])
    
    project.value = projectRes.data
    proofs.value = proofsRes.data || []
    nfts.value = nftsRes.data || []
    milestones.value = (milestonesRes.data || []).map(milestone => ({
      ...milestone,
      date: new Date(milestone.date)
    }))
  } catch (error) {
    console.error('Failed to fetch project data:', error)
    message.error('Failed to load project data')
    // Fallback to explore projects endpoint
    try {
      const response = await axios.get('http://localhost:3000/api/projects/explore/public')
      const foundProject = response.data.find(p => p.id == projectId.value)
      if (foundProject) {
        project.value = foundProject
      }
    } catch (fallbackError) {
      console.error('Fallback request also failed:', fallbackError)
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProjectData()
})
</script>

<style scoped>
.explore-project-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background-color: #0d1117;
  color: #c9d1d9;
  min-height: 100vh;
}

.project-header {
  background: linear-gradient(135deg, #161b22 0%, #0d1117 100%);
  border: 1px solid #30363d;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
}

.project-tags {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.category-tag {
  font-size: 14px;
  font-weight: 500;
}

.status-tag {
  font-size: 14px;
  font-weight: 500;
}

.project-title {
  font-size: 32px;
  font-weight: 700;
  color: #c9d1d9;
  margin: 0 0 20px 0;
  line-height: 1.2;
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8b949e;
  font-size: 15px;
}

.meta-item .n-icon {
  font-size: 16px;
}

.leader-item {
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px 12px;
  border-radius: 8px;
  margin: -8px -12px;
}

.leader-item:hover {
  background-color: rgba(56, 139, 253, 0.1);
  color: #58a6ff;
}

.project-description {
  font-size: 16px;
  line-height: 1.6;
  color: #c9d1d9;
  margin-bottom: 32px;
  max-width: 800px;
}

.project-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(56, 139, 253, 0.05);
  border: 1px solid rgba(56, 139, 253, 0.2);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.stat-label {
  color: #8b949e;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  color: #c9d1d9;
  font-size: 18px;
  font-weight: 600;
}

.content-tabs {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 16px;
  overflow: hidden;
}

:deep(.n-tabs .n-tabs-nav) {
  background: #0d1117;
  border-bottom: 1px solid #30363d;
  padding: 0 32px;
}

:deep(.n-tabs .n-tabs-tab) {
  padding: 16px 24px;
  color: #8b949e;
  font-size: 15px;
  font-weight: 500;
}

:deep(.n-tabs .n-tabs-tab.n-tabs-tab--active) {
  color: #58a6ff;
}

:deep(.n-tabs .n-tabs-bar) {
  background: #58a6ff;
}

.tab-content {
  padding: 32px;
}

.content-section {
  margin-bottom: 32px;
}

.content-section h2 {
  font-size: 24px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 16px 0;
}

.content-section h3 {
  font-size: 20px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 16px 0;
}

.description-content {
  font-size: 16px;
  line-height: 1.7;
  color: #c9d1d9;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.detail-item {
  padding: 16px;
  background: rgba(48, 54, 61, 0.3);
  border-radius: 8px;
}

.detail-label {
  color: #8b949e;
  font-size: 14px;
  margin-bottom: 4px;
}

.detail-value {
  color: #c9d1d9;
  font-size: 16px;
  font-weight: 500;
}

.timeline-container {
  position: relative;
  padding-left: 32px;
}

.timeline-item {
  position: relative;
  padding-bottom: 32px;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 32px;
  bottom: -16px;
  width: 2px;
  background: #30363d;
}

.timeline-dot {
  position: absolute;
  left: -24px;
  top: 4px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  background: #0d1117;
}

.timeline-dot-completed {
  border-color: #238636;
  color: #238636;
}

.timeline-dot-current {
  border-color: #d29922;
  color: #d29922;
}

.timeline-dot-future {
  border-color: #58a6ff;
  color: #58a6ff;
}

.timeline-content {
  margin-left: 24px;
}

.milestone-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.milestone-title {
  font-size: 18px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0;
}

.milestone-description {
  color: #8b949e;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.milestone-date {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8b949e;
  font-size: 14px;
}

.proofs-grid, .nfts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.proof-card, .nft-card {
  background: rgba(48, 54, 61, 0.3);
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
}

.proof-card:hover, .nft-card:hover {
  border-color: #58a6ff;
  background: rgba(56, 139, 253, 0.05);
}

.proof-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.proof-header h4, .nft-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0;
}

.proof-description, .nft-description {
  color: #8b949e;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.proof-meta, .nft-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #8b949e;
}

.nft-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
  background: rgba(56, 139, 253, 0.1);
  border-radius: 8px;
  margin-bottom: 16px;
  color: #58a6ff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #8b949e;
}

.empty-state .n-icon {
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 8px 0;
}

.empty-state p {
  margin: 0;
  max-width: 400px;
}

/* Responsive design */
@media (max-width: 768px) {
  .explore-project-page {
    padding: 16px;
  }
  
  .project-header {
    padding: 24px;
  }
  
  .project-title {
    font-size: 24px;
  }
  
  .project-meta {
    flex-direction: column;
    gap: 12px;
  }
  
  .project-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tab-content {
    padding: 20px;
  }
  
  .proofs-grid, .nfts-grid {
    grid-template-columns: 1fr;
  }
}
</style> 