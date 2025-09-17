<template>
  <div class="permissions-page">
    <div class="page-header">
      <n-button text @click="goBack" class="back-btn">
        <template #icon>
          <n-icon :component="ArrowBackOutline" />
        </template>
        Back to Dataset
      </n-button>
      
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">Dataset Permissions</h1>
          <p class="page-description">
            Manage access permissions for "{{ datasetName }}"
          </p>
        </div>
        
        <n-button type="primary" @click="showGrantModal = true">
          <template #icon>
            <n-icon :component="PersonAddOutline" />
          </template>
          Grant Access
        </n-button>
      </div>
    </div>

    <div class="permissions-content">
      <n-spin :show="isLoading">
        <div class="content-grid">
          <!-- Current Permissions List -->
          <div class="permissions-list">
            <n-card title="Current Permissions" class="permissions-card">
              <div v-if="permissions.length === 0" class="empty-permissions">
                <n-empty description="No permissions granted yet">
                  <template #icon>
                    <n-icon :component="LockClosedOutline" size="48" />
                  </template>
                  <template #extra>
                    <n-button type="primary" @click="showGrantModal = true">
                      Grant First Permission
                    </n-button>
                  </template>
                </n-empty>
              </div>
              
              <div v-else class="permissions-grid">
                <div 
                  v-for="permission in permissions" 
                  :key="permission.id" 
                  class="permission-item"
                >
                  <div class="permission-user">
                    <n-avatar :src="getAvatarUrl(permission.wallet_address)" size="medium">
                      {{ getInitials(permission.username || permission.wallet_address) }}
                    </n-avatar>
                    <div class="user-info">
                      <h4 class="username">{{ permission.username || 'Anonymous User' }}</h4>
                      <p class="wallet-address">{{ formatWalletAddress(permission.wallet_address) }}</p>
                    </div>
                  </div>
                  
                  <div class="permission-details">
                    <n-tag :type="getPermissionType(permission.permission_type)" size="small">
                      <template #icon>
                        <n-icon :component="getPermissionIcon(permission.permission_type)" />
                      </template>
                      {{ formatPermissionType(permission.permission_type) }}
                    </n-tag>
                    
                    <div class="permission-meta">
                      <div class="meta-item">
                        <n-icon :component="CalendarOutline" />
                        <span>Granted {{ formatDate(permission.created_at) }}</span>
                      </div>
                      
                      <div v-if="permission.expires_at" class="meta-item">
                        <n-icon :component="TimeOutline" />
                        <span>Expires {{ formatDate(permission.expires_at) }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="permission-actions">
                    <n-dropdown :options="getPermissionActions(permission)" @select="handlePermissionAction($event, permission)">
                      <n-button text size="small">
                        <n-icon :component="EllipsisVerticalOutline" />
                      </n-button>
                    </n-dropdown>
                  </div>
                </div>
              </div>
            </n-card>
          </div>

          <!-- Permission Settings -->
          <div class="settings-panel">
            <n-card title="Access Settings" class="settings-card">
              <div class="setting-item">
                <div class="setting-header">
                  <h4>Default Permission Level</h4>
                  <p>Set the default access level for new permissions</p>
                </div>
                <n-select
                  v-model:value="defaultPermissionType"
                  :options="permissionTypeOptions"
                  @update:value="updateDefaultPermission"
                />
              </div>
              
              <div class="setting-item">
                <div class="setting-header">
                  <h4>Auto-Expire Permissions</h4>
                  <p>Automatically revoke permissions after a certain period</p>
                </div>
                <n-switch
                  v-model:value="autoExpireEnabled"
                  @update:value="toggleAutoExpire"
                />
              </div>
              
              <div v-if="autoExpireEnabled" class="setting-item">
                <div class="setting-header">
                  <h4>Default Expiration Period</h4>
                  <p>Default duration for new permissions</p>
                </div>
                <n-select
                  v-model:value="defaultExpirationPeriod"
                  :options="expirationOptions"
                  @update:value="updateDefaultExpiration"
                />
              </div>
            </n-card>

            <n-card title="Permission Statistics" class="stats-card">
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-icon">
                    <n-icon :component="PeopleOutline" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-number">{{ permissions.length }}</div>
                    <div class="stat-label">Total Permissions</div>
                  </div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-icon">
                    <n-icon :component="CheckmarkCircleOutline" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-number">{{ activePermissions }}</div>
                    <div class="stat-label">Active</div>
                  </div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-icon">
                    <n-icon :component="TimeOutline" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-number">{{ expiredPermissions }}</div>
                    <div class="stat-label">Expired</div>
                  </div>
                </div>
              </div>
            </n-card>
          </div>
        </div>
      </n-spin>
    </div>

    <!-- Grant Permission Modal -->
    <n-modal v-model:show="showGrantModal" preset="dialog" title="Grant Dataset Access">
      <template #header>
        <div class="modal-header">
          <n-icon :component="PersonAddOutline" />
          <span>Grant Dataset Access</span>
        </div>
      </template>
      
      <div class="grant-form">
        <n-form :model="grantForm" :rules="grantRules" ref="grantFormRef">
          <n-form-item label="User Wallet Address" path="target_wallet_address">
            <n-input
              v-model:value="grantForm.target_wallet_address"
              placeholder="0x..."
              @blur="validateWalletAddress"
            />
          </n-form-item>
          
          <n-form-item label="Permission Type" path="permission_type">
            <n-select
              v-model:value="grantForm.permission_type"
              :options="permissionTypeOptions"
              placeholder="Select permission level"
            />
          </n-form-item>
          
          <n-form-item label="Expiration (Optional)" path="expires_at">
            <n-date-picker
              v-model:value="grantForm.expires_at"
              type="datetime"
              placeholder="Select expiration date"
              clearable
              style="width: 100%"
            />
          </n-form-item>
          
          <n-form-item label="Access Conditions (Optional)" path="access_conditions">
            <n-input
              v-model:value="grantForm.access_conditions"
              type="textarea"
              placeholder="Additional conditions or notes"
              :rows="3"
            />
          </n-form-item>
        </n-form>
      </div>
      
      <template #action>
        <n-space>
          <n-button @click="showGrantModal = false">Cancel</n-button>
          <n-button type="primary" @click="grantPermission" :loading="isGranting">
            Grant Access
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  NButton, NIcon, NCard, NTag, NSpin, NEmpty, NAvatar, NDropdown, NSelect,
  NSwitch, NModal, NForm, NFormItem, NInput, NDatePicker, NSpace, useMessage
} from 'naive-ui'
import {
  ArrowBackOutline, PersonAddOutline, LockClosedOutline, CalendarOutline,
  TimeOutline, EllipsisVerticalOutline, PeopleOutline, CheckmarkCircleOutline,
  EyeOutline, CreateOutline, SettingsOutline, TrashOutline
} from '@vicons/ionicons5'
import axios from 'axios'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const message = useMessage()

