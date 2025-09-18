<template>
  <n-layout-header bordered class="navbar">
    <div class="navbar-left">
      <router-link to="/" class="logo">DeSci-Proof</router-link>
    </div>
    <div class="navbar-center">
       <n-dropdown trigger="hover" :options="projectOptions" @select = 'handleProjectDropdownSelect'>
        <n-a href="#">Projects</n-a>
      </n-dropdown>
      <n-dropdown trigger="hover" :options="datasetOptions" @select = 'handleDatasetDropdownSelect'>
        <n-a href="#">Datasets</n-a>
      </n-dropdown>
      <n-a href="#">Community</n-a>
      <n-a href="#">Docs</n-a>
    </div>
    <div class="navbar-right">
      <n-input placeholder="Search..." round clearable class="search-bar" />
      
      <!-- Web3 Connect Button -->
      <div v-if="!isConnected" @click="handleConnect">
        <n-button type="primary">Connect Wallet</n-button>
      </div>
      <div v-else>
        <n-dropdown trigger="click" :options="userDropdownOptions" @select="handleUserDropdownSelect">
            <n-button strong secondary>
                {{ formattedAccount }}
            </n-button>
        </n-dropdown>
      </div>

    </div>
  </n-layout-header>
</template>

<script setup>
import { computed } from 'vue';
import { NLayoutHeader, NButton, NInput, NDropdown, NA } from 'naive-ui';
import { useRouter } from 'vue-router';
import { useWeb3 } from '../composables/useWeb3';

const router = useRouter();
const { connectWallet, disconnectWallet, account, isConnected } = useWeb3();

// --- Computed Properties for Display ---
const formattedAccount = computed(() => {
    if (!account.value) return '';
    return `${account.value.substring(0, 6)}...${account.value.substring(account.value.length - 4)}`;
});

const userDropdownOptions = computed(() => [
  { label: 'Go to Dashboard', key: 'dashboard' },
  { type: 'divider', key: 'd1' },
  { label: 'Disconnect', key: 'disconnect' },
]);


// --- Event Handlers ---
const handleConnect = async () => {
    if (isConnected.value) {
        console.log("Already connected.");
        return;
    }
    const user = await connectWallet();
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        // No longer auto-redirecting. User can choose from dropdown.
    }
};

const handleUserDropdownSelect = (key) => {
    if (key === 'disconnect') {
        disconnectWallet();
        router.push('/'); 
    } else if (key === 'dashboard') {
        router.push('/dashboard');
    }
};

const handleProjectDropdownSelect = (key) => {
  router.push(key);
};

const handleDatasetDropdownSelect = (key) => {
  router.push(key);
};


// --- Static Dropdown Options ---
const projectOptions = [
  { label: 'Explore All Projects', key: '/explore' },
  { label: 'Start a New Project', key: '/projects' }
];

const datasetOptions = [
  { label: 'Browse Datasets', key: '/explore' },
  { label: 'Submit a Dataset', key: '/datasets/upload' }
];
</script>

<style scoped>
/* Styles remain largely the same */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  height: 64px;
}

.navbar-left .logo {
  font-weight: bold;
  font-size: 1.5rem;
  color: #f0f6fc;
  text-decoration: none;
}

.navbar-center {
  display: flex;
  gap: 2rem;
}

.navbar-center .n-a {
  color: #c9d1d9;
  text-decoration: none;
}

.navbar-right {
  display: flex;
  align-items: center;
}

.search-bar {
  width: 200px;
  margin-right: 1.5rem;
}
</style> 