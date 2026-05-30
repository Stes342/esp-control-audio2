<template>
  <div>
    <button @click="toggleRelay">Toggle Relay</button>
    <p>Status: {{ status }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ipcRenderer } from 'electron'

const status = ref('unknown')

async function toggleRelay() {
  // Параметры IP и номер реле возьми из настроек или пропсов
  const ip = '192.168.0.163'
  const relayNumber = 1
  const state = true // Включить

  const result = await ipcRenderer.invoke('relay-toggle', { ip, relayNumber, state })
  if (result.success) {
    status.value = 'Relay toggled successfully'
  } else {
    status.value = 'Error: ' + result.error
  }
}
</script>
