import { describe, it, expect, vi, beforeEach } from 'vitest'

// Мокаем БД до импорта модели
vi.mock('../../../src/config/db', () => ({
  default: { execute: vi.fn() },
  execute: vi.fn(),
}))

import db from '../../../src/config/db'

// Task использует CommonJS require, импортируем через createRequire
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Task = require('../../../src/models/taskModel')

const mockDb = db.execute ?? db.default?.execute

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Task Model', () => {

  // ── findById ──────────────────────────────────────────────

  it('findById — возвращает задачу по id', async () => {
    const mockTask = { id: 1, title: 'Задача 1', user_id: 42, deleted_at: null }
    mockDb.mockResolvedValueOnce([[mockTask]])

    const result = await Task.findById(1)
    expect(result).toEqual(mockTask)
    expect(mockDb).toHaveBeenCalledWith(
      'SELECT * FROM tasks WHERE id = ?',
      [1]
    )
  })

  it('findById — возвращает null если задача не найдена', async () => {
    mockDb.mockResolvedValueOnce([[]])

    const result = await Task.findById(9999)
    expect(result).toBeNull()
  })

  // ── create ────────────────────────────────────────────────

  it('create — вставляет запись и возвращает insertId', async () => {
    mockDb.mockResolvedValueOnce([{ insertId: 77 }])

    const data = {
      title:       'Новая задача',
      description: 'Описание',
      deadline:    '2026-06-01',
      date_from:   null,
      enterprise:  'Школа №1',
      tags:        [],
      lists:       [],
      participants:[],
      attachments: [],
      comments:    [],
    }

    const id = await Task.create(42, 3, data)
    expect(id).toBe(77)
    expect(mockDb).toHaveBeenCalledOnce()
  })

  it('create — вызывает INSERT с корректными полями', async () => {
    mockDb.mockResolvedValueOnce([{ insertId: 1 }])

    await Task.create(1, 2, { title: 'Тест' })

    const callArgs = mockDb.mock.calls[0]
    expect(callArgs[0]).toContain('INSERT INTO tasks')
    expect(callArgs[1]).toContain('Тест')
  })

  // ── findByUser ────────────────────────────────────────────

  it('findByUser — возвращает задачи пользователя', async () => {
    const rows = [
      { id: 1, title: 'Задача A', user_id: 5, deleted_at: null },
      { id: 2, title: 'Задача B', user_id: 5, deleted_at: null },
    ]
    mockDb.mockResolvedValueOnce([rows])

    const result = await Task.findByUser(5)
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Задача A')
  })

  it('findByUser — возвращает пустой массив если задач нет', async () => {
    mockDb.mockResolvedValueOnce([[]])
    const result = await Task.findByUser(999)
    expect(result).toHaveLength(0)
  })

  // ── softDelete ────────────────────────────────────────────

  it('softDelete — вызывает UPDATE с deleted_at', async () => {
    mockDb.mockResolvedValueOnce([{ affectedRows: 1 }])

    await Task.softDelete(1, 42)

    const callArgs = mockDb.mock.calls[0]
    expect(callArgs[0]).toContain('deleted_at')
    expect(callArgs[0]).toContain('UPDATE tasks')
    expect(callArgs[1]).toContain(1)
    expect(callArgs[1]).toContain(42)
  })

  // ── update ────────────────────────────────────────────────

  it('update — вызывает UPDATE с нужными полями', async () => {
    mockDb.mockResolvedValueOnce([{ affectedRows: 1 }])

    const data = {
      title:       'Обновлённая задача',
      description: 'Новое описание',
      deadline:    '2026-12-31',
      date_from:   null,
      enterprise:  null,
      tags:        [],
      lists:       [],
      participants:[],
      attachments: [],
      comments:    [],
      history:     [],
      completed:   false,
    }

    await Task.update(1, 42, 3, data)

    const callArgs = mockDb.mock.calls[0]
    expect(callArgs[0]).toContain('UPDATE tasks')
    expect(callArgs[0]).toContain('SET')
    expect(callArgs[1]).toContain('Обновлённая задача')
  })
})
