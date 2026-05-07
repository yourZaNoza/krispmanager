<template>
  <v-dialog
    :model-value="modelValue"
    max-width="700"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg" class="note-dialog-card">
      <!-- Header -->
      <div class="dialog-header d-flex align-center px-6 py-4" style="gap: 8px; border-bottom: 1px solid #e8e8e8; flex-shrink: 0">
        <span class="text-h6 font-weight-medium flex-grow-1">
          {{ form.id ? (form.title || 'Заметка') : 'Новая заметка' }}
        </span>
        <v-btn icon size="small" variant="plain" color="grey-darken-1" @click="save">
          <v-icon>mdi-check</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="plain" color="grey-darken-1" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Body -->
      <v-card-text class="pa-0">
        <div class="d-flex" style="min-height: 400px">

          <!-- Left panel -->
          <div class="left-panel pa-6 d-flex flex-column" style="flex: 1; min-width: 0; gap: 0">

            <!-- Title -->
            <div class="mb-4">
              <p class="field-label">Наименование</p>
              <v-text-field
                v-model="form.title"
                variant="outlined"
                density="compact"
                hide-details
                placeholder="Введите название"
                :error="titleError"
              />
            </div>

            <!-- Lists -->
            <div v-for="list in form.lists" :key="list.id" class="list-section mb-3">
              <!-- List header -->
              <div class="d-flex align-center" style="gap: 4px; margin-bottom: 6px">
                <v-btn icon size="x-small" variant="plain" density="compact" @click="list.collapsed = !list.collapsed">
                  <v-icon size="16" color="grey-darken-1">{{ list.collapsed ? 'mdi-chevron-right' : 'mdi-chevron-down' }}</v-icon>
                </v-btn>
                <v-text-field
                  v-model="list.title"
                  variant="plain"
                  density="compact"
                  hide-details
                  placeholder="Название списка"
                  class="list-title-input flex-grow-1"
                />
                <v-btn icon size="x-small" variant="plain" density="compact" @click="removeList(list.id)">
                  <v-icon size="16" color="grey">mdi-delete-outline</v-icon>
                </v-btn>
              </div>

              <!-- Items -->
              <template v-if="!list.collapsed">
                <div
                  v-for="(item, idx) in list.items"
                  :key="item.id"
                  class="d-flex align-center"
                  style="gap: 6px; padding-left: 28px; margin-bottom: 4px"
                >
                  <!-- Checklist -->
                  <v-checkbox
                    v-if="list.type === 'checklist'"
                    v-model="item.checked"
                    density="compact"
                    hide-details
                    color="green-darken-1"
                    class="flex-shrink-0 item-checkbox"
                  />
                  <!-- Numbered -->
                  <span v-else-if="list.type === 'numbered'" class="text-body-2 text-grey flex-shrink-0" style="width: 20px; text-align: right">{{ idx + 1 }}.</span>
                  <!-- Bullet -->
                  <span v-else class="text-body-2 text-grey flex-shrink-0" style="font-size: 18px; line-height: 1">•</span>

                  <v-text-field
                    v-model="item.text"
                    variant="plain"
                    density="compact"
                    hide-details
                    placeholder="Введите пункт"
                    class="flex-grow-1 item-text-field"
                    :class="{ 'item-checked': item.checked && list.type === 'checklist' }"
                  />
                  <v-btn icon size="x-small" variant="plain" density="compact" @click="removeItem(list.id, item.id)">
                    <v-icon size="14" color="grey">mdi-close</v-icon>
                  </v-btn>
                </div>
                <div style="padding-left: 28px; margin-top: 2px">
                  <v-btn
                    variant="text"
                    size="small"
                    class="text-none text-grey px-1"
                    prepend-icon="mdi-plus"
                    @click="addItem(list.id)"
                  >Добавить пункт</v-btn>
                </div>
              </template>
            </div>

            <!-- Add list button -->
            <v-btn
              variant="outlined"
              class="text-none mb-4"
              color="grey-darken-1"
              prepend-icon="mdi-plus"
              style="width: 100%"
            >
              Добавить новый список
              <v-menu activator="parent" location="bottom start">
                <v-list density="compact" rounded="lg" class="pa-1">
                  <v-list-item rounded="lg" @click="addList('bullet')">
                    <template #prepend><v-icon size="16" class="mr-2">mdi-format-list-bulleted</v-icon></template>
                    <v-list-item-title class="text-body-2">Маркированный список</v-list-item-title>
                  </v-list-item>
                  <v-list-item rounded="lg" @click="addList('numbered')">
                    <template #prepend><v-icon size="16" class="mr-2">mdi-format-list-numbered</v-icon></template>
                    <v-list-item-title class="text-body-2">Нумерованный список</v-list-item-title>
                  </v-list-item>
                  <v-list-item rounded="lg" @click="addList('checklist')">
                    <template #prepend><v-icon size="16" class="mr-2">mdi-checkbox-marked-outline</v-icon></template>
                    <v-list-item-title class="text-body-2">Чек-лист</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-btn>

            <!-- Comment input -->
            <div class="comment-box d-flex align-center mb-3" style="gap: 8px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 8px 12px">
              <v-text-field
                v-model="commentText"
                variant="plain"
                density="compact"
                hide-details
                placeholder="Добавить комментарий"
                class="flex-grow-1"
                @keydown.enter.prevent="addComment"
              />
              <!-- Hidden file input -->
              <input
                ref="fileInput"
                type="file"
                style="display: none"
                multiple
                @change="onFilesSelected"
              />
              <v-icon
                size="18"
                color="grey-darken-1"
                style="cursor: pointer"
                @click="fileInput.click()"
              >mdi-paperclip</v-icon>
              <v-icon
                size="18"
                :color="commentText.trim() ? 'green-darken-2' : 'grey-darken-1'"
                style="cursor: pointer"
                @click="addComment"
              >mdi-send</v-icon>
            </div>

            <!-- Attachments list -->
            <div v-if="form.attachments && form.attachments.length" class="mb-3 d-flex flex-column" style="gap: 6px">
              <div
                v-for="att in form.attachments"
                :key="att.id"
                class="attachment-row d-flex align-center"
                style="gap: 10px; background: #f5f5f5; border-radius: 8px; padding: 8px 12px"
              >
                <v-icon size="20" color="blue-darken-1">mdi-file-document-outline</v-icon>
                <span class="text-body-2 flex-grow-1 text-truncate">{{ att.name }}</span>
                <v-btn
                  variant="outlined"
                  size="x-small"
                  class="text-none"
                  color="grey-darken-1"
                  prepend-icon="mdi-download"
                  @click="downloadAttachment(att)"
                >Скачать</v-btn>
                <v-btn icon size="x-small" variant="plain" @click="removeAttachment(att.id)">
                  <v-icon size="14" color="grey">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>

            <!-- Comments -->
            <template v-if="form.comments && form.comments.length">
              <div
                v-for="c in form.comments"
                :key="c.id"
                class="d-flex mb-3"
                style="gap: 10px"
              >
                <v-avatar size="32" color="grey-lighten-2">
                  <v-icon size="18" color="grey-darken-1">mdi-account</v-icon>
                </v-avatar>
                <div style="flex: 1">
                  <p class="text-body-2 font-weight-medium mb-0">{{ c.userName }}</p>
                  <p class="text-body-2 text-grey-darken-1 mb-0">{{ c.text }}</p>
                  <p class="text-caption text-grey">{{ formatDate(c.createdAt) }}</p>
                </div>
              </div>
            </template>

          </div>

          <!-- Divider -->
          <div style="width: 1px; background: #e8e8e8; flex-shrink: 0" />

          <!-- Right panel -->
          <div class="right-panel pa-6 d-flex flex-column" style="width: 210px; flex-shrink: 0; gap: 20px">

            <!-- Date -->
            <div>
              <p class="field-label">Дата</p>
              <div class="custom-field-trigger">
                <v-icon size="15" color="grey-darken-1">mdi-calendar</v-icon>
                <span class="text-body-2 flex-grow-1">{{ formatRuDate(form.date) || 'Не задана' }}</span>
                <v-icon size="15" color="grey-darken-1">mdi-chevron-down</v-icon>
                <input type="date" class="hidden-native" :value="form.date" @change="onDateChange" />
              </div>
            </div>

            <!-- Time -->
            <div>
              <p class="field-label">Время</p>
              <div class="custom-field-trigger">
                <v-icon size="15" color="grey-darken-1">mdi-clock-outline</v-icon>
                <span class="text-body-2 flex-grow-1">{{ form.time || '00:00' }}</span>
                <div class="d-flex flex-column" style="gap: 0">
                  <v-icon size="14" style="cursor: pointer" color="grey-darken-1" @click="adjustTime(30)">mdi-chevron-up</v-icon>
                  <v-icon size="14" style="cursor: pointer" color="grey-darken-1" @click="adjustTime(-30)">mdi-chevron-down</v-icon>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div>
              <div class="d-flex align-center justify-space-between mb-2">
                <p class="field-label mb-0">Отметки</p>
                <v-btn icon size="x-small" variant="plain" color="grey-darken-1">
                  <v-icon size="16">mdi-plus</v-icon>
                  <v-menu activator="parent" location="bottom end">
                    <v-list density="compact" rounded="lg" class="pa-1">
                      <v-list-item v-for="tag in availableTags" :key="tag.name" rounded="lg" @click="addTag(tag.name)">
                        <template #prepend>
                          <span class="tag-dot mr-2" :style="{ background: tag.color }" />
                        </template>
                        <v-list-item-title class="text-body-2">{{ tag.name }}</v-list-item-title>
                      </v-list-item>
                      <v-list-item v-if="!availableTags.length" disabled>
                        <v-list-item-title class="text-body-2 text-grey">Все добавлены</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </v-btn>
              </div>
              <div class="d-flex flex-wrap" style="gap: 6px">
                <v-chip
                  v-for="tag in form.tags"
                  :key="tag"
                  size="small"
                  closable
                  :style="tagStyle(tag)"
                  @click:close="removeTag(tag)"
                >{{ tag }}</v-chip>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { TAGS, tagStyle, loadNoteTags } from '@/composables/noteTags'

