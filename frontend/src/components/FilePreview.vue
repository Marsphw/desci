<template>
  <div class="file-preview-container">
    <div v-if="isLoading" class="loading-overlay">
      <n-spin size="large" />
    </div>

    <!-- Image Preview -->
    <img v-if="previewType === 'image'" :src="fileUrl" alt="Image preview" class="image-preview" />

    <!-- PDF Preview -->
    <div v-else-if="previewType === 'pdf'" class="pdf-preview">
      <vue-pdf-embed :source="fileUrl" />
    </div>

    <!-- Code Preview -->
    <div v-else-if="previewType === 'code'" class="code-preview">
      <codemirror
        v-model="code"
        :style="{ height: '100%' }"
        :autofocus="true"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="extensions"
        :disabled="true"
      />
    </div>
    
    <!-- Unsupported File Type -->
    <div v-else class="unsupported-preview">
      <n-empty :description="`Preview for .${fileExtension} files is not supported.`" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import VuePdfEmbed from 'vue-pdf-embed';
import { Codemirror } from 'vue-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { NSpin, NEmpty } from 'naive-ui';

const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
});

const isLoading = ref(true);
const code = ref('');
const fileUrl = ref('');
const previewType = ref('');
const fileExtension = ref('');

const extensions = [oneDark]; // Default with theme

const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
}

const determinePreviewType = (extension) => {
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) {
        return 'image';
    }
    if (extension === 'pdf') {
        return 'pdf';
    }
    if (['js', 'ts', 'py', 'json', 'md', 'html', 'css'].includes(extension)) {
        if (extension === 'js' || extension === 'ts') extensions.push(javascript());
        if (extension === 'py') extensions.push(python());
        return 'code';
    }
    return 'unsupported';
};

onMounted(async () => {
    fileExtension.value = getFileExtension(props.file.file_name);
    previewType.value = determinePreviewType(fileExtension.value);
    
    const url = `http://localhost:3000/${props.file.file_path.replace(/\\/g, '/')}`;

    try {
        if (previewType.value === 'code') {
            const response = await axios.get(url, { responseType: 'text' });
            code.value = response.data;
        } else {
            // For images and PDFs, we can use the URL directly
            // For binary files, fetching as blob might be better if auth is needed
            fileUrl.value = url;
        }
    } catch (error) {
        console.error("Failed to load file content:", error);
    } finally {
        isLoading.value = false;
    }
});
</script>

<style scoped>
.file-preview-container {
  height: 70vh;
  width: 100%;
  position: relative;
  border: 1px solid #30363d;
  background-color: #0d1117;
}
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0,0,0,0.5);
  z-index: 10;
}
.image-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.pdf-preview, .code-preview {
  height: 100%;
  overflow-y: auto;
}
.unsupported-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}
</style> 