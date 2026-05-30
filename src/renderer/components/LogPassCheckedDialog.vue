<template>
  <div class="dialog">
    <h3 style="
    margin-top: 5px;
    margin-bottom: 5px;">Set Log/Pass for {{ macList.length }} selected modules</h3>

    <label>
      Login:
      <input v-model="login" placeholder="admin">
    </label>
    <label>
      Password:
      <input v-model="password" placeholder="******" type="password">
    </label>

    <div class="actions">
      <button @click="saveToAll">Save</button>
      <button @click="$emit('close')">Cancel</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LogPassCheckedDialog',
  props: {
    macList: Array
  },
  data() {
    return {
      login: '',
      password: ''
    }
  },
  methods: {
    async saveToAll() {
      for (const mac of this.macList) {
        // Загружаем текущее устройство
        const allModules = await window.storageAPI.loadModules?.()
        const device = allModules.find(m => m.mac === mac)
        if (device) {
          const updatedDevice = {
            ...device,
            login: this.login,
            password: this.password
          }
          await window.storageAPI.upsertModule(updatedDevice)
        }
      }
      alert(`Credentials updated for ${this.macList.length} modules!`)
      this.$emit('close')
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
  box-shadow: 0 0 20px rgba(0,0,0,0.3);
}
label {
  display: block;
  margin: 10px 0;
}
input {
  width: 90%;
}
.actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 20px;
}
.actions button {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 6px 6px;
  border-radius: 4px;
  cursor: pointer;
}
.actions button {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 6px 6px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
