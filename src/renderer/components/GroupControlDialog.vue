<template>
  <section class="group-control-panel">
    <h3 style="
    margin-top: 5px;
    margin-bottom: 5px;">Group control</h3>
    <h5>Set audio URL for selected groups.</h5>

    <div class="control-row">
      <label class="control-label" for="group-audio-url">Audio stream URL:</label>
      <select id="group-audio-url" v-model="audioUrl" class="control-input">
        <option value="" disabled>Select saved stream...</option>
        <option v-for="preset in audioUrls" :key="preset.id" :value="preset.url">
          {{ preset.name }} — {{ preset.url }}
        </option>
      </select>
      <button @click="setAudioUrlForGroups" :disabled="!audioUrl">Set stream URL</button>
    </div>

    <div class="control-row">
      <label class="control-label" for="group-playlist">Playlist URLs:</label>
      <select id="group-playlist" v-model="playlistId" class="control-input">
        <option value="" disabled>Select saved playlist...</option>
        <option v-for="playlist in playlists" :key="playlist.id" :value="playlist.id">
          {{ playlist.name }} — {{ playlist.urls?.length || 0 }} URLs
        </option>
      </select>
      <button @click="sendPlaylistForGroups" :disabled="!playlistId">Send Playlist</button>
    </div>
    
    <div class="control-row">
      <label class="control-label" for="group-firmware-url">Firmware update:</label>
      <input
        id="group-firmware-url"
        v-model.trim="firmwareUpdateUrl"
        class="control-input"
        type="text"
        placeholder="http://server/audio3.bin"
      />      
      <button @click="sendFirmwareUpdateForGroups" :disabled="!firmwareUpdateUrl">Firmware update</button>
    </div>          

    <div class="control-row">
      <label class="control-label" for="group-ntp-server">NTP Server:</label>
      <input
        id="group-ntp-server"
        v-model.trim="ntpServer"
        class="control-input"
        type="text"
        placeholder="pool.ntp.org"
      />
      <button @click="sendNtpForGroups" :disabled="!ntpServer">Set NTP</button>
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
        <button @click="sendAudioCommandForGroups('play')" :disabled="selectedGroups.length === 0">Play</button>
        <button @click="sendAudioCommandForGroups('pause')" :disabled="selectedGroups.length === 0">Pause</button>
        <button @click="sendAudioCommandForGroups('reboot')" :disabled="selectedGroups.length === 0">Reboot</button>                             
        <button @click="$emit('close')">Close</button>
    </div>
  </section>
</template>


