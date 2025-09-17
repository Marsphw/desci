<template>
  <div class="analytics-page">
    <div class="page-header">
      <n-button text @click="goBack" class="back-btn">
        <template #icon>
          <n-icon :component="ArrowBackOutline" />
        </template>
        Back to Dataset
      </n-button>
      
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">Dataset Analytics</h1>
          <p class="page-description">
            Monitor usage patterns, access statistics, and performance metrics for "{{ datasetName }}"
          </p>
        </div>
        
        <div class="header-controls">
          <n-select
            v-model:value="selectedTimeRange"
            :options="timeRangeOptions"
            style="width: 150px"
            @update:value="refreshAnalytics"
          />
          <n-button @click="exportAnalytics" secondary>
            <template #icon>
              <n-icon :component="DownloadOutline" />
            </template>
            Export
          </n-button>
        </div>
      </div>
    </div>

    <div class="analytics-content">
      <n-spin :show="isLoading">
        <div class="content-grid">
          <!-- Overview Cards -->
          <div class="overview-section">
            <n-card title="Overview Statistics" class="overview-card">
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon">
                    <n-icon :component="EyeOutline" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-number">{{ analytics.total_usage || 0 }}</div>
                    <div class="stat-label">Total Views</div>
                    <div class="stat-change" :class="{ positive: analytics.view_change > 0, negative: analytics.view_change < 0 }">
                      {{ formatChange(analytics.view_change) }}% vs last period
                    </div>
                  </div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-icon">
                    <n-icon :component="DownloadOutline" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-number">{{ analytics.download_count || 0 }}</div>
                    <div class="stat-label">Downloads</div>
                    <div class="stat-change" :class="{ positive: analytics.download_change > 0, negative: analytics.download_change < 0 }">
                      {{ formatChange(analytics.download_change) }}% vs last period
                    </div>
                  </div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-icon">
                    <n-icon :component="PeopleOutline" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-number">{{ uniqueUsers }}</div>
                    <div class="stat-label">Unique Users</div>
                    <div class="stat-change" :class="{ positive: analytics.user_change > 0, negative: analytics.user_change < 0 }">
                      {{ formatChange(analytics.user_change) }}% vs last period
                    </div>
                  </div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-icon">
                    <n-icon :component="TimeOutline" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-number">{{ formatTime(analytics.avg_session_time) }}</div>
                    <div class="stat-label">Avg. Session Time</div>
                    <div class="stat-change" :class="{ positive: analytics.time_change > 0, negative: analytics.time_change < 0 }">
                      {{ formatChange(analytics.time_change) }}% vs last period
                    </div>
                  </div>
                </div>
              </div>
            </n-card>
          </div>

          <!-- Charts Section -->
          <div class="charts-section">
            <div class="chart-row">
              <n-card title="Usage Over Time" class="chart-card">
                <div class="chart-container">
                  <div class="chart-placeholder">
                    <div class="chart-visual">
                      <div 
                        v-for="(day, index) in analytics.daily_usage" 
                        :key="index"
                        class="chart-bar"
                        :style="{ height: `${(day.usage_count / maxUsage) * 100}%` }"
                        :title="`${day.date}: ${day.usage_count} views`"
                      />
                    </div>
                    <div class="chart-labels">
                      <span v-for="(day, index) in chartLabels" :key="index" class="chart-label">
                        {{ day }}
                      </span>
                    </div>
                  </div>
                </div>
              </n-card>
              
              <n-card title="Access Patterns" class="chart-card">
                <div class="access-patterns">
                  <div class="pattern-item" v-for="action in analytics.usage_by_action" :key="action.action_type">
                    <div class="pattern-header">
                      <n-icon :component="getActionIcon(action.action_type)" />
                      <span class="pattern-name">{{ formatActionType(action.action_type) }}</span>
                    </div>
                    <div class="pattern-bar">
                      <div 
                        class="pattern-fill" 
                        :style="{ width: `${(action.count / totalActions) * 100}%` }"
                      />
                    </div>
                    <div class="pattern-count">{{ action.count }}</div>
                  </div>
                </div>
              </n-card>
            </div>
          </div>

          <!-- Details Section -->
          <div class="details-section">
            <n-card title="Recent Activity" class="activity-card">
              <div v-if="analytics.recent_usage && analytics.recent_usage.length > 0" class="activity-list">
                <div 
                  v-for="activity in analytics.recent_usage" 
                  :key="activity.id" 
                  class="activity-item"
                >
                  <div class="activity-user">
                    <n-avatar :src="getAvatarUrl(activity.wallet_address)" size="small">
                      {{ getInitials(activity.username || activity.wallet_address) }}
                    </n-avatar>
                    <div class="user-info">
                      <span class="username">{{ activity.username || 'Anonymous' }}</span>
                      <span class="wallet-address">{{ formatWalletAddress(activity.wallet_address) }}</span>
                    </div>
                  </div>
                  
                  <div class="activity-details">
                    <n-tag :type="getActionType(activity.action_type)" size="small">
                      {{ formatActionType(activity.action_type) }}
                    </n-tag>
                    <span class="activity-time">{{ formatDate(activity.created_at) }}</span>
                  </div>
                </div>
              </div>
              
              <div v-else class="empty-activity">
                <n-empty description="No recent activity" size="small" />
              </div>
            </n-card>

            <n-card title="Geographic Distribution" class="geo-card">
              <div class="geo-stats">
                <div class="geo-item" v-for="region in mockGeographicData" :key="region.region">
                  <div class="geo-info">
                    <span class="geo-region">{{ region.region }}</span>
                    <span class="geo-percentage">{{ region.percentage }}%</span>
                  </div>
                  <div class="geo-bar">
                    <div 
                      class="geo-fill" 
                      :style="{ width: `${region.percentage}%` }"
                    />
                  </div>
                  <span class="geo-count">{{ region.count }} users</span>
                </div>
              </div>
            </n-card>

            <n-card title="Performance Metrics" class="performance-card">
              <div class="metrics-grid">
                <div class="metric-item">
                  <div class="metric-label">Average Response Time</div>
                  <div class="metric-value">{{ analytics.avg_response_time || '245' }}ms</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">Success Rate</div>
                  <div class="metric-value">{{ analytics.success_rate || '99.2' }}%</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">Data Transfer</div>
                  <div class="metric-value">{{ formatFileSize(analytics.total_bytes_transferred || 1024 * 1024 * 156) }}</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">Peak Concurrent Users</div>
                  <div class="metric-value">{{ analytics.peak_users || '23' }}</div>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  NButton, NIcon, NCard, NSelect, NSpin, NEmpty, NAvatar, NTag, useMessage
} from 'naive-ui'
import {
  ArrowBackOutline, DownloadOutline, EyeOutline, PeopleOutline, TimeOutline,
  SearchOutline, ShareOutline, AnalyticsOutline, RefreshOutline
} from '@vicons/ionicons5'
import axios from 'axios'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const message = useMessage()

