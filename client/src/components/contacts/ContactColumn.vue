<template>
  <div class="contact-column">
    <div class="contact-column-body">

      <!-- Column header -->
      <div class="d-flex align-center col-header" style="gap: 8px">
        <v-icon :color="column.color" size="12">mdi-circle</v-icon>
        <span class="text-subtitle-2 font-weight-bold">{{ column.title }}</span>
        <span class="contact-badge">{{ column.contacts.length }}</span>
      </div>

      <!-- Contact cards -->
      <div class="d-flex flex-column" style="gap: 10px">
        <ContactCard
          v-for="contact in column.contacts"
          :key="contact.id"
          :contact="contact"
          @edit="$emit('edit', contact)"
          @delete="askDelete(contact)"
        />
      </div>

    </div>
  </div>

  <!-- Delete confirmation -->
  <v-dialog v-model="deleteDialog" max-width="360">
    <v-card rounded="lg" class="pa-6">
      <p class="text-body-1 font-weight-medium mb-6 text-center">
        Удалить контакт «{{ pendingContact?.name }}»?
      </p>
      <div class="d-flex justify-center" style="gap: 12px">
        <v-btn variant="outlined" color="grey-darken-1" class="text-none" @click="deleteDialog = false">
          Отмена
        </v-btn>
        <v-btn variant="flat" color="red" class="text-none text-white" @click="confirmDelete">
          Удалить
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import ContactCard from './ContactCard.vue'

const props = defineProps({
  column: { type: Object, required: true },
})
const emit = defineEmits(['edit', 'delete'])

const deleteDialog   = ref(false)
const pendingContact = ref(null)

const askDelete = (contact) => {
  pendingContact.value = contact
  deleteDialog.value = true
}

const confirmDelete = () => {
  if (pendingContact.value) emit('delete', pendingContact.value)
  deleteDialog.value = false
  pendingContact.value = null
}
</script>

<style scoped>
.contact-column {
  min-width: 280px;
  width: 280px;
  flex-shrink: 0;
}
.contact-column-body {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
}
.col-header {
  margin-bottom: 20px;
}
.contact-badge {
  background: #f0f0f0;
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  color: #616161;
  flex-shrink: 0;
}
</style>