<script>
export default {
  props: ['devices', 'allGroups', 'audioUrls', 'playlists'],
  data() {
    return {
      selectedGroups: [],      
      audioUrl: '',
      playlistId: '',
      firmwareUpdateUrl: '',
      ntpServer: '',
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
    notify(message) {
      this.$emit('notify', message);
    },
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
      const targetDevices = this.getTargetDevices();
      if (targetDevices.length === 0) {
        this.notify('⚠️ No target groups selected.');
        return;
      }

      const encodedUrl = encodeURIComponent(this.audioUrl);
      let sentCount = 0;
      let failedCount = 0;
      for (const device of targetDevices) {
        if (!device.available) continue;
        try {
          const response = await fetch(`http://localhost:3000/proxy/${device.ip}/audio/seturl?url=${encodedUrl}`);
          if (!response.ok) {
            const text = await response.text();
            failedCount += 1;
            console.warn(`Audio URL failed on ${device.ip}: ${response.status} ${text}`);
          } else {
            sentCount += 1;
          }
        } catch (err) {
          failedCount += 1;
          console.warn(`Audio URL failed on ${device.ip}`, err);
        }
      }
      if (sentCount > 0) {
        this.notify(`✅ Audio URL sent to ${sentCount} group module(s).${failedCount ? ` Failed: ${failedCount}.` : ''}`);
      } else {
        this.notify(`❌ Failed to send audio URL.${failedCount ? ` Failed: ${failedCount}.` : ' No online target modules.'}`);
      }
    },
    async sendPlaylistForGroups() {
      const playlist = this.playlists.find(item => item.id === this.playlistId);
      const urls = Array.isArray(playlist?.urls) ? playlist.urls : [];

      if (urls.length === 0) return;

      const targetDevices = this.getTargetDevices();
      if (targetDevices.length === 0) {
        this.notify('⚠️ No target groups selected.');
        return;
      }

      let sentCount = 0;
      let failedCount = 0;
      for (const device of targetDevices) {
        if (!device.available) continue;
        try {
          const response = await fetch(`http://localhost:3000/proxy/${device.ip}/audio/playlist`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              urls,
              returnToPrevious: true,
            }),
          });
          if (!response.ok) {
            const text = await response.text();
            failedCount += 1;
            console.warn(`Playlist failed on ${device.ip}: ${response.status} ${text}`);
          } else {
            sentCount += 1;
          }
        } catch (err) {
          failedCount += 1;
          console.warn(`Playlist failed on ${device.ip}`, err);
        }
      }
      if (sentCount > 0) {
        this.notify(`✅ Playlist sent to ${sentCount} group module(s).${failedCount ? ` Failed: ${failedCount}.` : ''}`);
      } else {
        this.notify(`❌ Failed to send playlist.${failedCount ? ` Failed: ${failedCount}.` : ' No online target modules.'}`);
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
    async sendNtpForGroups() {
      if (!this.ntpServer) return;
      const targetDevices = this.getTargetDevices();
      if (targetDevices.length === 0) {
        this.notify('⚠️ No target groups selected.');
        return;
      }
      const encodedServer = encodeURIComponent(this.ntpServer);
      let sentCount = 0;
      let failedCount = 0;
      for (const device of targetDevices) {
        if (!device.available) continue;
        try {
          const response = await fetch(`http://localhost:3000/proxy/${device.ip}/ntp?server=${encodedServer}`);
          if (!response.ok) {
            const text = await response.text();
            failedCount += 1;
            console.warn(`NTP failed on ${device.ip}: ${response.status} ${text}`);
          } else {
            sentCount += 1;
          }
        } catch (err) {
          failedCount += 1;
          console.warn(`NTP failed on ${device.ip}`, err);
        }
      }
      if (sentCount > 0) {
        this.notify(`✅ NTP server sent to ${sentCount} group module(s).${failedCount ? ` Failed: ${failedCount}.` : ''}`);
      } else {
        this.notify(`❌ Failed to send NTP server.${failedCount ? ` Failed: ${failedCount}.` : ' No online target modules.'}`);
      }
    },
    async sendFirmwareUpdateForGroups() {
      if (!this.firmwareUpdateUrl.startsWith('http://')) {
        this.notify('❌ Firmware URL must start with http://');
        return;
      }

      const targetDevices = this.getTargetDevices();
      if (targetDevices.length === 0) {
        this.notify('⚠️ No target groups selected.');
        return;
      }

      let sentCount = 0;
      let failedCount = 0;
      for (const device of targetDevices) {
        if (!device.available) continue;
        try {
          const response = await fetch(`http://localhost:3000/proxy/${device.ip}/firmware/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: this.firmwareUpdateUrl,
            }),
          });
          if (!response.ok) {
            const text = await response.text();
            failedCount += 1;
            console.warn(`Firmware update failed on ${device.ip}: ${response.status} ${text}`);
            continue;
          }
          device.firmwareStatus = 'OTA_START';
          device.firmwareProgress = 0;
          sentCount += 1;
        } catch (err) {
          failedCount += 1;
          console.warn(`Firmware update failed on ${device.ip}`, err);
        }
      }
      if (sentCount > 0) {
        this.notify(`✅ Firmware update started for ${sentCount} group module(s).${failedCount ? ` Failed: ${failedCount}.` : ''}`);
      } else {
        this.notify(`❌ Failed to start firmware update.${failedCount ? ` Failed: ${failedCount}.` : ' No online target modules.'}`);
      }
    },    
  },
};
</script>
<style scoped>


.group-control-panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: white;  
  padding: 16px;
  box-sizing: border-box;
}
.control-row {
  display: flex;
  align-items: center;  
  gap: 14px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e2e2;
}
.control-label {
  flex: 0 0 140px;
  margin-bottom: 0;
}
.control-input {
  flex: 1;
  min-width: 260px;
  max-width: 520px;
  box-sizing: border-box;
}
.control-row button {
  flex: 0 0 auto;
  background: #007bff;
  color: #fff;
  border: none;
  padding: 6px 6px;
  border-radius: 4px;
  cursor: pointer;
}
.actions {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
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
  
}
</style>

