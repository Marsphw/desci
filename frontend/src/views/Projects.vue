<template>
  <div class="projects-page">
    <!-- 统计栏 -->
    <div class="stats-bar">
      <div class="stat-group total-group">
        <div class="stat-item total">
          <span class="stat-value total">{{ projects.length }}</span>
          <span class="stat-label">Total Projects</span>
        </div>
      </div>
      <div class="stat-group status-group">
        <div class="stat-item">
          <span class="stat-value success">{{ getStatusCount('Active') }}</span>
          <span class="stat-label">Active</span>
        </div>
        <div class="stat-item">
          <span class="stat-value warning">{{ getStatusCount('Under Review') }}</span>
          <span class="stat-label">Under Review</span>
        </div>
        <div class="stat-item">
          <span class="stat-value info">{{ getStatusCount('Completed') }}</span>
          <span class="stat-label">Completed</span>
        </div>
        <div class="stat-item">
          <span class="stat-value default">{{ getStatusCount('Unknown') }}</span>
          <span class="stat-label">Unknown</span>
        </div>
      </div>
    </div>

    <div class="projects-header">
      <n-input placeholder="Search projects..." clearable class="search-bar" />
      <n-button type="primary" class="new-project-btn" @click="showCreateModal = true">New project</n-button>
    </div>

    <div class="project-list">
      <n-card v-if="isLoading" class="project-item">Loading projects...</n-card>
      <n-card v-else-if="projects.length === 0" class="project-item">No projects found.</n-card>
      <n-card v-for="project in projects" :key="project.id" class="project-item" @click="goToProject(project)">
        <div class="project-info">
          <div class="project-header">
            <h3 class="project-name">{{ project.name }}</h3>
            <n-tag :type="getStatusType(project.status)" size="small">{{ project.status }}</n-tag>
          </div>
          <div class="project-meta">
            <div class="meta-item">
              <n-icon :component="PersonOutline" />
              <span>{{ project.owner_username || '@' + project.owner_wallet_address?.slice(2, 8) }}</span>
            </div>
            <div class="meta-item">
              <n-icon :component="TimeOutline" />
              <span>updated {{ project.updatedAt }}</span>
            </div>
          </div>
        </div>
      </n-card>
    </div>

    <!-- Create Project Modal -->
    <n-modal v-model:show="showCreateModal" preset="card" :style="{ width: '600px' }" title="Create a new project">
      <n-form @submit.prevent="handleCreateProject">
        <n-form-item label="Project name" required>
          <n-input v-model:value="newProject.name" placeholder="My awesome research" />
        </n-form-item>
        <n-form-item label="Description (optional)">
          <n-input v-model:value="newProject.description" type="textarea" placeholder="A short description of your project." />
        </n-form-item>
        <n-form-item label="Visibility">
          <n-radio-group v-model:value="newProject.visibility" name="visibility">
            <n-radio value="Private">Private</n-radio>
            <n-radio value="Public">Public</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="Initial Status">
            <n-select v-model:value="newProject.status" :options="statusOptions" />
        </n-form-item>
        <n-form-item label="Research Field">
          <n-select
            v-model:value="newProject.category"
            :options="categoryOptions"
            placeholder="Select research field"
          />
        </n-form-item>
        <n-button type="primary" attr-type="submit" :loading="isCreating">Create project</n-button>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { NInput, NButton, NIcon, NCard, NTag, NModal, NForm, NFormItem, NRadioGroup, NRadio, useMessage, NSelect } from 'naive-ui';
import { PersonOutline, TimeOutline } from '@vicons/ionicons5';
import { useRouter } from 'vue-router';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const router = useRouter();
const message = useMessage();

const projects = ref([]);
const isLoading = ref(true);
const user = ref(null);

const showCreateModal = ref(false);
const isCreating = ref(false);
const newProject = ref({
  name: '',
  description: '',
  status: 'Active',
  visibility: 'Private',
  category: 'Other',
  start_date: new Date().toISOString()
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
];

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
    fetchProjects();
  } else {
    isLoading.value = false;
  }
});

const fetchProjects = async () => {
  try {
    const { data } = await axios.get(`http://localhost:3000/api/projects`, {
      params: {
        wallet_address: user.value.wallet_address
      }
    });
    projects.value = data.map(p => ({
      ...p,
      owner: user.value.username || '@' + user.value.wallet_address.slice(2, 8),
      updatedAt: dayjs(p.updated_at).fromNow(),
      did: user.value.did
    }));
  } catch (error) {
    message.error('Failed to fetch projects.');
  } finally {
    isLoading.value = false;
  }
};

const handleCreateProject = async () => {
  isCreating.value = true;
  try {
    await axios.post('http://localhost:3000/api/projects', {
      ...newProject.value,
      creator_wallet_address: user.value.wallet_address,
    });
    showCreateModal.value = false;
    newProject.value = { name: '', description: '', visibility: 'Private', status: 'Active' };
    message.success('Project created successfully!');
    fetchProjects();
  } catch (error) {
    message.error(error.response?.data?.error || 'Failed to create project.');
  } finally {
    isCreating.value = false;
  }
};

const sortOptions = [
  { label: 'Sort by name', key: 'name' },
  { label: 'Sort by date', key: 'date' },
];

const projectActions = [
  { label: 'Rename', key: 'rename' },
  { label: 'Delete', key: 'delete' },
];

const goToProject = (project) => {
  router.push(`/projects/${project.id}`);
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

// 计算各状态项目数量
const getStatusCount = (status) => {
  return projects.value.filter(project => project.status === status).length;
};
</script>

<style scoped>
.projects-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.search-bar {
  max-width: 400px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.project-name {
  margin: 0;
  font-size: 16px;
  color: #c9d1d9;
}

.project-meta {
  display: flex;
  gap: 16px;
  color: #8b949e;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item .n-icon {
  font-size: 16px;
}

.stats-bar {
  display: flex;
  margin-bottom: 32px;
  background-color: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  overflow: hidden;
}

.stat-group {
  display: flex;
}

.total-group {
  width: 200px;
  border-right: 1px solid #30363d;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-item.total {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
}

.stat-value.total {
  color: #ffffff;
  font-size: 48px;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 8px;
}

.total .stat-label {
  font-weight: 500;
  font-size: 16px;
  color: #8b949e;
  text-align: center;
}

.status-group {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  position: relative;
}

.status-group .stat-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  height: 60%;
  width: 1px;
  background-color: #30363d;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-value.success {
  color: #3fb950;
}

.stat-value.warning {
  color: #d29922;
}

.stat-value.info {
  color: #58a6ff;
}

.stat-value.default {
  color: #8b949e;
}
</style> 