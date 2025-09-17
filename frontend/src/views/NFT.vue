<template>
  <div class="nft-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">NFT Collections</h1>
          <p class="page-description">
            Your research publications minted as NFTs on the blockchain
          </p>
        </div>
        <div class="header-actions">
          <n-button type="primary" @click="showMintDialog = true">
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
            Mint New NFT
          </n-button>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="search-container">
        <n-input
          v-model:value="searchQuery"
          placeholder="Search NFTs by title, author, or category..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <n-icon :component="SearchOutline" />
          </template>
        </n-input>
      </div>
      
      <div class="filter-container">
        <n-select
          v-model:value="selectedCategory"
          :options="categoryOptions"
          placeholder="Category"
          clearable
          class="filter-select"
        />
        <n-select
          v-model:value="selectedStatus"
          :options="statusOptions"
          placeholder="Status"
          clearable
          class="filter-select"
        />
        <n-select
          v-model:value="sortBy"
          :options="sortOptions"
          placeholder="Sort by"
          class="filter-select"
        />
      </div>
    </div>

    <!-- NFT Stats -->
    <div class="stats-section">
      <n-grid :cols="4" :x-gap="24">
        <n-gi>
          <n-statistic label="Total NFTs" :value="filteredNFTs.length" />
        </n-gi>
        <n-gi>
          <n-statistic label="Total Value" :value="totalValue" :precision="2" />
        </n-gi>
        <n-gi>
          <n-statistic label="This Month" :value="thisMonthCount" />
        </n-gi>
        <n-gi>
          <n-statistic label="Floor Price" :value="floorPrice" :precision="3" />
        </n-gi>
      </n-grid>
    </div>

    <!-- NFT Grid -->
    <div class="nft-grid">
      <div 
        v-for="nft in paginatedNFTs" 
        :key="nft.id" 
        class="nft-card"
        @click="viewNFTDetails(nft)"
      >
        <div class="nft-image-container">
          <img :src="nft.image" :alt="nft.title" class="nft-image" />
          <div class="nft-overlay">
            <n-tag :type="getStatusType(nft.status)" size="small" class="status-tag">
              {{ nft.status }}
            </n-tag>
            <div class="overlay-actions">
              <n-button circle size="small" @click.stop="shareNFT(nft)">
                <template #icon>
                  <n-icon :component="ShareOutline" />
                </template>
              </n-button>
              <n-button circle size="small" @click.stop="viewOnBlockchain(nft)">
                <template #icon>
                  <n-icon :component="LinkOutline" />
                </template>
              </n-button>
            </div>
          </div>
        </div>
        
        <div class="nft-content">
          <div class="nft-header">
            <h3 class="nft-title">{{ nft.title }}</h3>
            <div class="nft-price">
              <span class="price-value">{{ nft.price }} ETH</span>
              <span class="price-usd">${{ (nft.price * 2500).toFixed(0) }}</span>
            </div>
          </div>
          
          <div class="nft-meta">
            <div class="meta-item">
              <n-icon :component="PersonOutline" class="meta-icon" />
              <span>{{ nft.authors.join(', ') }}</span>
            </div>
            <div class="meta-item">
              <n-icon :component="CalendarOutline" class="meta-icon" />
              <span>{{ formatDate(nft.mintedAt) }}</span>
            </div>
            <div class="meta-item">
              <n-icon :component="EyeOutline" class="meta-icon" />
              <span>{{ nft.views }} views</span>
            </div>
          </div>
          
          <div class="nft-tags">
            <n-tag 
              v-for="tag in nft.tags.slice(0, 2)" 
              :key="tag" 
              size="small" 
              class="nft-tag"
            >
              {{ tag }}
            </n-tag>
            <span v-if="nft.tags.length > 2" class="more-tags">
              +{{ nft.tags.length - 2 }} more
            </span>
          </div>
          
          <div class="nft-actions">
            <n-button size="small" @click.stop="downloadPaper(nft)">
              <template #icon>
                <n-icon :component="DownloadOutline" />
              </template>
              Download
            </n-button>
            <n-button size="small" type="primary" @click.stop="listForSale(nft)">
              <template #icon>
                <n-icon :component="CashOutline" />
              </template>
              List for Sale
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-container">
      <n-pagination
        v-model:page="currentPage"
        :page-count="totalPages"
        :page-size="pageSize"
        show-size-picker
        :page-sizes="[8, 16, 24, 32]"
        @update:page-size="handlePageSizeChange"
      />
    </div>

    <!-- Empty State -->
    <div v-if="filteredNFTs.length === 0" class="empty-state">
      <n-empty description="No NFTs found" size="large">
        <template #extra>
          <n-button type="primary" @click="showMintDialog = true">
            Mint Your First NFT
          </n-button>
        </template>
      </n-empty>
    </div>

    <!-- Mint Dialog -->
    <n-modal v-model:show="showMintDialog" preset="dialog" title="Mint New NFT">
      <template #header>
        <div class="dialog-header">
          <n-icon :component="DiamondOutline" class="dialog-icon" />
          <span>Mint Research Paper as NFT</span>
        </div>
      </template>
      <div class="mint-form">
        <n-form :model="mintForm" ref="mintFormRef" :rules="mintRules">
          <n-form-item label="Paper Title" path="title">
            <n-input v-model:value="mintForm.title" placeholder="Enter paper title" />
          </n-form-item>
          <n-form-item label="Authors" path="authors">
            <n-input v-model:value="mintForm.authors" placeholder="Enter authors (comma separated)" />
          </n-form-item>
          <n-form-item label="Category" path="category">
            <n-select v-model:value="mintForm.category" :options="categoryOptions" placeholder="Select category" />
          </n-form-item>
          <n-form-item label="Price (ETH)" path="price">
            <n-input-number v-model:value="mintForm.price" :min="0" :step="0.001" placeholder="0.000" />
          </n-form-item>
          <n-form-item label="Paper File" path="file">
            <n-upload
              :file-list="mintForm.fileList"
              :max="1"
              accept=".pdf"
              @change="handleFileChange"
            >
              <n-button>Upload PDF</n-button>
            </n-upload>
          </n-form-item>
        </n-form>
      </div>
      <template #action>
        <n-space>
          <n-button @click="showMintDialog = false">Cancel</n-button>
          <n-button type="primary" @click="mintNFT" :loading="isMinting">
            Mint NFT
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  NButton, NInput, NSelect, NGrid, NGi, NStatistic, NTag, NIcon, 
  NPagination, NEmpty, NModal, NForm, NFormItem, NInputNumber, 
  NUpload, NSpace, useMessage 
} from 'naive-ui'
import {
  AddOutline, SearchOutline, ShareOutline, LinkOutline, PersonOutline,
  CalendarOutline, EyeOutline, DownloadOutline, CashOutline, DiamondOutline
} from '@vicons/ionicons5'
import dayjs from 'dayjs'

