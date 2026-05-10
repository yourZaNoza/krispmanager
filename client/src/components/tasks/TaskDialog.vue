<template>
  <v-dialog
    :model-value="modelValue"
    max-width="900"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between px-6 py-4" style="border-bottom: 1px solid #e0e0e0">
        <span class="text-h6 font-weight-medium">{{ form.id ? form.title : 'Новая задача' }}</span>
        <div class="d-flex">
          <v-btn icon size="small" variant="plain" @click="saveTask"><v-icon>mdi-check</v-icon></v-btn>
          <v-btn icon size="small" variant="plain" @click="$emit('update:modelValue', false)"><v-icon>mdi-close</v-icon></v-btn>
        </div>
      </div>

      <v-card-text class="pa-0" style="max-height: 75vh; overflow-y: auto">
        <div class="d-flex" style="min-height: 400px">

          <!-- ── Left column ── -->
          <div style="flex: 1; padding: 24px; min-width: 0">

            <!-- Name (create only) -->
            <div v-if="!form.id" class="mb-5">
              <p class="field-label">Наименование</p>
              <v-text-field v-model="form.title" variant="outlined" density="compact" hide-details />
            </div>

            <!-- Description -->
            <div class="mb-5">
              <p class="field-label">Описание</p>
              <v-textarea
                v-model="form.description"
                variant="outlined"
                density="compact"
                hide-details
                rows="2"
                auto-grow
                placeholder="Добавьте описание"
              />
            </div>

            <!-- Checklists -->
            <div v-for="(lst, li) in form.lists" :key="lst.id" class="mb-5">
              <div class="d-flex align-center mb-2" style="gap: 4px">
                <v-btn icon size="x-small" variant="plain" @click="lst.collapsed = !lst.collapsed">
                  <v-icon size="16">{{ lst.collapsed ? 'mdi-chevron-right' : 'mdi-chevron-down' }}</v-icon>
                </v-btn>
                <span class="text-body-2 font-weight-medium">{{ lst.name }}</span>
                <v-spacer />
                <v-btn icon size="x-small" variant="plain" @click="form.lists.splice(li, 1)">
                  <v-icon size="14" color="grey">mdi-delete-outline</v-icon>
                </v-btn>
              </div>
              <template v-if="!lst.collapsed">
                <div
                  v-for="(item, ii) in lst.items"
                  :key="ii"
                  class="d-flex align-center mb-1"
                  style="gap: 6px"
                >
                  <v-checkbox-btn v-model="item.done" density="compact" color="#037247" style="flex: 0 0 auto" />
                  <span
                    class="text-body-2 flex-grow-1"
                    style="text-align: left"
                    :style="item.done ? 'text-decoration: line-through; color: #9e9e9e' : ''"
                  >{{ item.text }}</span>
                  <v-btn icon size="x-small" variant="plain" @click="lst.items.splice(ii, 1)">
                    <v-icon size="14" color="grey">mdi-close</v-icon>
                  </v-btn>
                </div>

                <!-- Inline new item input -->
                <div v-if="lst.addingItem" class="d-flex align-center mb-1" style="gap: 6px">
                  <v-checkbox-btn density="compact" disabled style="flex: 0 0 auto" />
                  <v-text-field
                    v-model="lst.newItemText"
                    variant="plain"
                    density="compact"
                    hide-details
                    placeholder="Новый пункт"
                    autofocus
                    class="flex-grow-1"
                    @keyup.enter="confirmItem(lst)"
                    @keyup.esc="lst.addingItem = false; lst.newItemText = ''"
                    @blur="confirmItem(lst)"
                  />
                </div>
                <v-btn variant="plain" size="small" class="text-none text-caption text-grey pl-6" @click="startItem(lst)">
                  + Добавить пункт
                </v-btn>
              </template>
            </div>

            <!-- Add list button -->
            <v-btn
              variant="outlined"
              color="grey-darken-1"
              class="text-none mb-5 w-100"
              @click="listDialog = true; newListName = ''"
            >
              <v-icon start size="16">mdi-plus</v-icon>
              Добавить новый список
            </v-btn>

            <!-- Comment input -->
            <v-text-field
              v-model="newComment"
              placeholder="Добавить комментарий"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-4"
            >
              <template #append-inner>
                <v-btn icon size="x-small" variant="plain" @click="triggerFile">
                  <v-icon size="16" color="grey">mdi-paperclip</v-icon>
                </v-btn>
                <v-btn icon size="x-small" variant="plain" @click="submitComment">
                  <v-icon size="16" color="grey">mdi-send-outline</v-icon>
                </v-btn>
              </template>
            </v-text-field>
            <input
              ref="fileInputRef"
              type="file"
              accept=".docx,.xlsx,.pdf"
              multiple
              style="display: none"
              @change="onFilePick"
            />

            <!-- Attachment list -->
            <div v-if="form.attachments.length" class="mb-4">
              <div
                v-for="(f, fi) in form.attachments"
                :key="fi"
                class="d-flex align-center py-2 px-3 mb-2 rounded"
                style="gap: 10px; border: 1px solid #e0e0e0; background: #fafafa"
              >
                <v-icon size="20" color="blue-darken-1">mdi-file-document-outline</v-icon>
                <span class="text-body-2 flex-grow-1" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ f.name }}</span>
                <v-btn
                  size="x-small"
                  variant="outlined"
                  color="grey-darken-1"
                  class="text-none"
                  style="flex-shrink: 0"
                  @click="downloadAttachment(f)"
                >
                  <v-icon size="14" start>mdi-download</v-icon>
                  Скачать
                </v-btn>
                <v-btn icon size="x-small" variant="plain" style="flex-shrink: 0" @click="form.attachments.splice(fi, 1)">
                  <v-icon size="14" color="grey">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>

            <!-- Comments list -->
            <div v-if="form.comments.length" class="mb-4">
              <div v-for="(c, ci) in form.comments" :key="ci" class="d-flex align-start mb-4" style="gap: 10px">
                <v-avatar size="28" color="grey-lighten-2">
                  <v-icon size="16" color="grey-darken-1">mdi-account</v-icon>
                </v-avatar>
                <div>
                  <span class="text-caption font-weight-medium">{{ c.author }}</span>
                  <p class="text-body-2 text-grey-darken-1 mb-0">{{ c.text }}</p>
                  <span class="text-caption text-grey">{{ c.time }}</span>
                </div>
              </div>
            </div>

            <!-- History -->
            <template v-if="form.id && form.history && form.history.length">
              <div class="d-flex align-center justify-space-between mt-4 mb-4">
                <span class="text-body-2 font-weight-medium">История</span>
                <v-btn variant="outlined" size="x-small" class="text-none" @click="showHistory = !showHistory">
                  {{ showHistory ? 'Скрыть историю' : 'Показать историю' }}
                </v-btn>
              </div>
              <div v-if="showHistory">
                <div v-for="(h, hi) in form.history" :key="hi" class="d-flex align-start mb-4" style="gap: 12px">
                  <v-avatar size="32" color="grey-lighten-2">
                    <v-icon size="18" color="grey-darken-1">mdi-account</v-icon>
                  </v-avatar>
                  <div style="flex: 1">
                    <div class="d-flex align-center justify-space-between">
                      <span class="text-body-2 font-weight-medium">{{ h.author }}</span>
                      <v-btn icon size="x-small" variant="plain"><v-icon size="14">mdi-dots-vertical</v-icon></v-btn>
                    </div>
                    <p class="text-body-2 text-grey-darken-1 my-1">{{ h.text }}</p>
                    <span class="text-caption text-grey">{{ h.time }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <v-divider vertical />

          <!-- ── Right column ── -->
          <div style="width: 240px; flex-shrink: 0; padding: 24px">

            <!-- Participants -->
            <div class="mb-5">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-body-2 font-weight-medium">Участники</span>
                <v-menu v-model="participantsMenu" :close-on-content-click="false" location="bottom end" max-height="300">
                  <template #activator="{ props: p }">
                    <v-btn icon size="x-small" variant="plain" v-bind="p">
                      <v-icon size="16">mdi-plus</v-icon>
                    </v-btn>
                  </template>
                  <v-card rounded="lg" min-width="220" class="pa-2">
                    <p v-if="!registeredContacts.length" class="text-caption text-grey px-2 py-1 mb-0">
                      Нет зарегистрированных участников
                    </p>
                    <div
                      v-for="contact in registeredContacts"
                      :key="contact.id"
                      class="px-2 py-2 rounded mb-1 tag-option"
                      @click="toggleParticipant(contact)"
                    >
                      <div class="d-flex align-center" style="gap: 8px">
                        <v-icon size="14" :style="{ opacity: isParticipantAdded(contact) ? 1 : 0, color: '#037247' }">mdi-check</v-icon>
                        <UserAvatar :user-id="contact.employeeId ?? contact.id" :name="contact.name" :size="24" style="flex-shrink: 0" />
                        <span class="text-body-2">{{ contact.name }}</span>
                      </div>
                    </div>
                  </v-card>
                </v-menu>
              </div>
              <div v-if="form.participants && form.participants.length" class="d-flex flex-wrap" style="gap: 4px">
                <v-tooltip
                  v-for="(participant, pi) in form.participants"
                  :key="pi"
                  :text="participant.name"
                  location="top"
                >
                  <template #activator="{ props: tp }">
                    <UserAvatar
                      v-bind="tp"
                      :user-id="participant.id"
                      :name="participant.name"
                      :size="28"
                      style="border: 2px solid white; cursor: pointer"
                      @click="removeParticipant(participant)"
                    />
                  </template>
                </v-tooltip>
              </div>
            </div>

            <!-- Due date from -->
            <div class="mb-3">
              <p class="text-body-2 font-weight-medium mb-2">Срок с</p>
              <v-menu v-model="dateFromMenu" :close-on-content-click="false" location="bottom start">
                <template #activator="{ props: p }">
                  <div v-bind="p" class="date-trigger">
                    <v-icon size="15" color="grey-darken-1">mdi-calendar-outline</v-icon>
                    <span class="text-body-2">{{ form.dateFromRaw ? fmtLong(form.dateFromRaw) : 'Выбрать дату' }}</span>
                    <v-icon size="15" color="grey-darken-1">mdi-chevron-down</v-icon>
                  </div>
                </template>
                <MiniCalendar
                  :model-value="form.dateFromRaw"
                  @update:model-value="(d) => { form.dateFromRaw = d; dateFromMenu = false }"
                />
              </v-menu>
            </div>

            <!-- Due date to -->
            <div class="mb-5">
              <p class="text-body-2 font-weight-medium mb-2">Срок до</p>
              <v-menu v-model="dateMenu" :close-on-content-click="false" location="bottom start">
                <template #activator="{ props: p }">
                  <div v-bind="p" class="date-trigger">
                    <v-icon size="15" color="grey-darken-1">mdi-calendar-outline</v-icon>
                    <span class="text-body-2">{{ form.deadlineRaw ? fmtLong(form.deadlineRaw) : 'Выбрать дату' }}</span>
                    <v-icon size="15" color="grey-darken-1">mdi-chevron-down</v-icon>
                  </div>
                </template>
                <MiniCalendar
                  :model-value="form.deadlineRaw"
                  @update:model-value="(d) => { form.deadlineRaw = d; dateMenu = false }"
                />
              </v-menu>
            </div>

            <!-- Tags -->
            <div class="mb-5">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-body-2 font-weight-medium">Отметки</span>
                <v-menu v-model="tagsMenu" :close-on-content-click="false" location="bottom end">
                  <template #activator="{ props: p }">
                    <v-btn icon size="x-small" variant="plain" v-bind="p"><v-icon size="16">mdi-plus</v-icon></v-btn>
                  </template>
                  <v-card rounded="lg" min-width="180" class="pa-2">
                    <div
                      v-for="tag in TAGS_LIST"
                      :key="tag.label"
                      class="px-2 py-1 rounded mb-1 tag-option"
                      :style="{ backgroundColor: tag.bg }"
                      @click="toggleTag(tag)"
                    >
                      <div class="d-flex align-center" style="gap: 6px">
                        <span class="task-tag-dot" :style="{ background: tag.color }" />
                        <span :style="{ color: tag.color, fontWeight: '500', fontSize: '13px' }">{{ tag.label }}</span>
                        <v-icon v-if="isTagOn(tag)" size="13" :color="tag.color" class="ml-auto">mdi-check</v-icon>
                      </div>
                    </div>
                  </v-card>
                </v-menu>
              </div>
              <div class="d-flex flex-wrap" style="gap: 6px">
                <v-chip
                  v-for="tag in form.tags"
                  :key="tag.label"
                  size="small"
                  rounded="sm"
                  closable
                  :style="{ backgroundColor: tag.bg, color: tag.color }"
                  @click:close="removeTag(tag)"
                >{{ tag.label }}</v-chip>
              </div>
            </div>

            <!-- Enterprise -->
            <div class="mb-5">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-body-2 font-weight-medium">Предприятие</span>
                <v-menu v-model="entMenu" :close-on-content-click="false" location="bottom end" max-height="300">
                  <template #activator="{ props: p }">
                    <v-btn icon size="x-small" variant="plain" v-bind="p">
                      <v-icon size="16">mdi-plus</v-icon>
                    </v-btn>
                  </template>
                  <v-card rounded="lg" min-width="200" class="pa-2">
                    <p v-if="!enterprises.length" class="text-caption text-grey px-2 py-1 mb-0">
                      Нет сохранённых предприятий
                    </p>
                    <div
                      v-for="ent in enterprises"
                      :key="ent.id"
                      class="px-2 py-2 rounded mb-1 tag-option"
                      @click="selectEnterprise(ent)"
                    >
                      <div class="d-flex align-center" style="gap: 8px">
                        <v-icon
                          size="14"
                          :style="{ opacity: form.enterprise === ent.name ? 1 : 0, color: '#037247' }"
                        >mdi-check</v-icon>
                        <span class="text-body-2">{{ ent.name }}</span>
                      </div>
                    </div>
                  </v-card>
                </v-menu>
              </div>
              <v-chip v-if="form.enterprise" size="small" rounded="sm" closable @click:close="form.enterprise = ''">
                {{ form.enterprise }}
              </v-chip>
            </div>

            <!-- Category -->
            <div class="mb-5">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-body-2 font-weight-medium">Категория</span>
                <v-menu v-model="catMenu" :close-on-content-click="true" location="bottom end">
                  <template #activator="{ props: p }">
                    <v-btn icon size="x-small" variant="plain" v-bind="p"><v-icon size="16">mdi-plus</v-icon></v-btn>
                  </template>
                  <v-card rounded="lg" min-width="180" class="pa-2">
                    <div
                      v-for="col in columns"
                      :key="col.id"
                      class="px-2 py-2 rounded mb-1 tag-option"
                      @click="form.catId = col.id"
                    >
                      <div class="d-flex align-center" style="gap: 8px">
                        <v-icon :color="col.dotColor" size="10">mdi-circle</v-icon>
                        <span class="text-body-2">{{ col.title }}</span>
                      </div>
                    </div>
                  </v-card>
                </v-menu>
              </div>
              <v-chip v-if="form.catId" size="small" rounded="sm" closable @click:close="form.catId = null">
                {{ columns.find(c => c.id === form.catId)?.title }}
              </v-chip>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Nested: list name dialog -->
    <v-dialog v-model="listDialog" max-width="360">
      <v-card rounded="lg" class="pa-5">
        <p class="text-body-1 font-weight-medium mb-4">Название списка</p>
        <v-text-field
          v-model="newListName"
          variant="outlined"
          density="compact"
          hide-details
          autofocus
          @keyup.enter="confirmList"
        />
        <div class="d-flex justify-end mt-4" style="gap: 8px">
          <v-btn variant="outlined" class="text-none" @click="listDialog = false">Отмена</v-btn>
          <v-btn style="background-color: #037247" class="text-white text-none" @click="confirmList">Добавить</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import axios from 'axios'
import MiniCalendar from '@/components/MiniCalendar.vue'
import UserAvatar from '@/components/UserAvatar.vue'

const tagApi = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })
const serverTaskTags = ref([])

