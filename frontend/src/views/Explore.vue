<template>
  <div class="explore-page">
    <div class="explore-header">
      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <n-tabs v-model:value="activeTab" @update:value="onTabChange" type="line" size="large">
          <n-tab-pane name="all" tab="All">
            <template #tab>
              <n-icon :component="GlobeOutline" />
              All
            </template>
          </n-tab-pane>
          <n-tab-pane name="projects" tab="Projects">
            <template #tab>
              <n-icon :component="LayersOutline" />
              Projects
            </template>
          </n-tab-pane>
          <n-tab-pane name="datasets" tab="Datasets">
            <template #tab>
              <n-icon :component="DocumentTextOutline" />
              Datasets
            </template>
          </n-tab-pane>
          <n-tab-pane name="publications" tab="Publications">
            <template #tab>
              <n-icon :component="BookOutline" />
              Publications
            </template>
          </n-tab-pane>
        </n-tabs>
      </div>
      
      <div class="search-controls">
        <n-input 
          v-model:value="searchQuery" 
          :placeholder="getSearchPlaceholder()" 
          clearable 
          class="search-bar"
          @input="onSearchChange"
        />
      </div>
      
      <div class="filters-section">
        <div class="filter-group">
          <n-select
            v-model:value="selectedCategory"
            placeholder="Category"
            :options="getCategoryOptions()"
            clearable
            style="width: 180px"
            @update:value="applyFilters"
          />
          <n-select
            v-if="activeTab !== 'datasets'"
            v-model:value="selectedStatus"
            placeholder="Status"
            :options="statusOptions"
            clearable
            style="width: 150px"
            @update:value="applyFilters"
          />
          <n-button 
            v-if="hasActiveFilters" 
            text 
            @click="clearFilters"
            class="clear-filters"
          >
            Clear Filters
          </n-button>
        </div>
      </div>
    </div>

    <div class="content-grid" ref="contentGrid">
      <!-- Loading State -->
      <n-card v-if="isLoading" class="loading-card">
        <n-spin size="large">
          <div class="loading-text">Loading {{ activeTab }}...</div>
        </n-spin>
      </n-card>
      
      <!-- Empty State -->
      <n-card v-else-if="displayItems.length === 0" class="empty-card">
        <div class="empty-content">
          <n-icon :component="getEmptyIcon()" class="empty-icon" />
          <div class="empty-text">No {{ activeTab }} found</div>
          <div class="empty-description">Try adjusting your search or filters</div>
        </div>
      </n-card>
      
      <!-- Content Cards -->
      <n-card
        v-for="item in displayItems"
        :key="`${item.type}-${item.id}`"
        :class="getCardClass(item.type)"
        :bordered="false"
        @click="goToItem(item)"
      >
        <!-- Project Card Content -->
        <template v-if="item.type === 'project'">
          <div class="card-header">
            <div class="category-tag">{{ item.category || 'Other' }}</div>
            <n-tag :type="getStatusType(item.status)" round size="small">
              <template #icon>
                <n-icon :component="TimeOutline" />
              </template>
              {{ item.status }}
            </n-tag>
          </div>

          <h2 class="item-title">{{ item.name }}</h2>
          <div class="item-subtitle">Led by {{ item.owner }}</div>
          
          <p class="item-description">{{ item.description || 'No description provided.' }}</p>

          <div class="item-info">
            <div class="info-row">
              <div class="info-label">Started:</div>
              <div class="info-value">{{ formatDate(item.startDate) }}</div>
            </div>
            
            <div class="stats-list">
              <div class="stat-row">
                <div class="stat-label">Funding:</div>
                <div class="stat-value">{{ item.funding || 'None' }}</div>
              </div>
              <div class="stat-row">
                <div class="stat-label">Proofs:</div>
                <div class="stat-value">{{ item.proofs_count || 0 }} submitted</div>
              </div>
              <div class="stat-row">
                <div class="stat-label">NFTs:</div>
                <div class="stat-value">{{ item.nfts_count || 0 }} minted</div>
              </div>
            </div>
          </div>

          <div class="view-action">
            <n-button
              type="primary"
              block
              class="view-button"
              @click.stop="goToItem(item)"
            >
              View Project
              <template #icon>
                <n-icon :component="ArrowForwardOutline" />
              </template>
            </n-button>
          </div>
        </template>

        <!-- Dataset Card Content -->
        <template v-if="item.type === 'dataset'">
          <div class="card-header">
            <div class="category-tag">{{ item.category || 'Other' }}</div>
            <n-tag :type="getPrivacyType(item.privacy_level)" round size="small">
              <template #icon>
                <n-icon :component="getPrivacyIcon(item.privacy_level)" />
              </template>
              {{ getPrivacyLabel(item.privacy_level) }}
            </n-tag>
          </div>

          <h2 class="item-title">{{ item.name }}</h2>
          <div class="item-subtitle">By {{ item.owner_username || 'Unknown' }}</div>
          
          <p class="item-description">{{ item.description || 'No description provided.' }}</p>

          <div class="item-info">
            <div class="info-row">
              <div class="info-label">Created:</div>
              <div class="info-value">{{ formatDate(item.created_at) }}</div>
            </div>
            
            <div class="stats-list">
              <div class="stat-row">
                <div class="stat-label">Size:</div>
                <div class="stat-value">{{ formatFileSize(item.file_size) }}</div>
              </div>
              <div class="stat-row">
                <div class="stat-label">Type:</div>
                <div class="stat-value">{{ item.file_type || 'Unknown' }}</div>
              </div>
              <div class="stat-row">
                <div class="stat-label">Downloads:</div>
                <div class="stat-value">{{ item.download_count || 0 }}</div>
              </div>
            </div>
          </div>

          <div class="view-action">
            <n-button
              type="primary"
              block
              class="view-button"
              @click.stop="goToItem(item)"
            >
              View Dataset
              <template #icon>
                <n-icon :component="ArrowForwardOutline" />
              </template>
            </n-button>
          </div>
        </template>

        <!-- Publication Card Content (Placeholder) -->
        <template v-if="item.type === 'publication'">
          <div class="card-header">
            <div class="category-tag">{{ item.category || 'Research' }}</div>
            <n-tag type="info" round size="small">
              <template #icon>
                <n-icon :component="BookOutline" />
              </template>
              Publication
            </n-tag>
          </div>

          <h2 class="item-title">{{ item.title }}</h2>
          <div class="item-subtitle">By {{ item.authors }}</div>
          
          <p class="item-description">{{ item.abstract || 'No abstract provided.' }}</p>

          <div class="item-info">
            <div class="info-row">
              <div class="info-label">Published:</div>
              <div class="info-value">{{ formatDate(item.published_date) }}</div>
            </div>
            
            <div class="stats-list">
              <div class="stat-row">
                <div class="stat-label">Journal:</div>
                <div class="stat-value">{{ item.journal || 'Unknown' }}</div>
              </div>
              <div class="stat-row">
                <div class="stat-label">Citations:</div>
                <div class="stat-value">{{ item.citations || 0 }}</div>
              </div>
            </div>
          </div>

          <div class="view-action">
            <n-button
              type="primary"
              block
              class="view-button"
              @click.stop="goToItem(item)"
            >
              View Publication
              <template #icon>
                <n-icon :component="ArrowForwardOutline" />
              </template>
            </n-button>
          </div>
        </template>
      </n-card>
      
      <!-- Loading More State -->
      <div v-if="!isLoading && displayItems.length > 0 && isLoadingMore" class="loading-more-section">
        <div class="loading-more-content">
          <n-spin size="small" />
          <div class="loading-more-text">Loading more...</div>
        </div>
      </div>
      
      <!-- End of Results -->
      <div v-if="!isLoading && !hasMoreData && displayItems.length > 0" class="end-section">
        <div class="end-line"></div>
        <div class="end-content">
          <div class="end-text">That's all for now</div>
          <div class="end-description">No more {{ activeTab }} to show</div>
        </div>
        <div class="end-line"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { 
  NInput, NCard, NTag, NIcon, NButton, NSelect, NTabs, NTabPane, NSpin, useMessage 
} from 'naive-ui';
import { 
  TimeOutline, ArrowForwardOutline, CashOutline,
  ShieldCheckmarkOutline, DiamondOutline, GlobeOutline, LockClosedOutline,
  LayersOutline, DocumentTextOutline, BookOutline, SearchOutline,
  FolderOutline, GridOutline
} from '@vicons/ionicons5';
import { useRouter } from 'vue-router';
import axios from 'axios';
import dayjs from 'dayjs';

