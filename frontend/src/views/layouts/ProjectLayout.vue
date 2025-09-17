<template>
  <div class="project-layout">
    <!-- 移除重复的标题和面包屑 -->
    <div class="project-info" :class="{ 'collapsed': isInfoCollapsed }">
      <div class="section-header" @click="toggleInfo">
        <div class="header-content">
          <div class="project-meta">
            <n-tag :type="getStatusType(project.status)" size="small">{{ project.status }}</n-tag>
            <n-tag type="info" size="small">{{ project.visibility }}</n-tag>
            <n-tag type="info" size="small">{{ getCategoryLabel(project.category) }}</n-tag>
          </div>
        </div>
        <n-icon :component="isInfoCollapsed ? ChevronDown : ChevronUp" class="collapse-icon" />
      </div>
      <div class="section-content" v-show="!isInfoCollapsed">
        <p class="project-description">
          {{ project.description || 'No description provided.' }}
          <span class="more-details-link" @click="showEditModal = true">more details</span>
        </p>
      </div>
    </div>

    <div class="project-toolbar" :class="{ 'collapsed': isToolbarCollapsed }">
      <div class="section-header" @click="toggleToolbar">
        <div class="header-content">
          <div class="toolbar-left">
            <!-- 只保留 Current iteration -->
            <n-button type="primary" @click.stop="switchIteration('current')">
              <template #icon>
                <n-icon :component="ListOutline" />
              </template>
              Current iteration
            </n-button>

            <!-- 核心功能按钮 -->
            <n-button @click.stop="navigateTo('repository')">
              <template #icon>
                <n-icon :component="FolderOpenOutline" />
              </template>
              Repository
            </n-button>

            <n-dropdown trigger="click" :options="collaboratorsDropdownOptions" @select="handleCollaboratorsSelect">
              <n-button @click.stop="">
                <template #icon>
                  <n-icon :component="PeopleOutline" />
                </template>
                Collaborators
              </n-button>
            </n-dropdown>

            <n-button @click.stop="navigateTo('proofs')">
              <template #icon>
                <n-icon :component="ShieldCheckmarkOutline" />
              </template>
              Proofs
            </n-button>

            <n-button @click.stop="navigateTo('nft')">
              <template #icon>
                <n-icon :component="DiamondOutline" />
              </template>
              NFT
            </n-button>

            <n-button @click.stop="navigateTo('funding')">
              <template #icon>
                <n-icon :component="CardOutline" />
              </template>
              Funding
            </n-button>

            <n-button @click.stop="navigateTo('roadmap')">
              <template #icon>
                <n-icon :component="NavigateOutline" />
              </template>
              Roadmap
            </n-button>

            <n-button @click.stop="navigateTo('my-items')">
              <template #icon>
                <n-icon :component="PersonOutline" />
              </template>
              My items
            </n-button>
          </div>
        </div>
        <n-icon :component="isToolbarCollapsed ? ChevronDown : ChevronUp" class="collapse-icon" />
      </div>
    </div>

    <div class="project-main-content">
      <router-view />
    </div>

    <!-- 详情弹窗 -->
    <n-modal v-model:show="showEditModal" preset="card" style="width: 600px;">
      <template #header>
        <div class="modal-header">
          <h3>Project Details</h3>
        </div>
      </template>

      <!-- 查看模式 -->
      <div v-if="!isEditing" class="details-view">
        <div class="detail-item">
          <label>Description</label>
          <p>{{ project.description || 'No description provided.' }}</p>
        </div>
        <div class="detail-item">
          <label>Research Field</label>
          <p>{{ getCategoryLabel(project.category) }}</p>
        </div>
        <div class="detail-item">
          <label>Visibility</label>
          <p>{{ project.visibility }}</p>
        </div>
        <div class="detail-item">
          <label>Status</label>
          <p>{{ project.status }}</p>
        </div>
        <div class="edit-button-container">
          <n-button type="primary" @click="startEditing">Edit</n-button>
        </div>
      </div>

      <!-- 编辑模式 -->
      <n-form v-else>
        <n-form-item label="Description">
          <n-input v-model:value="editableProject.description" type="textarea" placeholder="Please Input"/>
        </n-form-item>
        <n-form-item label="Research Field">
          <n-select
            v-model:value="editableProject.category"
            :options="categoryOptions"
            placeholder="Select research field"
          />
        </n-form-item>
        <n-form-item label="Visibility">
          <n-radio-group v-model:value="editableProject.visibility">
            <n-radio value="Public">Public</n-radio>
            <n-radio value="Private">Private</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="Status">
          <n-select v-model:value="editableProject.status" :options="statusOptions" placeholder="Please Select" />
        </n-form-item>
      </n-form>

      <template #footer>
        <div v-if="isEditing" class="modal-footer">
          <n-button @click="cancelEdit">Cancel</n-button>
          <n-button type="primary" @click="saveChanges">Save Changes</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, provide, watch, h } from 'vue';