const props = defineProps({
  modelValue:  { type: Boolean, required: true },
  initialForm: { type: Object, default: null },
  columns:     { type: Array,  required: true },
})
const emit = defineEmits(['update:modelValue', 'save'])

const api = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

// Local dialog state
const dateMenu         = ref(false)
const dateFromMenu     = ref(false)
const tagsMenu         = ref(false)
const catMenu          = ref(false)
const entMenu          = ref(false)
const listDialog       = ref(false)
const participantsMenu = ref(false)

// Enterprises and contacts lists
const enterprises        = ref([])
const contacts           = ref([])
const registeredContacts = computed(() => contacts.value.filter(c => c.isRegistered))

onMounted(async () => {
  try {
    const { data } = await api.get('/api/enterprises')
    enterprises.value = data.flatMap(cat => cat.enterprises)
  } catch (err) {
    console.error('Ошибка загрузки предприятий:', err)
  }
  try {
    const { data } = await api.get('/api/contacts')
    contacts.value = data.flatMap(cat => cat.contacts || [])
  } catch (err) {
    console.error('Ошибка загрузки контактов:', err)
  }
  try {
    const { data } = await tagApi.get('/api/tags?scope=task')
    if (data.length) serverTaskTags.value = data.map(t => ({ label: t.label, bg: t.bg, color: t.color }))
  } catch { /* keep hardcoded fallback */ }
})
const newListName = ref('')
const newComment  = ref('')
const showHistory = ref(true)
const fileInputRef = ref(null)