const router = useRouter();
const message = useMessage();

// Tab management
const activeTab = ref('all');

// Refs for scroll listening
const contentGrid = ref(null);

// Data arrays
const projects = ref([]);
const datasets = ref([]);
const publications = ref([]);
const allProjects = ref([]);
const allDatasets = ref([]);
const allPublications = ref([]);

const isLoading = ref(true);
const isLoadingMore = ref(false);
const hasMoreData = ref(true);

// Pagination state
const pagination = ref({
  projects: { offset: 0, limit: 20, hasMore: true },
  datasets: { offset: 0, limit: 20, hasMore: true },
  publications: { offset: 0, limit: 20, hasMore: true }
});

// Search and filter states
const searchQuery = ref('');
const selectedCategory = ref(null);
const selectedStatus = ref(null);

// User data
const currentUser = ref(null);

// Filter options
const projectCategoryOptions = ref([
  { label: 'DeFi', value: 'DeFi' },
  { label: 'Infrastructure', value: 'Infrastructure' },
  { label: 'Privacy', value: 'Privacy' },
  { label: 'DeSci', value: 'DeSci' },
  { label: 'Other', value: 'Other' }
]);

const datasetCategoryOptions = ref([
  { label: 'Research Data', value: 'Research' },
  { label: 'Healthcare', value: 'Healthcare' },
  { label: 'Finance', value: 'Finance' },
  { label: 'AI/ML', value: 'AI' },
  { label: 'IoT', value: 'IoT' },
  { label: 'Genomics', value: 'Genomics' },
  { label: 'Climate', value: 'Climate' },
  { label: 'Other', value: 'Other' }
]);

