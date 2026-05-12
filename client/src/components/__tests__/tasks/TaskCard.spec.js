import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import TaskCard from '../../tasks/TaskCard.vue'

const makeTask = (overrides = {}) => ({
  id:           1,
  title:        'Тестовая задача',
  deadline:     '01.05.2026',
  deadlineRaw:  null,
  tags:         [],
  lists:        [],
  attachments:  0,
  comments:     0,
  participants: [],
  ...overrides,
})

describe('TaskCard', () => {

  // ── Рендеринг ─────────────────────────────────────────────

  it('отображает название задачи', () => {
    const wrapper = shallowMount(TaskCard, { props: { task: makeTask() } })
    expect(wrapper.text()).toContain('Тестовая задача')
  })

  it('отображает срок из строкового поля deadline', () => {
    const wrapper = shallowMount(TaskCard, { props: { task: makeTask({ deadline: '15.06.2026' }) } })
    expect(wrapper.text()).toContain('15.06.2026')
  })

  it('форматирует deadlineRaw в формат ДД.ММ.ГГГГ', () => {
    const task = makeTask({ deadlineRaw: '2026-08-20', deadline: '' })
    const wrapper = shallowMount(TaskCard, { props: { task } })
    expect(wrapper.text()).toContain('20.08.2026')
  })

  it('показывает badge "удалена" когда deleted=true', () => {
    const wrapper = shallowMount(TaskCard, { props: { task: makeTask(), deleted: true } })
    expect(wrapper.find('.deleted-badge').exists()).toBe(true)
    expect(wrapper.find('.deleted-badge').text()).toBe('удалена')
  })

  it('не показывает badge "удалена" когда deleted=false', () => {
    const wrapper = shallowMount(TaskCard, { props: { task: makeTask(), deleted: false } })
    expect(wrapper.find('.deleted-badge').exists()).toBe(false)
  })

  // ── Computed: subtasksText ────────────────────────────────

  it('[computed] subtasksText — пусто если нет списков', () => {
    const wrapper = shallowMount(TaskCard, { props: { task: makeTask() } })
    expect(wrapper.vm.subtasksText).toBe('')
  })

  it('[computed] subtasksText — «2/3» при двух выполненных из трёх', () => {
    const task = makeTask({
      lists: [{ id: 1, items: [
        { text: 'A', done: true  },
        { text: 'B', done: false },
        { text: 'C', done: true  },
      ]}],
    })
    const wrapper = shallowMount(TaskCard, { props: { task } })
    expect(wrapper.vm.subtasksText).toBe('2/3')
  })

  it('[computed] subtasksText — «0/2» если ничего не выполнено', () => {
    const task = makeTask({
      lists: [{ id: 1, items: [{ text: 'X', done: false }, { text: 'Y', done: false }] }],
    })
    const wrapper = shallowMount(TaskCard, { props: { task } })
    expect(wrapper.vm.subtasksText).toBe('0/2')
  })

  it('[computed] subtasksText — суммирует элементы из нескольких списков', () => {
    const task = makeTask({
      lists: [
        { id: 1, items: [{ text: 'A', done: true }] },
        { id: 2, items: [{ text: 'B', done: false }, { text: 'C', done: false }] },
      ],
    })
    const wrapper = shallowMount(TaskCard, { props: { task } })
    expect(wrapper.vm.subtasksText).toBe('1/3')
  })

  // ── Computed: attachCount / commentCount ──────────────────

  it('[computed] attachCount — длина массива вложений', () => {
    const wrapper = shallowMount(TaskCard, { props: { task: makeTask({ attachments: [{}, {}] }) } })
    expect(wrapper.vm.attachCount).toBe(2)
  })

  it('[computed] attachCount — числовое значение если передано числом', () => {
    const wrapper = shallowMount(TaskCard, { props: { task: makeTask({ attachments: 7 }) } })
    expect(wrapper.vm.attachCount).toBe(7)
  })

  it('[computed] commentCount — длина массива комментариев', () => {
    const wrapper = shallowMount(TaskCard, { props: { task: makeTask({ comments: [{}, {}, {}] }) } })
    expect(wrapper.vm.commentCount).toBe(3)
  })

  it('[computed] commentCount — числовое значение если передано числом', () => {
    const wrapper = shallowMount(TaskCard, { props: { task: makeTask({ comments: 4 }) } })
    expect(wrapper.vm.commentCount).toBe(4)
  })

  // ── Computed: displayDeadline ─────────────────────────────

  it('[computed] displayDeadline — deadlineRaw приоритетнее deadline', () => {
    const task = makeTask({ deadlineRaw: '2026-01-15', deadline: '99.99.9999' })
    const wrapper = shallowMount(TaskCard, { props: { task } })
    expect(wrapper.vm.displayDeadline).toBe('15.01.2026')
  })

  it('[computed] displayDeadline — «—» если некорректная дата', () => {
    const task = makeTask({ deadlineRaw: 'invalid-date', deadline: '' })
    const wrapper = shallowMount(TaskCard, { props: { task } })
    expect(wrapper.vm.displayDeadline).toBe('—')
  })

  it('[computed] displayDeadline — берёт deadline если нет deadlineRaw', () => {
    const task = makeTask({ deadlineRaw: null, deadline: '30.12.2026' })
    const wrapper = shallowMount(TaskCard, { props: { task } })
    expect(wrapper.vm.displayDeadline).toBe('30.12.2026')
  })

  // ── События ───────────────────────────────────────────────

  it('эмитит click при нажатии на карточку', async () => {
    const wrapper = shallowMount(TaskCard, { props: { task: makeTask() } })
    wrapper.vm.$emit('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('эмитит delete-click', () => {
    const wrapper = shallowMount(TaskCard, { props: { task: makeTask() } })
    wrapper.vm.$emit('delete-click')
    expect(wrapper.emitted('delete-click')).toBeTruthy()
  })

  it('эмитит restore-click в режиме deleted', () => {
    const wrapper = shallowMount(TaskCard, { props: { task: makeTask(), deleted: true } })
    wrapper.vm.$emit('restore-click')
    expect(wrapper.emitted('restore-click')).toBeTruthy()
  })
})