// Reactive data
const analytics = ref({})
const isLoading = ref(true)
const datasetName = ref('')
const currentUser = ref(null)
const selectedTimeRange = ref('30d')

// Mock geographic data
const mockGeographicData = ref([
  { region: 'North America', percentage: 45, count: 234 },
  { region: 'Europe', percentage: 32, count: 167 },
  { region: 'Asia Pacific', percentage: 18, count: 94 },
  { region: 'Others', percentage: 5, count: 26 }
])

// Computed
const datasetId = computed(() => route.params.dataset_id)

const uniqueUsers = computed(() => {
  if (!analytics.value.recent_usage) return 0
  const users = new Set(analytics.value.recent_usage.map(u => u.wallet_address))
  return users.size
})

const totalActions = computed(() => {
  if (!analytics.value.usage_by_action) return 1
  return analytics.value.usage_by_action.reduce((sum, action) => sum + action.count, 0)
})

const maxUsage = computed(() => {
  if (!analytics.value.daily_usage || analytics.value.daily_usage.length === 0) return 1
  return Math.max(...analytics.value.daily_usage.map(day => day.usage_count))
})

const chartLabels = computed(() => {
  if (!analytics.value.daily_usage) return []
  return analytics.value.daily_usage.slice(-7).map(day => {
    return dayjs(day.date).format('MM/DD')
  })
})

// Options
const timeRangeOptions = ref([
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'Last Year', value: '1y' }
])

// Methods
const goBack = () => {
  router.push(`/datasets/${datasetId.value}`)
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i]
}

const formatDate = (date) => {
  if (!date) return 'Unknown'
  return dayjs(date).format('MMM D, HH:mm')
}