const TAGS_FALLBACK = [
  { label: 'Срочная',     bg: '#FFF3E0', color: '#E65100' },
  { label: 'Мероприятие', bg: '#E0F2F1', color: '#00695C' },
  { label: 'Отчет',       bg: '#E8F5E9', color: '#2E7D32' },
  { label: 'Документы',   bg: '#E8EAF6', color: '#3949AB' },
  { label: 'Отдел',       bg: '#FFF8E1', color: '#F57F17' },
]
const TAGS_LIST = computed(() => serverTaskTags.value.length ? serverTaskTags.value : TAGS_FALLBACK)

const emptyForm = () => ({
  id: null, title: '', description: '', lists: [],
  deadlineRaw: null, dateFromRaw: null, participants: [], tags: [],
  enterprise: '', catId: null, attachments: [], comments: [], history: [],
})
const form = ref(emptyForm())

watch(() => props.modelValue, (v) => {
  if (!v) return
  if (props.initialForm) {
    const c = JSON.parse(JSON.stringify(props.initialForm))
    if (c.deadlineRaw) c.deadlineRaw   = new Date(c.deadlineRaw)
    if (c.dateFromRaw) c.dateFromRaw   = new Date(c.dateFromRaw)
    form.value = c
  } else {
    form.value = emptyForm()
  }
  showHistory.value = true
  entMenu.value = false
  newComment.value = ''
})

