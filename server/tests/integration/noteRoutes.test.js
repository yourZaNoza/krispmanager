import { describe, it, expect, vi, beforeEach } from 'vitest'

// Мокаем модель и auth-middleware
vi.mock('../../src/models/noteModel', () => ({
  default: {
    findByUser:  vi.fn(),
    create:      vi.fn(),
    update:      vi.fn(),
    softDelete:  vi.fn(),
  },
}))

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const ctrl    = require('../../src/controllers/noteController')

import NoteModel from '../../src/models/noteModel'

function makeRes() {
  const res = { statusCode: 200, body: null }
  res.status = (code) => { res.statusCode = code; return res }
  res.json   = (data)  => { res.body = data;        return res }
  return res
}

beforeEach(() => { vi.clearAllMocks() })

describe('noteRoutes (integration-style, controller + model)', () => {

  // ── GET /api/notes ────────────────────────────────────────

  it('GET /api/notes — возвращает список заметок', async () => {
    NoteModel.findByUser = vi.fn().mockResolvedValue([
      { id: 1, title: 'Заметка', tags: [], lists: [] },
    ])
    const req = { user: { id: 1 } }
    const res = makeRes()
    await ctrl.getAll(req, res)
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].title).toBe('Заметка')
  })

  it('GET /api/notes — 401 без авторизации', async () => {
    const req = { user: null }
    const res = makeRes()
    await ctrl.getAll(req, res)
    expect(res.statusCode).toBe(401)
  })

  // ── POST /api/notes ───────────────────────────────────────

  it('POST /api/notes — создаёт заметку и возвращает 201', async () => {
    NoteModel.create = vi.fn().mockResolvedValue(10)
    const req = { user: { id: 1 }, body: { title: 'Новая заметка', tags: [], lists: [] } }
    const res = makeRes()
    await ctrl.create(req, res)
    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBe(10)
  })

  it('POST /api/notes — 400 без title', async () => {
    const req = { user: { id: 1 }, body: { title: '   ' } }
    const res = makeRes()
    await ctrl.create(req, res)
    expect(res.statusCode).toBe(400)
  })

  // ── PUT /api/notes/:id ────────────────────────────────────

  it('PUT /api/notes/:id — обновляет заметку', async () => {
    NoteModel.update = vi.fn().mockResolvedValue()
    const req = { user: { id: 1 }, params: { id: '5' }, body: { title: 'Обновлённая', tags: [] } }
    const res = makeRes()
    await ctrl.update(req, res)
    expect(NoteModel.update).toHaveBeenCalledWith(5, 1, expect.objectContaining({ title: 'Обновлённая' }))
    expect(res.body.message).toContain('обновлен')
  })

  // ── DELETE /api/notes/:id ─────────────────────────────────

  it('DELETE /api/notes/:id — мягко удаляет заметку', async () => {
    NoteModel.softDelete = vi.fn().mockResolvedValue()
    const req = { user: { id: 1 }, params: { id: '3' } }
    const res = makeRes()
    await ctrl.remove(req, res)
    expect(NoteModel.softDelete).toHaveBeenCalledWith(3, 1)
    expect(res.body.message).toContain('удален')
  })
})
