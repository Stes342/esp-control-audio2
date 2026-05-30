<template>
  <div>
    <div v-if="devices.length === 0">Нет подключённых устройств</div>
    <div v-else>
      <DeviceCard
        v-for="device in devices"
        :key="device.mac"
        :device="device"
        @toggle-relay="toggleRelay"
      />
    </div>
  </div>
</template>

<script>
import DeviceCard from './DeviceCard.vue'

export default {
  name: 'DeviceList',
  props: {
    devices: Array
  },
  components: { DeviceCard },
  methods: {
    toggleRelay(deviceId) {
      this.$emit('toggle-relay', deviceId)
    }
  }
}
</script>
