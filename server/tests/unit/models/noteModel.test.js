import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRequire } from 'module'
import { realpathSync } from 'fs'
import { fileURLToPath } from 'url'

const cjsRequire = createRequire(import.meta.url)

function injectCache(relPath, exports) {
  const p = realpathSync(fileURLToPath(new URL(relPath, import.meta.url)))
  delete cjsRequire.cache[p]
  cjsRequire.cache[p] = { id: p, filename: p, loaded: true, exports }
}

const mockExecute = vi.fn()
injectCache('../../../src/config/db.js', { execute: mockExecute })

const Note = cjsRequire('../../../src/models/noteModel')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Note Model', () => {

  // ── findByUser ────────────────────────────────────────────

  it('findByUser — возвращает заметки пользователя', async () => {
    const rows = [
      { id: 1, title: 'Заметка A', user_id: 5, date: null, time: '10:00',
        tags: '[]', lists: '[]', comments: '[]', history: '[]', attachments: '[]' },
      { id: 2, title: 'Заметка B', user_id: 5, date: null, time: '',
        tags: '[]', lists: '[]', comments: '[]', history: '[]', attachments: '[]' },
    ]
    mockExecute.mockResolvedValueOnce([rows])
    const result = await Note.findByUser(5)
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Заметка A')
    expect(result[0].tags).toEqual([])
  })

  it('findByUser — возвращает пустой массив если заметок нет', async () => {
    mockExecute.mockResolvedValueOnce([[]])
    const result = await Note.findByUser(999)
    expect(result).toHaveLength(0)
  })

  it('findByUser — парсит JSON поля корректно', async () => {
    const rows = [{
      id: 1, title: 'Test', user_id: 1, date: null, time: '',
      tags: '["Важное","Личное"]',
      lists: '[{"type":"bullet","items":[]}]',
      comments: '[]', history: '[]', attachments: '[]',
    }]
    mockExecute.mockResolvedValueOnce([rows])
    const result = await Note.findByUser(1)
    expect(result[0].tags).toEqual(['Важное', 'Личное'])
    expect(result[0].lists).toHaveLength(1)
  })

  it('findByUser — возвращает fallback [] для битого JSON', async () => {
    const rows = [{
      id: 1, title: 'Test', user_id: 1, date: null, time: '',
      tags: 'INVALID_JSON',
      lists: '[]', comments: '[]', history: '[]', attachments: '[]',
    }]
    mockExecute.mockResolvedValueOnce([rows])
    const result = await Note.findByUser(1)
    expect(result[0].tags).toEqual([])
  })

  // ── create ────────────────────────────────────────────────

  it('create — вставляет запись и возвращает insertId', async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 55 }])
    const id = await Note.create(1, { title: 'Новая заметка', date: '2026-05-12', time: '09:00' })
    expect(id).toBe(55)
    expect(mockExecute).toHaveBeenCalledOnce()
  })

  it('create — вызывает INSERT INTO notes с нужными полями', async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 1 }])
    await Note.create(7, { title: 'Тест', tags: ['Важное'], lists: [] })
    const callArgs = mockExecute.mock.calls[0]
    expect(callArgs[0]).toContain('INSERT INTO notes')
    expect(callArgs[1]).toContain('Тест')
    expect(callArgs[1]).toContain(7)
  })

  it('create — сериализует массивы в JSON', async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 2 }])
    await Note.create(1, { title: 'X', tags: ['А', 'Б'], lists: [{ type: 'bullet' }] })
    const callArgs = mockExecute.mock.calls[0]
    expect(callArgs[1]).toContain('["А","Б"]')
  })

  // ── update ────────────────────────────────────────────────

  it('update — вызывает UPDATE notes с нужными полями', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }])
    await Note.update(1, 42, { title: 'Обновлённая', date: '2026-06-01', time: '12:00' })
    const callArgs = mockExecute.mock.calls[0]
    expect(callArgs[0]).toContain('UPDATE notes')
    expect(callArgs[0]).toContain('SET')
    expect(callArgs[1]).toContain('Обновлённая')
    expect(callArgs[1]).toContain(1)
    expect(callArgs[1]).toContain(42)
  })

  // ── softDelete ────────────────────────────────────────────

  it('softDelete — вызывает UPDATE с deleted_at = NOW()', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }])
    await Note.softDelete(3, 99)
    const callArgs = mockExecute.mock.calls[0]
    expect(callArgs[0]).toContain('deleted_at')
    expect(callArgs[0]).toContain('UPDATE notes')
    expect(callArgs[1]).toContain(3)
    expect(callArgs[1]).toContain(99)
  })
})
