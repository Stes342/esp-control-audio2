<template>
  <div class="dialog">
    <h3>Set Users Access</h3>
    <h5>If a checkbox is not checked, access to the relay will be removed!</h5>
    <button @click="toggleCheckAll" class="check-all-btn">{{ isAllChecked ? 'Uncheck All' : 'Check All' }}</button>

    <label>Relays count:</label>
    <input type="number" v-model.number="relayCount" min="1" max="16" @change="adjustRelays" />

    <div v-for="(user, idx) in userAccess" :key="idx" class="user-block">
      <h4>user {{ idx + 1 }}</h4>
      <div class="checkbox-group">
        <label
          v-for="relayIdx in relayCount"
          :key="relayIdx"
        >
          <input
            type="checkbox"
            v-model="user.r[relayIdx - 1]"
          />
          Relay {{ relayIdx }}
        </label>
      </div>
    </div>
      <div class="actions">
        <button @click="submit">Submit</button>
        <button @click="$emit('close')">Cancel</button>
      </div>
  </div>
</template>
<script>
export default {
  props: ['devices'], // получишь чекнутые устройства от родителя
  data() {
    return {
      relayCount: 4,
      userAccess: [
        { r: [false, false, false, false] },
        { r: [false, false, false, false] },
        { r: [false, false, false, false] },
        { r: [false, false, false, false] }
      ]
    };
  },
  computed: {
    isAllChecked() {
      return this.userAccess.every(user =>
        user.r.every(v => v === true)
      );
    }
  },
  methods: {
    adjustRelays() {
    this.userAccess.forEach(user => {
      const diff = this.relayCount - user.r.length;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) user.r.push(false);
      } else if (diff < 0) {
        user.r.splice(this.relayCount);
      }
    });
  },
  toggleCheckAll() {
    const newValue = !this.isAllChecked;
    this.userAccess.forEach(user => {
      user.r = user.r.map(() => newValue);
    });
  },
  async submit() {
    const results = [];
    for (const device of this.devices) {
      const fd = new URLSearchParams();
      this.userAccess.forEach((u, i) => {
        const uname = `user${i + 1}`;
        u.r.forEach((isOn, j) => {
          if (isOn) {
            fd.append(`${uname}_r${j + 1}`, 'on');
          }
        });
      });
      try {
        const response = await fetch(`http://localhost:3000/proxy/${device.ip}/set_user_access`, {
          method: 'POST',
          body: fd
        });
        if (response.ok) {
          results.push(`✅ ${device.name}: Access updated`);
        } else {
          results.push(`❌ ${device.name}: ${await response.text()}`);
        }
      } catch (err) {
        results.push(`❌ ${device.name}: Network error`);
      }
    }
    alert(results.join('\n'));
    this.$emit('close');
  }
  }
};
</script>
<style scoped>
.dialog {
  background: #fff;
  padding: 10px;
  width: 200px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0,0,0,0.2);
}

h2 {
  margin-top: 0;
}

h3 {
  margin: 10px 0 8px 0;
}

h4 {
  margin: 10px 0 8px 0;
}

h5 {
  margin: 5px 0 8px 0;
  font-size: 14px;
  color: #ff0000;
}

label {
  display: block;
  margin: 4px 0;
  font-size: 14px;
}

input[type="checkbox"] {
  margin-right: 6px;
}

button {
  margin-top: 16px;
  padding: 8px 8px;
  font-size: 12px;
  cursor: pointer;
}
.actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 5px;
}
.actions button {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 6px 6px;
  border-radius: 4px;
  cursor: pointer;
}
.check-all-btn{
  margin-top: 5px;
  background: #007bff;
  color: #fff;
  border: none;
  padding: 6px 6px;
  border-radius: 4px;
  cursor: pointer;
}


</style>
