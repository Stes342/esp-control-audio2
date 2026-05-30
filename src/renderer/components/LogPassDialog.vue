<template>
  <div class="dialog">
    <h3>Set Login & Password</h3>

    <label>
      Login:
      <input type="text" v-model="login" placeholder="" />
    </label>

    <label>
      Password:
      <input type="password" v-model="password" placeholder="" />
    </label>

    <div class="actions">
      <button @click="saveCredentials">Save</button>
      <button @click="$emit('close')">Cancel</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LogPassDialog',
  props: {
    device: Object
  },
  data() {
    return {
      login: this.device?.login || '',
      password: this.device?.password || ''
    }
  },
  methods: {
    async saveCredentials() {
      if (!this.device) return;
      const updated = {
        ...this.device,
        login: this.login,
        password: this.password
      };
      await window.storageAPI.upsertModule(updated);  // сохраняем
      this.$emit('close');
    }
  }
};
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
  width: 90%;
  padding: 6px;
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