const publicationCategoryOptions = ref([
  { label: 'Computer Science', value: 'CS' },
  { label: 'Biology', value: 'Biology' },
  { label: 'Physics', value: 'Physics' },
  { label: 'Mathematics', value: 'Math' },
  { label: 'Chemistry', value: 'Chemistry' },
  { label: 'Medicine', value: 'Medicine' },
  { label: 'Other', value: 'Other' }
]);

const statusOptions = ref([
  { label: 'Active', value: 'Active' },
  { label: 'Under Review', value: 'Under Review' },
  { label: 'Completed', value: 'Completed' }
]);

const getStatusType = (status) => {
  switch (status) {
    case 'Active':
      return 'primary';
    case 'Under Review':
      return 'warning';
    case 'Completed':
      return 'success';
    case 'Unknown':
    default:
      return 'default';
  }
};

const getPrivacyType = (privacyLevel) => {
  switch (privacyLevel) {
    case 'public': return 'info';
    case 'private': return 'warning';
    case 'encrypted': return 'error';
    case 'zk_proof_protected': return 'success';
    default: return 'default';
  }
};

const getPrivacyIcon = (privacyLevel) => {
  switch (privacyLevel) {
    case 'public': return GlobeOutline;
    case 'private': return LockClosedOutline;
    case 'encrypted': return LockClosedOutline;
    case 'zk_proof_protected': return ShieldCheckmarkOutline;
    default: return GlobeOutline;
  }
};

const getPrivacyLabel = (privacyLevel) => {
  switch (privacyLevel) {
    case 'public': return 'Public';
    case 'private': return 'Private';
    case 'encrypted': return 'Encrypted';
    case 'zk_proof_protected': return 'ZK Protected';
    default: return 'Public';
  }
};

const formatDate = (date) => {
  if (!date) return 'Unknown';
  return dayjs(date).format('MMM D, YYYY');
};

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i];
};

// Computed properties
const hasActiveFilters = computed(() => {
  return selectedCategory.value || selectedStatus.value || searchQuery.value;
});

const displayItems = computed(() => {
  switch (activeTab.value) {
    case 'projects':
      return projects.value.map(p => ({ ...p, type: 'project' }));
    case 'datasets':
      return datasets.value.map(d => ({ ...d, type: 'dataset' }));
    case 'publications':
      return publications.value.map(p => ({ ...p, type: 'publication' }));
    case 'all':
    default:
      return [
        ...projects.value.map(p => ({ ...p, type: 'project' })),
        ...datasets.value.map(d => ({ ...d, type: 'dataset' })),
        ...publications.value.map(p => ({ ...p, type: 'publication' }))
      ];
  }
});

