<template>
  <div class="paper-edit-page">
    <div class="page-header">
      <h1 class="page-title">Edit Paper</h1>
      <p class="page-description">Edit your paper information and metadata</p>
    </div>
    
    <n-card title="Paper Editor" class="edit-card">
      <p>Paper editing functionality will be implemented here.</p>
      <p>This page will allow users to modify paper metadata, authors, abstract, keywords, etc.</p>
      
      <div class="form-actions">
        <n-button @click="goBack">Cancel</n-button>
        <n-button type="primary">Save Changes</n-button>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { NCard, NButton } from 'naive-ui'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.paper-edit-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #c9d1d9;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 1rem;
  color: #8b949e;
  margin: 0 0 32px 0;
}

.edit-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
</style> 