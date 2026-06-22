<template>
  <div class="dialog">
    <h3>Set admin credentials on module(s).</h3>
    <h5>Administrator privileges required!</h5>
    <label>Login:
      <input v-model="login" type="text" />
    </label>
    <label>Password:
      <input v-model="password" type="password" />
    </label>
    <div class="actions">
      <button @click="save">Apply</button>
      <button @click="$emit('close')">Cancel</button>
    </div>
  </div>
</template>

<script>
import ApiService from '../services/ApiService';

export default {
  props: ['devices'],
  data() {
    return {
      login: '',
      password: ''
    };
  },
  methods: {
    async save() {
      if (!this.login || !this.password) {
        alert('Both login and password required!');
        return;
      }

      const results = [];

      for (const device of this.devices) {
        const body = new URLSearchParams();
        body.append('new_login', this.login);
        body.append('new_password', this.password);

        try {
          const res = await ApiService.postForm(device, '/setauth', body);

          if (res.ok) {
            results.push(`✅ ${device.name}: Updated`);
          } else {
            const msg = await res.text();
            results.push(`❌ ${device.name}: ${msg}`);
          }
        } catch (err) {
          results.push(`❌ ${device.name}: ${err.message}`);
        }
      }

      alert('Admin credentials update results:\n\n' + results.join('\n'));

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
h3 {
  margin: 10px 0 8px 0;
}
h5 {
  margin: 5px 0 5px 0;
  font-size: 16px;
  color: #ff0000;
}
</style>