// Methods
const getSearchPlaceholder = () => {
  switch (activeTab.value) {
    case 'projects': return 'Search projects...';
    case 'datasets': return 'Search datasets...';
    case 'publications': return 'Search publications...';
    case 'all': 
    default: return 'Search all content...';
  }
};

const getCategoryOptions = () => {
  switch (activeTab.value) {
    case 'projects': return projectCategoryOptions.value;
    case 'datasets': return datasetCategoryOptions.value;
    case 'publications': return publicationCategoryOptions.value;
    case 'all':
    default: 
      return [
        ...projectCategoryOptions.value,
        ...datasetCategoryOptions.value.filter(opt => 
          !projectCategoryOptions.value.find(p => p.value === opt.value)
        ),
        ...publicationCategoryOptions.value.filter(opt => 
          !projectCategoryOptions.value.find(p => p.value === opt.value) &&
          !datasetCategoryOptions.value.find(d => d.value === opt.value)
        )
      ];
  }
};

const getEmptyIcon = () => {
  switch (activeTab.value) {
    case 'projects': return LayersOutline;
    case 'datasets': return DocumentTextOutline;
    case 'publications': return BookOutline;
    case 'all':
    default: return SearchOutline;
  }
};

const getCardClass = (type) => {
  return `content-card ${type}-card`;
};

const goToItem = (item) => {
  switch (item.type) {
    case 'project':
      router.push(`/explore/projects/${item.id}`);
      break;
    case 'dataset':
      router.push(`/explore/datasets/${item.id}`);
      break;
    case 'publication':
      // TODO: Add publication route when implemented
      message.info('Publication details coming soon');
      break;
  }
};

const onTabChange = (tab) => {
  activeTab.value = tab;
  clearFilters();
  resetPagination();
  fetchData();
};

const onSearchChange = () => {
  resetPagination();
  applyFilters();
};

const applyFilters = () => {
  // If no active filters, show recommendations
  if (!hasActiveFilters.value) {
    resetPagination();
    fetchRecommendations();
    return;
  }
  
  // Reset pagination when applying filters
  resetPagination();
  
  // Apply filters based on current tab
  switch (activeTab.value) {
    case 'projects':
      filterProjects();
      break;
    case 'datasets':
      filterDatasets();
      break;
    case 'publications':
      filterPublications();
      break;
    case 'all':
    default:
      filterProjects();
      filterDatasets();
      filterPublications();
      break;
  }
};

const filterProjects = () => {
  let filtered = [...allProjects.value];
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(project => 
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.owner?.toLowerCase().includes(query)
    );
  }
  
  // Category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(project => project.category === selectedCategory.value);
  }
  
  // Status filter
  if (selectedStatus.value) {
    filtered = filtered.filter(project => project.status === selectedStatus.value);
  }
  
  projects.value = filtered;
};

const filterDatasets = () => {
  let filtered = [...allDatasets.value];
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(dataset => 
      dataset.name.toLowerCase().includes(query) ||
      dataset.description?.toLowerCase().includes(query) ||
      dataset.owner_username?.toLowerCase().includes(query)
    );
  }
  
  // Category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(dataset => dataset.category === selectedCategory.value);
  }
  
  datasets.value = filtered;
};

const filterPublications = () => {
  let filtered = [...allPublications.value];
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(publication => 
      publication.title?.toLowerCase().includes(query) ||
      publication.abstract?.toLowerCase().includes(query) ||
      publication.authors?.toLowerCase().includes(query)
    );
  }
  
  // Category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(publication => publication.category === selectedCategory.value);
  }
  
  publications.value = filtered;
};

const clearFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = null;
  selectedStatus.value = null;
  // When clearing filters, go back to recommendations
  resetPagination();
  fetchRecommendations();
};

const fetchData = () => {
  switch (activeTab.value) {
    case 'projects':
      fetchRecommendations();
      break;
    case 'datasets':
      fetchDatasetRecommendations();
      break;
    case 'publications':
      fetchPublicationRecommendations();
      break;
    case 'all':
    default:
      fetchAllRecommendations();
      break;
  }
};

const fetchCurrentUser = async () => {
  try {
    const userData = localStorage.getItem('user');
    console.log('User data from localStorage:', userData);
    if (userData) {
      const user = JSON.parse(userData);
      console.log('Parsed user:', user);
      if (user.wallet_address) {
        const response = await axios.get(`http://localhost:3000/api/users/wallet/${user.wallet_address}`);
        currentUser.value = response.data;
        console.log('Current user set:', currentUser.value);
      }
    } else {
      console.log('No user data found in localStorage');
      currentUser.value = null;
    }
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    currentUser.value = null;
  }
};

