<template>
  <div class="app-container">
    <!-- Top Navigation Tabs -->
    <header class="top-nav">
      <button @click="activeTab = 'control'" :class="{ active: activeTab === 'control' }">Control</button>
      <button @click="activeTab = 'manage'" :class="{ active: activeTab === 'manage' }">Manage</button>
      <button @click="activeTab = 'settings'" :class="{ active: activeTab === 'settings' }">Settings</button>
      <input type="text" v-model="searchQuery" placeholder="Search modules..." class="search-input" />
    </header>

    <!-- Tab Panels -->
    <main>
      <!-- Control Tab -->
      <div v-if="activeTab === 'control'" class="tab-content">
        <div class="submenu">
          <button
            :class="{ active: selectedGroup === 'All' }"
            @click="selectGroup('All')"
          >
            All
          </button>
          <button
            :class="{ active: selectedGroup === 'Offline' }"
            @click="selectGroup('Offline')"
          >
            Offline
          </button>
          <button
            :class="{ active: selectedGroup === 'NoGroup' }"
            @click="selectGroup('NoGroup')"
          >
            No Group
          </button>
          <button @click="openGroupControl">
            Group Control
          </button>
          <button @click="toggleSetAudioInline" :class="{ active: showSetAudioInline }">
            Set Stream URL (selected)
          </button>
          <button @click="toggleSetPlaylistInline" :class="{ active: showSetPlaylistInline }">
            Set Playlist URL(selected)
          </button>
          <button
            v-for="group in deviceGroups"
            :key="group"
            :class="{ active: selectedGroup === group }"
            @click="selectGroup(group)"
          >
            {{ group }}
          </button>
        </div>
        <div v-if="showSetAudioInline" class="submenu inline-audio-panel">
          <select v-model="selectedAudioUrl" class="inline-audio-input">
            <option value="" disabled>Select saved stream...</option>
            <option v-for="preset in schedulerAudioUrls" :key="preset.id" :value="preset.url">
              {{ preset.name }} — {{ preset.url }}
            </option>
          </select>
          <button @click="sendAudioUrlToSelected" :disabled="!selectedAudioUrl || !selectedDevice">Send</button>
          <button @click="showSetAudioInline = false">Close</button>
        </div>
        <div v-if="showSetPlaylistInline" class="submenu inline-audio-panel">
          <strong>Selected:</strong> {{ selectedDevice?.name || selectedDevice?.ip || '—' }}
          <select v-model="selectedPlaylistId" class="inline-audio-input">
            <option value="" disabled>Select saved playlist...</option>
            <option v-for="playlist in schedulerPlaylists" :key="playlist.id" :value="playlist.id">
              {{ playlist.name }} — {{ playlist.urls?.length || 0 }} URLs
            </option>
          </select>
          <button @click="sendPlaylistToSelected" :disabled="!selectedPlaylistId || !selectedDevice">Send</button>
          <button @click="showSetPlaylistInline = false">Close</button>
        </div>
        <div class="main-content split">
          <div class="left-pane">
            <div class="device-list">
              <div
                v-for="device in filteredDevices"
                :key="device.mac"
                class="device-card"
                :class="{ selected: selectedDevice?.mac === device.mac }"
                @click="selectDevice(device)"
              >
                <div class="card-header">
                  <h4>{{ device.name }}</h4>                  
                </div>

                <p class="secondary-info">
                  <span
                    class="status-indicator"
                    :class="{ online: device.available }"
                    title="Connection status"
                  >●</span>
                  &nbsp; <strong>IP:</strong> {{ device.ip }} &nbsp; | &nbsp;
                  <strong>MAC:</strong> {{ device.mac }}
                  <br>
                  <strong>Login:</strong> {{ device.login || '—' }}
                  <span v-if="device.group">
                    &nbsp; | &nbsp; <strong>Group:</strong> {{ device.group }}
                  </span>                  
                  &nbsp; | &nbsp; <strong>WiFi:</strong> {{ wifiSignalLabel(device) }}
                  &nbsp; | &nbsp; <strong>Audio:</strong> {{ playbackStateLabel(device) }}
                  <br>
                  <strong>Now playing:</strong> {{ nowPlayingLabel(device) }}
                  <br>                  
                </p>
              </div>
            </div>
          </div>

          <div class="right-pane">
            <iframe
              v-if="selectedDevice"
              class="device-webview"
              :src="webviewUrl"
              frameborder="0"
            ></iframe>
          </div>
        </div>
      </div>

      <!-- Manage Tab -->
      <div v-else-if="activeTab === 'manage'" class="tab-content">
        <div class="submenu">          
          <button
            :class="{ active: selectedGroup === 'All' }"
            @click="selectGroup('All')"
          >
            All
          </button>
          <button
            :class="{ active: selectedGroup === 'NoGroup' }"
            @click="selectGroup('NoGroup')"
          >
            No Group
          </button>
          <button @click="openLogPassChecked" :disabled="checkedDevices.length === 0">Log\Pass</button>
          <button @click="removeChecked" :disabled="checkedDevices.length === 0">Delete</button>
          <button @click="openSetAuthForChecked" :disabled="checkedDevices.length === 0">Log\Pass (Admin) on module</button>
          <button @click="openSetUsersForChecked" :disabled="checkedDevices.length === 0">Log\Pass (Users) on module</button>
          <!-- <button @click="showUserAccessDialog = true" :disabled="checkedDevices.length === 0">User Access on module</button> -->
          <button @click="toggleCheckAll">{{ isAllChecked ? 'Uncheck All' : 'Check All' }}</button>
          <button @click="showAddDialog = true">Add by IP</button>          
          <button @click="toggleGroupsPanel">Groups</button>
          <button @click="showSchedulerPanel = !showSchedulerPanel; showGroupsPanel = false">Scheduler</button>
        </div>

        <div class="main-content split">
          <div class="left-pane">
            <div v-if="filteredManageDevices.length === 0" class="no-cards">
              No modules added
            </div>
            <div v-else class="device-list">
              <div
                v-for="device in filteredManageDevices"
                :key="device.mac"
                class="device-card"
              >
                <div class="card-header">
                  <h4>{{ device.name }}</h4>
                  <input type="checkbox" v-model="checkedDevices" :value="device.mac" />
                </div>
                <p class="secondary-info">
                  <strong>IP:</strong> {{ device.ip }} | <strong>MAC:</strong> {{ device.mac }} <br> <strong>Login:</strong> {{ device.login || '—' }} | <strong>Group:</strong> {{ device.group }}
                </p>
                <div class="card-actions">
                  <button @click="openLogPass(device)">Log\Pass</button>
                  <button @click="removeDevice(device)">Delete</button>
                </div>
              </div>
            </div>
          </div>
          <div class="right-pane">
            <SchedulerPanel
              v-if="showSchedulerPanel"
              :devices="devices"
              :allGroups="allGroups"
            />
            <div v-else-if="showGroupsPanel">
              <div class="group-controls">
                <button @click="openGroupDialog('new')">New Group</button>
                <button @click="openGroupDialog('delete')">Delete Group</button>
                <button @click="openGroupDialog('assign')" :disabled="checkedDevices.length === 0">Add to Group</button>
                <button @click="openGroupDialog('remove')" :disabled="checkedDevices.length === 0">Delete from Group</button>
              </div>

              <div v-if="showGroupDialog" class="dialog-backdrop">
                <GroupDialog
                  :existingGroups="availableGroups"
                  :action="groupAction"
                  @confirm="handleGroupConfirm"
                  @close="showGroupDialog = false"
                />
              </div>
              <h3>Groups</h3>
              <div class="group-list">                
                <div
                  v-for="group in availableGroups"
                  :key="group"
                  class="group-card"
                  :class="{ selected: selectedGroup === group }"
                  @click="selectGroup(group)"
                >
                  {{ group }}
                </div>
              </div>
            </div>
            <div v-else>
              <p>Groups</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Tab -->
      <div v-else-if="activeTab === 'settings'" class="tab-content">
        <div class="submenu">
          <h2>Config</h2>

          <div class="config-buttons">
            <div class="config-section">
              <label>
                <input type="checkbox" v-model="includeCredentials" />
                Export login and password
              </label>
              <button @click="exportConfig">Export</button>
              <p class="config-description">
                Export current configuration to a JSON file. This includes device name, IP, MAC address, and group (if defined).
              </p>
            </div>
            <div class="config-section">
              <button @click="$refs.importFile.click()">Import</button>
              <input
                type="file"
                accept=".json"
                ref="importFile"
                @change="importConfig"
                style="display: none;"
              />
              <p class="config-description">
                Import configuration from a JSON file. If the file does not include groups (e.g. Android export), group will remain empty.
              </p>
            </div>
          </div>
        </div>
      </div>      
    </main>

    <!-- Диалог AddDeviceDialog: вставляем сюда! -->
    <div v-if="showAddDialog" class="dialog-backdrop">
      <AddDeviceDialog @close="handleAddDeviceClose" />
    </div>
    <!-- Диалог LogPassDialog: вставляем сюда! -->
    <div v-if="showLogPassDialog" class="dialog-backdrop">
      <LogPassDialog
        :device="logPassDevice"
        @close="showLogPassDialog = false; loadDevices()" 
      />
    </div>
    <!-- Для группы чекнутых -->
    <div v-if="showLogPassCheckedDialog" class="dialog-backdrop">
      <LogPassCheckedDialog
        :macList="logPassCheckedDevices"
        @close="showLogPassCheckedDialog = false; loadDevices()" 
      />
    </div>
    <div v-if="showSetAdminAuthDialog" class="dialog-backdrop">
      <SetAdminAuthDialog
        :devices="selectedAdminDevices"
        @close="showSetAdminAuthDialog = false"
      />
    </div>
    <div v-if="showUsersPassCheckedDialog" class="dialog-backdrop">
      <UsersPassCheckedDialog
        :devices="usersPassCheckedDevices"
        @close="showUsersPassCheckedDialog = false"
      />
    </div>
    <div v-if="showUserAccessDialog" class="dialog-backdrop">
      <UserAccessDialog
        :devices="checkedDevices.map(mac => devices.find(d => d.mac === mac))"
        @close="showUserAccessDialog = false"
      />
    </div>

    <div v-if="showSetAudioUrlDialog" class="dialog-backdrop">
      <div class="dialog">
        <h3 style="margin-top: 5px; margin-bottom: 5px;">Set Audio URL (selected)</h3>
        <p style="margin: 0 0 8px 0;">Target: <strong>{{ selectedDevice?.name || selectedDevice?.ip || '—' }}</strong></p>
        <input
          type="text"
          v-model.trim="selectedAudioUrl"
          placeholder="https://..."
          style="width: 100%; margin-bottom: 10px;"
        />
        <div class="card-actions">
          <button @click="sendAudioUrlToSelected" :disabled="!selectedAudioUrl || !selectedDevice">Set Audio URL</button>
          <button @click="showSetAudioUrlDialog = false">Close</button>
        </div>
      </div>
    </div>

    <GroupControlDialog
      v-if="showGroupControlDialog"
      :devices="devices"
      :allGroups="allGroups"
      :audioUrls="schedulerAudioUrls"
      :playlists="schedulerPlaylists"
      @close="closeGroupControl"
    />
  </div>
