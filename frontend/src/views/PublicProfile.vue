<template>
  <div class="public-profile-page">
    <div class="profile-header">
      <div class="profile-avatar">
        <n-avatar size="large" :src="avatarUrl">
          {{ user.username?.charAt(0) || user.wallet_address?.slice(2, 4) || 'U' }}
        </n-avatar>
      </div>
      
      <div class="profile-info">
        <h1 class="profile-name">{{ user.username || 'Anonymous User' }}</h1>
        <div class="profile-title">{{ user.organization || 'Research Scientist' }}</div>
        
        <div class="profile-badges">
          <n-tag v-if="user.is_academically_verified" type="success" size="small">
            <template #icon>
              <n-icon :component="ShieldCheckmarkOutline" />
            </template>
            Verified Researcher
          </n-tag>
          <n-tag type="info" size="small">
            <template #icon>
              <n-icon :component="CardOutline" />
            </template>
            Web3 Connected
          </n-tag>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <n-tabs v-model:value="activeTab" type="line" size="large" class="profile-tabs">
        <n-tab-pane name="public" tab="Public Profile">
          <div class="tab-content">
            <div class="info-section">
              <h3>Basic Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Username</div>
                  <div class="info-value">{{ user.username || 'Not set' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Organization</div>
                  <div class="info-value">{{ user.organization || 'Not specified' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Research Interests</div>
                  <div class="info-value">
                    <div v-if="parsedResearchInterests.length > 0" class="research-tags">
                      <n-tag 
                        v-for="interest in parsedResearchInterests" 
                        :key="interest" 
                        type="info" 
                        size="small"
                        class="interest-tag"
                      >
                        {{ interest }}
                      </n-tag>
                    </div>
                    <span v-else>Not specified</span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">Website</div>
                  <div class="info-value">
                    <a v-if="user.personal_website" :href="user.personal_website" target="_blank" class="profile-link">
                      {{ user.personal_website }}
                    </a>
                    <span v-else>Not provided</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h3>Research Activity</h3>
              <div class="activity-stats">
                <div class="stat-card">
                  <div class="stat-number">{{ userProjects.length }}</div>
                  <div class="stat-label">Projects Led</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{ userProofs.length }}</div>
                  <div class="stat-label">Proofs Submitted</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{ userNFTs.length }}</div>
                  <div class="stat-label">Research NFTs</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{ collaborationCount }}</div>
                  <div class="stat-label">Collaborations</div>
                </div>
              </div>
            </div>

            <div class="info-section" v-if="userProjects.length > 0">
              <h3>Recent Projects</h3>
              <div class="projects-list">
                <div 
                  v-for="project in userProjects.slice(0, 3)" 
                  :key="project.id" 
                  class="project-item clickable-project"
                  @click="goToProjectDetail(project.id)"
                >
                  <div class="project-info">
                    <h4 class="project-name">{{ project.name }}</h4>
                    <p class="project-description">{{ project.description }}</p>
                    <div class="project-meta">
                      <n-tag :type="getStatusType(project.status)" size="small">{{ project.status }}</n-tag>
                      <span class="project-date">{{ formatDate(project.start_date) }}</span>
                    </div>
                  </div>
                  <div class="project-arrow">
                    <n-icon :component="ArrowForwardOutline" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane name="onchain" tab="OnChain Profile">
          <div class="tab-content">
            <div class="info-section">
              <h3>Blockchain Identity</h3>
              <div class="wallet-info">
                <div class="wallet-address">
                  <div class="address-label">Wallet Address</div>
                  <div class="address-value">
                    <code class="wallet-code">{{ user.wallet_address }}</code>
                    <n-button text @click="copyToClipboard(user.wallet_address)">
                      <n-icon :component="CopyOutline" />
                    </n-button>
                  </div>
                </div>
                
                <div class="did-info" v-if="user.did">
                  <div class="did-label">Decentralized Identity (DID)</div>
                  <div class="did-value">
                    <code class="did-code">{{ user.did }}</code>
                    <n-button text @click="copyToClipboard(user.did)">
                      <n-icon :component="CopyOutline" />
                    </n-button>
                  </div>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h3>OnChain Activities</h3>
              <div class="activity-timeline">
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="activity-title">Account Created</div>
                    <div class="activity-date">{{ formatDate(user.created_at) }}</div>
                  </div>
                </div>
                <div v-for="project in userProjects.slice(0, 2)" :key="`project-${project.id}`" class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="activity-title">Project Created: {{ project.name }}</div>
                    <div class="activity-date">{{ formatDate(project.created_at) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane name="academic" tab="Academic Identity">
          <div class="tab-content">
            <div class="info-section">
              <h3>Academic Credentials</h3>
              <div class="academic-status">
                <div class="verification-card" :class="{ 'verified': user.is_academically_verified }">
                  <div class="verification-icon">
                    <n-icon :component="user.is_academically_verified ? ShieldCheckmarkOutline : AlertCircleOutline" size="24" />
                  </div>
                  <div class="verification-content">
                    <h4>Academic Verification</h4>
                    <p v-if="user.is_academically_verified">
                      This researcher has been verified through academic credentials
                    </p>
                    <p v-else>
                      Academic verification pending or not submitted
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h3>Academic Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">ORCID ID</div>
                  <div class="info-value">
                    <a v-if="user.orcid_id" :href="`https://orcid.org/${user.orcid_id}`" target="_blank" class="profile-link">
                      {{ user.orcid_id }}
                    </a>
                    <span v-else>Not provided</span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">GitHub</div>
                  <div class="info-value">
                    <a v-if="user.github_username" :href="`https://github.com/${user.github_username}`" target="_blank" class="profile-link">
                      @{{ user.github_username }}
                    </a>
                    <span v-else>Not provided</span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">{{ user.email || 'Not public' }}</div>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h3>Research Publications & Activities</h3>
              <div class="research-activities">
                                 <div class="activity-item">
                   <h4>Current Research Areas</h4>
                   <div v-if="parsedResearchInterests.length > 0" class="research-areas">
                     <div class="research-tags">
                       <n-tag 
                         v-for="interest in parsedResearchInterests" 
                         :key="interest" 
                         type="success" 
                         size="medium"
                         class="area-tag"
                       >
                         {{ interest }}
                       </n-tag>
                     </div>
                   </div>
                   <p v-else class="no-data">No specific research areas listed</p>
                 </div>
                <div class="activity-item" v-if="userProjects.length > 0">
                  <h4>Active Research Projects</h4>
                  <ul class="research-projects">
                    <li 
                      v-for="project in userProjects.slice(0, 3)" 
                      :key="project.id"
                      class="clickable-research-project"
                      @click="goToProjectDetail(project.id)"
                    >
                      <div class="research-project-info">
                        <strong>{{ project.name }}</strong> - {{ project.status }}
                      </div>
                      <n-icon :component="ArrowForwardOutline" class="research-project-arrow" />
                    </li>
                  </ul>
                </div>
                <div class="activity-item" v-if="user.orcid_id">
                  <h4>Academic Profile</h4>
                  <p>
                    ORCID verified researcher with digital identifier 
                    <a :href="`https://orcid.org/${user.orcid_id}`" target="_blank" class="profile-link">
                      {{ user.orcid_id }}
                    </a>
                  </p>
                </div>
              </div>
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
  NAvatar, NTag, NIcon, NTabs, NTabPane, NButton, useMessage 
} from 'naive-ui'
import {
  ShieldCheckmarkOutline, CopyOutline, AlertCircleOutline, CardOutline, ArrowForwardOutline
} from '@vicons/ionicons5'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const message = useMessage()

// Reactive data
const user = ref({})
const userProjects = ref([])
const userProofs = ref([])
const userNFTs = ref([])
const activeTab = ref('public')
const loading = ref(true)

// Get user identifier from route
const userIdentifier = computed(() => route.params.userIdentifier)

// Computed
const avatarUrl = computed(() => {
  if (user.value.wallet_address) {
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${user.value.wallet_address}`
  }
  return null
})

const collaborationCount = computed(() => {
  // Mock calculation - in real app, count collaborations
  return Math.floor(Math.random() * 10) + 1
})

const parsedResearchInterests = computed(() => {
  if (!user.value.research_interests) {
    return []
  }
  try {
    // Try to parse as JSON array
    const parsed = JSON.parse(user.value.research_interests)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    // If parsing fails, treat as comma-separated string
    return user.value.research_interests.split(',').map(item => item.trim()).filter(item => item)
  }
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

const getStatusType = (status) => {
  switch (status) {
    case 'Active': return 'success'
    case 'Under Review': return 'warning'
    case 'Completed': return 'info'
    default: return 'default'
  }
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success('Copied to clipboard')
  } catch (error) {
    message.error('Failed to copy')
  }
}

const goToProjectDetail = (projectId) => {
  router.push(`/explore/projects/${projectId}`)
}

// API calls
const fetchUserData = async () => {
  if (!userIdentifier.value) return
  
  try {
    // Try to fetch user by username first, then by wallet address
    let userResponse
    try {
      userResponse = await axios.get(`http://localhost:3000/api/users/username/${userIdentifier.value}`)
    } catch {
      userResponse = await axios.get(`http://localhost:3000/api/users/wallet/${userIdentifier.value}`)
    }
    
    user.value = userResponse.data
    
    // Fetch user's projects
    if (user.value.wallet_address) {
      try {
        const projectsResponse = await axios.get(`http://localhost:3000/api/projects?wallet_address=${user.value.wallet_address}`)
        userProjects.value = projectsResponse.data || []
      } catch (error) {
        console.error('Failed to fetch user projects:', error)
      }
    }
    
  } catch (error) {
    console.error('Failed to fetch user data:', error)
    message.error('User not found')
    // Create a mock user for demo purposes
    user.value = {
      username: userIdentifier.value,
      wallet_address: '0x' + Math.random().toString(16).substr(2, 40),
      organization: 'Research Institute',
      research_interests: 'Quantum Computing, Blockchain Research',
      is_academically_verified: Math.random() > 0.5,
      created_at: new Date().toISOString()
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUserData()
})
</script>

<style scoped>
.public-profile-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
  background-color: #0d1117;
  color: #c9d1d9;
  min-height: 100vh;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  background: linear-gradient(135deg, #161b22 0%, #0d1117 100%);
  border: 1px solid #30363d;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
}

.profile-avatar {
  flex-shrink: 0;
}

.profile-avatar :deep(.n-avatar) {
  width: 80px;
  height: 80px;
  font-size: 32px;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 28px;
  font-weight: 700;
  color: #c9d1d9;
  margin: 0 0 8px 0;
}

.profile-title {
  font-size: 16px;
  color: #8b949e;
  margin-bottom: 16px;
}

.profile-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.profile-content {
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

.info-section {
  margin-bottom: 32px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h3 {
  font-size: 20px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 20px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-item {
  padding: 16px;
  background: rgba(48, 54, 61, 0.3);
  border-radius: 8px;
}

.info-label {
  color: #8b949e;
  font-size: 14px;
  margin-bottom: 6px;
  font-weight: 500;
}

.info-value {
  color: #c9d1d9;
  font-size: 15px;
}

.info-value .research-tags {
  margin-bottom: 0;
}

.profile-link {
  color: #58a6ff;
  text-decoration: none;
}

.profile-link:hover {
  text-decoration: underline;
}

.activity-stats {
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

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #58a6ff;
  margin-bottom: 4px;
}

.stat-label {
  color: #8b949e;
  font-size: 14px;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-item {
  background: rgba(48, 54, 61, 0.3);
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.clickable-project {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-project:hover {
  background: rgba(56, 139, 253, 0.1);
  border-color: rgba(56, 139, 253, 0.3);
  transform: translateY(-1px);
}

.project-info {
  flex: 1;
}

.project-arrow {
  opacity: 0.5;
  font-size: 16px;
  color: #8b949e;
  transition: all 0.2s ease;
  margin-left: 16px;
}

.clickable-project:hover .project-arrow {
  opacity: 1;
  color: #58a6ff;
  transform: translateX(2px);
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 8px 0;
}

.project-description {
  color: #8b949e;
  margin: 0 0 12px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: calc(100% - 20px);
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-date {
  color: #8b949e;
  font-size: 14px;
}

.wallet-info {
  background: rgba(48, 54, 61, 0.3);
  border-radius: 12px;
  padding: 24px;
}

.wallet-address, .did-info {
  margin-bottom: 20px;
}

.wallet-address:last-child, .did-info:last-child {
  margin-bottom: 0;
}

.address-label, .did-label {
  color: #8b949e;
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
}

.address-value, .did-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wallet-code, .did-code {
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #58a6ff;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-timeline {
  position: relative;
  padding-left: 24px;
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 20px;
  bottom: -8px;
  width: 2px;
  background: #30363d;
}

.timeline-dot {
  position: absolute;
  left: -20px;
  top: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #58a6ff;
}

.timeline-content {
  margin-left: 8px;
}

.activity-title {
  font-size: 15px;
  font-weight: 500;
  color: #c9d1d9;
  margin-bottom: 4px;
}

.activity-date {
  font-size: 14px;
  color: #8b949e;
}

.academic-status {
  margin-bottom: 24px;
}

.verification-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #30363d;
  background: rgba(48, 54, 61, 0.3);
}

.verification-card.verified {
  border-color: rgba(35, 134, 54, 0.5);
  background: rgba(35, 134, 54, 0.1);
}

.verification-icon {
  color: #8b949e;
}

.verification-card.verified .verification-icon {
  color: #238636;
}

.verification-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 6px 0;
}

.verification-content p {
  margin: 0;
  color: #8b949e;
  line-height: 1.5;
}

.research-activities {
  background: rgba(48, 54, 61, 0.3);
  border-radius: 12px;
  padding: 24px;
}

.activity-item {
  margin-bottom: 24px;
}

.activity-item:last-child {
  margin-bottom: 0;
}

.activity-item h4 {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 8px 0;
}

.activity-item p {
  margin: 0;
  line-height: 1.6;
  color: #8b949e;
}

.no-data {
  font-style: italic;
  color: #6e7681;
}

.research-projects {
  list-style: none;
  padding: 0;
  margin: 0;
}

.research-projects li {
  padding: 12px 0;
  border-bottom: 1px solid rgba(48, 54, 61, 0.5);
  color: #8b949e;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.research-projects li:last-child {
  border-bottom: none;
}

.research-projects strong {
  color: #c9d1d9;
}

.research-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.interest-tag, .area-tag {
  font-weight: 500;
}

.research-areas {
  background: rgba(35, 134, 54, 0.05);
  border: 1px solid rgba(35, 134, 54, 0.2);
  border-radius: 8px;
  padding: 16px;
}

.research-description {
  margin: 12px 0 0 0;
  color: #8b949e;
  font-style: italic;
  line-height: 1.5;
}

.clickable-research-project {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
  margin: 0 -8px;
  padding: 12px 8px !important;
}

.clickable-research-project:hover {
  background: rgba(56, 139, 253, 0.1);
  color: #c9d1d9;
}

.research-project-info {
  flex: 1;
}

.research-project-arrow {
  opacity: 0;
  font-size: 14px;
  color: #8b949e;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.clickable-research-project:hover .research-project-arrow {
  opacity: 1;
  color: #58a6ff;
  transform: translateX(1px);
}

/* Responsive design */
@media (max-width: 768px) {
  .public-profile-page {
    padding: 16px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }
  
  .tab-content {
    padding: 20px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .activity-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 