const fetchPublicProjects = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/projects/explore/public');
    allProjects.value = response.data;
    // Don't set projects here - let fetchRecommendations handle initial display
  } catch (error) {
    console.error('Failed to fetch public projects:', error);
  }
};

const fetchPublicDatasets = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/datasets/explore');
    allDatasets.value = response.data;
  } catch (error) {
    console.error('Failed to fetch public datasets:', error);
  }
};

const fetchPublicPublications = async () => {
  try {
    // TODO: Implement when publications API is ready
    allPublications.value = [];
  } catch (error) {
    console.error('Failed to fetch public publications:', error);
  }
};

const fetchRecommendations = async () => {
  try {
    isLoading.value = true;
    // Reset data arrays
    projects.value = [];
    
    const endpoint = currentUser.value 
      ? `http://localhost:3000/api/projects/explore/recommendations?user_id=${currentUser.value.id}&limit=${pagination.value.projects.limit}&offset=0`
      : `http://localhost:3000/api/projects/explore/recommendations?limit=${pagination.value.projects.limit}&offset=0`;
    
    const response = await axios.get(endpoint);
    projects.value = response.data;
    
    // Update pagination state
    if (response.data.length < pagination.value.projects.limit) {
      pagination.value.projects.hasMore = false;
    }
  } catch (error) {
    console.error('Failed to fetch project recommendations:', error);
    message.error('Failed to load project recommendations');
    // Fallback to regular projects
    projects.value = [...allProjects.value];
  } finally {
    isLoading.value = false;
  }
};

const fetchDatasetRecommendations = async () => {
  try {
    isLoading.value = true;
    // Reset data arrays
    datasets.value = [];
    
    // Use new dataset recommendations API
    const endpoint = currentUser.value 
      ? `http://localhost:3000/api/datasets/explore/recommendations?user_id=${currentUser.value.id}&limit=${pagination.value.datasets.limit}&offset=0`
      : `http://localhost:3000/api/datasets/explore/recommendations?limit=${pagination.value.datasets.limit}&offset=0`;
    
    const response = await axios.get(endpoint);
    datasets.value = response.data;
    
    // Update pagination state
    if (response.data.length < pagination.value.datasets.limit) {
      pagination.value.datasets.hasMore = false;
    }
  } catch (error) {
    console.error('Failed to fetch dataset recommendations:', error);
    message.error('Failed to load dataset recommendations');
    // Fallback to regular datasets
    datasets.value = [...allDatasets.value];
  } finally {
    isLoading.value = false;
  }
};

const fetchPublicationRecommendations = async () => {
  try {
    isLoading.value = true;
    // Reset data arrays
    publications.value = [];
    // TODO: Implement when publications API is ready
    publications.value = [...allPublications.value];
  } catch (error) {
    console.error('Failed to fetch publication recommendations:', error);
    message.error('Failed to load publication recommendations');
    publications.value = [];
  } finally {
    isLoading.value = false;
  }
};