const message = useMessage()

// Reactive data
const searchQuery = ref('')
const selectedCategory = ref(null)
const selectedStatus = ref(null)
const sortBy = ref('newest')
const currentPage = ref(1)
const pageSize = ref(8)
const showMintDialog = ref(false)
const isMinting = ref(false)

// Mock NFT data
const nfts = ref([
  {
    id: 1,
    title: "Quantum Computing Applications in Cryptography",
    authors: ["Dr. Alice Johnson", "Prof. Bob Smith"],
    category: "Computer Science",
    tags: ["Quantum Computing", "Cryptography", "Security", "Algorithms"],
    image: "https://via.placeholder.com/300x400/1a1a2e/eee?text=Quantum+Computing",
    price: 0.25,
    status: "Minted",
    mintedAt: "2024-01-15",
    views: 1250,
    tokenId: "0x1234...5678",
    blockchain: "Ethereum"
  },
  {
    id: 2,
    title: "Machine Learning in Healthcare Diagnostics",
    authors: ["Dr. Carol Davis", "Dr. David Wilson"],
    category: "Medical Science",
    tags: ["Machine Learning", "Healthcare", "Diagnostics", "AI"],
    image: "https://via.placeholder.com/300x400/2d1b69/eee?text=ML+Healthcare",
    price: 0.18,
    status: "Listed",
    mintedAt: "2024-01-20",
    views: 890,
    tokenId: "0x2345...6789",
    blockchain: "Ethereum"
  },
  {
    id: 3,
    title: "Sustainable Energy Solutions for Urban Areas",
    authors: ["Prof. Eve Brown", "Dr. Frank Miller"],
    category: "Environmental Science",
    tags: ["Renewable Energy", "Sustainability", "Urban Planning", "Green Tech"],
    image: "https://via.placeholder.com/300x400/11998e/eee?text=Sustainable+Energy",
    price: 0.32,
    status: "Sold",
    mintedAt: "2024-01-10",
    views: 2100,
    tokenId: "0x3456...7890",
    blockchain: "Ethereum"
  },
  {
    id: 4,
    title: "Blockchain Consensus Mechanisms: A Comparative Study",
    authors: ["Dr. Grace Lee", "Prof. Henry Taylor"],
    category: "Computer Science",
    tags: ["Blockchain", "Consensus", "Distributed Systems", "Cryptocurrency"],
    image: "https://via.placeholder.com/300x400/8b5cf6/eee?text=Blockchain+Study",
    price: 0.42,
    status: "Minted",
    mintedAt: "2024-02-01",
    views: 1850,
    tokenId: "0x4567...8901",
    blockchain: "Ethereum"
  },
  {
    id: 5,
    title: "Gene Therapy Advances in Rare Diseases",
    authors: ["Dr. Ivy Chen", "Prof. Jack Anderson"],
    category: "Biotechnology",
    tags: ["Gene Therapy", "Rare Diseases", "Genetics", "Medical Research"],
    image: "https://via.placeholder.com/300x400/ef4444/eee?text=Gene+Therapy",
    price: 0.28,
    status: "Listed",
    mintedAt: "2024-02-05",
    views: 1650,
    tokenId: "0x5678...9012",
    blockchain: "Ethereum"
  },
  {
    id: 6,
    title: "Climate Change Impact on Marine Ecosystems",
    authors: ["Dr. Karen White", "Prof. Leo Garcia"],
    category: "Marine Biology",
    tags: ["Climate Change", "Marine Life", "Ecosystem", "Conservation"],
    image: "https://via.placeholder.com/300x400/06b6d4/eee?text=Marine+Climate",
    price: 0.22,
    status: "Minted",
    mintedAt: "2024-02-08",
    views: 1120,
    tokenId: "0x6789...0123",
    blockchain: "Ethereum"
  }
])

