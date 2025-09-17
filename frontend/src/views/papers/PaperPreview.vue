<template>
  <div class="paper-preview-page">
    <div class="page-header">
      <h1 class="page-title">Preview Paper</h1>
      <p class="page-description">Review your paper before submission</p>
    </div>
    
    <n-card title="Paper Preview" class="preview-card">
      <p>Paper preview functionality will be implemented here.</p>
      <p>This page will show a formatted preview of the paper as it will appear when published.</p>
      
      <div class="form-actions">
        <n-button @click="goBack">Back to Edit</n-button>
        <n-button type="primary" @click="proceedToPublish">Proceed to Publish</n-button>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { NCard, NButton } from 'naive-ui'

const router = useRouter()
const route = useRoute()

const goBack = () => {
  router.push(`/papers/${route.params.paper_id}/edit`)
}

const proceedToPublish = () => {
  router.push(`/papers/${route.params.paper_id}/publish`)
}
</script>

<style scoped>
.paper-preview-page {
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

.preview-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
}
</style> 