// Date helpers
const toDate = (d) => { if (!d) return null; return d instanceof Date ? d : new Date(d) }
const fmtLong = (d) => {
  const dt = toDate(d)
  if (!dt || isNaN(dt)) return 'Выбрать дату'
  const m = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
  return `${dt.getDate()} ${m[dt.getMonth()]} ${dt.getFullYear()}`
}

// Tags
const isTagOn   = (tag) => form.value.tags.some(t => t.label === tag.label)
const toggleTag = (tag) => {
  const idx = form.value.tags.findIndex(t => t.label === tag.label)
  if (idx >= 0) form.value.tags.splice(idx, 1)
  else form.value.tags.push(tag)
}
const removeTag = (tag) => {
  const idx = form.value.tags.findIndex(t => t.label === tag.label)
  if (idx >= 0) form.value.tags.splice(idx, 1)
}

// Checklists
const startItem   = (lst) => { lst.newItemText = ''; lst.addingItem = true }
const confirmItem = (lst) => {
  if (lst.newItemText?.trim()) lst.items.push({ text: lst.newItemText.trim(), done: false })
  lst.addingItem = false
  lst.newItemText = ''
}
const confirmList = () => {
  if (!newListName.value.trim()) return
  form.value.lists.push({
    id: Date.now(), name: newListName.value.trim(),
    collapsed: false, items: [], addingItem: false, newItemText: '',
  })
  listDialog.value = false
  newListName.value = ''
}

