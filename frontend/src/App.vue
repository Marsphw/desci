<script setup>
import { NConfigProvider, NMessageProvider, NDialogProvider, darkTheme } from 'naive-ui';
import { defineComponent } from 'vue';

// Font Cdn
const cdn = document.createElement('link');
cdn.rel = 'stylesheet';
cdn.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
document.head.appendChild(cdn);
</script>

<template>
  <n-config-provider :theme="darkTheme">
    <n-message-provider>
      <n-dialog-provider>
        <router-view class="router-view" />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
.n-config-provider {
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Allow this to grow and fill the #app container */
}

.router-view {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.n-layout {
  flex-grow: 1;
}
</style>
