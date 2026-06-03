<template>
  <div class="scheduler-panel">
    <h3>Scheduler</h3>

    <div class="scheduler-section">
      <h4>Audio stream URLs</h4>
      <div class="scheduler-form-row">
        <input type="text" v-model.trim="newAudioUrl.name" placeholder="Name" />
        <input type="text" v-model.trim="newAudioUrl.url" placeholder="https://..." />
        <button @click="addAudioUrlPreset" :disabled="!newAudioUrl.name || !newAudioUrl.url">Add</button>
      </div>
      <div v-if="scheduler.audioUrls.length === 0" class="scheduler-empty">No audio URL presets.</div>
      <div v-for="preset in scheduler.audioUrls" :key="preset.id" class="scheduler-item">
        <span><strong>{{ preset.name }}</strong> — {{ preset.url }}</span>
        <button @click="deleteAudioUrlPreset(preset.id)">Delete</button>
      </div>
    </div>

    <div class="scheduler-section">
      <h4>Playlist URLs</h4>
      <div class="scheduler-form-row">
        <input type="text" v-model.trim="newPlaylist.name" placeholder="Name" />
        <textarea v-model.trim="newPlaylist.urls" placeholder="https://.../001.mp3, https://.../002.mp3"></textarea>
        <button @click="addPlaylistPreset" :disabled="!newPlaylist.name || !newPlaylist.urls">Add</button>
      </div>
      <div v-if="scheduler.playlists.length === 0" class="scheduler-empty">No playlist presets.</div>
      <div v-for="playlist in scheduler.playlists" :key="playlist.id" class="scheduler-item">
        <div class="scheduler-item-content">
          <span><strong>{{ playlist.name }}</strong> — {{ playlist.urls.length }} URLs</span>
          <details class="scheduler-url-list">
            <summary>Show files</summary>
            <ol>
              <li v-for="url in playlist.urls" :key="url">{{ url }}</li>
            </ol>
          </details>
        </div>
        <button @click="deletePlaylistPreset(playlist.id)">Delete</button>
      </div>
    </div>

    <div class="scheduler-section">
      <h4>Schedulers</h4>
      <div class="scheduler-form-row">
        <input type="text" v-model.trim="newDaySchedulerName" placeholder="Scheduler name" />
        <button @click="addDayScheduler" :disabled="!newDaySchedulerName">Add scheduler</button>
      </div>
      <div v-if="scheduler.daySchedulers.length === 0" class="scheduler-empty">No schedulers.</div>
      <div v-for="dayScheduler in scheduler.daySchedulers" :key="dayScheduler.id" class="scheduler-item">
        <button class="scheduler-select-button" @click="selectDayScheduler(dayScheduler.id)">
          <span class="scheduler-dot" :style="{ backgroundColor: dayScheduler.color }"></span>
          <strong>{{ dayScheduler.name }}</strong>
        </button>
        <button @click="deleteDayScheduler(dayScheduler.id)">Delete</button>
      </div>

      <div v-if="selectedDayScheduler" class="scheduler-editor">
        <h5>Edit scheduler: {{ selectedDayScheduler.name }}</h5>
        <div class="scheduler-form-row">
          <input type="text" v-model.trim="selectedDayScheduler.name" placeholder="Scheduler name" @change="saveScheduler" />
          <input type="color" v-model="selectedDayScheduler.color" @change="saveScheduler" />
        </div>

        <div class="scheduler-form-row">
          <label>
            <input type="radio" value="groups" v-model="selectedDayScheduler.targetType" @change="saveScheduler" />
            Groups
          </label>
          <label>
            <input type="radio" value="device" v-model="selectedDayScheduler.targetType" @change="saveScheduler" />
            Device
          </label>
        </div>

        <div v-if="selectedDayScheduler.targetType === 'groups'" class="scheduler-checkboxes">
          <label v-for="group in groupOptions" :key="group.value">
            <input type="checkbox" :value="group.value" v-model="selectedDayScheduler.targetGroups" @change="saveScheduler" />
            {{ group.label }}
          </label>
        </div>
        <div v-else class="scheduler-form-row">
          <select v-model="selectedDayScheduler.targetDeviceIp" @change="saveScheduler">
            <option value="">Select device</option>
            <option v-for="device in devices" :key="device.ip" :value="device.ip">
              {{ device.name || device.ip }} ({{ device.ip }})
            </option>
          </select>
        </div>

        <div class="scheduler-form-row scheduler-event-form">
          <input type="time" v-model="newSchedulerEvent.time" />
          <select v-model="newSchedulerEvent.action">
            <option value="setAudioUrl">Audio URL</option>
            <option value="playlist">Playlist</option>
            <option value="play">Play</option>
            <option value="pause">Pause</option>
          </select>
          <select v-if="newSchedulerEvent.action === 'setAudioUrl'" v-model="newSchedulerEvent.audioUrlId">
            <option value="">Select audio URL</option>
            <option v-for="preset in scheduler.audioUrls" :key="preset.id" :value="preset.id">{{ preset.name }}</option>
          </select>
          <select v-if="newSchedulerEvent.action === 'playlist'" v-model="newSchedulerEvent.playlistId">
            <option value="">Select playlist</option>
            <option v-for="playlist in scheduler.playlists" :key="playlist.id" :value="playlist.id">{{ playlist.name }}</option>
          </select>
          <button @click="addSchedulerEvent" :disabled="!canAddSchedulerEvent">Add event</button>
        </div>

        <div v-if="selectedDayScheduler.events.length === 0" class="scheduler-empty">No events in this scheduler.</div>
        <table v-else class="scheduler-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in selectedSchedulerEvents" :key="event.id">
              <td>{{ event.time }}</td>
              <td>{{ actionLabel(event.action) }}</td>
              <td>{{ eventValueLabel(event) }}</td>
              <td><button @click="deleteSchedulerEvent(event.id)">Delete</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="scheduler-section">
      <h4>Calendar</h4>
      <div class="scheduler-form-row">
        <button @click="changeCalendarMonth(-1)">‹</button>
        <input type="month" v-model="calendarMonth" />
        <button @click="changeCalendarMonth(1)">›</button>
      </div>
      <div class="calendar-grid calendar-weekdays">
        <div v-for="day in weekDays" :key="day">{{ day }}</div>
      </div>
      <div class="calendar-grid">
        <button
          v-for="day in calendarDays"
          :key="day.key"
          class="calendar-day"
          :class="{ blank: !day.date }"
          :disabled="!day.date"
          @click="openCalendarDay(day.date)"
        >
          <span class="calendar-day-number">{{ day.day }}</span>
          <span class="calendar-dots">
            <span
              v-for="dayScheduler in schedulersForDate(day.date).slice(0, 6)"
              :key="dayScheduler.id"
              class="scheduler-dot"
              :title="dayScheduler.name"
              :style="{ backgroundColor: dayScheduler.color }"
            ></span>
          </span>
        </button>
      </div>
    </div>

    <div v-if="selectedCalendarDate" class="scheduler-section">
      <h4>Day assignments: {{ selectedCalendarDate }}</h4>
      <div v-if="scheduler.daySchedulers.length === 0" class="scheduler-empty">Create a scheduler first.</div>
      <div v-else class="scheduler-checkboxes">
        <label v-for="dayScheduler in scheduler.daySchedulers" :key="dayScheduler.id" :class="{ conflict: schedulerConflictMessage(dayScheduler.id) }">
          <input
            type="checkbox"
            :value="dayScheduler.id"
            v-model="draftAssignmentSchedulerIds"
            :disabled="Boolean(schedulerConflictMessage(dayScheduler.id))"
          />
          <span class="scheduler-dot" :style="{ backgroundColor: dayScheduler.color }"></span>
          {{ dayScheduler.name }}
          <span v-if="schedulerConflictMessage(dayScheduler.id)"> — {{ schedulerConflictMessage(dayScheduler.id) }}</span>
        </label>
      </div>
      <div class="scheduler-form-row">
        <button @click="saveCalendarDayAssignment">Save day</button>
        <button @click="selectedCalendarDate = ''">Close</button>
      </div>
      <div class="scheduler-empty">Copy uses replace: target days/months get exactly this day's schedulers.</div>
      <div class="scheduler-copy-days">
        <label v-for="day in selectableCopyDays" :key="day.date">
          <input type="checkbox" :value="day.date" v-model="copyTargetDates" />
          {{ day.day }}
        </label>
      </div>
      <div class="scheduler-form-row">
        <button @click="copySelectedDayToDates" :disabled="copyTargetDates.length === 0">Copy to checked days</button>
        <button @click="copySelectedDayToMonth">Copy to whole month</button>
      </div>
    </div>

    <div class="scheduler-section">
      <h4>Copy month</h4>
      <div class="scheduler-empty">Copy current month to selected next months. Existing assignments in target months are replaced.</div>
      <div class="scheduler-copy-days">
        <label v-for="month in copyMonthOptions" :key="month.value">
          <input type="checkbox" :value="month.value" v-model="copyTargetMonths" />
          {{ month.label }}
        </label>
      </div>
      <button @click="copyCurrentMonthToMonths" :disabled="copyTargetMonths.length === 0">Copy month to checked months</button>
    </div>
  </div>