import { useRoute, useRouter, RouterView } from 'vue-router';
import { NButton, NIcon, NButtonGroup, NPopover, NAvatar, NBreadcrumb, NBreadcrumbItem, NTabs, NTabPane, NTag, NInput, NForm, NFormItem, NRadioGroup, NRadio, NSelect, NModal, NDropdown } from 'naive-ui';
import axios from 'axios';
import {
  ListOutline, PeopleOutline, FolderOpenOutline, ChevronDown, ChevronUp,
  DiamondOutline, CardOutline, NavigateOutline, ShieldCheckmarkOutline, PersonOutline
} from '@vicons/ionicons5';

const route = useRoute();
const router = useRouter();
const projectId = ref(route.params.projectId);
const project = ref({});
const collaborators = ref([]);
const showEditModal = ref(false);
const isEditing = ref(false);
const editableProject = ref({});

// Provide the project data to child components
provide('projectData', project);

const currentSubView = computed(() => {
  const routeName = route.name;
  const metaTitle = route.meta.title;
  if (metaTitle && metaTitle !== 'Iterations') {
    return metaTitle;
  }
  return '';
});

const categoryOptions = [
  { label: '生物医学', value: 'Biomedical' },
  { label: '人工智能', value: 'AI' },
  { label: '气候科学', value: 'Climate' },
  { label: '量子计算', value: 'Quantum' },
  { label: '材料科学', value: 'Materials' },
  { label: '神经科学', value: 'Neuroscience' },
  { label: '其他', value: 'Other' }
];

const statusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Under Review', value: 'Under Review' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Unknown', value: 'Unknown' }
];

const getCategoryLabel = (value) => {
  const option = categoryOptions.find(opt => opt.value === value);
  return option ? option.label : '其他';
};

const getStatusType = (status) => {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Under Review':
      return 'warning';
    case 'Completed':
      return 'info';
    case 'Unknown':
    default:
      return 'default';
  }
};

const fetchProjectDetails = async () => {
  try {
    const response = await axios.get(`http://localhost:3000/api/projects/${projectId.value}`);
    project.value = {
      ...response.data,
      status: response.data.status || 'Unknown'
    };
    editableProject.value = { ...project.value };
    collaborators.value = response.data.collaborators || [];
  } catch (error) {
    console.error('Failed to fetch project details:', error);
  }
};

const switchIteration = () => {
  // Current iteration is always active now
  console.log('Current iteration view');
};

const navigateTo = (path) => {
  const targetPath = `/projects/${projectId.value}/${path}`;
  console.log(`Navigating to: ${targetPath}`);
  router.push(targetPath);
};

// Collaborators dropdown options
const collaboratorsDropdownOptions = computed(() => {
  const options = [];
  
  // Add collaborators with avatars and names
  collaborators.value.forEach(collaborator => {
    options.push({
      key: `user-${collaborator.id}`,
      label: collaborator.username || collaborator.wallet_address,
      icon: () => h(NAvatar, { 
        size: 'small', 
        src: collaborator.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${collaborator.wallet_address}`,
        fallbackSrc: `https://api.dicebear.com/7.x/identicon/svg?seed=${collaborator.wallet_address}`
      }),
      disabled: true // Make user items non-clickable
    });
  });
  
  // Add separator and "More details" option
  if (options.length > 0) {
    options.push({
      key: 'divider',
      type: 'divider'
    });
  }
  
  options.push({
    key: 'more-details',
    label: 'More details',
    icon: () => h(NIcon, null, { default: () => h(PeopleOutline) })
  });
  
  return options;
});

