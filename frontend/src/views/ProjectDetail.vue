<template>
  <div class="project-detail-page">
    <div v-if="isLoading" class="loading-state">
      <n-spin size="large" />
    </div>
    <div v-else class="kanban-board">
      <div class="kanban-columns-wrapper">
        <draggable v-model="board" group="columns" item-key="id" class="kanban-columns-container">
          <template #item="{ element: column }">
            <div class="kanban-column">
              <div class="column-header">
                <n-icon :component="EllipseOutline" size="16" />
                <span class="column-title">{{ column.title }}</span>
                <span class="item-count">{{ column.items.length }}</span>
                <n-dropdown trigger="click" :options="columnActions">
                  <n-button text class="column-actions-btn">
                    <n-icon :component="EllipsisHorizontal" />
                  </n-button>
                </n-dropdown>
              </div>
              <div class="item-list-wrapper">
                <draggable v-model="column.items" group="items" item-key="id" class="item-list">
                  <template #item="{ element: item }">
                    <n-card class="kanban-item" size="small">
                      {{ item.content }}
                    </n-card>
                  </template>
                </draggable>
              </div>
              <n-button text class="add-item-btn" @click="openAddItemModal(column.id)">
                <n-icon :component="AddOutline" /> Add item
              </n-button>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Add Item Modal -->
    <n-modal v-model:show="showAddItemModal" preset="card" title="Add New Task" style="width: 600px;">
      <n-form>
        <n-form-item label="Task Description">
          <n-input v-model:value="newItemText" type="textarea" placeholder="Enter task description" />
        </n-form-item>
        <n-form-item label="Column">
          <n-select v-model:value="targetColumnId" :options="columnOptions" placeholder="Select column" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button @click="showAddItemModal = false">Cancel</n-button>
        <n-button type="primary" @click="handleAddItem" :disabled="!newItemText.trim() || !targetColumnId">
          Add Task
        </n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { 
  NCard, NIcon, NButton, NDropdown, NSpin, NModal, NInput,
  NForm, NFormItem, NSelect
} from 'naive-ui';
import draggable from 'vuedraggable';
import axios from 'axios';
import {
  AddOutline, EllipseOutline, EllipsisHorizontal
} from '@vicons/ionicons5';

const route = useRoute();
const isLoading = ref(true);
const board = ref([]);
const projectId = ref(route.params.projectId);
const showAddItemModal = ref(false);
const newItemText = ref('');
const targetColumnId = ref(null);

// Always use current iteration now

const columnActions = [
  { label: 'Rename column', key: 'rename' },
  { label: 'Delete column', key: 'delete' }
];

const columnOptions = computed(() => 
  board.value.map(column => ({
    label: column.title,
    value: column.id
  }))
);

const fetchBoard = async () => {
  isLoading.value = true;
  try {
    // Always fetch current iteration board
    const response = await axios.get(`http://localhost:3000/api/kanban/iterations/${projectId.value}/current`);
    board.value = response.data.board || [
      { id: 1, title: 'Backlog', items: [] },
      { id: 2, title: 'Ready', items: [] },
      { id: 3, title: 'In progress', items: [] },
      { id: 4, title: 'In review', items: [] },
      { id: 5, title: 'Done', items: [] }
    ];
  } catch (error) {
    console.error('Failed to fetch kanban board:', error);
    board.value = [
      { id: 1, title: 'Backlog', items: [] },
      { id: 2, title: 'Ready', items: [] },
      { id: 3, title: 'In progress', items: [] },
      { id: 4, title: 'In review', items: [] },
      { id: 5, title: 'Done', items: [] }
    ];
  } finally {
    isLoading.value = false;
  }
};

const openAddItemModal = (columnId = null) => {
  targetColumnId.value = columnId;
  showAddItemModal.value = true;
  newItemText.value = '';
};

const handleAddItem = async () => {
  if (!newItemText.value.trim() || !targetColumnId.value) return;
  
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    await axios.post('http://localhost:3000/api/kanban/cards', {
      column_id: targetColumnId.value,
      content: newItemText.value,
      creator_wallet_address: user.wallet_address,
      project_id: projectId.value
    });
    await fetchBoard();
    showAddItemModal.value = false;
    newItemText.value = '';
    targetColumnId.value = null;
  } catch (error) {
    console.error('Failed to add new item:', error);
  }
};

onMounted(() => {
  fetchBoard();
});
</script>

<style scoped>
.project-detail-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.board-header {
  padding: 16px;
  border-bottom: 1px solid #30363d;
}

.board-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.board-title h2 {
  margin: 0;
  color: #c9d1d9;
  font-size: 20px;
}

.kanban-board {
  flex: 1;
  width: 100%;
  overflow-x: auto;
  background-color: #0d1117;
}

.kanban-columns-wrapper {
  display: inline-block;
  min-width: 100%;
  padding: 16px;
}

.kanban-columns-container {
  display: flex;
  gap: 16px;
}

.kanban-column {
  flex: 0 0 280px;
  width: 280px;
  background-color: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #c9d1d9;
}

.column-title {
  font-weight: 600;
  color: #c9d1d9;
}

.item-count {
  background-color: rgba(110, 118, 129, 0.4);
  border-radius: 2em;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 500;
  color: #8b949e;
}

.column-actions-btn {
  margin-left: auto;
  color: #8b949e;
}

.item-list-wrapper {
  flex-grow: 1;
}

.item-list {
  flex-grow: 1;
  min-height: 100px;
}

.kanban-item {
  margin-bottom: 8px;
  cursor: grab;
  background-color: #21262d;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 8px;
  color: #c9d1d9;
  font-size: 14px;
}

.kanban-item:hover {
  border-color: #6e7681;
}

.kanban-item:active {
  cursor: grabbing;
}

.add-item-btn {
  width: 100%;
  margin-top: 8px;
  color: #58a6ff;
  font-size: 14px;
  text-align: left;
  padding: 8px;
  border-radius: 6px;
}

.add-item-btn:hover {
  background-color: #1f6feb;
  color: #ffffff;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding-top: 50px;
}
</style> 