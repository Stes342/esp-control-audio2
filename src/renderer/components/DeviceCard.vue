<template>
  <div class="device-card" @click="$emit('select', device)">
    <h4>{{ device.name }}</h4>
    <p>IP: {{ device.ip }}</p>
    <p class="mac">MAC: {{ device.mac }}</p>
    
    <div class="controls">
      <template v-if="isFound">
        <button @click.stop="$emit('add', device)">Add</button>
      </template>
      <template v-else>
        <button @click.stop="$emit('login', device)">Login/Pass</button>
        <button @click.stop="$emit('remove', device.id)">Remove</button>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeviceCard',
  props: {
    device: Object,
    isFound: Boolean
  }
}
</script>

<style scoped>
.device-card {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}
.device-card:hover {
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}
.controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

button {
  padding: 6px 10px;
  font-size: 14px;
  cursor: pointer;
}
.mac {
  font-size: 13px;
  color: #555;
  margin: 4px 0;
}
</style>
