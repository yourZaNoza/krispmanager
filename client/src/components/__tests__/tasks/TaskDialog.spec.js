import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('axios', () => ({
  default: {
    create: () => ({
      get: vi.fn().mockResolvedValue({ data: [] }),
    }),
  },
}))

import TaskDialog from '../../tasks/TaskDialog.vue'

const defaultColumns = [{ id: 1, title: 'Дела', dotColor: '#000' }]

function mountDialog(props = {}) {
  return shallowMount(TaskDialog, {
    props: {
      modelValue:  true,
      columns:     defaultColumns,
      initialForm: null,
      ...props,
    },
  })
}

describe('TaskDialog', () => {

  // ── Рендеринг ─────────────────────────────────────────────

  it('монтируется без ошибок', () => {
    const wrapper = mountDialog()
    expect(wrapper.exists()).toBe(true)
  })

  it('заголовок «Новая задача» когда initialForm = null', () => {
    const wrapper = mountDialog()
    expect(wrapper.text()).toContain('Новая задача')
  })

  it('заголовок = название задачи при редактировании', async () => {
    const wrapper = mountDialog({
      initialForm: {
        id: 1, title: 'Моя задача', description: '', lists: [],
        deadlineRaw: null, dateFromRaw: null, participants: [],
        tags: [], enterprise: '', catId: 1,
        attachments: [], comments: [], history: [],
      },
    })
    // Триггерим watch через открытие диалога
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.text()).toContain('Моя задача')
  })

  // ── Форма ─────────────────────────────────────────────────

  it('form.title пустое при создании новой задачи', () => {
    const wrapper = mountDialog()
    expect(wrapper.vm.form.title).toBe('')
  })

  it('form заполняется из initialForm при открытии', async () => {
    const wrapper = mountDialog({ modelValue: false })
    await wrapper.setProps({
      modelValue:  true,
      initialForm: {
        id: 5, title: 'Задача из пропса', description: 'Описание',
        lists: [], deadlineRaw: null, dateFromRaw: null,
        participants: [], tags: [], enterprise: 'Школа', catId: 2,
        attachments: [], comments: [], history: [],
      },
    })
    expect(wrapper.vm.form.title).toBe('Задача из пропса')
    expect(wrapper.vm.form.enterprise).toBe('Школа')
  })

  it('saveTask не эмитит save если title пустой', () => {
    const wrapper = mountDialog()
    wrapper.vm.form.title = ''
    wrapper.vm.saveTask()
    expect(wrapper.emitted('save')).toBeFalsy()
  })

  it('saveTask эмитит save если title заполнен', () => {
    const wrapper = mountDialog()
    wrapper.vm.form.title  = 'Готовая задача'
    wrapper.vm.form.catId  = 1
    wrapper.vm.saveTask()
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0].title).toBe('Готовая задача')
  })

  // ── Списки ────────────────────────────────────────────────

  it('confirmList добавляет список в form.lists', () => {
    const wrapper = mountDialog()
    expect(wrapper.vm.form.lists).toHaveLength(0)
    wrapper.vm.newListName = 'Чеклист'
    wrapper.vm.confirmList()
    expect(wrapper.vm.form.lists).toHaveLength(1)
    expect(wrapper.vm.form.lists[0].name).toBe('Чеклист')
  })

  // ── События ───────────────────────────────────────────────

  it('эмитит update:modelValue при закрытии', () => {
    const wrapper = mountDialog()
    wrapper.vm.$emit('update:modelValue', false)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe(false)
  })
})