// Reactive data
const permissions = ref([])
const isLoading = ref(true)
const isGranting = ref(false)
const showGrantModal = ref(false)
const datasetName = ref('')
const currentUser = ref(null)

// Settings
const defaultPermissionType = ref('read')
const autoExpireEnabled = ref(false)
const defaultExpirationPeriod = ref('30d')

// Form data
const grantForm = ref({
  target_wallet_address: '',
  permission_type: 'read',
  expires_at: null,
  access_conditions: ''
})

const grantFormRef = ref(null)

// Computed
const datasetId = computed(() => route.params.dataset_id)

const activePermissions = computed(() => {
  return permissions.value.filter(p => !p.expires_at || new Date(p.expires_at) > new Date()).length
})

const expiredPermissions = computed(() => {
  return permissions.value.filter(p => p.expires_at && new Date(p.expires_at) <= new Date()).length
})

// Form validation rules
const grantRules = {
  target_wallet_address: [
    { required: true, message: 'Wallet address is required', trigger: ['input', 'blur'] },
    { 
      pattern: /^0x[a-fA-F0-9]{40}$/, 
      message: 'Please enter a valid Ethereum wallet address', 
      trigger: ['input', 'blur'] 
    }
  ],
  permission_type: [
    { required: true, message: 'Permission type is required', trigger: ['change', 'blur'] }
  ]
}

// Options
const permissionTypeOptions = ref([
  { label: 'Read Only', value: 'read' },
  { label: 'Read & Write', value: 'write' },
  { label: 'Admin', value: 'admin' }
])

const expirationOptions = ref([
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '1 Year', value: '1y' }
])

// Methods
const goBack = () => {
  router.push(`/datasets/${datasetId.value}`)
}

