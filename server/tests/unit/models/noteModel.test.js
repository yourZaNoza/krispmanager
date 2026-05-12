import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../src/config/db', () => ({
  default: { execute: vi.fn() },
  execute: vi.fn(),
}))

import db from '../../../src/config/db'

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Note = require('../../../src/models/noteModel')

const mockDb = db.execute ?? db.default?.execute

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Note Model', () => {

  // ── findByUser ────────────────────────────────────────────

  it('findByUser — возвращает заметки пользователя', async () => {
    const rows = [
      { id: 1, title: 'Заметка A', user_id: 5, date: null, time: '10:00',
        tags: '[]', lists: '[]', comments: '[]', history: '[]', attachments: '[]', deleted_at: null },
      { id: 2, title: 'Заметка B', user_id: 5, date: null, time: '',
        tags: '[]', lists: '[]', comments: '[]', history: '[]', attachments: '[]', deleted_at: null },
    ]
    mockDb.mockResolvedValueOnce([rows])

    const result = await Note.findByUser(5)
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Заметка A')
    expect(result[0].tags).toEqual([])
  })

  it('findByUser — возвращает пустой массив если заметок нет', async () => {
    mockDb.mockResolvedValueOnce([[]])
    const result = await Note.findByUser(999)
    expect(result).toHaveLength(0)
  })

  it('findByUser — парсит JSON поля корректно', async () => {
    const rows = [{
      id: 1, title: 'Test', user_id: 1, date: null, time: '',
      tags: '["Важное","Личное"]',
      lists: '[{"type":"bullet","items":[]}]',
      comments: '[]', history: '[]', attachments: '[]',
      deleted_at: null,
    }]
    mockDb.mockResolvedValueOnce([rows])

    const result = await Note.findByUser(1)
    expect(result[0].tags).toEqual(['Важное', 'Личное'])
    expect(result[0].lists).toHaveLength(1)
  })

  it('findByUser — возвращает fallback [] для битого JSON', async () => {
    const rows = [{
      id: 1, title: 'Test', user_id: 1, date: null, time: '',
      tags: 'INVALID_JSON',
      lists: '[]', comments: '[]', history: '[]', attachments: '[]',
      deleted_at: null,
    }]
    mockDb.mockResolvedValueOnce([rows])

    const result = await Note.findByUser(1)
    expect(result[0].tags).toEqual([])
  })

  // ── create ────────────────────────────────────────────────

  it('create — вставляет запись и возвращает insertId', async () => {
    mockDb.mockResolvedValueOnce([{ insertId: 55 }])

    const id = await Note.create(1, { title: 'Новая заметка', date: '2026-05-12', time: '09:00' })
    expect(id).toBe(55)
    expect(mockDb).toHaveBeenCalledOnce()
  })

  it('create — вызывает INSERT INTO notes с нужными полями', async () => {
    mockDb.mockResolvedValueOnce([{ insertId: 1 }])

    await Note.create(7, { title: 'Тест', tags: ['Важное'], lists: [] })

    const callArgs = mockDb.mock.calls[0]
    expect(callArgs[0]).toContain('INSERT INTO notes')
    expect(callArgs[1]).toContain('Тест')
    expect(callArgs[1]).toContain(7)
  })

  it('create — сериализует массивы в JSON', async () => {
    mockDb.mockResolvedValueOnce([{ insertId: 2 }])

    await Note.create(1, { title: 'X', tags: ['А', 'Б'], lists: [{ type: 'bullet' }] })

    const callArgs = mockDb.mock.calls[0]
    expect(callArgs[1]).toContain('["А","Б"]')
  })

  // ── update ────────────────────────────────────────────────

  it('update — вызывает UPDATE notes с нужными полями', async () => {
    mockDb.mockResolvedValueOnce([{ affectedRows: 1 }])

    await Note.update(1, 42, { title: 'Обновлённая', date: '2026-06-01', time: '12:00' })

    const callArgs = mockDb.mock.calls[0]
    expect(callArgs[0]).toContain('UPDATE notes')
    expect(callArgs[0]).toContain('SET')
    expect(callArgs[1]).toContain('Обновлённая')
    expect(callArgs[1]).toContain(1)
    expect(callArgs[1]).toContain(42)
  })

  // ── softDelete ────────────────────────────────────────────

  it('softDelete — вызывает UPDATE с deleted_at = NOW()', async () => {
    mockDb.mockResolvedValueOnce([{ affectedRows: 1 }])

    await Note.softDelete(3, 99)

    const callArgs = mockDb.mock.calls[0]
    expect(callArgs[0]).toContain('deleted_at')
    expect(callArgs[0]).toContain('UPDATE notes')
    expect(callArgs[1]).toContain(3)
    expect(callArgs[1]).toContain(99)
  })
})
