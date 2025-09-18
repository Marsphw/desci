<template>
  <n-layout class="main-layout">
    <Navbar />
    <n-layout-content class="main-content">
      <div class="hero-section">
        <n-h1>Welcome to DeSci-Proof</n-h1>
        <n-p>A decentralized platform for verifiable research.</n-p>
        <div class="hero-actions">
            <n-button type="primary" size="large" @click="$router.push('/dashboard')">
               Get Started
             </n-button>
          <n-button
            ghost
            size="large"
            style="margin-left: 12px"
            @click="$router.push('/explore')"
          >
            Explore Projects
          </n-button>
        </div>
      </div>

      <!-- New Features Section -->
      <div class="features-section">
        <n-h2>Why DeSci-Proof?</n-h2>
        <n-grid x-gap="24" y-gap="24" :cols="3">
          <n-gi>
            <n-card title="Verifiable Ownership">
              Mint your research outputs as dNFTs to establish immutable, on-chain proof of ownership.
            </n-card>
          </n-gi>
          <n-gi>
            <n-card title="Decentralized Collaboration">
              Create or join research projects with transparent, trustless collaboration models.
            </n-card>
          </n-gi>
          <n-gi>
            <n-card title="Transparent Peer Review">
              Participate in an open and fair peer-review process, where contributions are rewarded.
            </n-card>
          </n-gi>
        </n-grid>
      </div>

      <!-- New Highlights Section -->
      <div class="highlights-section">
         <n-h2>From Datasets to Discoveries</n-h2>
         <n-p>Explore a universe of knowledge, from raw data to groundbreaking papers, all interconnected in our knowledge graph.</n-p>
         <n-button type="tertiary" size="large">Explore the Graph</n-button>
      </div>

    </n-layout-content>
  </n-layout>
</template>

<script setup>
import Navbar from '../components/Navbar.vue';
import { NLayout, NLayoutContent, NH1, NP, NButton, NH2, NGrid, NGi, NCard } from 'naive-ui';
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.main-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8rem 2rem; /* Increased padding for more space */
  background-color: #101014; /* Slightly different shade for hero */
  min-height: 80vh; /* Give hero a significant portion of the view */
}

.features-section, .highlights-section {
  padding: 4rem 2rem;
  text-align: center;
}

.features-section {
  background-color: #0d1117;
}

.highlights-section {
    background-color: #161b22;
}

.n-h1 {
  font-size: 3.5rem !important;
  font-weight: 700 !important;
}

.n-h2 {
    font-size: 2.5rem !important;
    font-weight: 600 !important;
    margin-bottom: 2rem;
}

.n-p {
  font-size: 1.5rem !important;
  color: #c9d1d9 !important;
  margin-bottom: 2.5rem !important;
}

.n-card {
    text-align: left;
}
</style> 