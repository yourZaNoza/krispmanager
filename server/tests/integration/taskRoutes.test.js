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
const mockCategory     = { findByUser: vi.fn(), findOne: vi.fn(), create: vi.fn() }
const mockEmployee     = { findById: vi.fn() }
const mockNotification = { create: vi.fn() }
const mockSseStore     = { pushToUser: vi.fn() }

injectCache('../../src/models/taskModel.js',         mockTask)
injectCache('../../src/models/categoryModel.js',     mockCategory)
injectCache('../../src/models/employeeModel.js',     mockEmployee)
injectCache('../../src/models/notificationModel.js', mockNotification)
injectCache('../../src/config/sseStore.js',          mockSseStore)

const ctrl = cjsRequire('../../src/controllers/taskController')

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
    mockCategory.findByUser.mockResolvedValue([{ id_category: 1, title: 'Дела', color: '#f00', user_id: 1 }])
    mockTask.findAllForEmployee.mockResolvedValue([])

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
    mockTask.create.mockResolvedValue(99)
    mockEmployee.findById.mockResolvedValue({ name: 'Иван', role: 'пользователь' })

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
    mockTask.softDelete.mockResolvedValue()
    const req = { user: { id: 1 }, params: { id: '7' } }
    const res = makeRes()
    await ctrl.deleteTask(req, res)
    expect(mockTask.softDelete).toHaveBeenCalledWith(7, 1)
    expect(res.body.message).toContain('удален')
  })
})
