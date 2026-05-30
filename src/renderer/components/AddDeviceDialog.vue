<template>
  <div class="dialog">
  <h3 style="
    margin-top: 5px;
    margin-bottom: 5px;">Add Device by IP</h3>

  <label>
    IP Address:
    <input type="text" v-model="ip" placeholder="192.168.0.123" />
  </label>

  <label>
    Login:
    <input type="text" v-model="login" placeholder="admin" />
  </label>

  <label>
    Password:
    <input type="password" v-model="password" placeholder="******" />
  </label>

  <div class="actions">
    <button @click="identifyDevice">Add</button>
    <button @click="$emit('close')">Cancel</button>
  </div>
</div>

</template>

<script>
import axios from 'axios'

export default {
  name: 'AddDeviceDialog',
  data() {
    return {
      ip: '',
      login: '',
      password: ''
    }
  },
  methods: {
    async identifyDevice() {
      if (!this.ip) {
        alert('Please enter IP address')
        return
      }

      try {
        const response = await fetch(`http://${this.ip}/identify`)
        const text = await response.text()

        if (!text.includes('ESP32-POWERCTRL')) {
          alert('This device is not a Power Control module')
          return
        }

        const macMatch = text.match(/MAC=([A-Fa-f0-9:]+)/)
        const nameMatch = text.match(/NAME=([^\|]+)/)

        const mac = macMatch ? macMatch[1] : ''
        const name = nameMatch ? nameMatch[1] : 'Unknown'

        if (!mac) {
          alert('MAC address not found')
          return
        }

        const newModule = {
          mac,
          name,
          ip: this.ip,
          login: this.login,
          password: this.password,
          relayOn: false,
          available: true
        }

        await window.storageAPI.upsertModule(newModule)
        alert(`Device "${name}" saved locally!`)
        this.$emit('close', true)
      } catch (error) {
        alert(`Failed to identify device: ${error.message}`)
      }
    }
  }
}
</script>


<style scoped>
.dialog {
  background: white;
  padding: 10px;
  width: 200px;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}
label {
  display: block;
  margin-bottom: 10px;
}
input {
  width: 80%;
  padding: 6px 2px;
  font-size: 14px;
  margin-top: 4px;
}
.actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 15px;
}
.actions button {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 6px 6px;
  border-radius: 4px;
  cursor: pointer;
}
button {
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
}
</style>
