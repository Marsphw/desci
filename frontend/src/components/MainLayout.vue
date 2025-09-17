<template>
  <n-layout has-sider class="main-layout">
    <!-- Sidebar -->
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      show-trigger
      :collapsed="isCollapsed"
      @update:collapsed="isCollapsed = $event"
    >
      <div class="logo-container" @click="goToHome">
        <span v-if="!isCollapsed">DeSci-Proof</span>
        <span v-else>DS</span>
      </div>
      <div class="user-info-container">
        <n-avatar round size="large" class="user-avatar">
          {{ user?.username?.charAt(0) || 'U' }}
        </n-avatar>
        <div v-if="!isCollapsed" class="user-details">
          <span class="user-name">{{ user?.username || 'Anonymous' }}</span>
        </div>
      </div>
      <n-menu
        :options="menuOptions"
        :value="activeMenu"
        @update:value="handleMenuSelect"
      />
    </n-layout-sider>

    <!-- Main Content Area -->
    <n-layout>
      <!-- Header -->
      <n-layout-header bordered class="header">
        <div class="header-left">
          <!-- Removed the sidebar toggle icon -->
          <div v-if="isProjectPage" class="breadcrumb-container">
            <span class="breadcrumb-link" @click="router.push('/projects')">projects</span>
            <span class="breadcrumb-separator"> > </span>
            <span 
              :class="subPageTitle ? 'breadcrumb-link' : 'breadcrumb-text'"
              @click="subPageTitle ? navigateToProject() : null"
            >
              {{ projectName || 'Loading...' }}
            </span>
            <template v-if="subPageTitle">
              <span class="breadcrumb-separator"> > </span>
              <span class="breadcrumb-text">{{ subPageTitle }}</span>
            </template>
          </div>
          <div v-else-if="isExploreProjectPage" class="breadcrumb-container">
            <span class="breadcrumb-link" @click="router.push('/explore')">explore</span>
            <span class="breadcrumb-separator"> > </span>
            <span class="breadcrumb-text">{{ projectName || 'Loading...' }}</span>
          </div>
          <div v-else-if="isPublicProfilePage" class="breadcrumb-container">
            <span class="breadcrumb-link" @click="router.push('/explore')">explore</span>
            <span class="breadcrumb-separator"> > </span>
            <span class="breadcrumb-text">{{ profileUserName }}</span>
          </div>
          <div v-else-if="isDatasetPage" class="breadcrumb-container">
            <span class="breadcrumb-link" @click="router.push('/datasets')">datasets</span>
            <template v-if="route.params.dataset_id">
              <span class="breadcrumb-separator"> > </span>
              <span 
                :class="datasetSubPageTitle ? 'breadcrumb-link' : 'breadcrumb-text'"
                @click="datasetSubPageTitle ? router.push(`/datasets/${route.params.dataset_id}`) : null"
              >
                {{ datasetName }}
              </span>
              <template v-if="datasetSubPageTitle">
                <span class="breadcrumb-separator"> > </span>
                <span class="breadcrumb-text">{{ datasetSubPageTitle }}</span>
              </template>
            </template>
            <template v-else-if="route.query.dataset_id && route.name === 'PrivateQuery'">
              <span class="breadcrumb-separator"> > </span>
              <span 
                class="breadcrumb-link"
                @click="router.push(`/datasets/${route.query.dataset_id}`)"
              >
                {{ datasetName }}
              </span>
              <span class="breadcrumb-separator"> > </span>
              <span class="breadcrumb-text">private query</span>
            </template>
            <template v-else-if="route.name === 'DatasetUpload'">
              <span class="breadcrumb-separator"> > </span>
              <span class="breadcrumb-text">Upload Dataset</span>
            </template>
          </div>
          <div v-else-if="isProofPage" class="breadcrumb-container">
            <template v-if="route.name === 'Proof'">
              <span class="breadcrumb-text">Proofs</span>
            </template>
            <template v-else>
              <span class="breadcrumb-link" @click="router.push('/proof')">proof</span>
              <template v-if="route.params.dataset_id">
                <span class="breadcrumb-separator"> > </span>
                <span 
                  :class="proofSubPageTitle ? 'breadcrumb-link' : 'breadcrumb-text'"
                  @click="proofSubPageTitle ? router.push(`/proof/details/${route.params.dataset_id}`) : null"
                >
                  {{ datasetName }}
                </span>
                <template v-if="proofSubPageTitle">
                  <span class="breadcrumb-separator"> > </span>
                  <span class="breadcrumb-text">{{ proofSubPageTitle }}</span>
                </template>
              </template>
              <template v-else-if="route.name === 'ProofGenerate'">
                <span class="breadcrumb-separator"> > </span>
                <span class="breadcrumb-text">Generate ZK Proof</span>
              </template>
            </template>
          </div>
          <div v-else class="page-title">
            {{ route.name.charAt(0).toUpperCase() + route.name.slice(1) }}
          </div>
        </div>
        <div class="header-actions">
          <n-button @click="disconnect" type="error" ghost>
            <template #icon>
              <n-icon :component="LogOutOutline" />
            </template>
            Disconnect
          </n-button>
        </div>
      </n-layout-header>

      <!-- Content -->
      <n-layout-content class="content">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup>
