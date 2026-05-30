<template>
  <div class="dialog-overlay">
    <div class="dialog-box">
      <h3>Login for {{ device.name }}</h3>
      <input v-model="username" placeholder="Username" />
      <input v-model="password" type="password" placeholder="Password" />
      <div class="actions">
        <button @click="submit">OK</button>
        <button @click="$emit('close')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginDialog',
  props: {
    device: Object
  },
  data() {
    return {
      username: this.device.username || '',
      password: this.device.password || ''
    }
  },
  methods: {
    submit() {
      const credentials = {
        ip: this.device.ip,
        id: this.device.id,
        username: this.username,
        password: this.password
      }
      this.$emit('save-login', credentials)
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-box {
  background: white;
  padding: 20px;
  width: 300px;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.dialog-box input {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 6px;
  font-size: 14px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