// Files
const triggerFile = () => fileInputRef.value?.click()
const onFilePick  = (e) => {
  Array.from(e.target.files).forEach(file => {
    form.value.attachments.push({ name: file.name, url: URL.createObjectURL(file) })
  })
  e.target.value = ''
}
const downloadAttachment = async (att) => {
  if (!att.url) return
  if (window.showSaveFilePicker) {
    try {
      const ext = att.name.split('.').pop()
      const handle = await window.showSaveFilePicker({ suggestedName: att.name,
        types: [{ description: 'Файл', accept: { '*/*': [`.${ext}`] } }] })
      const blob = await fetch(att.url).then(r => r.blob())
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
    } catch { /* user cancelled */ }
  } else {
    const a = document.createElement('a')
    a.href = att.url
    a.download = att.name
    a.click()
  }
}

// Participants
const isParticipantAdded = (contact) => {
  const pid = contact.employeeId ?? contact.id
  return form.value.participants.some(p => p.id === pid)
}
const toggleParticipant = (contact) => {
  const pid = contact.employeeId ?? contact.id
  const idx = form.value.participants.findIndex(p => p.id === pid)
  if (idx >= 0) form.value.participants.splice(idx, 1)
  else form.value.participants.push({ id: pid, name: contact.name })
}
const removeParticipant = (participant) => {
  const idx = form.value.participants.findIndex(p => p.id === participant.id)
  if (idx >= 0) form.value.participants.splice(idx, 1)
}

