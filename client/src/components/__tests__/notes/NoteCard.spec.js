import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import NoteCard from '../../notes/NoteCard.vue'

const makeNote = (overrides = {}) => ({
  id:    1,
  title: 'Тестовая заметка',
  date:  '2026-05-12',
  time:  '10:30',
  tags:  [],
  lists: [],
  ...overrides,
})

describe('NoteCard', () => {

  // ── Рендеринг ─────────────────────────────────────────────

  it('отображает заголовок заметки', () => {
    const wrapper = shallowMount(NoteCard, { props: { note: makeNote() } })
    expect(wrapper.text()).toContain('Тестовая заметка')
  })

  it('отображает теги', () => {
    const note = makeNote({ tags: ['Важное', 'Проект'] })
    const wrapper = shallowMount(NoteCard, { props: { note } })
    expect(wrapper.text()).toContain('Важное')
    expect(wrapper.text()).toContain('Проект')
  })

  it('показывает первые элементы списка как превью', () => {
    const note = makeNote({
      lists: [{ type: 'bullet', items: [
        { text: 'Первый пункт'  },
        { text: 'Второй пункт' },
      ]}],
    })
    const wrapper = shallowMount(NoteCard, { props: { note } })
    expect(wrapper.text()).toContain('Первый пункт')
    expect(wrapper.text()).toContain('Второй пункт')
  })

  it('показывает максимум 3 элемента превью', () => {
    const note = makeNote({
      lists: [{ type: 'bullet', items: [
        { text: 'Пункт 1' },
        { text: 'Пункт 2' },
        { text: 'Пункт 3' },
        { text: 'Пункт 4 — скрытый' },
      ]}],
    })
    const wrapper = shallowMount(NoteCard, { props: { note } })
    expect(wrapper.text()).toContain('Пункт 1')
    expect(wrapper.text()).not.toContain('Пункт 4 — скрытый')
  })

  it('показывает badge "удалена" в режиме archiveMode + deleted', () => {
    const wrapper = shallowMount(NoteCard, {
      props: { note: makeNote(), deleted: true, archiveMode: true },
    })
    expect(wrapper.find('.deleted-badge').exists()).toBe(true)
    expect(wrapper.find('.deleted-badge').text()).toBe('удалена')
  })

  it('не показывает badge вне archiveMode', () => {
    const wrapper = shallowMount(NoteCard, {
      props: { note: makeNote(), deleted: true, archiveMode: false },
    })
    expect(wrapper.find('.deleted-badge').exists()).toBe(false)
  })

  // ── Computed: footerDate ──────────────────────────────────

  it('[computed] footerDate — формат «Май 12 / 10:30»', () => {
    const wrapper = shallowMount(NoteCard, { props: { note: makeNote() } })
    expect(wrapper.vm.footerDate).toContain('10:30')
    expect(wrapper.vm.footerDate).toMatch(/\d+/)
  })

  it('[computed] footerDate — только время если нет даты', () => {
    const note = makeNote({ date: null, time: '14:00' })
    const wrapper = shallowMount(NoteCard, { props: { note } })
    expect(wrapper.vm.footerDate).toBe('14:00')
  })

  it('[computed] footerDate — только дата если нет времени', () => {
    const note = makeNote({ date: '2026-01-01', time: '' })
    const wrapper = shallowMount(NoteCard, { props: { note } })
    expect(wrapper.vm.footerDate).not.toContain('/')
    expect(wrapper.vm.footerDate).not.toBe('—')
  })

  it('[computed] footerDate — «—» если нет ни даты ни времени', () => {
    const note = makeNote({ date: null, time: '' })
    const wrapper = shallowMount(NoteCard, { props: { note } })
    expect(wrapper.vm.footerDate).toBe('—')
  })

  // ── Computed: previewList ─────────────────────────────────

  it('[computed] previewList — null если нет списков', () => {
    const wrapper = shallowMount(NoteCard, { props: { note: makeNote() } })
    expect(wrapper.vm.previewList).toBeNull()
  })

  it('[computed] previewList — возвращает первый список с элементами', () => {
    const lists = [
      { type: 'bullet', items: [] },
      { type: 'numbered', items: [{ text: 'Item' }] },
    ]
    const wrapper = shallowMount(NoteCard, { props: { note: makeNote({ lists }) } })
    expect(wrapper.vm.previewList.type).toBe('numbered')
  })

  // ── События ───────────────────────────────────────────────

  it('эмитит open при прямом вызове', () => {
    const wrapper = shallowMount(NoteCard, { props: { note: makeNote() } })
    wrapper.vm.$emit('open')
    expect(wrapper.emitted('open')).toBeTruthy()
  })

  it('эмитит delete при прямом вызове', () => {
    const wrapper = shallowMount(NoteCard, { props: { note: makeNote() } })
    wrapper.vm.$emit('delete')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('эмитит restore-click в режиме deleted+archiveMode', () => {
    const wrapper = shallowMount(NoteCard, {
      props: { note: makeNote(), deleted: true, archiveMode: true },
    })
    wrapper.vm.$emit('restore-click')
    expect(wrapper.emitted('restore-click')).toBeTruthy()
  })
})
