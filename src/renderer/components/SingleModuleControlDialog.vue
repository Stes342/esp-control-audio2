<template>
  <section class="group-control-panel">
    <h3 style="margin-top: 5px; margin-bottom: 5px;">Single module control</h3>
    <h5>Control settings for the selected module.</h5>

    <div class="selected-module">
      Selected: <strong>{{ selectedLabel }}</strong>
    </div>

    <div class="control-row">
      <label class="control-label" for="single-audio-url">Audio stream URL:</label>
      <select id="single-audio-url" v-model="audioUrl" class="control-input">
        <option value="" disabled>Select saved stream...</option>
        <option v-for="preset in audioUrls" :key="preset.id" :value="preset.url">
          {{ preset.name }} — {{ preset.url }}
        </option>
      </select>
      <button @click="setAudioUrl" :disabled="!audioUrl || !selectedDevice">Set stream URL</button>
    </div>

    <div class="control-row">
      <label class="control-label" for="single-playlist">Playlist URLs:</label>
      <select id="single-playlist" v-model="playlistId" class="control-input">
        <option value="" disabled>Select saved playlist...</option>
        <option v-for="playlist in playlists" :key="playlist.id" :value="playlist.id">
          {{ playlist.name }} — {{ playlist.urls?.length || 0 }} URLs
        </option>
      </select>
      <button @click="sendPlaylist" :disabled="!playlistId || !selectedDevice">Send Playlist</button>
    </div>

    <div class="control-row">
      <label class="control-label" for="single-firmware-url">Firmware update:</label>
      <input
        id="single-firmware-url"
        v-model.trim="firmwareUpdateUrl"
        class="control-input"
        type="text"
        placeholder="http://server/audio3.bin"
      />
      <button @click="sendFirmwareUpdate" :disabled="!firmwareUpdateUrl || !selectedDevice">Firmware update</button>
    </div>

    <div class="control-row">
      <label class="control-label" for="single-work-time-enabled">Work time:</label>
      <div class="control-input control-work-time-input">
        <label class="control-check">
          <input id="single-work-time-enabled" type="checkbox" v-model="workTimeEnabled" /> Enabled
        </label>
        <label class="control-time-field">Start: <input v-model="workTimeStart" class="control-time-input" type="time" /></label>
        <label class="control-time-field">End: <input v-model="workTimeEnd" class="control-time-input" type="time" /></label>
      </div>
      <button @click="sendWorkTime" :disabled="!selectedDevice || (workTimeEnabled && (!workTimeStart || !workTimeEnd))">Set work time</button>
    </div>

    <div class="control-row">
      <label class="control-label" for="single-ntp-server">NTP Server:</label>
      <input
        id="single-ntp-server"
        v-model.trim="ntpServer"
        class="control-input"
        type="text"
        placeholder="pool.ntp.org"
      />
      <button @click="sendNtp" :disabled="!ntpServer || !selectedDevice">Set NTP</button>
    </div>

    <div class="actions">
      <button @click="$emit('close')">Close</button>
    </div>
  </section>
</template>