// Form data for minting
const mintForm = ref({
  title: '',
  authors: '',
  category: null,
  price: 0,
  fileList: []
})

const mintFormRef = ref(null)

// Options
const categoryOptions = [
  { label: 'Computer Science', value: 'Computer Science' },
  { label: 'Medical Science', value: 'Medical Science' },
  { label: 'Environmental Science', value: 'Environmental Science' },
  { label: 'Biotechnology', value: 'Biotechnology' },
  { label: 'Marine Biology', value: 'Marine Biology' },
  { label: 'Physics', value: 'Physics' },
  { label: 'Chemistry', value: 'Chemistry' },
  { label: 'Mathematics', value: 'Mathematics' }
]

const statusOptions = [
  { label: 'Minted', value: 'Minted' },
  { label: 'Listed', value: 'Listed' },
  { label: 'Sold', value: 'Sold' }
]

const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Most Views', value: 'views' }
]

// Form validation rules
const mintRules = {
  title: [
    { required: true, message: 'Please enter paper title', trigger: 'blur' }
  ],
  authors: [
    { required: true, message: 'Please enter authors', trigger: 'blur' }
  ],
  category: [
    { required: true, message: 'Please select category', trigger: 'change' }
  ],
  price: [
    { required: true, message: 'Please enter price', trigger: 'blur' },
    { type: 'number', min: 0, message: 'Price must be greater than 0', trigger: 'blur' }
  ]
}

// Computed properties
const filteredNFTs = computed(() => {
  let filtered = nfts.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(nft => 
      nft.title.toLowerCase().includes(query) ||
      nft.authors.some(author => author.toLowerCase().includes(query)) ||
      nft.category.toLowerCase().includes(query) ||
      nft.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(nft => nft.category === selectedCategory.value)
  }

  // Status filter
  if (selectedStatus.value) {
    filtered = filtered.filter(nft => nft.status === selectedStatus.value)
  }

  // Sorting
  filtered = filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'newest':
        return new Date(b.mintedAt) - new Date(a.mintedAt)
      case 'oldest':
        return new Date(a.mintedAt) - new Date(b.mintedAt)
      case 'price_desc':
        return b.price - a.price
      case 'price_asc':
        return a.price - b.price
      case 'views':
        return b.views - a.views
      default:
        return 0
    }
  })

  return filtered
})

const paginatedNFTs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredNFTs.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredNFTs.value.length / pageSize.value)
})

const totalValue = computed(() => {
  return nfts.value.reduce((sum, nft) => sum + nft.price, 0)
})

const thisMonthCount = computed(() => {
  const thisMonth = dayjs().format('YYYY-MM')
  return nfts.value.filter(nft => nft.mintedAt.startsWith(thisMonth)).length
})