onMounted(loadNoteTags)

const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  note:        { type: Object,  default: null },
  currentUser: { type: Object,  default: () => ({ name: 'Вы' }) },
})
const emit = defineEmits(['update:modelValue', 'save'])

const titleError  = ref(false)
const commentText = ref('')
const fileInput   = ref(null)

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

const blankForm = () => ({
  id:          null,
  title:       '',
  date:        new Date().toISOString().split('T')[0],
  time:        `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`,
  tags:        [],
  lists:       [],
  comments:    [],
  history:     [],
  attachments: [],
})

const form = ref(blankForm())

watch(() => props.modelValue, (open) => {
  if (!open) return
  titleError.value  = false
  commentText.value = ''
  form.value = props.note
    ? { attachments: [], ...props.note, lists: (props.note.lists || []).map(l => ({ ...l, collapsed: false })) }
    : blankForm()
})

/* ---------- Lists ---------- */
function addList(type) {
  form.value.lists.push({ id: uid(), title: '', type, items: [], collapsed: false })
}
function removeList(id) {
  form.value.lists = form.value.lists.filter(l => l.id !== id)
}
function addItem(listId) {
  const list = form.value.lists.find(l => l.id === listId)
  if (list) list.items.push({ id: uid(), text: '', checked: false })
}
function removeItem(listId, itemId) {
  const list = form.value.lists.find(l => l.id === listId)
  if (list) list.items = list.items.filter(i => i.id !== itemId)
}

