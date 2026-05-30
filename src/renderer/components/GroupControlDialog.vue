<template>
  <div class="overlay">
    <div class="dialog">
      <h3 style="
      margin-top: 5px;
      margin-bottom: 5px;">Group control</h3>
      <h5>Set audio URL for selected groups.</h5>

      <div>
        <label>Audio stream URL:
          <input type="text" v-model.trim="audioUrl" placeholder="https://..." />
        </label>
      </div>     
      
      <!-- Выбор групп -->
      <div>
        <label v-for="group in selectableGroups" :key="group.value">
          <input type="checkbox" v-model="selectedGroups" :value="group.value" />
          {{ group.label }}
        </label>
      </div>

      <!-- Управление -->
      <div class="actions">
        <button @click="setAudioUrlForGroups" :disabled="!audioUrl">Set Audio URL</button>
        <button @click="sendAudioCommandForGroups('play')" :disabled="selectedGroups.length === 0">Play</button>
        <button @click="sendAudioCommandForGroups('pause')" :disabled="selectedGroups.length === 0">Pause</button>                
        <button @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>


<script>
export default {
  props: ['devices', 'allGroups'],
  data() {
    return {
      selectedGroups: [],      
      audioUrl: '',
    };
  },
  computed: {
    selectableGroups() {
      return [
        { value: 'All', label: 'All' },
        { value: 'NoGroup', label: 'No Group' },
        ...this.allGroups.map(group => ({ value: group, label: group }))
      ];
    },
  },
  methods: {
    getTargetDevices() {
      const includeAll = this.selectedGroups.includes('All');
      const includeNoGroup = this.selectedGroups.includes('NoGroup');        
      return this.devices.filter((d) => {
        if (includeAll) return true;
        if (includeNoGroup && !d.group) return true;
        return this.selectedGroups.includes(d.group);
      });
    },
    async setAudioUrlForGroups() {
      const includeAll = this.selectedGroups.includes('All');
      const includeNoGroup = this.selectedGroups.includes('NoGroup');
      const targetDevices = this.devices.filter((d) => {
        if (includeAll) return true;
        if (includeNoGroup && !d.group) return true;
        return this.selectedGroups.includes(d.group);
      });
      const encodedUrl = encodeURIComponent(this.audioUrl);
      for (const device of targetDevices) {
        if (!device.available) continue;
        try {
          const response = await fetch(`http://localhost:3000/proxy/${device.ip}/audio/seturl?url=${encodedUrl}`);
          if (!response.ok) {
            const text = await response.text();
            console.warn(`Audio URL failed on ${device.ip}: ${response.status} ${text}`);
          }
        } catch (err) {
          console.warn(`Audio URL failed on ${device.ip}`, err);
        }
      }
    },
    async sendAudioCommandForGroups(command) {
      for (const device of this.getTargetDevices()) {
        if (!device.available) continue;
        try {
          const response = await fetch(`http://localhost:3000/proxy/${device.ip}/audio/${command}`);
          if (!response.ok) {
            const text = await response.text();
            console.warn(`Audio ${command} failed on ${device.ip}: ${response.status} ${text}`);
          }
        } catch (err) {
          console.warn(`Audio ${command} failed on ${device.ip}`, err);
        }
      }

    },    
  },
};
</script>
<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); /* полупрозрачный фон */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  padding: 10px;
  width: 300px;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
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
label {
  display: block;
  margin-bottom: 10px;
}
h5 {
  margin: 5px 0 5px 0;
  font-size: 16px;
  color: #ff0000;
}
</style>