</template>

<script>
function createEmptyScheduler() {
  return {
    audioUrls: [],
    playlists: [],
    events: [],
    daySchedulers: [],
    calendarAssignments: []
  };
}

const SCHEDULER_FALLBACK_KEY = 'espControlScheduler';
const SCHEDULER_COLORS = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1', '#17a2b8', '#fd7e14', '#20c997'];

function todayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default {
  name: 'SchedulerPanel',
  props: {
    devices: {
      type: Array,
      default: () => []
    },
    allGroups: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      scheduler: createEmptyScheduler(),
      calendarMonth: todayDate().slice(0, 7),
      selectedCalendarDate: '',
      selectedDaySchedulerId: '',
      draftAssignmentSchedulerIds: [],
      copyTargetDates: [],
      copyTargetMonths: [],
      newDaySchedulerName: '',
      newAudioUrl: {
        name: '',
        url: ''
      },
      newPlaylist: {
        name: '',
        urls: ''
      },
      newSchedulerEvent: {
        time: '08:00',
        action: 'setAudioUrl',
        audioUrlId: '',
        playlistId: ''
      }
    };
  },
  computed: {
    weekDays() {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    },
    groupOptions() {
      return [
        { value: 'All', label: 'All' },
        { value: 'NoGroup', label: 'No Group' },
        ...this.allGroups.map(group => ({ value: group, label: group }))
      ];
    },
    selectedDayScheduler() {
      return this.scheduler.daySchedulers.find(item => item.id === this.selectedDaySchedulerId) || null;
    },
    selectedSchedulerEvents() {
      return (this.selectedDayScheduler?.events || [])
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time));
    },
    canAddSchedulerEvent() {
      if (!this.selectedDayScheduler || !this.newSchedulerEvent.time || !this.newSchedulerEvent.action) return false;
      if (this.newSchedulerEvent.action === 'setAudioUrl') return Boolean(this.newSchedulerEvent.audioUrlId);
      if (this.newSchedulerEvent.action === 'playlist') return Boolean(this.newSchedulerEvent.playlistId);
      return true;
    },
    calendarDays() {
      const [year, month] = this.calendarMonth.split('-').map(Number);
      const firstDay = new Date(year, month - 1, 1);
      const daysCount = this.daysInMonth(this.calendarMonth);
      const startOffset = (firstDay.getDay() + 6) % 7;
      const days = [];

      for (let index = 0; index < startOffset; index += 1) {
        days.push({ key: `blank_${index}`, date: '', day: '' });
      }

      for (let day = 1; day <= daysCount; day += 1) {
        const date = this.dateForMonthDay(this.calendarMonth, day);
        days.push({ key: date, date, day });
      }

      return days;
    },
    selectableCopyDays() {
      return this.calendarDays.filter(day => day.date && day.date !== this.selectedCalendarDate);
    },
    copyMonthOptions() {
      const [year, month] = this.calendarMonth.split('-').map(Number);
      const options = [];
      for (let offset = 1; offset <= 12; offset += 1) {
        const next = new Date(year, month - 1 + offset, 1);
        const value = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
        options.push({ value, label: value });
      }
      return options;
    }
  },
  async mounted() {
    await this.loadScheduler();
  },
  watch: {
    'newSchedulerEvent.action'(action) {
      if (action !== 'setAudioUrl') this.newSchedulerEvent.audioUrlId = '';
      if (action !== 'playlist') this.newSchedulerEvent.playlistId = '';
    },
    selectedDayScheduler: {
      handler() {
        this.ensureSelectedSchedulerDefaults();
      },
      deep: false
    }
  },
  methods: {
    createId(prefix) {
      return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    },
    normalizeScheduler(scheduler) {
      return {
        audioUrls: Array.isArray(scheduler?.audioUrls) ? scheduler.audioUrls : [],
        playlists: Array.isArray(scheduler?.playlists) ? scheduler.playlists : [],
        events: Array.isArray(scheduler?.events) ? scheduler.events : [],
        daySchedulers: Array.isArray(scheduler?.daySchedulers)
          ? scheduler.daySchedulers.map(item => ({
              id: item.id || this.createId('scheduler'),
              name: item.name || 'Scheduler',
              color: item.color || this.nextSchedulerColor(),
              targetType: item.targetType === 'device' ? 'device' : 'groups',
              targetGroups: Array.isArray(item.targetGroups) ? item.targetGroups : [],
              targetDeviceIp: item.targetDeviceIp || '',
              events: Array.isArray(item.events) ? item.events : []
            }))
          : [],
        calendarAssignments: Array.isArray(scheduler?.calendarAssignments)
          ? scheduler.calendarAssignments.map(item => ({
              date: item.date,
              schedulerIds: Array.isArray(item.schedulerIds) ? item.schedulerIds : []
            })).filter(item => item.date)
          : []
      };
    },
    loadLocalSchedulerBackup() {
      try {
        const rawScheduler = window.localStorage.getItem(SCHEDULER_FALLBACK_KEY);
        return rawScheduler ? JSON.parse(rawScheduler) : null;
      } catch (error) {
        console.error('Failed to load local scheduler backup:', error);
        return null;
      }
    },
    saveLocalSchedulerBackup(scheduler) {
      try {
        window.localStorage.setItem(SCHEDULER_FALLBACK_KEY, JSON.stringify(scheduler));
      } catch (error) {
        console.error('Failed to save local scheduler backup:', error);
      }
    },
    schedulerHasData(scheduler) {
      return Boolean(
        scheduler?.audioUrls?.length ||
        scheduler?.playlists?.length ||
        scheduler?.daySchedulers?.length ||
        scheduler?.calendarAssignments?.length
      );
    },
    async loadScheduler() {
      let scheduler = null;

      try {
        if (window.storageAPI?.loadScheduler) {
          scheduler = await window.storageAPI.loadScheduler();
        }
      } catch (error) {
        console.error('Failed to load scheduler from storage:', error);
      }

      const localBackup = this.loadLocalSchedulerBackup();
      const normalizedScheduler = this.normalizeScheduler(scheduler);

      if (!this.schedulerHasData(normalizedScheduler) && this.schedulerHasData(localBackup)) {
        this.scheduler = this.normalizeScheduler(localBackup);
        await this.saveScheduler();
        return;
      }

      this.scheduler = normalizedScheduler;
      this.saveLocalSchedulerBackup(this.scheduler);
      if (!this.selectedDaySchedulerId && this.scheduler.daySchedulers[0]) {
        this.selectedDaySchedulerId = this.scheduler.daySchedulers[0].id;
      }
    },
    async saveScheduler() {
      const scheduler = JSON.parse(JSON.stringify(this.scheduler));
      try {
        if (!window.storageAPI?.saveScheduler) {
          throw new Error('window.storageAPI.saveScheduler is not available');
        }

        await window.storageAPI.saveScheduler(scheduler);
      } catch (error) {
        console.error('Failed to save scheduler to storage:', error);
      } finally {
        this.saveLocalSchedulerBackup(scheduler);
      }
    },
    nextSchedulerColor() {
      return SCHEDULER_COLORS[this.scheduler.daySchedulers.length % SCHEDULER_COLORS.length];
    },
    ensureSelectedSchedulerDefaults() {
      if (!this.selectedDayScheduler) return;
      if (!Array.isArray(this.selectedDayScheduler.targetGroups)) this.selectedDayScheduler.targetGroups = [];
      if (!Array.isArray(this.selectedDayScheduler.events)) this.selectedDayScheduler.events = [];
      if (!this.selectedDayScheduler.color) this.selectedDayScheduler.color = this.nextSchedulerColor();
    },
    async addAudioUrlPreset() {
      this.scheduler.audioUrls.push({
        id: this.createId('audio'),
        name: this.newAudioUrl.name,
        url: this.newAudioUrl.url
      });
      this.newAudioUrl = { name: '', url: '' };
      await this.saveScheduler();
    },
    async deleteAudioUrlPreset(id) {
      this.scheduler.audioUrls = this.scheduler.audioUrls.filter(preset => preset.id !== id);
      this.scheduler.daySchedulers.forEach((dayScheduler) => {
        dayScheduler.events = dayScheduler.events.filter(event => event.audioUrlId !== id);
      });
      await this.saveScheduler();
    },
    async addPlaylistPreset() {
      const urls = this.newPlaylist.urls
        .split(',')
        .map(url => url.trim())
        .filter(Boolean);

      if (urls.length === 0) return;

      this.scheduler.playlists.push({
        id: this.createId('playlist'),
        name: this.newPlaylist.name,
        urls,
        returnToPrevious: true
      });
      this.newPlaylist = { name: '', urls: '' };
      await this.saveScheduler();
    },
    async deletePlaylistPreset(id) {
      this.scheduler.playlists = this.scheduler.playlists.filter(playlist => playlist.id !== id);
      this.scheduler.daySchedulers.forEach((dayScheduler) => {
        dayScheduler.events = dayScheduler.events.filter(event => event.playlistId !== id);
      });
      await this.saveScheduler();
    },
    async addDayScheduler() {
      const scheduler = {
        id: this.createId('scheduler'),
        name: this.newDaySchedulerName,
        color: this.nextSchedulerColor(),
        targetType: 'groups',
        targetGroups: ['All'],
        targetDeviceIp: '',
        events: []
      };
      this.scheduler.daySchedulers.push(scheduler);
      this.selectedDaySchedulerId = scheduler.id;
      this.newDaySchedulerName = '';
      await this.saveScheduler();
    },
    selectDayScheduler(id) {
      this.selectedDaySchedulerId = id;
    },
    async deleteDayScheduler(id) {
      this.scheduler.daySchedulers = this.scheduler.daySchedulers.filter(item => item.id !== id);
      this.scheduler.calendarAssignments = this.scheduler.calendarAssignments
        .map(assignment => ({
          ...assignment,
          schedulerIds: assignment.schedulerIds.filter(schedulerId => schedulerId !== id)
        }))
        .filter(assignment => assignment.schedulerIds.length > 0);
      if (this.selectedDaySchedulerId === id) {
        this.selectedDaySchedulerId = this.scheduler.daySchedulers[0]?.id || '';
      }
      await this.saveScheduler();
    },
    async addSchedulerEvent() {
      if (!this.canAddSchedulerEvent) return;
      if (this.selectedDayScheduler.events.some(event => event.time === this.newSchedulerEvent.time)) {
        alert('This scheduler already has an event at this time. Use another minute.');
        return;
      }

      this.selectedDayScheduler.events.push({
        id: this.createId('event'),
        time: this.newSchedulerEvent.time,
        action: this.newSchedulerEvent.action,
        audioUrlId: this.newSchedulerEvent.action === 'setAudioUrl' ? this.newSchedulerEvent.audioUrlId : '',
        playlistId: this.newSchedulerEvent.action === 'playlist' ? this.newSchedulerEvent.playlistId : ''
      });
      await this.saveScheduler();
    },
    async deleteSchedulerEvent(id) {
      if (!this.selectedDayScheduler) return;
      this.selectedDayScheduler.events = this.selectedDayScheduler.events.filter(event => event.id !== id);
      await this.saveScheduler();
    },
    daysInMonth(monthValue) {
      const [year, month] = monthValue.split('-').map(Number);
      return new Date(year, month, 0).getDate();
    },
    dateForMonthDay(monthValue, day) {
      return `${monthValue}-${String(day).padStart(2, '0')}`;
    },
    changeCalendarMonth(offset) {
      const [year, month] = this.calendarMonth.split('-').map(Number);
      const next = new Date(year, month - 1 + offset, 1);
      this.calendarMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
      this.selectedCalendarDate = '';
      this.copyTargetDates = [];
      this.copyTargetMonths = [];
    },
    findAssignment(date) {
      return this.scheduler.calendarAssignments.find(assignment => assignment.date === date) || null;
    },
    schedulersForDate(date) {
      if (!date) return [];
      const assignment = this.findAssignment(date);
      if (!assignment) return [];
      return assignment.schedulerIds
        .map(id => this.scheduler.daySchedulers.find(dayScheduler => dayScheduler.id === id))
        .filter(Boolean);
    },
    openCalendarDay(date) {
      this.selectedCalendarDate = date;
      this.draftAssignmentSchedulerIds = this.schedulersForDate(date).map(dayScheduler => dayScheduler.id);
      this.copyTargetDates = [];
    },
    async saveCalendarDayAssignment() {
      if (!this.selectedCalendarDate) return;
      const conflict = this.findAssignmentConflict(this.draftAssignmentSchedulerIds);
      if (conflict) {
        alert(conflict);
        return;
      }
      this.setAssignment(this.selectedCalendarDate, this.draftAssignmentSchedulerIds);
      await this.saveScheduler();
    },
    setAssignment(date, schedulerIds) {
      const cleanIds = Array.from(new Set(schedulerIds));
      this.scheduler.calendarAssignments = this.scheduler.calendarAssignments.filter(assignment => assignment.date !== date);
      if (cleanIds.length > 0) {
        this.scheduler.calendarAssignments.push({ date, schedulerIds: cleanIds });
      }
    },
    schedulerConflictMessage(candidateId) {
      if (this.draftAssignmentSchedulerIds.includes(candidateId)) return '';
      const candidate = this.scheduler.daySchedulers.find(item => item.id === candidateId);
      if (!candidate) return '';

      for (const selectedId of this.draftAssignmentSchedulerIds) {
        const selected = this.scheduler.daySchedulers.find(item => item.id === selectedId);
        if (selected && this.schedulersConflict(candidate, selected)) {
          return `Conflict with ${selected.name}`;
        }
      }

      return '';
    },
    findAssignmentConflict(schedulerIds) {
      for (let i = 0; i < schedulerIds.length; i += 1) {
        const first = this.scheduler.daySchedulers.find(item => item.id === schedulerIds[i]);
        if (!first) continue;
        for (let j = i + 1; j < schedulerIds.length; j += 1) {
          const second = this.scheduler.daySchedulers.find(item => item.id === schedulerIds[j]);
          if (second && this.schedulersConflict(first, second)) {
            return `Scheduler target conflict: ${first.name} and ${second.name}`;
          }
        }
      }
      return '';
    },
    schedulerHasAllTarget(dayScheduler) {
      return dayScheduler.targetType === 'groups' && dayScheduler.targetGroups.includes('All');
    },
    schedulersConflict(first, second) {
      if (this.schedulerHasAllTarget(first) || this.schedulerHasAllTarget(second)) return true;
      if (first.targetType === 'device' && second.targetType === 'device') {
        return Boolean(first.targetDeviceIp && first.targetDeviceIp === second.targetDeviceIp);
      }
      if (first.targetType === 'groups' && second.targetType === 'groups') {
        return first.targetGroups.some(group => second.targetGroups.includes(group));
      }
      const groupScheduler = first.targetType === 'groups' ? first : second;
      const deviceScheduler = first.targetType === 'device' ? first : second;
      const device = this.devices.find(item => item.ip === deviceScheduler.targetDeviceIp);
      if (!device) return false;
      if (groupScheduler.targetGroups.includes('NoGroup') && !device.group) return true;
      return groupScheduler.targetGroups.includes(device.group);
    },
    async copySelectedDayToDates() {
      if (!this.selectedCalendarDate || this.copyTargetDates.length === 0) return;
      const sourceIds = this.draftAssignmentSchedulerIds.slice();
      const conflict = this.findAssignmentConflict(sourceIds);
      if (conflict) {
        alert(conflict);
        return;
      }
      for (const date of this.copyTargetDates) {
        this.setAssignment(date, sourceIds);
      }
      await this.saveScheduler();
    },
    async copySelectedDayToMonth() {
      if (!this.selectedCalendarDate) return;
      const sourceIds = this.draftAssignmentSchedulerIds.slice();
      const conflict = this.findAssignmentConflict(sourceIds);
      if (conflict) {
        alert(conflict);
        return;
      }
      const daysCount = this.daysInMonth(this.calendarMonth);
      for (let day = 1; day <= daysCount; day += 1) {
        this.setAssignment(this.dateForMonthDay(this.calendarMonth, day), sourceIds);
      }
      await this.saveScheduler();
    },
    async copyCurrentMonthToMonths() {
      if (this.copyTargetMonths.length === 0) return;
      const sourceAssignments = this.scheduler.calendarAssignments.filter(assignment => assignment.date?.startsWith(`${this.calendarMonth}-`));
      for (const targetMonth of this.copyTargetMonths) {
        this.scheduler.calendarAssignments = this.scheduler.calendarAssignments.filter(assignment => !assignment.date?.startsWith(`${targetMonth}-`));
        const daysCount = this.daysInMonth(targetMonth);
        for (const assignment of sourceAssignments) {
          const sourceDay = Number(assignment.date.slice(8, 10));
          if (sourceDay > daysCount) continue;
          this.scheduler.calendarAssignments.push({
            date: this.dateForMonthDay(targetMonth, sourceDay),
            schedulerIds: assignment.schedulerIds.slice()
          });
        }
      }
      this.copyTargetMonths = [];
      await this.saveScheduler();
    },
    actionLabel(action) {
      const labels = {
        setAudioUrl: 'Audio URL',
        playlist: 'Playlist',
        play: 'Play',
        pause: 'Pause'
      };
      return labels[action] || action;
    },
    eventValueLabel(event) {
      if (event.action === 'setAudioUrl') {
        return this.scheduler.audioUrls.find(preset => preset.id === event.audioUrlId)?.name || '—';
      }
      if (event.action === 'playlist') {
        return this.scheduler.playlists.find(playlist => playlist.id === event.playlistId)?.name || '—';
      }
      return '—';
    }
  }
};
</script>