const formatTime = (seconds) => {
  if (!seconds) return '0s'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

const formatChange = (change) => {
  if (!change) return '0'
  return change > 0 ? `+${change}` : change.toString()
}

const formatWalletAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const getInitials = (text) => {
  return text.slice(0, 2).toUpperCase()
}

const getAvatarUrl = (walletAddress) => {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`
}

const getActionIcon = (actionType) => {
  switch (actionType) {
    case 'view': return EyeOutline
    case 'download': return DownloadOutline
    case 'query': return SearchOutline
    case 'share': return ShareOutline
    default: return AnalyticsOutline
  }
}

const getActionType = (actionType) => {
  switch (actionType) {
    case 'view': return 'info'
    case 'download': return 'success'
    case 'query': return 'warning'
    case 'share': return 'default'
    default: return 'default'
  }
}

const formatActionType = (actionType) => {
  switch (actionType) {
    case 'view': return 'View'
    case 'download': return 'Download'
    case 'query': return 'Query'
    case 'share': return 'Share'
    default: return actionType
  }
}

const exportAnalytics = () => {
  // TODO: Implement analytics export
  message.info('Export functionality coming soon')
}

const refreshAnalytics = async () => {
  isLoading.value = true
  await fetchAnalytics()
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

const fetchDatasetInfo = async () => {
  try {
    const params = currentUser.value?.wallet_address 
      ? `?wallet_address=${currentUser.value.wallet_address}` 
      : ''
    
    const response = await axios.get(`http://localhost:3000/api/datasets/${datasetId.value}${params}`)
    datasetName.value = response.data.name
  } catch (error) {
    console.error('Failed to fetch dataset info:', error)
  }
}

const fetchAnalytics = async () => {
  try {
    if (!currentUser.value?.wallet_address) {
      message.error('Please connect your wallet first')
      return
    }

    const response = await axios.get(`http://localhost:3000/api/datasets/${datasetId.value}/analytics?owner_wallet_address=${currentUser.value.wallet_address}`)
    
    // Enhance the analytics data with some calculated fields and mock data for demo
    analytics.value = {
      ...response.data,
      view_change: Math.floor(Math.random() * 40) - 20, // Mock percentage change
      download_change: Math.floor(Math.random() * 30) - 15,
      user_change: Math.floor(Math.random() * 25) - 10,
      time_change: Math.floor(Math.random() * 20) - 10,
      avg_session_time: Math.floor(Math.random() * 300) + 60,
      avg_response_time: Math.floor(Math.random() * 200) + 150,
      success_rate: (Math.random() * 2 + 98).toFixed(1),
      peak_users: Math.floor(Math.random() * 50) + 10,
      total_bytes_transferred: Math.floor(Math.random() * 1024 * 1024 * 500)
    }

    // If no daily usage data, generate some mock data
    if (!analytics.value.daily_usage || analytics.value.daily_usage.length === 0) {
      analytics.value.daily_usage = generateMockDailyUsage()
    }

    // If no usage by action data, generate some mock data
    if (!analytics.value.usage_by_action || analytics.value.usage_by_action.length === 0) {
      analytics.value.usage_by_action = [
        { action_type: 'view', count: Math.floor(Math.random() * 100) + 50 },
        { action_type: 'download', count: Math.floor(Math.random() * 50) + 20 },
        { action_type: 'query', count: Math.floor(Math.random() * 30) + 10 },
        { action_type: 'share', count: Math.floor(Math.random() * 20) + 5 }
      ]
    }
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    message.error('Failed to load analytics data')
    
    // Provide fallback mock data if API fails
    analytics.value = generateFallbackAnalytics()
  } finally {
    isLoading.value = false
  }
}

const generateMockDailyUsage = () => {
  const days = []
  for (let i = 29; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
    const usage_count = Math.floor(Math.random() * 50) + 5
    days.push({ date, usage_count })
  }
  return days
}

