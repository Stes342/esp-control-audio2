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
            Set Audio URL (selected)
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
          <strong>Selected:</strong> {{ selectedDevice?.name || selectedDevice?.ip || '—' }}
          <input
            type="text"
            v-model.trim="selectedAudioUrl"
            placeholder="https://..."
            class="inline-audio-input"
          />
          <button @click="sendAudioUrlToSelected" :disabled="!selectedAudioUrl || !selectedDevice">Send</button>
          <button @click="showSetAudioInline = false">Close</button>
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
          <button @click="showUserAccessDialog = true" :disabled="checkedDevices.length === 0">User Access on module</button>
          <button @click="toggleCheckAll">{{ isAllChecked ? 'Uncheck All' : 'Check All' }}</button>
          <button @click="showAddDialog = true">Add by IP</button>          
          <button @click="showGroupsPanel = !showGroupsPanel">Groups</button>
        </div>

        <div class="main-content split">
          <div class="left-pane">
            <div v-if="filteredManageDevices.length === 0" class="no-cards">
              No modules added
            </div>
            <div v-else class="device-list">
              <div
                v-for="device in filteredDevices"
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
            <div v-if="showGroupsPanel">
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
        .filter(device =>
          device.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          device.ip.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          device.mac.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
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
        .filter(device =>
          device.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          device.ip.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          device.mac.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
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

    async startAvailabilityCheck() {
      const intervalMs = 10000;

      const pingDevice = async (device) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        try {
          const res = await fetch(`http://localhost:3000/proxy/${device.ip}/status`, {
            signal: controller.signal
          });
          clearTimeout(timeout);
          return res.ok;
        } catch {
          return false;
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
      this.availableGroups = await window.storageAPI.getGroups();
      console.log('[loadGroups] Loaded:', JSON.parse(JSON.stringify(this.availableGroups)));
    },
    async handleAddDeviceClose(reload = false) {
      this.showAddDialog = false
      if (reload) {
        await this.loadDevices()   // ✅ вот так подтягивает новые устройства сразу
      }
    },
    openGroupControl() {
      this.showGroupControlDialog = true;
    },
    closeGroupControl() {
      this.showGroupControlDialog = false;
    },

    toggleSetAudioInline() {
      if (!this.selectedDevice) {
        alert('Select a module first in Control tab.');
        return;
      }
      this.showSetAudioInline = !this.showSetAudioInline;
      if (this.showSetAudioInline && !this.selectedAudioUrl) {
        this.selectedAudioUrl = '';
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
  mounted() {
    this.loadDevices()
    this.startAvailabilityCheck()
    this.loadGroups();
  },
  beforeUnmount() {
    if (this.checkInterval) clearInterval(this.checkInterval)
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