const fetchAllRecommendations = async () => {
  try {
    isLoading.value = true;
    
    // Reset data arrays
    projects.value = [];
    datasets.value = [];
    publications.value = [];
    
    console.log('Fetching all recommendations, currentUser:', currentUser.value);
    
    // Fetch recommendations from all sources in parallel
    const promises = [];
    
    // Fetch project recommendations
    const projectEndpoint = currentUser.value 
      ? `http://localhost:3000/api/projects/explore/recommendations?user_id=${currentUser.value.id}&limit=${pagination.value.projects.limit}&offset=0`
      : `http://localhost:3000/api/projects/explore/recommendations?limit=${pagination.value.projects.limit}&offset=0`;
    console.log('Project endpoint:', projectEndpoint);
    promises.push(axios.get(projectEndpoint));
    
    // Fetch dataset recommendations
    const datasetEndpoint = currentUser.value 
      ? `http://localhost:3000/api/datasets/explore/recommendations?user_id=${currentUser.value.id}&limit=${pagination.value.datasets.limit}&offset=0`
      : `http://localhost:3000/api/datasets/explore/recommendations?limit=${pagination.value.datasets.limit}&offset=0`;
    console.log('Dataset endpoint:', datasetEndpoint);
    promises.push(axios.get(datasetEndpoint));
    
    const [projectResponse, datasetResponse] = await Promise.all(promises);
    
    console.log('Project response:', projectResponse.data.length, 'items');
    console.log('Dataset response:', datasetResponse.data.length, 'items');
    
    // Set the individual arrays for mixed display
    projects.value = projectResponse.data || [];
    datasets.value = datasetResponse.data || [];
    publications.value = []; // TODO: Add when publications API is ready
    
    // Update pagination states
    if ((projectResponse.data || []).length < pagination.value.projects.limit) {
      pagination.value.projects.hasMore = false;
    }
    if ((datasetResponse.data || []).length < pagination.value.datasets.limit) {
      pagination.value.datasets.hasMore = false;
    }
    
    // Update hasMoreData based on all content types
    hasMoreData.value = pagination.value.projects.hasMore || pagination.value.datasets.hasMore;
    
    console.log('Final data counts - Projects:', projects.value.length, 'Datasets:', datasets.value.length);
    
  } catch (error) {
    console.error('Failed to fetch all recommendations:', error);
    message.error('Failed to load recommendations');
    // Fallback to existing data
    projects.value = [...allProjects.value].slice(0, 10);
    datasets.value = [...allDatasets.value].slice(0, 10);
    publications.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Add infinite scroll functionality
const loadMoreData = async () => {
  if (isLoadingMore.value || !hasMoreData.value) return;
  
  try {
    isLoadingMore.value = true;
    
    switch (activeTab.value) {
      case 'projects':
        await loadMoreProjects();
        break;
      case 'datasets':
        await loadMoreDatasets();
        break;
      case 'publications':
        await loadMorePublications();
        break;
      case 'all':
      default:
        await loadMoreAllContent();
        break;
    }
  } catch (error) {
    console.error('Failed to load more data:', error);
    message.error('Failed to load more content');
  } finally {
    isLoadingMore.value = false;
  }
};

const loadMoreProjects = async () => {
  if (!pagination.value.projects.hasMore) {
    hasMoreData.value = false;
    return;
  }
  
  pagination.value.projects.offset += pagination.value.projects.limit;
  
  const endpoint = currentUser.value 
    ? `http://localhost:3000/api/projects/explore/recommendations?user_id=${currentUser.value.id}&limit=${pagination.value.projects.limit}&offset=${pagination.value.projects.offset}`
    : `http://localhost:3000/api/projects/explore/recommendations?limit=${pagination.value.projects.limit}&offset=${pagination.value.projects.offset}`;
  
  const response = await axios.get(endpoint);
  const newProjects = response.data;
  
  if (newProjects.length === 0 || newProjects.length < pagination.value.projects.limit) {
    pagination.value.projects.hasMore = false;
    hasMoreData.value = false;
  }
  
  projects.value.push(...newProjects);
};

const loadMoreDatasets = async () => {
  if (!pagination.value.datasets.hasMore) {
    hasMoreData.value = false;
    return;
  }
  
  pagination.value.datasets.offset += pagination.value.datasets.limit;
  
  const endpoint = currentUser.value 
    ? `http://localhost:3000/api/datasets/explore/recommendations?user_id=${currentUser.value.id}&limit=${pagination.value.datasets.limit}&offset=${pagination.value.datasets.offset}`
    : `http://localhost:3000/api/datasets/explore/recommendations?limit=${pagination.value.datasets.limit}&offset=${pagination.value.datasets.offset}`;
  
  const response = await axios.get(endpoint);
  const newDatasets = response.data;
  
  if (newDatasets.length === 0 || newDatasets.length < pagination.value.datasets.limit) {
    pagination.value.datasets.hasMore = false;
    hasMoreData.value = false;
  }
  
  datasets.value.push(...newDatasets);
};

const loadMorePublications = async () => {
  // TODO: Implement when publications API is ready
  pagination.value.publications.hasMore = false;
  hasMoreData.value = false;
};

const loadMoreAllContent = async () => {
  // For "all" tab, alternate between loading projects and datasets
  const shouldLoadProjects = pagination.value.projects.hasMore && Math.random() > 0.5;
  
  if (shouldLoadProjects) {
    await loadMoreProjects();
  } else if (pagination.value.datasets.hasMore) {
    await loadMoreDatasets();
  } else if (pagination.value.projects.hasMore) {
    await loadMoreProjects();
  } else {
    hasMoreData.value = false;
  }
};

// Reset pagination when changing tabs or applying filters
const resetPagination = () => {
  pagination.value = {
    projects: { offset: 0, limit: 20, hasMore: true },
    datasets: { offset: 0, limit: 20, hasMore: true },
    publications: { offset: 0, limit: 20, hasMore: true }
  };
  hasMoreData.value = true;
};

// Infinite scroll functionality
const setupInfiniteScroll = () => {
  const handleScroll = () => {
    if (isLoadingMore.value || !hasMoreData.value) return;
    
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    // Trigger load more when user scrolls to 80% of the page
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      loadMoreData();
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
};

let cleanupScrollListener = null;

onMounted(async () => {
  try {
    // Setup infinite scroll
    cleanupScrollListener = setupInfiniteScroll();
    
    await fetchCurrentUser();
    await Promise.all([
      fetchPublicProjects(),
      fetchPublicDatasets(),
      fetchPublicPublications()
    ]);
    // Load recommendations by default
    await fetchAllRecommendations();
  } catch (error) {
    console.error('Failed to initialize explore page:', error);
    message.error('Failed to load explore page');
  }
});

onUnmounted(() => {
  if (cleanupScrollListener) {
    cleanupScrollListener();
  }
});
</script>

<style scoped>
.explore-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.explore-header {
  margin-bottom: 24px;
}

.search-controls {
  margin-bottom: 16px;
}

.search-bar {
  max-width: 400px;
}

.filters-section {
  margin-bottom: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.clear-filters {
  color: #58a6ff;
  font-size: 14px;
}

.clear-filters:hover {
  text-decoration: underline;
}

.tab-navigation {
  margin-bottom: 24px;
}

:deep(.n-tabs .n-tab-pane) {
  display: none;
}

:deep(.n-tabs .n-tabs-tab) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.loading-card, .empty-card {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 16px;
}

.loading-text {
  margin-top: 16px;
  color: #8b949e;
  font-size: 16px;
}

.empty-content {
  text-align: center;
  color: #8b949e;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  opacity: 0.8;
}

.content-card {
  background: linear-gradient(to bottom right, #0d1117, #161b22);
  border: 1px solid #30363d;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.content-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border-color: #58a6ff;
}

.content-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #58a6ff, transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.content-card:hover::after {
  opacity: 1;
}

.dataset-card {
  border-left: 3px solid #f7b731;
}

.publication-card {
  border-left: 3px solid #5f27cd;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-tag {
  padding: 4px 12px;
  background: rgba(88, 166, 255, 0.1);
  border-radius: 16px;
  color: #58a6ff;
  font-size: 14px;
}

.item-title {
  font-size: 20px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.item-subtitle {
  color: #8b949e;
  font-size: 14px;
  margin-bottom: 12px;
}

.item-description {
  color: #8b949e;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 16px;
  min-height: 63px;
  flex-grow: 1;
}

.item-info {
  margin-top: auto;
  margin-bottom: 20px;
  padding-top: 20px;
  border-top: 1px solid #30363d;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  margin-bottom: 16px;
}

.info-label, .stat-label {
  color: #8b949e;
  font-size: 14px;
  font-weight: normal;
}

.info-value, .stat-value {
  color: #c9d1d9;
  font-size: 14px;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8b949e;
  font-size: 14px;
}

.stat-item .n-icon {
  font-size: 16px;
}

.view-action {
  margin-top: auto;
}

.view-button {
  background: #1f6feb;
  border: none;
  font-weight: 500;
  height: 36px;
  border-radius: 8px;
}

.view-button:hover {
  background: #388bfd;
}

.view-button .n-icon {
  margin-left: 8px;
}

/* New styles for infinite scroll */
.loading-more-section {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
}

.loading-more-content {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #8b949e;
  font-size: 16px;
}

.loading-more-text {
  color: #8b949e;
  font-size: 16px;
}

.end-section {
  grid-column: 1 / -1;
  margin-top: 32px;
  padding: 24px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.end-line {
  flex-grow: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #30363d, transparent);
  max-width: 200px;
}

.end-content {
  text-align: center;
  color: #8b949e;
  padding: 0 24px;
  background: #0d1117;
  position: relative;
}

.end-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #58a6ff;
}

.end-description {
  font-size: 14px;
  opacity: 0.8;
  color: #8b949e;
}
</style> 