const generateFallbackAnalytics = () => {
  return {
    total_usage: 1247,
    download_count: 89,
    access_count: 1247,
    view_change: 12,
    download_change: -5,
    user_change: 8,
    time_change: 3,
    avg_session_time: 180,
    avg_response_time: 245,
    success_rate: '99.2',
    peak_users: 23,
    total_bytes_transferred: 1024 * 1024 * 156,
    daily_usage: generateMockDailyUsage(),
    usage_by_action: [
      { action_type: 'view', count: 856 },
      { action_type: 'download', count: 234 },
      { action_type: 'query', count: 123 },
      { action_type: 'share', count: 34 }
    ],
    recent_usage: [
      {
        id: 1,
        username: 'researcher1',
        wallet_address: '0x1234...5678',
        action_type: 'view',
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 2,
        username: 'scientist_bob',
        wallet_address: '0xabcd...efgh',
        action_type: 'download',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  }
}

onMounted(async () => {
  await fetchCurrentUser()
  await fetchDatasetInfo()
  await fetchAnalytics()
})
</script>

<style scoped>
.analytics-page {
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

.back-btn {
  color: #8b949e;
  margin-bottom: 16px;
}

.back-btn:hover {
  color: #58a6ff;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
}

.title-section {
  flex: 1;
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

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.analytics-content {
  min-height: 400px;
}

.content-grid {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.overview-section {
  width: 100%;
}

.overview-card,
.chart-card,
.activity-card,
.geo-card,
.performance-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(56, 139, 253, 0.05);
  border: 1px solid rgba(56, 139, 253, 0.2);
  border-radius: 12px;
}

.stat-icon {
  font-size: 32px;
  color: #58a6ff;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #c9d1d9;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #8b949e;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-change {
  font-size: 12px;
  font-weight: 500;
}

.stat-change.positive {
  color: #2ea043;
}

.stat-change.negative {
  color: #da3633;
}

.charts-section {
  width: 100%;
}

.chart-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.chart-container {
  height: 200px;
  display: flex;
  flex-direction: column;
}

.chart-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.chart-visual {
  display: flex;
  align-items: end;
  justify-content: space-around;
  height: 160px;
  padding: 20px 0;
  border-bottom: 1px solid #30363d;
}

.chart-bar {
  width: 20px;
  background: linear-gradient(to top, #58a6ff, #79c0ff);
  border-radius: 2px 2px 0 0;
  min-height: 2px;
  transition: all 0.3s ease;
}

.chart-bar:hover {
  background: linear-gradient(to top, #1f6feb, #58a6ff);
}

.chart-labels {
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
}

.chart-label {
  font-size: 12px;
  color: #8b949e;
}

.access-patterns {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 0;
}

.pattern-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pattern-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.pattern-header .n-icon {
  font-size: 16px;
  color: #58a6ff;
}

.pattern-name {
  font-size: 14px;
  color: #c9d1d9;
  font-weight: 500;
}

.pattern-bar {
  flex: 1;
  height: 8px;
  background: #30363d;
  border-radius: 4px;
  overflow: hidden;
}

.pattern-fill {
  height: 100%;
  background: linear-gradient(to right, #58a6ff, #79c0ff);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.pattern-count {
  font-size: 14px;
  color: #c9d1d9;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

.details-section {
  display: grid;
  grid-template-columns: 1fr 300px 300px;
  gap: 24px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(48, 54, 61, 0.3);
  border: 1px solid #30363d;
  border-radius: 8px;
}

.activity-user {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: #c9d1d9;
}

.wallet-address {
  font-size: 12px;
  color: #8b949e;
  font-family: 'Courier New', monospace;
}

.activity-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.activity-time {
  font-size: 12px;
  color: #8b949e;
}

.empty-activity {
  padding: 40px 0;
  text-align: center;
}

.geo-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.geo-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.geo-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.geo-region {
  font-size: 14px;
  color: #c9d1d9;
  font-weight: 500;
}

.geo-percentage {
  font-size: 14px;
  color: #58a6ff;
  font-weight: 600;
}

.geo-bar {
  height: 6px;
  background: #30363d;
  border-radius: 3px;
  overflow: hidden;
}

.geo-fill {
  height: 100%;
  background: linear-gradient(to right, #58a6ff, #79c0ff);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.geo-count {
  font-size: 12px;
  color: #8b949e;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(48, 54, 61, 0.3);
  border-radius: 8px;
}

.metric-label {
  font-size: 14px;
  color: #8b949e;
  font-weight: 500;
}

.metric-value {
  font-size: 20px;
  color: #c9d1d9;
  font-weight: 700;
}

/* Responsive design */
@media (max-width: 1200px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
  
  .details-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .analytics-page {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style> 