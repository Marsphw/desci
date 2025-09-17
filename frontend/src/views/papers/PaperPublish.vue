<template>
  <div class="paper-publish-page">
    <div class="page-header">
      <h1 class="page-title">Publish Paper</h1>
      <p class="page-description">Choose how to publish your research paper</p>
    </div>
    
    <div class="publish-options">
      <n-card title="Publication Options" class="publish-card">
        <div class="options-grid">
          <div class="option-card" :class="{ 'selected': selectedOption === 'peer-review' }" @click="selectedOption = 'peer-review'">
            <n-icon :component="PeopleOutline" class="option-icon" />
            <h3>Peer Review</h3>
            <p>Submit for formal peer review process</p>
            <n-button type="primary" @click="submitForReview" :disabled="selectedOption !== 'peer-review'">
              Submit for Review
            </n-button>
          </div>
          
          <div class="option-card" :class="{ 'selected': selectedOption === 'preprint' }" @click="selectedOption = 'preprint'">
            <n-icon :component="FlashOutline" class="option-icon" />
            <h3>Direct Publication</h3>
            <p>Publish immediately as preprint</p>
            <n-button type="primary" @click="publishDirect" :disabled="selectedOption !== 'preprint'">
              Publish Now
            </n-button>
          </div>
        </div>
        
        <div class="form-actions">
          <n-button @click="goBack">Back to Preview</n-button>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NCard, NButton, NIcon, useMessage } from 'naive-ui'
import { PeopleOutline, FlashOutline } from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()
const message = useMessage()

const selectedOption = ref('')

const goBack = () => {
  router.push(`/papers/${route.params.paper_id}/preview`)
}

const submitForReview = () => {
  message.success('Paper submitted for peer review!')
  router.push(`/papers/${route.params.paper_id}`)
}

const publishDirect = () => {
  message.success('Paper published successfully!')
  router.push(`/papers/${route.params.paper_id}`)
}
</script>

<style scoped>
.paper-publish-page {
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

.publish-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.option-card {
  padding: 24px;
  border: 1px solid #30363d;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-card:hover {
  border-color: #58a6ff;
}

.option-card.selected {
  border-color: #58a6ff;
  background: rgba(88, 166, 255, 0.1);
}

.option-icon {
  font-size: 48px;
  color: #58a6ff;
  margin-bottom: 16px;
}

.option-card h3 {
  margin: 0 0 12px 0;
  color: #c9d1d9;
  font-size: 1.25rem;
}

.option-card p {
  margin: 0 0 16px 0;
  color: #8b949e;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #30363d;
}
</style> 