<template>
  <section class="excel-upload">
    <h2>上传 Excel 文件</h2>
    <form @submit.prevent="onSubmit" novalidate>
      <input
        type="file"
        name="file"
        accept=".xls,.xlsx"
        @change="onFileChange"
      />
      <button type="submit" :disabled="!file || loading">
        {{ loading ? '上传中...' : '上传并解析' }}
      </button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <pre v-if="result" class="result">{{ pretty(result) }}</pre>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { apiFetch } from '@/api/http'

const file = ref<File | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<any | null>(null)

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0] || null
  file.value = f
}

function pretty(v: unknown) {
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

async function onSubmit() {
  error.value = null
  result.value = null
  if (!file.value) {
    error.value = '请先选择文件'
    return
  }
  loading.value = true
  try {
    const form = new FormData()
    form.append('file', file.value)
    const res = await apiFetch<any, FormData>('/file/parse-excel', {
      method: 'POST',
      body: form,
    })
    if (res.ok) {
      result.value = res.data ?? { message: '解析成功，无数据返回' }
    } else {
      error.value = res.error || `解析失败，状态码 ${res.status}`
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '未知错误'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.excel-upload {
  border: 1px solid #ddd;
  padding: 16px;
  border-radius: 8px;
}
.excel-upload form {
  display: flex;
  gap: 12px;
  align-items: center;
}
.error { color: #c00; }
.result {
  background: #f7f7f7;
  padding: 12px;
  border-radius: 6px;
  margin-top: 12px;
  max-height: 300px;
  overflow: auto;
}
</style>
