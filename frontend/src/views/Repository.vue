<template>
  <div class="repository-page">
    <div class="repo-header">
      <div class="path-display">
        <n-breadcrumb>
          <n-breadcrumb-item v-for="(part, index) in currentPath" :key="part.id" @click="navigateTo(part.id, index)">
            {{ part.name }}
          </n-breadcrumb-item>
        </n-breadcrumb>
      </div>
      <div class="action-buttons">
        <n-button @click="showCreateFolderModal = true" ghost>Create Folder</n-button>
        <n-button @click="showUploadModal = true" type="primary" ghost>Upload Files</n-button>
      </div>
    </div>

    <div class="file-list-container">
      <n-list hoverable clickable>
        <n-list-item v-for="file in files" :key="file.id" @click="handleItemClick(file)">
          <template #prefix>
            <n-icon size="20">
              <FolderOutline v-if="file.file_type === 'directory'" />
              <DocumentTextOutline v-else />
            </n-icon>
          </template>
          <div class="file-item-content">
            <span class="file-name">{{ file.file_name }}</span>
            <span class="commit-message">Initial commit</span>
            <span class="last-updated">{{ new Date(file.uploaded_at).toLocaleDateString() }}</span>
          </div>
        </n-list-item>
        <div v-if="files.length === 0" class="empty-state">
          <n-icon size="48" :depth="3"><ArchiveOutline /></n-icon>
          <p>This repository is empty.</p>
        </div>
      </n-list>
    </div>

    <!-- Upload Modal -->
    <n-modal v-model:show="showUploadModal" preset="card" title="Upload Files" style="width: 600px;">
      <n-upload
        multiple
        directory-dnd
        :action="uploadUrl"
        :data="{ parent_id: currentFolderId, uploader_wallet_address: '0xYourWalletAddressHere' }"
        name="files"
        @finish="onUploadFinished"
      >
        <n-upload-dragger>
          <div style="margin-bottom: 12px;"><n-icon size="48" :depth="3"><archive-outline /></n-icon></div>
          <n-text style="font-size: 16px;">Click or drag files to this area to upload</n-text>
        </n-upload-dragger>
      </n-upload>
    </n-modal>

     <!-- Create Folder Modal -->
    <n-modal v-model:show="showCreateFolderModal" preset="card" title="Create New Folder" style="width: 400px;">
        <n-input v-model:value="newFolderName" placeholder="Enter folder name" />
        <template #footer>
            <n-button @click="createFolder" type="primary">Create</n-button>
        </template>
    </n-modal>

    <!-- File Preview Modal -->
    <n-modal v-model:show="showPreviewModal" preset="card" :title="selectedFileForPreview?.file_name" style="width: 90vw; height: 85vh;">
        <FilePreview v-if="selectedFileForPreview" :file="selectedFileForPreview" />
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { NButton, NIcon, NList, NListItem, NModal, NUpload, NUploadDragger, NBreadcrumb, NBreadcrumbItem, NText, useMessage, NInput } from 'naive-ui';
import { ArchiveOutline, FolderOutline, DocumentTextOutline } from '@vicons/ionicons5';
import FilePreview from '../components/FilePreview.vue';

const route = useRoute();
const message = useMessage();
const files = ref([]);
const projectId = ref(route.params.projectId);
const currentFolderId = ref(null);
const currentPath = ref([{ id: null, name: 'root' }]);
const showUploadModal = ref(false);
const showCreateFolderModal = ref(false);
const showPreviewModal = ref(false);
const selectedFileForPreview = ref(null);
const newFolderName = ref('');

// Corrected API endpoints, now all under /api/projects/
const API_BASE_URL = `http://localhost:3000/api/projects/${projectId.value}/repository`;

const fetchFiles = async () => {
    try {
        // GET /api/projects/:projectId/repository
        const response = await axios.get(API_BASE_URL, {
            params: { parentId: currentFolderId.value }
        });
        files.value = response.data;
    } catch (error) {
        console.error('Failed to fetch files:', error);
        message.error('Failed to fetch repository files.');
    }
};

const handleItemClick = (item) => {
    if (item.file_type === 'directory') {
        navigateTo(item.id, item.file_name);
    } else {
        openPreviewModal(item);
    }
};

const navigateTo = (folderId, folderName) => {
    if(folderId === null) {
        currentPath.value = [{ id: null, name: 'root' }];
    } else {
        const index = currentPath.value.findIndex(p => p.id === folderId);
        if (index !== -1) {
            currentPath.value.splice(index + 1);
        } else {
            currentPath.value.push({ id: folderId, name: folderName });
        }
    }
    currentFolderId.value = folderId;
    fetchFiles();
};

const createFolder = async () => {
    if (!newFolderName.value.trim()) return;
    try {
        // POST /api/projects/:projectId/repository/folders
        await axios.post(`${API_BASE_URL}/folders`, {
            name: newFolderName.value,
            parent_id: currentFolderId.value,
            uploader_wallet_address: '0xYourWalletAddressHere',
        });
        message.success(`Folder "${newFolderName.value}" created.`);
        showCreateFolderModal.value = false;
        newFolderName.value = '';
        await fetchFiles();
    } catch (error) {
        message.error('Failed to create folder.');
        console.error('Error creating folder:', error);
    }
};

const openPreviewModal = (file) => {
    selectedFileForPreview.value = file;
    showPreviewModal.value = true;
};

const onUploadFinished = ({ file, event }) => {
  const response = JSON.parse(event.target.response);
  message.success(`${file.name} uploaded successfully.`);
  fetchFiles(); // Refresh the file list
};

// Update action for the n-upload component
// POST /api/projects/:projectId/repository/files
const uploadUrl = `${API_BASE_URL}/files`;

onMounted(() => {
  fetchFiles();
});
</script>

<style scoped>
.repository-page {
  padding: 24px;
  background-color: #0d1117;
  color: #c9d1d9;
  height: 100%;
}
.repo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.path-display {
  font-size: 16px;
}
.action-buttons {
    display: flex;
    gap: 8px;
}
.file-list-container {
  border: 1px solid #30363d;
  border-radius: 6px;
  overflow: hidden;
}
:deep(.n-list-item__prefix) {
    display: flex;
    align-items: center;
    margin-right: 16px;
}
.file-item-content {
    display: grid;
    grid-template-columns: 3fr 2fr 1fr;
    align-items: center;
    width: 100%;
}
.file-name {
    cursor: pointer;
}
.file-name:hover {
    color: #58a6ff;
    text-decoration: underline;
}
.commit-message, .last-updated {
    color: #8b949e;
}
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    text-align: center;
    color: #8b949e;
}
</style> 