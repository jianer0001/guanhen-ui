<script setup lang="ts">
import ExcelUpload from './components/ExcelUpload.vue'
</script>

<template>
  <main>
    <header style="display:flex;align-items:center;gap:12px;">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
      <h1>首页 · Excel 上传解析</h1>
    </header>
    <ExcelUpload />
  </main>
</template>

<style scoped>
.logo {
  height: 3em;
  padding: 0.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover { filter: drop-shadow(0 0 1em #646cffaa); }
</style>