// Enterprise
const selectEnterprise = (ent) => {
  form.value.enterprise = ent.name
  entMenu.value = false
}

// Comments
const currentUserName = (() => {
  try { return JSON.parse(localStorage.getItem('user') || '{}').name || 'Вы' } catch { return 'Вы' }
})()

const submitComment = () => {
  if (!newComment.value.trim()) return
  form.value.comments.push({ author: currentUserName, text: newComment.value.trim(), time: new Date().toLocaleDateString('ru-RU') })
  newComment.value = ''
}

// Save
const saveTask = () => {
  if (!form.value.title.trim()) return
  emit('save', JSON.parse(JSON.stringify({
    ...form.value,
    deadlineRaw: form.value.deadlineRaw ? form.value.deadlineRaw.toISOString() : null,
    dateFromRaw: form.value.dateFromRaw ? form.value.dateFromRaw.toISOString() : null,
  })))
  emit('update:modelValue', false)
}
</script>

<style scoped>
.field-label {
  font-size: 12px;
  color: #616161;
  margin-bottom: 4px;
  font-weight: 500;
}
.date-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
}
.date-trigger:hover { background: #f5f5f5; }
.tag-option { cursor: pointer; }
.tag-option:hover { opacity: 0.8; }
.task-tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}

</style>