const getAvatarUrl = (walletAddress) => {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`
}

const getInitials = (text) => {
  return text.slice(0, 2).toUpperCase()
}

const formatWalletAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatDate = (date) => {
  if (!date) return 'Never'
  return dayjs(date).format('MMM D, YYYY')
}

const getPermissionType = (type) => {
  switch (type) {
    case 'read': return 'info'
    case 'write': return 'warning' 
    case 'admin': return 'error'
    default: return 'default'
  }
}

const getPermissionIcon = (type) => {
  switch (type) {
    case 'read': return EyeOutline
    case 'write': return CreateOutline
    case 'admin': return SettingsOutline
    default: return EyeOutline
  }
}

const formatPermissionType = (type) => {
  switch (type) {
    case 'read': return 'Read Only'
    case 'write': return 'Read & Write'
    case 'admin': return 'Admin'
    default: return type
  }
}

const getPermissionActions = (permission) => [
  {
    label: 'Edit Permission',
    key: 'edit',
    icon: () => h(NIcon, { component: CreateOutline })
  },
  {
    type: 'divider'
  },
  {
    label: 'Revoke Access',
    key: 'revoke',
    icon: () => h(NIcon, { component: TrashOutline }),
    props: {
      style: 'color: #d03050'
    }
  }
]

const handlePermissionAction = (key, permission) => {
  switch (key) {
    case 'edit':
      // TODO: Implement edit permission functionality
      message.info('Edit permission functionality coming soon')
      break
    case 'revoke':
      revokePermission(permission)
      break
  }
}

const validateWalletAddress = () => {
  // Additional wallet validation logic can be added here
}

const grantPermission = async () => {
  try {
    await grantFormRef.value?.validate()
  } catch (error) {
    return
  }

  if (!currentUser.value?.wallet_address) {
    message.error('Please connect your wallet first')
    return
  }

  isGranting.value = true
  try {
    let expiresAt = null
    if (grantForm.value.expires_at) {
      expiresAt = dayjs(grantForm.value.expires_at).toISOString()
    }

    const response = await axios.post(`http://localhost:3000/api/datasets/${datasetId.value}/permissions`, {
      owner_wallet_address: currentUser.value.wallet_address,
      target_wallet_address: grantForm.value.target_wallet_address,
      permission_type: grantForm.value.permission_type,
      expires_at: expiresAt,
      access_conditions: grantForm.value.access_conditions || undefined
    })

    message.success('Permission granted successfully!')
    
    // Reset form and close modal
    grantForm.value = {
      target_wallet_address: '',
      permission_type: 'read',
      expires_at: null,
      access_conditions: ''
    }
    showGrantModal.value = false
    
    // Refresh permissions
    await fetchPermissions()
  } catch (error) {
    console.error('Failed to grant permission:', error)
    message.error(error.response?.data?.error || 'Failed to grant permission')
  } finally {
    isGranting.value = false
  }
}

const revokePermission = async (permission) => {
  if (!currentUser.value?.wallet_address) {
    message.error('Please connect your wallet first')
    return
  }

  try {
    await axios.delete(`http://localhost:3000/api/datasets/${datasetId.value}/permissions/${permission.id}`, {
      data: {
        owner_wallet_address: currentUser.value.wallet_address
      }
    })

    message.success('Permission revoked successfully!')
    
    // Refresh permissions
    await fetchPermissions()
  } catch (error) {
    console.error('Failed to revoke permission:', error)
    message.error(error.response?.data?.error || 'Failed to revoke permission')
  }
}

const updateDefaultPermission = (value) => {
  // TODO: Save default permission setting
  message.success('Default permission updated')
}

const toggleAutoExpire = (value) => {
  // TODO: Save auto-expire setting
  message.success(`Auto-expire ${value ? 'enabled' : 'disabled'}`)
}

const updateDefaultExpiration = (value) => {
  // TODO: Save default expiration setting
  message.success('Default expiration updated')
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

const fetchPermissions = async () => {
  try {
    if (!currentUser.value?.wallet_address) {
      message.error('Please connect your wallet first')
      return
    }

    const response = await axios.get(`http://localhost:3000/api/datasets/${datasetId.value}/permissions?owner_wallet_address=${currentUser.value.wallet_address}`)
    permissions.value = response.data
  } catch (error) {
    console.error('Failed to fetch permissions:', error)
    message.error('Failed to load permissions')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchCurrentUser()
  await fetchDatasetInfo()
  await fetchPermissions()
})
</script>

<style scoped>
.permissions-page {
  max-width: 1200px;
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

.permissions-content {
  min-height: 400px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
}

.permissions-list {
  display: flex;
  flex-direction: column;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.permissions-card,
.settings-card,
.stats-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.empty-permissions {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.permissions-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(48, 54, 61, 0.3);
  border: 1px solid #30363d;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.permission-item:hover {
  background: rgba(56, 139, 253, 0.05);
  border-color: rgba(56, 139, 253, 0.2);
}

.permission-user {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 4px 0;
}

.wallet-address {
  font-size: 14px;
  color: #8b949e;
  margin: 0;
  font-family: 'Courier New', monospace;
}

.permission-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.permission-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8b949e;
  font-size: 12px;
}

.meta-item .n-icon {
  font-size: 14px;
}

.permission-actions {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.permission-item:hover .permission-actions {
  opacity: 1;
}

.setting-item {
  margin-bottom: 24px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-header {
  margin-bottom: 12px;
}

.setting-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 4px 0;
}

.setting-header p {
  font-size: 14px;
  color: #8b949e;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(56, 139, 253, 0.05);
  border: 1px solid rgba(56, 139, 253, 0.2);
  border-radius: 8px;
}

.stat-icon {
  font-size: 20px;
  color: #58a6ff;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: #c9d1d9;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header .n-icon {
  font-size: 20px;
  color: #58a6ff;
}

.grant-form {
  padding: 16px 0;
}

/* Responsive design */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .settings-panel {
    order: -1;
  }
}

@media (max-width: 768px) {
  .permissions-page {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }
  
  .permission-item {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    text-align: left;
  }
  
  .permission-details {
    align-items: flex-start;
  }
  
  .permission-meta {
    align-items: flex-start;
  }
}
</style> 