const handleCollaboratorsSelect = (key) => {
  if (key === 'more-details') {
    navigateTo('collaborators');
  }
};

const startEditing = () => {
  editableProject.value = { ...project.value };
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  editableProject.value = { ...project.value };
};

const saveChanges = async () => {
  try {
    const updateData = {
      ...editableProject.value,
      status: editableProject.value.status || 'Unknown',
      visibility: editableProject.value.visibility || 'Private'
    };
    
    const response = await axios.put(`http://localhost:3000/api/projects/${projectId.value}`, updateData);
    project.value = {
      ...response.data,
      status: response.data.status || 'Unknown'
    };
    isEditing.value = false;
    showEditModal.value = false;
    console.log('Project updated successfully');
  } catch (error) {
    console.error('Failed to update project:', error);
  }
};

const isInfoCollapsed = ref(false);
const isToolbarCollapsed = ref(false);

const toggleInfo = () => {
  isInfoCollapsed.value = !isInfoCollapsed.value;
};

const toggleToolbar = () => {
  isToolbarCollapsed.value = !isToolbarCollapsed.value;
};

const disconnect = () => {
  // Add disconnect logic here
  router.push('/');
};



onMounted(() => {
  fetchProjectDetails();
});

// 当弹窗关闭时重置编辑状态
watch(showEditModal, (newValue) => {
  if (!newValue) {
    isEditing.value = false;
    editableProject.value = { ...project.value };
  }
});
</script>

<style scoped>
.project-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #0d1117;
}

.header {
  height: 64px;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #30363d;
  background-color: #0d1117;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #c9d1d9;
}

.breadcrumb-container {
  font-size: 18px; /* Adjusted for title size */
  font-weight: bold; /* Added for title emphasis */
}

.menu-icon {
  font-size: 20px;
  color: #8b949e;
}

.breadcrumb-link {
  color: #58a6ff;
  cursor: pointer;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #8b949e;
}

.breadcrumb-text {
  font-size: 18px; /* Adjusted for title size */
  font-weight: bold; /* Added for title emphasis */
}

.project-main-content {
  flex-grow: 1;
  padding: 0 24px;
}

.project-content-outlet {
  flex-grow: 1;
  overflow-y: auto;
}

.project-info {
  border-bottom: 1px solid #30363d;
  background-color: #161b22;
}

.project-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.project-description {
  color: #c9d1d9;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.project-toolbar {
  border-bottom: 1px solid #30363d;
  background-color: #161b22;
}

.toolbar-left, .toolbar-right {
  display: flex;
  gap: 8px;
}

:deep(.n-button) {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #c9d1d9;
  background-color: #21262d;
  border-color: #30363d;
}

:deep(.n-button:hover) {
  background-color: #30363d;
  border-color: #6e7681;
}

:deep(.n-button.n-button--primary-type) {
  background-color: #1f6feb;
  border-color: #1f6feb;
  color: #ffffff;
}

:deep(.n-button.n-button--primary-type:hover) {
  background-color: #388bfd;
  border-color: #388bfd;
}

.modal-header {
  margin-bottom: 20px;
}

/* Collaborators dropdown styles */
:deep(.n-dropdown-menu) {
  max-height: 300px;
  overflow-y: auto;
}

:deep(.n-dropdown-option) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.n-dropdown-option .n-avatar) {
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  color: #c9d1d9;
  font-size: 18px;
  text-align: center;
}

.details-view {
  padding: 8px 0;
}

.details-view .detail-item {
  margin-bottom: 20px;
}

.details-view .detail-item:last-child {
  margin-bottom: 0;
}

.details-view .detail-item label {
  display: block;
  color: #8b949e;
  font-size: 12px;
  margin-bottom: 4px;
}

.details-view .detail-item p {
  color: #c9d1d9;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.edit-button-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.more-details-link {
  color: #8b949e;
  cursor: pointer;
  margin-left: 8px;
}

.more-details-link:hover {
  text-decoration: underline;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 16px;
}

.section-header:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

.header-content {
  flex: 1;
}

.collapse-icon {
  font-size: 20px;
  color: #8b949e;
  transition: transform 0.3s;
}

.collapsed .collapse-icon {
  transform: rotate(180deg);
}

.section-content {
  padding: 0 16px 16px;
}


</style> 