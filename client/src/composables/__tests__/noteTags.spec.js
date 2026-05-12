import { describe, it, expect, vi } from 'vitest'

// Мокаем axios до импорта composable, чтобы loadNoteTags не делала реальных запросов
vi.mock('axios', () => ({
  default: {
    create: () => ({ get: vi.fn().mockResolvedValue({ data: [] }) }),
  },
}))

import { TAGS, tagStyle, tagColor } from '../noteTags'

describe('noteTags', () => {

  // ── Начальное состояние TAGS ──────────────────────────────

  it('TAGS содержит все базовые теги из FALLBACK', () => {
    const names = TAGS.value.map(t => t.name)
    expect(names).toContain('Важное')
    expect(names).toContain('Личное')
    expect(names).toContain('Срочное')
    expect(names).toContain('Рабочее')
    expect(names).toContain('Проект')
    expect(names).toContain('Ежемесячное')
  })

  it('каждый тег имеет поля name, bg, color', () => {
    for (const tag of TAGS.value) {
      expect(tag).toHaveProperty('name')
      expect(tag).toHaveProperty('bg')
      expect(tag).toHaveProperty('color')
    }
  })

  // ── tagStyle ──────────────────────────────────────────────

  it('tagStyle возвращает backgroundColor и color для известного тега', () => {
    const style = tagStyle('Важное')
    expect(style).toHaveProperty('backgroundColor')
    expect(style).toHaveProperty('color')
  })

  it('tagStyle устанавливает borderColor: transparent для известного тега', () => {
    const style = tagStyle('Важное')
    expect(style.borderColor).toBe('transparent')
  })

  it('tagStyle возвращает серый fallback для неизвестного тега', () => {
    const style = tagStyle('НеизвестныйТег_xyz')
    expect(style.backgroundColor).toBe('#f5f5f5')
    expect(style.color).toBe('#616161')
  })

  it('tagStyle для «Срочное» возвращает красноватый bg (FFEBEE)', () => {
    const style = tagStyle('Срочное')
    expect(style.backgroundColor).toBe('#FFEBEE')
  })

  it('tagStyle для «Проект» возвращает синеватый bg (E3F2FD)', () => {
    const style = tagStyle('Проект')
    expect(style.backgroundColor).toBe('#E3F2FD')
  })

  // ── tagColor ──────────────────────────────────────────────

  it('tagColor возвращает цвет строкой для известного тега', () => {
    const color = tagColor('Важное')
    expect(typeof color).toBe('string')
    expect(color).not.toBe('#9E9E9E')
  })

  it('tagColor возвращает "#9E9E9E" для неизвестного тега', () => {
    const color = tagColor('НесуществующийТег_abc')
    expect(color).toBe('#9E9E9E')
  })

  it('tagColor и tagStyle возвращают согласованный цвет для одного тега', () => {
    const color = tagColor('Личное')
    const style = tagStyle('Личное')
    expect(style.color).toBe(color)
  })
})
