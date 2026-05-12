import { describe, it, expect, vi, beforeEach } from 'vitest'

// Мокаем все зависимости контроллера
vi.mock('../../../src/models/taskModel',         () => ({ default: { findById: vi.fn(), create: vi.fn(), update: vi.fn(), softDelete: vi.fn(), findAllForEmployee: vi.fn() } }))
vi.mock('../../../src/models/categoryModel',     () => ({ default: { findByUser: vi.fn(), findOne: vi.fn(), create: vi.fn() } }))
vi.mock('../../../src/models/employeeModel',     () => ({ default: { findById: vi.fn() } }))
vi.mock('../../../src/models/notificationModel', () => ({ default: { create: vi.fn() } }))
vi.mock('../../../src/config/sseStore',          () => ({ default: { pushToUser: vi.fn() } }))

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const ctrl    = require('../../../src/controllers/taskController')

import TaskModel     from '../../../src/models/taskModel'
import CategoryModel from '../../../src/models/categoryModel'

const mockTask = { default: TaskModel }
const mockCat  = { default: CategoryModel }

function makeRes() {
  const res = { statusCode: 200, body: null }
  res.status = (code) => { res.statusCode = code; return res }
  res.json   = (data)  => { res.body = data;        return res }
  return res
}

beforeEach(() => { vi.clearAllMocks() })

describe('taskController', () => {

  // ── createTask ────────────────────────────────────────────

  it('createTask — 401 если нет userId', async () => {
    const req = { user: null, body: {} }
    const res = makeRes()
    await ctrl.createTask(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('createTask — 400 если нет catId или title', async () => {
    const req = { user: { id: 1 }, body: { catId: null, title: '' } }
    const res = makeRes()
    await ctrl.createTask(req, res)
    expect(res.statusCode).toBe(400)
  })

  it('createTask — 201 и возвращает задачу при корректных данных', async () => {
    TaskModel.create    = vi.fn().mockResolvedValue(42)
    TaskModel.findById  = vi.fn().mockResolvedValue(null)

    const { default: Employee } = await import('../../../src/models/employeeModel')
    Employee.findById = vi.fn().mockResolvedValue({ name: 'Иван', role: 'пользователь' })

    const req = {
      user: { id: 1 },
      body: { catId: 3, title: 'Новая', description: '', participants: [], tags: [], lists: [] },
    }
    const res = makeRes()
    await ctrl.createTask(req, res)

    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBe(42)
    expect(res.body.title).toBe('Новая')
  })

  // ── deleteTask ────────────────────────────────────────────

  it('deleteTask — 401 если нет userId', async () => {
    const req = { user: null, params: { id: '1' } }
    const res = makeRes()
    await ctrl.deleteTask(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('deleteTask — вызывает softDelete и возвращает 200', async () => {
    TaskModel.softDelete = vi.fn().mockResolvedValue()
    const req = { user: { id: 5 }, params: { id: '10' } }
    const res = makeRes()
    await ctrl.deleteTask(req, res)
    expect(TaskModel.softDelete).toHaveBeenCalledWith(10, 5)
    expect(res.body.message).toContain('удален')
  })

  // ── getCategories ─────────────────────────────────────────

  it('getCategories — 401 если нет userId', async () => {
    const req = { user: null }
    const res = makeRes()
    await ctrl.getCategories(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('getCategories — возвращает массив категорий с задачами', async () => {
    CategoryModel.findByUser        = vi.fn().mockResolvedValue([{ id_category: 1, title: 'Общие', color: '#000', user_id: 1 }])
    TaskModel.findAllForEmployee    = vi.fn().mockResolvedValue([])

    const req = { user: { id: 1 } }
    const res = makeRes()
    await ctrl.getCategories(req, res)

    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].title).toBe('Общие')
    expect(res.body[0].tasks).toEqual([])
  })
})