import { h, ref, computed, onMounted, inject, watch } from 'vue';
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NAvatar, NButton, NIcon } from 'naive-ui';
import { HomeOutline, PersonOutline, FolderOpenOutline, DocumentTextOutline, SettingsOutline, LogOutOutline, MenuOutline, CompassOutline, ServerOutline, ShieldCheckmarkOutline, DiamondOutline, CheckmarkDoneOutline } from '@vicons/ionicons5';
import { useRouter, useRoute } from 'vue-router';
import { useWeb3 } from '../composables/useWeb3';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const { disconnectWallet } = useWeb3();

const isCollapsed = ref(false);
const user = ref(null);
const projectData = ref({});

function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions = [
  {
    label: 'Dashboard',
    key: 'dashboard',
    icon: renderIcon(HomeOutline),
  },
  {
    label: 'Profile',
    key: 'profile',
    icon: renderIcon(PersonOutline),
  },
  {
    label: 'Projects',
    key: 'projects',
    icon: renderIcon(FolderOpenOutline),
  },
  {
    label: 'Datasets',
    key: 'datasets',
    icon: renderIcon(ServerOutline),
  },
  {
    label: 'Proof',
    key: 'proof',
    icon: renderIcon(ShieldCheckmarkOutline),
  },
  {
    label: 'Publications',
    key: 'publications',
    icon: renderIcon(DocumentTextOutline),
  },
  {
    label: 'Settings',
    key: 'settings',
    icon: renderIcon(SettingsOutline),
  },
  {
    label: 'Explore',
    key: 'explore',
    icon: renderIcon(CompassOutline),
  },
  {
    label: 'NFTs',
    key: 'nfts',
    icon: renderIcon(DiamondOutline),
  },
  {
    label: 'Reviews',
    key: 'reviews',
    icon: renderIcon(CheckmarkDoneOutline),
  },
];

const activeMenu = computed(() => {
  const routeName = route.name?.toLowerCase();
  
  // Special handling for dataset routes
  if (routeName?.includes('dataset') || routeName === 'privatequery') {
    return 'datasets';
  }
  
  // Special handling for proof routes
  if (routeName === 'proof' || routeName === 'proofgenerate' || routeName === 'proofdetails') {
    return 'proof';
  }
  
  return routeName;
});

// Computed properties for project page breadcrumb navigation
const isProjectPage = computed(() => {
  const projectRoutes = ['ProjectDetail', 'ProjectRepository', 'ProjectCollaborators', 'ProjectProof', 'ProjectFunding', 'ProjectNFT', 'ProjectMyItems', 'ProjectRoadmap'];
  return projectRoutes.includes(route.name);
});

const isExploreProjectPage = computed(() => {
  return route.name === 'ExploreProjectDetail';
});

const isPublicProfilePage = computed(() => {
  return route.name === 'PublicProfile';
});

const isDatasetPage = computed(() => {
  const datasetRoutes = ['DatasetDetail', 'DatasetUpload', 'DatasetPermissions', 'DatasetAnalytics', 'PrivateQuery'];
  return datasetRoutes.includes(route.name);
});

const isProofPage = computed(() => {
  const proofRoutes = ['Proof', 'ProofGenerate', 'ProofDetails'];
  return proofRoutes.includes(route.name);
});