const floorPrice = computed(() => {
  const prices = nfts.value.map(nft => nft.price)
  return Math.min(...prices)
})

// Methods
const formatDate = (date) => {
  return dayjs(date).format('MMM DD, YYYY')
}

const getStatusType = (status) => {
  switch (status) {
    case 'Minted': return 'info'
    case 'Listed': return 'warning'
    case 'Sold': return 'success'
    default: return 'default'
  }
}

const handlePageSizeChange = (newPageSize) => {
  pageSize.value = newPageSize
  currentPage.value = 1
}

const handleFileChange = ({ fileList }) => {
  mintForm.value.fileList = fileList
}

const viewNFTDetails = (nft) => {
  message.info(`Viewing details for: ${nft.title}`)
  // TODO: Navigate to NFT detail page
}

const shareNFT = (nft) => {
  navigator.clipboard.writeText(`${window.location.origin}/nfts/${nft.id}`)
  message.success('NFT link copied to clipboard!')
}

const viewOnBlockchain = (nft) => {
  message.info(`Opening blockchain explorer for token: ${nft.tokenId}`)
  // TODO: Open blockchain explorer
}

const downloadPaper = (nft) => {
  message.success(`Downloading: ${nft.title}`)
  // TODO: Implement paper download
}

const listForSale = (nft) => {
  message.info(`Listing ${nft.title} for sale`)
  // TODO: Open listing dialog
}

const mintNFT = async () => {
  try {
    await mintFormRef.value?.validate()
    isMinting.value = true
    
    // Simulate minting process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const newNFT = {
      id: nfts.value.length + 1,
      title: mintForm.value.title,
      authors: mintForm.value.authors.split(',').map(a => a.trim()),
      category: mintForm.value.category,
      tags: ['New Research', 'Blockchain', 'NFT'],
      image: `https://via.placeholder.com/300x400/10b981/eee?text=${encodeURIComponent(mintForm.value.title.substring(0, 20))}`,
      price: mintForm.value.price,
      status: 'Minted',
      mintedAt: dayjs().format('YYYY-MM-DD'),
      views: 0,
      tokenId: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
      blockchain: 'Ethereum'
    }
    
    nfts.value.unshift(newNFT)
    showMintDialog.value = false
    message.success('NFT minted successfully!')
    
    // Reset form
    mintForm.value = {
      title: '',
      authors: '',
      category: null,
      price: 0,
      fileList: []
    }
  } catch (error) {
    message.error('Failed to mint NFT')
  } finally {
    isMinting.value = false
  }
}

onMounted(() => {
  // Initialize page
})
</script>

<style scoped>
.nft-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
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
  margin: 0;
  line-height: 1.5;
}

.filters-section {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
}

.search-container {
  margin-bottom: 16px;
}

.search-input {
  max-width: 400px;
}

.filter-container {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  min-width: 140px;
}

.stats-section {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
}

.nft-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.nft-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nft-card:hover {
  border-color: #58a6ff;
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(88, 166, 255, 0.1);
}

.nft-image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.nft-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nft-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), transparent, rgba(0,0,0,0.7));
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nft-card:hover .nft-overlay {
  opacity: 1;
}

.status-tag {
  align-self: flex-start;
}

.overlay-actions {
  display: flex;
  gap: 8px;
}

.nft-content {
  padding: 20px;
}

.nft-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.nft-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.nft-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.price-value {
  font-size: 1rem;
  font-weight: 600;
  color: #58a6ff;
}

.price-usd {
  font-size: 0.85rem;
  color: #8b949e;
}

.nft-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #8b949e;
}

.meta-icon {
  font-size: 14px;
}

.nft-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.nft-tag {
  font-size: 0.75rem;
}

.more-tags {
  font-size: 0.75rem;
  color: #8b949e;
  align-self: center;
}

.nft-actions {
  display: flex;
  gap: 8px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialog-icon {
  font-size: 20px;
  color: #58a6ff;
}

.mint-form {
  padding: 20px 0;
}

/* Dark theme adjustments */
:deep(.n-card) {
  background-color: #161b22;
  border-color: #30363d;
}

:deep(.n-input) {
  background-color: #0d1117;
  border-color: #30363d;
}

:deep(.n-select) {
  background-color: #0d1117;
}

:deep(.n-statistic .n-statistic-value) {
  color: #c9d1d9;
}

:deep(.n-statistic .n-statistic-label) {
  color: #8b949e;
}
</style> 