</template>

<script>
import AddDeviceDialog from './components/AddDeviceDialog.vue'
import LogPassDialog from './components/LogPassDialog.vue';
import LogPassCheckedDialog from './components/LogPassCheckedDialog.vue'
import SetAdminAuthDialog from './components/SetAdminAuthDialog.vue';
import UsersPassCheckedDialog from './components/UsersPassCheckedDialog.vue';
import UserAccessDialog from './components/UserAccessDialog.vue';
import GroupDialog from './components/GroupDialog.vue';
import GroupControlDialog from './components/GroupControlDialog.vue';
import SchedulerPanel from './components/SchedulerPanel.vue';

const SCHEDULER_FALLBACK_KEY = 'espControlScheduler';

export default {
  components: {
    AddDeviceDialog,   // ✅ добавляешь сюда компонент диалога
    LogPassDialog,
    LogPassCheckedDialog,
    UsersPassCheckedDialog,
    SetAdminAuthDialog,
    UserAccessDialog,
    GroupDialog,
    GroupControlDialog,
    SchedulerPanel,    
  },
  data() {
    return {
      activeTab: 'control',
      selectedGroup: 'All',
      selectedDevice: null,
      devices: [],
      checkInterval: null,  // ✅ добавлено
      checkedDevices: [],
      showAddDialog: false,
      showLogPassDialog: false,
      logPassDevice: null,
      showLogPassCheckedDialog: false,
      logPassCheckedDevices: [],
      showSetAdminAuthDialog: false,
      selectedAdminDevices: [],
      showUsersPassCheckedDialog: false,
      usersPassCheckedDevices: [],
      showUserAccessDialog: false,
      showGroupsPanel: false,
      showSchedulerPanel: false,
      showGroupDialog: false,
      groupAction: '', // 'new' | 'delete' | 'assign' | 'remove'
      availableGroups: [], // берём из storageAPI при загрузке 
      showGroupControlDialog: false,
      selectedGroups: [],
      relayCount: 4,
      selectedRelays: [],
      searchQuery: "",
      includeCredentials: true,
      showSetAudioInline: false,
      selectedAudioUrl: '',
      schedulerAudioUrls: [],
      schedulerPlaylists: [],
      showSetPlaylistInline: false,
      selectedPlaylistId: '',
      schedulerInterval: null,
      schedulerCheckRunning: false,
      executedScheduledEvents: new Set(),
    }
  },
  computed: {
    deviceGroups() {
      const groups = new Set()
      this.devices.forEach(device => {
        if (device.group) groups.add(device.group)
      })
      return Array.from(groups).sort()
    },
    filteredDevices() {
      return this.devices
        .filter(device => {
          if (this.selectedGroup === 'All') return true;
          if (this.selectedGroup === 'Offline') return !device.available;
          if (this.selectedGroup === 'NoGroup') return !device.group;
          return device.group === this.selectedGroup;
        })
        .filter(device => this.deviceMatchesSearch(device));
    },
    webviewUrl() {
      if (!this.selectedDevice) return ''
      const { ip, login, password } = this.selectedDevice
      if (login && password) {
        return `http://localhost:3000/proxy/${ip}/?user=${encodeURIComponent(login)}&pass=${encodeURIComponent(password)}`
      }
      return `http://${ip}`
    },
    filteredManageDevices() {
      return this.devices
        .filter(device => {
          if (this.selectedGroup === 'All') return true;
          if (this.selectedGroup === 'Offline') return !device.available;
          if (this.selectedGroup === 'NoGroup') return !device.group;
          return device.group === this.selectedGroup;
        })
        .filter(device => this.deviceMatchesSearch(device));
    },
    selectedDevices() {
      // Возвращает объекты устройств, которые выбраны
      return this.devices.filter(d => this.checkedDevices.includes(d.mac))
    },
    isAllChecked() {
      return this.filteredManageDevices.length > 0 &&
            this.checkedDevices.length === this.filteredManageDevices.length;
    },
    allGroups() {
      const groups = new Set();
      for (const device of this.devices) {
        if (device.group) {
          groups.add(device.group);
        }
      }
      return Array.from(groups);
    },    

  },
  methods: {
    async loadDevices() {
      try {
        const response = await window.storageAPI.loadModules?.()
        if (response && Array.isArray(response)) {
          this.devices = response
        }
      } catch (e) {
        console.error('Failed to load modules:', e)
      }
    },

    deviceMatchesSearch(device) {
      const query = this.searchQuery.trim().toLowerCase();
      if (!query) return true;

      return [
        device.name,
        device.ip,
        device.mac,
        this.wifiSignalLabel(device),
        this.playbackStateLabel(device),
        this.nowPlayingLabel(device),
        device.wifiRssi,
        device.audioPlaybackState,
        device.audioNowPlaying
      ]
        .filter(value => value !== null && value !== undefined)
        .some(value => String(value).toLowerCase().includes(query));
    },

    async readModuleStatus(response) {
      const text = await response.text();
      if (!text) return null;

      try {
        return JSON.parse(text);
      } catch (error) {
        console.warn('Failed to parse module status:', error);
        return null;
      }
    },

    applyModuleStatus(device, status) {
      if (!status || Array.isArray(status)) {
        device.wifiRssi = null;
        device.audioPlaybackState = '';
        device.audioNowPlaying = '';
        device.audioNowPlayingUrl = '';
        return;
      }

      const audio = status.audio || status.playback || {};
      const wifi = status.wifi || {};
      device.wifiRssi = wifi.rssi ?? status.wifiRssi ?? status.rssi ?? null;
      device.audioPlaybackState = audio.state || status.audioState || status.playbackState || '';
      device.audioNowPlaying = audio.current || audio.nowPlaying || audio.currentTrack || status.nowPlaying || '';
      device.audioNowPlayingUrl = audio.url || status.audioUrl || status.url || '';
    },

    wifiSignalLabel(device) {
      if (!device.available) return 'Offline';
      if (device.wifiRssi === null || device.wifiRssi === undefined || device.wifiRssi === '') return '—';
      return `${device.wifiRssi} dBm`;
    },

    playbackStateLabel(device) {
      if (!device.available) return 'Offline';
      const state = String(device.audioPlaybackState || '').toLowerCase();
      if (state === 'play' || state === 'playing') return 'Play';
      if (state === 'pause' || state === 'paused') return 'Pause';
      if (state === 'stopped' || state === 'stop') return 'Stopped';
      return '—';
    },

    endpointNameFromUrl(url) {
      const clean = String(url || '').split('?')[0];
      const slashIndex = clean.lastIndexOf('/');
      return slashIndex >= 0 ? clean.slice(slashIndex + 1) : clean;
    },

    normalizedPlaybackValue(value) {
      const text = String(value || '').trim();
      try {
        return decodeURIComponent(text).toLowerCase();
      } catch {
        return text.toLowerCase();
      }
    },

    playbackMatchesCurrent(device, url) {
      const currentValues = [
        device.audioNowPlayingUrl,
        device.audioNowPlaying,
      ]
        .map(value => this.normalizedPlaybackValue(value))
        .filter(Boolean);

      const presetUrl = this.normalizedPlaybackValue(url);
      const presetEndpoint = this.normalizedPlaybackValue(this.endpointNameFromUrl(url));

      return currentValues.some(value => value === presetUrl || value === presetEndpoint);
    },

    savedNowPlayingLabel(device) {
      const streamPreset = this.schedulerAudioUrls.find(preset => this.playbackMatchesCurrent(device, preset.url));
      if (streamPreset?.name) return streamPreset.name;

      const playlistPreset = this.schedulerPlaylists.find(playlist => (playlist.urls || []).some(url => this.playbackMatchesCurrent(device, url)));
      if (playlistPreset?.name) return playlistPreset.name;

      return '';
    },

    nowPlayingLabel(device) {
      if (!device.available) return 'Offline';
      return this.savedNowPlayingLabel(device) || device.audioNowPlaying || '—';
    },

    async readModuleStatus(response) {
      const text = await response.text();
      if (!text) return null;

      try {
        return JSON.parse(text);
      } catch (error) {
        console.warn('Failed to parse module status:', error);
        return null;
      }
    },

    applyModuleStatus(device, status) {
      if (!status || Array.isArray(status)) {
        device.wifiRssi = null;
        device.audioPlaybackState = '';
        device.audioNowPlaying = '';
        device.audioNowPlayingUrl = '';
        return;
      }

      const audio = status.audio || status.playback || {};
      const wifi = status.wifi || {};
      device.wifiRssi = wifi.rssi ?? status.wifiRssi ?? status.rssi ?? null;
      device.audioPlaybackState = audio.state || status.audioState || status.playbackState || '';
      device.audioNowPlaying = audio.current || audio.nowPlaying || audio.currentTrack || status.nowPlaying || '';
      device.audioNowPlayingUrl = audio.url || status.audioUrl || status.url || '';
    },

    wifiSignalLabel(device) {
      if (!device.available) return 'Offline';
      if (device.wifiRssi === null || device.wifiRssi === undefined || device.wifiRssi === '') return '—';
      return `${device.wifiRssi} dBm`;
    },

    playbackStateLabel(device) {
      if (!device.available) return 'Offline';
      const state = String(device.audioPlaybackState || '').toLowerCase();
      if (state === 'play' || state === 'playing') return 'Play';
      if (state === 'pause' || state === 'paused') return 'Pause';
      if (state === 'stopped' || state === 'stop') return 'Stopped';
      return '—';
    },

    endpointNameFromUrl(url) {
      const clean = String(url || '').split('?')[0];
      const slashIndex = clean.lastIndexOf('/');
      return slashIndex >= 0 ? clean.slice(slashIndex + 1) : clean;
    },

    normalizedPlaybackValue(value) {
      const text = String(value || '').trim();
      try {
        return decodeURIComponent(text).toLowerCase();
      } catch {
        return text.toLowerCase();
      }
    },

    playbackMatchesCurrent(device, url) {
      const currentValues = [
        device.audioNowPlayingUrl,
        device.audioNowPlaying,
      ]
        .map(value => this.normalizedPlaybackValue(value))
        .filter(Boolean);

      const presetUrl = this.normalizedPlaybackValue(url);
      const presetEndpoint = this.normalizedPlaybackValue(this.endpointNameFromUrl(url));

      return currentValues.some(value => value === presetUrl || value === presetEndpoint);
    },

    savedNowPlayingLabel(device) {
      const streamPreset = this.schedulerAudioUrls.find(preset => this.playbackMatchesCurrent(device, preset.url));
      if (streamPreset?.name) return streamPreset.name;

      const playlistPreset = this.schedulerPlaylists.find(playlist => (playlist.urls || []).some(url => this.playbackMatchesCurrent(device, url)));
      if (playlistPreset?.name) return playlistPreset.name;

      return '';
    },

    nowPlayingLabel(device) {
      if (!device.available) return 'Offline';
      return this.savedNowPlayingLabel(device) || device.audioNowPlaying || '—';
    },

    async startAvailabilityCheck() {
      const intervalMs = 10000;

      const pingDevice = async (device) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        try {
          const res = await fetch(`http://localhost:3000/proxy/${device.ip}/status`, {
            signal: controller.signal
          });
          if (!res.ok) {
            this.applyModuleStatus(device, null);
            return false;
          }

          const moduleStatus = await this.readModuleStatus(res);
          this.applyModuleStatus(device, moduleStatus);
          return true;
        } catch {
          this.applyModuleStatus(device, null);
          return false;
          } finally {
          clearTimeout(timeout);
        }
      };

      const check = async () => {
        const tasks = this.devices.map(async (device) => {
          const available = await pingDevice(device);
          device.available = available;
        });
        await Promise.allSettled(tasks);
      };

      await check();
      this.checkInterval = setInterval(check, intervalMs);
    },

    startSchedulerRunner() {
      const intervalMs = 10000;
      const check = () => this.runDueSchedulerEvents();

      check();
      this.schedulerInterval = setInterval(check, intervalMs);
    },

    getSchedulerNow() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`
      };
    },

    getScheduledTargetDevices(dayScheduler) {
      if (dayScheduler.targetType === 'device') {
        return this.devices.filter(device => device.ip === dayScheduler.targetDeviceIp && device.available);
      }

      const targetGroups = Array.isArray(dayScheduler.targetGroups) ? dayScheduler.targetGroups : [];
      return this.devices.filter((device) => {
        if (!device.available) return false;
        if (targetGroups.includes('All')) return true;
        if (targetGroups.includes('NoGroup') && !device.group) return true;
        return targetGroups.includes(device.group);
      });
    },

    normalizeScheduler(scheduler) {
      return {
        audioUrls: Array.isArray(scheduler?.audioUrls) ? scheduler.audioUrls : [],
        playlists: Array.isArray(scheduler?.playlists) ? scheduler.playlists : [],
        events: Array.isArray(scheduler?.events) ? scheduler.events : [],
        daySchedulers: Array.isArray(scheduler?.daySchedulers) ? scheduler.daySchedulers : [],
        calendarAssignments: Array.isArray(scheduler?.calendarAssignments) ? scheduler.calendarAssignments : []
      };
    },

    schedulerHasData(scheduler) {
      return Boolean(
        scheduler?.audioUrls?.length ||
        scheduler?.playlists?.length ||
        scheduler?.daySchedulers?.length ||
        scheduler?.calendarAssignments?.length
      );
    },

    loadSchedulerBackup() {
      try {
        const rawScheduler = window.localStorage.getItem(SCHEDULER_FALLBACK_KEY);
        return rawScheduler ? JSON.parse(rawScheduler) : null;
      } catch (error) {
        console.error('Failed to load scheduler backup for runner:', error);
        return null;
      }
    },

    async loadSchedulerForRunner() {
      let scheduler = null;

      try {
        scheduler = await window.storageAPI.loadScheduler?.();
      } catch (error) {
        console.error('Failed to load scheduler events:', error);
      }

      const normalizedScheduler = this.normalizeScheduler(scheduler);
      const backupScheduler = this.normalizeScheduler(this.loadSchedulerBackup());

      if (normalizedScheduler.calendarAssignments.length > 0 || normalizedScheduler.daySchedulers.length > 0) return normalizedScheduler;
      if (backupScheduler.calendarAssignments.length > 0 || backupScheduler.daySchedulers.length > 0) return backupScheduler;
      if (this.schedulerHasData(normalizedScheduler)) return normalizedScheduler;
      if (this.schedulerHasData(backupScheduler)) return backupScheduler;

      return normalizedScheduler;
    },

    async runDueSchedulerEvents() {
      if (this.schedulerCheckRunning) return;
      this.schedulerCheckRunning = true;

      try {
        const scheduler = await this.loadSchedulerForRunner();
        const { date, time } = this.getSchedulerNow();
        const assignment = scheduler.calendarAssignments.find(item => item.date === date);
        if (!assignment || !Array.isArray(assignment.schedulerIds)) return;

        for (const daySchedulerId of assignment.schedulerIds) {
          const dayScheduler = scheduler.daySchedulers.find(item => item.id === daySchedulerId);
          if (!dayScheduler || !Array.isArray(dayScheduler.events)) continue;

          const dueEvents = dayScheduler.events.filter(event => event.time === time);
          for (const event of dueEvents) {
            const executionKey = `${dayScheduler.id}:${event.id}:${date}:${time}`;
            if (this.executedScheduledEvents.has(executionKey)) continue;

            const didAttempt = await this.executeScheduledEvent(event, dayScheduler, scheduler);
            if (didAttempt) {
              this.executedScheduledEvents.add(executionKey);
            }
          }
        }
      } finally {
        this.schedulerCheckRunning = false;
      }
    },

    async executeScheduledEvent(event, dayScheduler, scheduler) {
      const targetDevices = this.getScheduledTargetDevices(dayScheduler);
      if (targetDevices.length === 0) return false;

      for (const device of targetDevices) {
        await this.sendScheduledAction(device, event, scheduler);
      }

      return true;
    },

    async sendScheduledAction(device, event, scheduler) {
      try {
        if (event.action === 'setAudioUrl') {
          const preset = scheduler.audioUrls?.find(item => item.id === event.audioUrlId);
          if (!preset?.url) return;

          await this.sendScheduledAudioUrl(device, preset.url);
          return;
        }

        if (event.action === 'playlist') {
          const playlist = scheduler.playlists?.find(item => item.id === event.playlistId);
          if (!playlist?.urls?.length) return;

          await this.sendScheduledPlaylist(device, playlist);
          return;
        }

        if (event.action === 'play' || event.action === 'pause') {
          await this.sendScheduledAudioCommand(device, event.action);
        }
      } catch (error) {
        console.warn(`Scheduled ${event.action} failed on ${device.ip}:`, error);
      }
    },

    async sendScheduledAudioUrl(device, url) {
      const encodedUrl = encodeURIComponent(url);
      const response = await fetch(`http://localhost:3000/proxy/${device.ip}/audio/seturl?url=${encodedUrl}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
    },

    async sendScheduledPlaylist(device, playlist) {
      const response = await fetch(`http://localhost:3000/proxy/${device.ip}/audio/playlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: playlist.urls,
          returnToPrevious: playlist.returnToPrevious !== false,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
    },

    async sendScheduledAudioCommand(device, command) {
      const response = await fetch(`http://localhost:3000/proxy/${device.ip}/audio/${command}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
    },

    async removeDevice(device) {
      console.log('Removing device with MAC:', device.mac);
      await window.storageAPI.removeModule?.(device.mac);
      await this.loadDevices(); // перезагружаешь из JSON
      this.checkedDevices = this.checkedDevices.filter(mac => mac !== device.mac);
    },

    async removeChecked() {
      const confirmed = window.confirm('Are you sure you want to remove the selected devices?');
      if (!confirmed) return;
      for (const mac of this.checkedDevices) {
        console.log('Removing checked device with MAC:', mac);
        await window.storageAPI.removeModule?.(mac);
      }
      await this.loadDevices();
      this.checkedDevices = [];
    },
    //async created() {
     // this.availableGroups = await window.storageAPI.loadGroups();
    //},

    selectGroup(group) {
      this.selectedGroup = group
      this.selectedDevice = null
    },

    selectDevice(device) {
      this.selectedDevice = device
    },
    loadAllDevices() {
      this.selectedGroup = 'All';
      this.loadDevices();
    },

    
    openLogPass(device) {
      alert(`Open Log\\Pass for ${device.name}`)
    },

    openLogPass(device) {
      this.logPassDevice = device;
      this.showLogPassDialog = true;
    },
    openLogPassChecked() {
    if (this.checkedDevices.length === 0) return;
      this.logPassCheckedDevices = [...this.checkedDevices]; // сохраняешь MAC-адреса
      this.showLogPassCheckedDialog = true;
    },
    openSetAuthForChecked() {
      this.selectedAdminDevices = this.selectedDevices;
      if (this.selectedAdminDevices.length === 0) {
        alert('No devices selected');
        return;
      }
      this.showSetAdminAuthDialog = true;
    },
    openSetUsersForChecked() {
      if (this.checkedDevices.length === 0) return;
      this.usersPassCheckedDevices = this.devices.filter(d => this.checkedDevices.includes(d.mac));
      this.showUsersPassCheckedDialog = true;
    },
    toggleCheckAll() {
      if (this.isAllChecked) {
        this.checkedDevices = [];
      } else {
        this.checkedDevices = this.filteredManageDevices.map(d => d.mac);
      }
    },
    openGroupDialog(action) {
      this.groupAction = action;
      this.showGroupDialog = true;
    },
    async handleGroupConfirm(groupName) {
      this.showGroupDialog = false;

      if (this.groupAction === 'new') {
        if (!this.availableGroups.includes(groupName)) {
          this.availableGroups.push(groupName);
          ///console.log('[Saving] Groups (new):', this.availableGroups);
          const plainGroups = JSON.parse(JSON.stringify(this.availableGroups));
          console.log('[Saving] Plain Groups:', plainGroups);
          await window.storageAPI.setGroups(plainGroups);
          alert(`✅ Group "${groupName}" created!`);
        } else {
          alert(`⚠️ Group "${groupName}" already exists.`);
        }
      }

      if (this.groupAction === 'delete') {
        this.availableGroups = this.availableGroups.filter(g => g !== groupName);
        console.log('[Saving] Groups (delete):', this.availableGroups);
        await window.storageAPI.setGroups(JSON.parse(JSON.stringify(this.availableGroups)));
        // Снимаем группу у устройств
        for (const device of this.devices) {
          if (device.group === groupName) {
            device.group = '';
            await window.storageAPI.upsertModule(JSON.parse(JSON.stringify(device)));
          }
        }
        alert(`🗑️ Group "${groupName}" deleted!`);
        await this.loadDevices();
      }

      if (this.groupAction === 'assign') {
        for (const mac of this.checkedDevices) {
          const device = this.devices.find(d => d.mac === mac);
          if (device) {
            device.group = groupName;
            await window.storageAPI.upsertModule(JSON.parse(JSON.stringify(device)));
          }
        }
        if (!this.availableGroups.includes(groupName)) {
          this.availableGroups.push(groupName);
          await window.storageAPI.setGroups(JSON.parse(JSON.stringify(this.availableGroups)));
        }
        alert(`✅ Devices assigned to "${groupName}"`);
        await this.loadDevices();
        this.checkedDevices = [];
      }

      if (this.groupAction === 'remove') {
        for (const mac of this.checkedDevices) {
          const device = this.devices.find(d => d.mac === mac);
          if (device) {
            device.group = '';
            await window.storageAPI.upsertModule(JSON.parse(JSON.stringify(device)));
          }
        }
        alert(`✅ Group removed from selected devices!`);
        await this.loadDevices();
        this.checkedDevices = [];
      }
    },
    async loadGroups() {
      try {
        const storedGroups = await window.storageAPI.getGroups?.();
        const groups = Array.isArray(storedGroups) ? storedGroups : [];
        this.availableGroups = Array.from(new Set([...groups, ...this.allGroups])).sort();
        console.log('[loadGroups] Loaded:', JSON.parse(JSON.stringify(this.availableGroups)));
      } catch (error) {
        console.error('Failed to load groups:', error);
        this.availableGroups = Array.from(new Set(this.allGroups)).sort();
      }
    },
    async toggleGroupsPanel() {
      this.showGroupsPanel = !this.showGroupsPanel;
      this.showSchedulerPanel = false;
      if (this.showGroupsPanel) {
        await this.loadGroups();
      }
    },
    async handleAddDeviceClose(reload = false) {
      this.showAddDialog = false
      if (reload) {
        await this.loadDevices()   // ✅ вот так подтягивает новые устройства сразу
      }
    },
    openGroupControl() {
      this.showGroupControlDialog = true;
      this.loadSchedulerPresets();
    },
    closeGroupControl() {
      this.showGroupControlDialog = false;
    },

    async toggleSetAudioInline() {
      if (!this.selectedDevice) {
        alert('Select a module first in Control tab.');
        return;
      }
      this.showSetAudioInline = !this.showSetAudioInline;
      if (this.showSetAudioInline) {
        await this.loadSchedulerAudioUrls();
        if (!this.schedulerAudioUrls.some(preset => preset.url === this.selectedAudioUrl)) {
          this.selectedAudioUrl = '';
        }
      }
    },

    async toggleSetPlaylistInline() {
      if (!this.selectedDevice) {
        alert('Select a module first in Control tab.');
        return;
      }
      this.showSetPlaylistInline = !this.showSetPlaylistInline;
      if (this.showSetPlaylistInline) {
        await this.loadSchedulerPresets();
        if (!this.schedulerPlaylists.some(playlist => playlist.id === this.selectedPlaylistId)) {
          this.selectedPlaylistId = '';
        }
      }
    },    

    async loadSchedulerPresets() {
      try {
        const scheduler = await this.loadSchedulerForRunner();
        this.schedulerAudioUrls = Array.isArray(scheduler?.audioUrls) ? scheduler.audioUrls : [];
        this.schedulerPlaylists = Array.isArray(scheduler?.playlists) ? scheduler.playlists : [];
      } catch (error) {
        console.error('Failed to load scheduler presets:', error);
        this.schedulerAudioUrls = [];
        this.schedulerPlaylists = [];
      }
    },

    async sendAudioUrlToSelected() {
      if (!this.selectedDevice || !this.selectedAudioUrl) return;

      const encodedUrl = encodeURIComponent(this.selectedAudioUrl);
      try {
        const response = await fetch(`http://localhost:3000/proxy/${this.selectedDevice.ip}/audio/seturl?url=${encodedUrl}`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        alert(`✅ Audio URL sent to ${this.selectedDevice.name || this.selectedDevice.ip}`);
        this.showSetAudioInline = false;
      } catch (err) {
        console.error('Failed to set audio URL for selected module:', err);
        alert(`❌ Failed to send audio URL: ${err.message}`);
      }
    },

    async sendPlaylistToSelected() {
      if (!this.selectedDevice || !this.selectedPlaylistId) return;

      const playlist = this.schedulerPlaylists.find(item => item.id === this.selectedPlaylistId);
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
        alert(`✅ Playlist sent to ${this.selectedDevice.name || this.selectedDevice.ip}`);
        this.showSetPlaylistInline = false;
      } catch (err) {
        console.error('Failed to send playlist to selected module:', err);
        alert(`❌ Failed to send playlist: ${err.message}`);
      }
    },

    async importConfig(event) {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedData = JSON.parse(text);

        if (!Array.isArray(importedData)) {
          throw new Error("Imported file must be an array of devices");
        }

        const importedGroups = new Set();

        for (const item of importedData) {
          let mac = item.mac || item.macAddress;
          let ip = item.ip || item.ip_name;
          let name = item.name || item.deviceName || "Unnamed";

          if (!mac || !ip) {
            console.warn("Skipping invalid device:", item);
            continue;
          }

          const group = item.group || "";
          if (group) importedGroups.add(group);

          const device = {
            name,
            ip,
            mac,
            group,
            login: item.login || "",
            password: item.password || ""
          };

          await window.storageAPI.upsertModule(device);
        }

        // Загружаем текущие группы
        let existingGroups = await window.storageAPI.getGroups();
        if (!Array.isArray(existingGroups)) existingGroups = [];

        const updatedGroups = Array.from(new Set([...existingGroups, ...importedGroups]));

        await window.storageAPI.setGroups(updatedGroups);
        this.availableGroups = updatedGroups;

        alert("✅ Configuration imported successfully!");
        await this.loadDevices();

      } catch (err) {
        console.error("❌ Import error:", err);
        alert("❌ Failed to import configuration. Please check the file format.");
      }

      event.target.value = "";
    },

    async exportConfig() {
      const data = this.devices.map(device => {
        const base = {
          name: device.name,
          ip: device.ip,
          mac: device.mac,
          group: device.group || ""
        };

        if (this.includeCredentials) {
          base.login = device.login || "";
          base.password = device.password || "";
        }

        return base;
      });

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'config_export.json';
      a.click();
      URL.revokeObjectURL(url);
    },

  },
  async mounted() {
    await this.loadDevices()
    await this.loadGroups()
    await this.loadSchedulerPresets()
    await this.startAvailabilityCheck()
    this.startSchedulerRunner()
  },
  beforeUnmount() {
    if (this.checkInterval) clearInterval(this.checkInterval)
    if (this.schedulerInterval) clearInterval(this.schedulerInterval)
  }
}
</script>


