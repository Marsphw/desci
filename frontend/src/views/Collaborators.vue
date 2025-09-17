<template>
  <div class="collaborators-page">
    <div class="page-header">
      <h2>Collaborators</h2>
      <n-button @click="showAddModal = true" type="primary">
        <template #icon><n-icon :component="PersonAddOutline" /></template>
        Add Collaborator
      </n-button>
    </div>

    <n-list bordered>
      <n-list-item v-for="user in collaborators" :key="user.id">
        <div class="collaborator-info">
          <span class="username">{{ user.username || 'Unnamed User' }}</span>
          <span class="wallet">{{ user.wallet_address }}</span>
        </div>
        <template #suffix>
          <n-tag :type="user.role === 'editor' ? 'success' : 'default'" size="small">{{ user.role }}</n-tag>
          <n-button text class="remove-btn"><n-icon :component="TrashBinOutline" /></n-button>
        </template>
      </n-list-item>
    </n-list>

    <!-- Add Collaborator Modal -->
    <n-modal v-model:show="showAddModal" preset="card" title="Add New Collaborator" style="width: 500px;">
      <n-form>
        <n-form-item label="Wallet Address">
          <n-input v-model:value="newCollaboratorAddress" placeholder="Enter collaborator's wallet address" />
        </n-form-item>
        <n-form-item label="Role">
          <n-select v-model:value="newCollaboratorRole" :options="roleOptions" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button @click="addCollaborator" type="primary">Add</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { NButton, NIcon, NList, NListItem, NModal, NInput, NSelect, NTag, NForm, NFormItem } from 'naive-ui';
import { PersonAddOutline, TrashBinOutline } from '@vicons/ionicons5';

const route = useRoute();
const collaborators = ref([]);
const showAddModal = ref(false);
const newCollaboratorAddress = ref('');
const newCollaboratorRole = ref('viewer');
const projectId = ref(route.params.projectId);

const roleOptions = [
  { label: 'Viewer', value: 'viewer' },
  { label: 'Editor', value: 'editor' },
];

const fetchCollaborators = async () => {
  try {
    const response = await axios.get(`http://localhost:3000/api/repository/${projectId.value}/collaborators`);
    collaborators.value = response.data;
  } catch (error) {
    console.error('Failed to fetch collaborators:', error);
  }
};

const addCollaborator = async () => {
  if (!newCollaboratorAddress.value.trim()) return;
  try {
    await axios.post(`http://localhost:3000/api/repository/${projectId.value}/collaborators`, {
      wallet_address: newCollaboratorAddress.value,
      role: newCollaboratorRole.value,
    });
    showAddModal.value = false;
    newCollaboratorAddress.value = '';
    await fetchCollaborators(); // Refresh list
  } catch (error) {
    console.error('Failed to add collaborator:', error);
    // TODO: Show error message to user
  }
};

onMounted(() => {
  fetchCollaborators();
});
</script>

<style scoped>
.collaborators-page {
  padding: 24px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.collaborator-info {
  display: flex;
  flex-direction: column;
}
.username {
  font-weight: 600;
}
.wallet {
  font-size: 12px;
  color: #8b949e;
}
.remove-btn {
  margin-left: 16px;
}
</style> 