/* ---------- Comments ---------- */
function addComment() {
  const text = commentText.value.trim()
  if (!text) return
  const entry = { id: uid(), text, createdAt: new Date().toISOString(), userName: props.currentUser?.name || 'Вы' }
  form.value.comments = [...(form.value.comments || []), entry]
  commentText.value = ''
}

/* ---------- Files ---------- */
function onFilesSelected(e) {
  const files = Array.from(e.target.files || [])
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1]
      form.value.attachments = [
        ...(form.value.attachments || []),
        { id: uid(), name: file.name, type: file.type, size: file.size, data: base64, createdAt: new Date().toISOString() },
      ]
    }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

function downloadAttachment(att) {
  const binary  = atob(att.data)
  const bytes   = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob    = new Blob([bytes], { type: att.type || 'application/octet-stream' })
  const url     = URL.createObjectURL(blob)
  const a       = document.createElement('a')
  a.href        = url
  a.download    = att.name
  a.click()
  URL.revokeObjectURL(url)
}

function removeAttachment(id) {
  form.value.attachments = form.value.attachments.filter(a => a.id !== id)
}

/* ---------- Date / Time ---------- */
const LONG_MONTHS = ['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря']

function formatRuDate(str) {
  if (!str) return ''
  const d = new Date(str + 'T00:00:00')
  return `${d.getDate()} ${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function onDateChange(e) {
  form.value.date = e.target.value
}

function adjustTime(minutes) {
  const [h, m] = (form.value.time || '00:00').split(':').map(Number)
  const total   = ((h * 60 + m + minutes) % 1440 + 1440) % 1440
  form.value.time = `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`
}

/* ---------- Tags ---------- */
const availableTags = computed(() => TAGS.value.filter(t => !form.value.tags.includes(t.name)))
function addTag(name)    { if (!form.value.tags.includes(name)) form.value.tags = [...form.value.tags, name] }
function removeTag(name) { form.value.tags = form.value.tags.filter(t => t !== name) }

/* ---------- Date formatting for comments ---------- */
function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
}

/* ---------- Save / Close ---------- */
function save() {
  if (!form.value.title.trim()) { titleError.value = true; return }
  emit('save', { ...form.value, lists: form.value.lists.map(({ collapsed, ...l }) => l) })
  close()
}
function close() { emit('update:modelValue', false) }
</script>

<style scoped>
.field-label {
  font-size: 12px;
  color: #616161;
  font-weight: 500;
  margin-bottom: 6px;
}
.list-title-input :deep(.v-field__input) {
  padding: 0 !important;
  font-weight: 600;
  font-size: 14px;
}
.item-checkbox :deep(.v-selection-control) {
  min-height: unset !important;
}
.item-text-field :deep(.v-field__input) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: unset !important;
}
.item-checked :deep(.v-field__input input),
.item-checked :deep(.v-field__input) {
  text-decoration: line-through !important;
  color: #9e9e9e !important;
}
.custom-field-trigger {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
}
.hidden-native {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
}
.tag-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.note-dialog-card { overflow: hidden; }
</style>