const profileUserName = computed(() => {
  return route.params.userIdentifier || 'User Profile';
});

const projectName = computed(() => {
  // Use the project name from fetched data if available, otherwise fall back to project ID
  return projectData.value?.name || route.params.projectId || 'Loading...';
});

const subPageTitle = computed(() => {
  if (route.name === 'ProjectDetail') return null;
  return route.meta?.title || null;
});

const datasetName = computed(() => {
  // Use the dataset name from fetched data if available, otherwise fall back to dataset ID
  return projectData.value?.name || route.params.dataset_id || 'Loading...';
});

const datasetSubPageTitle = computed(() => {
  if (route.name === 'DatasetDetail') return null;
  return route.meta?.title || null;
});

const proofSubPageTitle = computed(() => {
  if (route.name === 'ProofDetails') return null;
  return route.meta?.title || null;
});

function handleMenuSelect(key) {
  if (key === 'profile') {
    router.push('/profile');
  } else if (key === 'datasets') {
    router.push('/datasets');
  } else if (key === 'proof') {
    router.push('/proof');
  } else {
    router.push(`/${key}`);
  }
}

function goToHome() {
  router.push('/');
}

function navigateToProject() {
  if (projectData.value?.id) {
    router.push(`/projects/${projectData.value.id}`);
  }
}

function disconnect() {
  disconnectWallet();
  localStorage.removeItem('user');
  router.push('/');
}

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  }
});

// Fetch project data when on project pages
const fetchProjectData = async (projectId) => {
  if (!projectId) return;
  
  try {
    const response = await axios.get(`http://localhost:3000/api/projects/${projectId}`);
    projectData.value = response.data;
  } catch (error) {
    console.error('Failed to fetch project data for breadcrumb:', error);
    projectData.value = {};
  }
};

// Fetch dataset data when on dataset pages
const fetchDatasetData = async (datasetId) => {
  if (!datasetId) return;
  
  try {
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    const params = user?.wallet_address ? `?wallet_address=${user.wallet_address}` : '';
    
    const response = await axios.get(`http://localhost:3000/api/datasets/${datasetId}${params}`);
    projectData.value = response.data; // Reusing projectData for dataset info
  } catch (error) {
    console.error('Failed to fetch dataset data for breadcrumb:', error);
    projectData.value = {};
  }
};

// Watch for route changes to fetch project data
watch(
  [() => route.params.projectId, isProjectPage, isExploreProjectPage],
  ([newProjectId, isProject, isExploreProject]) => {
    if ((isProject || isExploreProject) && newProjectId) {
      fetchProjectData(newProjectId);
    } else {
      projectData.value = {};
    }
  },
  { immediate: true }
);

// Watch for route changes to fetch dataset data
watch(
  [() => route.params.dataset_id, () => route.query.dataset_id, isDatasetPage, isProofPage],
  ([newDatasetId, queryDatasetId, isDataset, isProof]) => {
    const datasetId = newDatasetId || queryDatasetId;
    if ((isDataset || isProof) && datasetId) {
      fetchDatasetData(datasetId);
    } else if (!isProjectPage.value && !isExploreProjectPage.value) {
      // Only clear data if we're not on project or proof pages
      projectData.value = {};
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  color: #fff;
}

.user-info-container {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-bottom: 1px solid #2d2d2d;
  margin-bottom: 10px;
}

.user-avatar {
  margin-bottom: 10px;
}

.user-name {
  color: #fff;
  font-weight: 500;
}

.header {
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 1.75rem !important;
  font-weight: 600 !important;
  margin: 0;
}

.breadcrumb-container {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.75rem !important;
  font-weight: 600 !important;
  margin: 0;
}

.breadcrumb-link {
  color: #58a6ff;
  cursor: pointer;
  font-size: 1.75rem !important;
  font-weight: 600 !important;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #8b949e;
  font-size: 1.75rem !important;
  font-weight: 600 !important;
}

.breadcrumb-text {
  color: #c9d1d9;
  font-size: 1.75rem !important;
  font-weight: 600 !important;
}

.header-actions {
  display: flex;
  align-items: center;
}

.content {
  padding: 24px;
  background-color: #101014;
}
</style> 