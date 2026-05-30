<template>
  <div class="dialog">
    <h3>Manage Groups</h3>

    <label>
      <strong>Group Name:</strong>
      <input type="text" v-model="groupName" placeholder="Enter group name" ref="groupInput"/>
    </label>

    <div v-if="existingGroups.length">
      <h4>Or select from existing:</h4>
      <ul>
        <li
          v-for="group in existingGroups"
          :key="group"
          @click="selectGroup(group)"
          class="group-item"
        >
          {{ group }}
        </li>
      </ul>
    </div>

    <div class="actions">
      <button @click="confirm">Confirm</button>
      <button @click="$emit('close')">Cancel</button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    existingGroups: {
      type: Array,
      default: () => []
    },
    action: {
      type: String,
      default: 'assign' // assign | new | delete | remove
    }
  },
  data() {
    return {
      groupName: ''
    }
  },
  methods: {
    selectGroup(group) {
      this.groupName = group;
    },
    confirm() {
      if (!this.groupName.trim()) {
        alert('Please enter a group name!');
        return;
      }
      this.$emit('confirm', this.groupName.trim());
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.$refs.groupInput?.focus();
    });
  }
}
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

h3, h4 {
  margin: 10px 0 8px 0;
}

label {
  display: block;
  margin: 10px 0;
}

input[type="text"] {
  width: 90%;
  padding: 6px 6px;
  margin-top: 5px;
}

ul {
  list-style: none;
  padding: 0;
}

.group-item {
  background: #f0f0f0;
  margin: 4px 0;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
}

.group-item:hover {
  background: #d0d0d0;
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

button {
  padding: 6px 12px;
  cursor: pointer;
}
</style>
