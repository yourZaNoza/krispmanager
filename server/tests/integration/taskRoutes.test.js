import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/models/taskModel',         () => ({ default: { findById: vi.fn(), create: vi.fn(), update: vi.fn(), softDelete: vi.fn(), findAllForEmployee: vi.fn() } }))
vi.mock('../../src/models/categoryModel',     () => ({ default: { findByUser: vi.fn(), findOne: vi.fn(), create: vi.fn() } }))
vi.mock('../../src/models/employeeModel',     () => ({ default: { findById: vi.fn() } }))
vi.mock('../../src/models/notificationModel', () => ({ default: { create: vi.fn() } }))
vi.mock('../../src/config/sseStore',          () => ({ default: { pushToUser: vi.fn() } }))

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const ctrl    = require('../../src/controllers/taskController')

import TaskModel     from '../../src/models/taskModel'
import CategoryModel from '../../src/models/categoryModel'
import EmployeeModel from '../../src/models/employeeModel'

function makeRes() {
  const res = { statusCode: 200, body: null }
  res.status = (code) => { res.statusCode = code; return res }
  res.json   = (data)  => { res.body = data;        return res }
  return res
}

beforeEach(() => { vi.clearAllMocks() })

describe('taskRoutes (integration-style, controller + model)', () => {

  // ── GET /api/tasks/categories ─────────────────────────────

  it('GET /api/tasks/categories — возвращает категории с задачами', async () => {
    CategoryModel.findByUser     = vi.fn().mockResolvedValue([{ id_category: 1, title: 'Дела', color: '#f00', user_id: 1 }])
    TaskModel.findAllForEmployee = vi.fn().mockResolvedValue([])

    const req = { user: { id: 1 } }
    const res = makeRes()
    await ctrl.getCategories(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body[0].title).toBe('Дела')
    expect(res.body[0].tasks).toEqual([])
  })

  it('GET /api/tasks/categories — 401 без авторизации', async () => {
    const req = { user: null }
    const res = makeRes()
    await ctrl.getCategories(req, res)
    expect(res.statusCode).toBe(401)
  })

  // ── POST /api/tasks ───────────────────────────────────────

  it('POST /api/tasks — создаёт задачу и возвращает 201', async () => {
    TaskModel.create      = vi.fn().mockResolvedValue(99)
    EmployeeModel.findById = vi.fn().mockResolvedValue({ name: 'Иван', role: 'пользователь' })

    const req = { user: { id: 1 }, body: { catId: 2, title: 'Задача', participants: [], tags: [] } }
    const res = makeRes()
    await ctrl.createTask(req, res)

    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBe(99)
    expect(res.body.title).toBe('Задача')
  })

  it('POST /api/tasks — 400 без catId', async () => {
    const req = { user: { id: 1 }, body: { title: 'Задача' } }
    const res = makeRes()
    await ctrl.createTask(req, res)
    expect(res.statusCode).toBe(400)
  })

  // ── DELETE /api/tasks/:id ─────────────────────────────────

  it('DELETE /api/tasks/:id — мягко удаляет задачу', async () => {
    TaskModel.softDelete = vi.fn().mockResolvedValue()
    const req = { user: { id: 1 }, params: { id: '7' } }
    const res = makeRes()
    await ctrl.deleteTask(req, res)
    expect(TaskModel.softDelete).toHaveBeenCalledWith(7, 1)
    expect(res.body.message).toContain('удален')
  })
})