<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Верхнее меню */
.top-nav {
  display: flex;
  background: #007bff;
  padding: 10px;
}

.top-nav button {
  color: white;
  background: transparent;
  border: none;
  margin-right: 10px;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 16px;
}

.top-nav button.active {
  background: #4aa0fc;
  border-radius: 4px;
}

/* Подменю (All / группы) */
.submenu {
  background: #f0f0f0;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.submenu button {
  margin-right: 4px;
  padding: 5px 4px;
  font-size: 14px;
  border: none;
  background: #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.submenu button.active {
  background: #bbb;
}

.inline-audio-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid #ddd;
}
.inline-audio-input {
  min-width: 320px;
  padding: 4px 6px;
}

/* Контейнер вкладок */
main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

/* Рабочее пространство: слева карточки, справа WebView */
.main-content.split {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* Левая панель с карточками */
.left-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
  border-right: 1px solid #ccc;
}

/* Правая панель с WebView */
.right-pane {
  flex: 2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

/* Карточки модулей */
.device-list {
  display: flex;
  flex-direction: column;
  gap: 5px;  /*между карточками*/
}

.device-card {
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 8px 10px; /* было 12px или больше — сделай компактнее */
  margin-bottom: 5px; /* если нужно уменьшить зазор между карточками */
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.device-card h4 {
  margin: 0 0 4px 0; /* убираем верхний/нижний отступ или ставим небольшой */
  font-size: 16px;   /* если нужно, можно сделать чуть меньше */
  line-height: 1.2;
}

.device-card.selected {
  border-color: #007bff;
  background: #e7f1ff;
}

/* WebView iframe */
.device-webview {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  position: relative;
  z-index: 1;
}
.secondary-info {
  font-size: 13px;
  color: #555;
  margin: 2px 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  font-size: 20px;
  color: red;
}

.status-indicator.online {
  color: green;
}
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2147483647;
}
.dialog {
  background: #fff;
  padding: 12px;
  width: 360px;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0,0,0,0.35);
}
.card-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
.card-actions button {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 6px 6px;
  border-radius: 4px;
  cursor: pointer;
}

.no-cards {
  text-align: center;
  font-style: italic;
  color: #777;
}
.group-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
}

.group-card {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 8px;
  background: #f9f9f9;
  cursor: pointer;
  transition: background 0.2s;
}

.group-card:hover {
  background: #eee;
}

.group-card.selected {
  background: #007bff;
  color: #fff;
  border-color: #007bff;
}

.search-input {
  margin-right: auto;
  padding: 6px 12px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #ccc;  
}

.config-buttons {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 500px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-description {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.import-label {
  cursor: pointer;
}
.config-section button {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 6px 6px;
  border-radius: 4px;
  cursor: pointer;
}

</style>

