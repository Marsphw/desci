<template>
  <n-card class="project-card">
    <div class="card-header">
        <span class="field-tag">{{ project.field }}</span>
        <span class="status-tag" :style="{ backgroundColor: project.statusColor }">
            <n-icon :component="ClockIcon" />
            {{ project.status }}
        </span>
    </div>
    <h3 class="project-title">{{ project.title }}</h3>
    <p class="project-lead">Led by {{ project.lead }}</p>
    <p class="project-description">{{ project.description }}</p>

    <div class="project-details-grid">
        <span>Funding:</span> <span>{{ project.funding }}</span>
        <span>Proofs:</span> <span>{{ project.proofs }}</span>
        <span>NFTs:</span> <span>{{ project.nfts }}</span>
    </div>
    
    <template #footer>
        <n-button type="primary" block>
            View Project <n-icon :component="ExternalLinkIcon" style="margin-left: 8px;" />
        </n-button>
    </template>
  </n-card>
</template>

<script setup>
import { NCard, NIcon, NButton } from 'naive-ui';
import { TimeOutline as ClockIcon, OpenOutline as ExternalLinkIcon } from '@vicons/ionicons5';

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.project-card {
    display: flex;
    flex-direction: column;
    height: 100%;
}
.card-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
}
.field-tag {
    background-color: #30363d;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
}
.status-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 99px;
    font-size: 12px;
    color: white;
}
.project-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 8px 0;
}
.project-lead {
    color: #8b949e;
    margin: 0 0 16px 0;
}
.project-description {
    margin-bottom: 24px;
    line-height: 1.6;
    flex-grow: 1; /* Pushes details grid down */
}
.project-details-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 16px;
    color: #8b949e;
    margin-bottom: 24px;
}
</style> 