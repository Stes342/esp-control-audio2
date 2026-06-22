<template>
  <div class="dialog">
    <h3>Update Users Passwords on module(s)</h3>
    <label>user1 Password:
      <input v-model="user1" type="password" placeholder="Leave empty to skip" />
    </label>
    <label>user2 Password:
      <input v-model="user2" type="password" placeholder="Leave empty to skip" />
    </label>
    <label>user3 Password:
      <input v-model="user3" type="password" placeholder="Leave empty to skip" />
    </label>
    <label>user4 Password:
      <input v-model="user4" type="password" placeholder="Leave empty to skip" />
    </label>

    <div class="actions">
      <button @click="updateUsersPass">Apply</button>
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
      user1: '',
      user2: '',
      user3: '',
      user4: '',
    };
  },
  methods: {
    async updateUsersPass() {
      const results = [];

      for (const device of this.devices) {
        try {
          const params = new URLSearchParams();

          if (this.user1) params.append('user1_pass', this.user1);
          if (this.user2) params.append('user2_pass', this.user2);
          if (this.user3) params.append('user3_pass', this.user3);
          if (this.user4) params.append('user4_pass', this.user4);

          const res = await ApiService.postForm(device, '/set_user_access', params);

          if (res.ok) {
            results.push(`✅ ${device.name}: Updated`);
          } else {
            const err = await res.text();
            results.push(`❌ ${device.name}: ${err}`);
          }
        } catch (e) {
          results.push(`❌ ${device.name}: ${e.message}`);
        }
      }

      alert(results.join('\n'));
      this.$emit('close');
    },
  },
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
</style>
