<template>
  <div class="dialog">
  <h3 style="
    margin-top: 5px;
    margin-bottom: 5px;">Add Device by IP</h3>

  <label>
    IP Address:<br>
    <input type="text" v-model="ip" placeholder="192.168.0.123" />
  </label>

  <label>
    Login:<br>
    <input type="text" v-model="login" placeholder="admin" />
  </label>

  <label>
    Password:<br>
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
        this.$emit('notify', 'Please enter IP address');
        return
      }

      try {
        const response = await fetch(`http://${this.ip}/identify`)
        const text = await response.text()

        if (!text.includes('ESP32-AUDIOCTRL')) {
          this.$emit('notify', 'This device is not a Audio Control module');
          return
        }

        const macMatch = text.match(/MAC=([A-Fa-f0-9:]+)/)
        const nameMatch = text.match(/NAME=([^\|]+)/)

        const mac = macMatch ? macMatch[1] : ''
        const name = nameMatch ? nameMatch[1] : 'Unknown'

        if (!mac) {
          this.$emit('notify', 'MAC address not found');
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
        this.$emit('notify', `Device "${name}"Saved locally!`);
        this.$emit('close', true)
      } catch (error) {
        this.$emit('notify', `Error! Failed to identify device: ${error.message}`);  
      }
    }
  }
}
</script>


<style scoped>
.dialog {
  background: white;

  width: 300px;

  padding: 20px;

  border-radius: 10px;

  box-shadow: 0 0 20px rgba(0,0,0,0.25);
}

.dialog h3 {
  margin: 0 0 15px 0;
}

label {
  display: block;
  margin-bottom: 12px;
}

input {
  width: 100%;
  box-sizing: border-box;

  padding: 8px 10px;

  margin-top: 4px;

  border: 1px solid #ccc;
  border-radius: 4px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  margin-top: 15px;
}

.actions button {
  min-width: 80px;

  border: none;
  border-radius: 4px;

  padding: 8px 12px;

  cursor: pointer;

  background: #007bff;
  color: white;
}
button {
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
}
</style>
