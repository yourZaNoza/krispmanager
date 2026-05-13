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

const mockTask = {
  findById:          vi.fn(),
  create:            vi.fn(),
  update:            vi.fn(),
  softDelete:        vi.fn(),
  findAllForEmployee:vi.fn(),
}
const mockCategory = {
  findByUser: vi.fn(),
  findOne:    vi.fn(),
  create:     vi.fn(),
}
const mockEmployee     = { findById: vi.fn() }
const mockNotification = { create: vi.fn() }
const mockSseStore     = { pushToUser: vi.fn() }

injectCache('../../../src/models/taskModel.js',         mockTask)
injectCache('../../../src/models/categoryModel.js',     mockCategory)
injectCache('../../../src/models/employeeModel.js',     mockEmployee)
injectCache('../../../src/models/notificationModel.js', mockNotification)
injectCache('../../../src/config/sseStore.js',          mockSseStore)

const ctrl = cjsRequire('../../../src/controllers/taskController')

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
    mockTask.create.mockResolvedValue(42)
    mockEmployee.findById.mockResolvedValue({ name: 'Иван', role: 'пользователь' })

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
    mockTask.softDelete.mockResolvedValue()
    const req = { user: { id: 5 }, params: { id: '10' } }
    const res = makeRes()
    await ctrl.deleteTask(req, res)
    expect(mockTask.softDelete).toHaveBeenCalledWith(10, 5)
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
    mockCategory.findByUser.mockResolvedValue([{ id_category: 1, title: 'Общие', color: '#000', user_id: 1 }])
    mockTask.findAllForEmployee.mockResolvedValue([])

    const req = { user: { id: 1 } }
    const res = makeRes()
    await ctrl.getCategories(req, res)

    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].title).toBe('Общие')
    expect(res.body[0].tasks).toEqual([])
  })
})