<style scoped>
.scheduler-panel {
  padding: 10px;
  overflow-y: auto;
}

.scheduler-panel h3,
.scheduler-panel h4,
.scheduler-panel h5 {
  margin: 5px 0;
}

.scheduler-section {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  background: #fff;
}

.scheduler-editor {
  border-top: 1px solid #eee;
  margin-top: 10px;
  padding-top: 10px;
}

.scheduler-form-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  flex-wrap: wrap;
}

.scheduler-form-row input,
.scheduler-form-row select,
.scheduler-form-row textarea {
  padding: 6px;
  font-size: 14px;
}

.scheduler-form-row textarea {
  min-width: 280px;
  min-height: 34px;
}

.scheduler-event-form select {
  max-width: 180px;
}

.scheduler-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  border-top: 1px solid #eee;
  padding: 6px 0;
}

.scheduler-item-content {
  min-width: 0;
  overflow-wrap: anywhere;
}

.scheduler-select-button {
  color: #333 !important;
  background: transparent !important;
  text-align: left;
}

.scheduler-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}

.scheduler-url-list {
  margin-top: 4px;
}

.scheduler-url-list summary {
  cursor: pointer;
}

.scheduler-url-list ol {
  margin: 4px 0 0 18px;
  padding: 0;
}

.scheduler-empty {
  color: #777;
  font-style: italic;
  margin: 8px 0;
}

.scheduler-checkboxes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 8px 0;
}

.scheduler-checkboxes label {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 6px;
}

.scheduler-checkboxes label.conflict {
  color: #999;
  background: #f5f5f5;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(52px, 1fr));
  gap: 4px;
}

.calendar-weekdays {
  font-weight: bold;
  text-align: center;
  margin-bottom: 4px;
}

.calendar-day {
  min-height: 58px;
  background: #fff !important;
  color: #333 !important;
  border: 1px solid #ddd !important;
  padding: 4px !important;
  text-align: left;
}

.calendar-day.blank {
  background: #f6f6f6 !important;
  cursor: default;
}

.calendar-day-number {
  display: block;
  font-weight: bold;
}

.calendar-dots {
  display: block;
  margin-top: 12px;
}

.scheduler-copy-days {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}

.scheduler-copy-days label {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 6px;
}

.scheduler-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}

.scheduler-table th,
.scheduler-table td {
  border: 1px solid #ddd;
  padding: 6px;
  text-align: left;
}

.scheduler-panel button {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 6px 6px;
  border-radius: 4px;
  cursor: pointer;
}

.scheduler-panel button:disabled {
  background: #aaa;
  cursor: not-allowed;
}
</style>