<script>
export default {
  props: ['selectedDevice', 'audioUrls', 'playlists'],
  emits: ['notify', 'log', 'close'],
  data() {
    return {
      audioUrl: '',
      playlistId: '',
      firmwareUpdateUrl: '',
      ntpServer: '',
      workTimeEnabled: true,
      workTimeStart: '08:00',
      workTimeEnd: '21:00',
    };
  },
  computed: {
    selectedLabel() {
      return this.selectedDevice?.name || this.selectedDevice?.ip || '—';
    },
  },
  watch: {
    selectedDevice: {
      immediate: true,
      handler(device) {
        this.workTimeEnabled = device?.audioWorkTimeEnabled !== false;
        this.workTimeStart = device?.audioWorkStart || '08:00';
        this.workTimeEnd = device?.audioWorkEnd || '21:00';
        this.ntpServer = device?.ntpServer || '';
      },
    },
  },
  methods: {
    notify(message) {
      this.$emit('notify', message);
    },
    logAction(message) {
      this.$emit('log', message);
    },
    async setAudioUrl() {
      this.logAction(`Control: Single module control - Set stream URL for ${this.selectedLabel}`);
      if (!this.selectedDevice || !this.audioUrl) return;

      const encodedUrl = encodeURIComponent(this.audioUrl);
      try {
        const response = await fetch(`http://localhost:3000/proxy/${this.selectedDevice.ip}/audio/seturl?url=${encodedUrl}`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        this.notify(`✅ Audio URL sent to ${this.selectedLabel}`);
      } catch (err) {
        console.error('Failed to set audio URL for selected module:', err);
        this.notify(`❌ Failed to send audio URL: ${err.message}`);
      }
    },
    async sendPlaylist() {
      this.logAction(`Control: Single module control - Send Playlist for ${this.selectedLabel}`);
      if (!this.selectedDevice || !this.playlistId) return;

      const playlist = this.playlists.find(item => item.id === this.playlistId);
      const urls = Array.isArray(playlist?.urls) ? playlist.urls : [];
      if (urls.length === 0) return;

      try {
        const response = await fetch(`http://localhost:3000/proxy/${this.selectedDevice.ip}/audio/playlist`, {
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
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        this.notify(`✅ Playlist sent to ${this.selectedLabel}`);
      } catch (err) {
        console.error('Failed to send playlist to selected module:', err);
        this.notify(`❌ Failed to send playlist: ${err.message}`);
      }
    },
    async sendWorkTime() {
      this.logAction(`Control: Single module control - Set work time for ${this.selectedLabel}`);
      if (!this.selectedDevice) return;

      const params = new URLSearchParams({
        enabled: this.workTimeEnabled ? '1' : '0',
        start: this.workTimeStart,
        end: this.workTimeEnd,
      });
      try {
        const response = await fetch(`http://localhost:3000/proxy/${this.selectedDevice.ip}/audio/worktime?${params.toString()}`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        this.selectedDevice.audioWorkTimeEnabled = this.workTimeEnabled;
        this.selectedDevice.audioWorkStart = this.workTimeStart;
        this.selectedDevice.audioWorkEnd = this.workTimeEnd;
        this.notify(`✅ Work time saved for ${this.selectedLabel}`);
      } catch (err) {
        console.error('Failed to set work time for selected module:', err);
        this.notify(`❌ Failed to save work time: ${err.message}`);
      }
    },
    async sendNtp() {
      this.logAction(`Control: Single module control - Set NTP for ${this.selectedLabel}`);
      if (!this.selectedDevice || !this.ntpServer) return;

      const encodedServer = encodeURIComponent(this.ntpServer);
      try {
        const response = await fetch(`http://localhost:3000/proxy/${this.selectedDevice.ip}/ntp?server=${encodedServer}`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        this.selectedDevice.ntpServer = this.ntpServer;
        this.notify(`✅ NTP server sent to ${this.selectedLabel}`);
      } catch (err) {
        console.error('Failed to send NTP server to selected module:', err);
        this.notify(`❌ Failed to send NTP server: ${err.message}`);
      }
    },
    async sendFirmwareUpdate() {
       this.logAction(`Control: Single module control - Firmware update for ${this.selectedLabel}`);
      if (!this.selectedDevice || !this.firmwareUpdateUrl) return;

      if (!this.firmwareUpdateUrl.startsWith('http://')) {
        this.notify('❌ Firmware URL must start with http://');
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/proxy/${this.selectedDevice.ip}/firmware/update`, {
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
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        this.selectedDevice.firmwareStatus = 'OTA_START';
        this.selectedDevice.firmwareProgress = 0;
        this.notify(`✅ Firmware update started for ${this.selectedLabel}`);
      } catch (err) {
        console.error('Failed to start firmware update for selected module:', err);
        this.notify(`❌ Failed to start firmware update: ${err.message}`);
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
.selected-module {
  margin-bottom: 16px;
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
.control-work-time-input {
  display: flex;
  align-items: center;
  gap: 14px;
}
.control-time-input {
  width: 90px;
}
.control-check,
.control-time-field {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 0;
}
.control-row button,
.actions button {
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
button {
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
}
label {
  display: block;
  margin-bottom: 10px;
}
</style>