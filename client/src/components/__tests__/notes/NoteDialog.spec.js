import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('axios', () => ({
  default: {
    create: () => ({
      get: vi.fn().mockResolvedValue({ data: [] }),
    }),
  },
}))

import NoteDialog from '../../notes/NoteDialog.vue'

function mountDialog(props = {}) {
  return shallowMount(NoteDialog, {
    props: {
      modelValue:  true,
      note:        null,
      currentUser: { name: 'Тестер' },
      ...props,
    },
  })
}

describe('NoteDialog', () => {

  // ── Рендеринг ─────────────────────────────────────────────

  it('монтируется без ошибок', () => {
    const wrapper = mountDialog()
    expect(wrapper.exists()).toBe(true)
  })

  it('заголовок «Новая заметка» когда note = null', () => {
    const wrapper = mountDialog()
    expect(wrapper.text()).toContain('Новая заметка')
  })

  it('заголовок = название заметки при редактировании', async () => {
    const wrapper = mountDialog({
      note: { id: 1, title: 'Важная заметка', date: null, time: '', tags: [], lists: [], comments: [], history: [], attachments: [] },
    })
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.text()).toContain('Важная заметка')
  })

  // ── Форма ─────────────────────────────────────────────────

  it('form.title пустое при создании новой заметки', () => {
    const wrapper = mountDialog()
    expect(wrapper.vm.form.title).toBe('')
  })

  it('form заполняется из note при открытии', async () => {
    const wrapper = mountDialog({ modelValue: false })
    await wrapper.setProps({
      modelValue: true,
      note: { id: 3, title: 'Заметка из пропса', date: '2026-05-10', time: '09:00', tags: ['Важное'], lists: [], comments: [], history: [], attachments: [] },
    })
    expect(wrapper.vm.form.title).toBe('Заметка из пропса')
    expect(wrapper.vm.form.tags).toContain('Важное')
  })

  // ── Валидация ─────────────────────────────────────────────

  it('save устанавливает titleError если title пустой', () => {
    const wrapper = mountDialog()
    wrapper.vm.form.title = ''
    wrapper.vm.save()
    expect(wrapper.vm.titleError).toBe(true)
  })

  it('save не эмитит save если title пустой', () => {
    const wrapper = mountDialog()
    wrapper.vm.form.title = ''
    wrapper.vm.save()
    expect(wrapper.emitted('save')).toBeFalsy()
  })

  it('save эмитит save если title заполнен', () => {
    const wrapper = mountDialog()
    wrapper.vm.form.title = 'Заметка с содержимым'
    wrapper.vm.save()
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0].title).toBe('Заметка с содержимым')
  })

  // ── Списки ────────────────────────────────────────────────

  it('addList добавляет список в form.lists', () => {
    const wrapper = mountDialog()
    expect(wrapper.vm.form.lists).toHaveLength(0)
    wrapper.vm.addList('bullet')
    expect(wrapper.vm.form.lists).toHaveLength(1)
    expect(wrapper.vm.form.lists[0].type).toBe('bullet')
  })

  it('removeList удаляет список по id', () => {
    const wrapper = mountDialog()
    wrapper.vm.addList('bullet')
    const id = wrapper.vm.form.lists[0].id
    wrapper.vm.removeList(id)
    expect(wrapper.vm.form.lists).toHaveLength(0)
  })

  // ── Комментарии ───────────────────────────────────────────

  it('addComment добавляет комментарий в form.comments', () => {
    const wrapper = mountDialog()
    wrapper.vm.commentText = 'Тестовый комментарий'
    wrapper.vm.addComment()
    expect(wrapper.vm.form.comments).toHaveLength(1)
    expect(wrapper.vm.form.comments[0].text).toBe('Тестовый комментарий')
  })

  it('addComment не добавляет пустой комментарий', () => {
    const wrapper = mountDialog()
    wrapper.vm.commentText = '   '
    wrapper.vm.addComment()
    expect(wrapper.vm.form.comments).toHaveLength(0)
  })

  // ── События ───────────────────────────────────────────────

  it('close эмитит update:modelValue = false', () => {
    const wrapper = mountDialog()
    wrapper.vm.close()
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe(false)
  })
})
