import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../src/models/noteModel', () => ({
  default: {
    findByUser: vi.fn(),
    create:     vi.fn(),
    update:     vi.fn(),
    softDelete: vi.fn(),
  },
}))

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const ctrl    = require('../../../src/controllers/noteController')

import NoteModel from '../../../src/models/noteModel'

function makeRes() {
  const res = { statusCode: 200, body: null }
  res.status = (code) => { res.statusCode = code; return res }
  res.json   = (data)  => { res.body = data;        return res }
  return res
}

beforeEach(() => { vi.clearAllMocks() })

describe('noteController', () => {

  // ── getAll ────────────────────────────────────────────────

  it('getAll — 401 если нет userId', async () => {
    const req = { user: null }
    const res = makeRes()
    await ctrl.getAll(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('getAll — возвращает заметки пользователя', async () => {
    const notes = [{ id: 1, title: 'Заметка' }]
    NoteModel.findByUser = vi.fn().mockResolvedValue(notes)

    const req = { user: { id: 5 } }
    const res = makeRes()
    await ctrl.getAll(req, res)

    expect(NoteModel.findByUser).toHaveBeenCalledWith(5)
    expect(res.body).toEqual(notes)
  })

  // ── create ────────────────────────────────────────────────

  it('create — 401 если нет userId', async () => {
    const req = { user: null, body: { title: 'X' } }
    const res = makeRes()
    await ctrl.create(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('create — 400 если нет title', async () => {
    const req = { user: { id: 1 }, body: { title: '' } }
    const res = makeRes()
    await ctrl.create(req, res)
    expect(res.statusCode).toBe(400)
  })

  it('create — 201 и возвращает созданную заметку', async () => {
    NoteModel.create = vi.fn().mockResolvedValue(77)

    const req = { user: { id: 1 }, body: { title: 'Новая', date: '2026-05-12', time: '10:00', tags: [], lists: [] } }
    const res = makeRes()
    await ctrl.create(req, res)

    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBe(77)
    expect(res.body.title).toBe('Новая')
  })

  // ── update ────────────────────────────────────────────────

  it('update — 401 если нет userId', async () => {
    const req = { user: null, params: { id: '1' }, body: {} }
    const res = makeRes()
    await ctrl.update(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('update — вызывает Note.update и возвращает сообщение', async () => {
    NoteModel.update = vi.fn().mockResolvedValue()

    const req = { user: { id: 3 }, params: { id: '10' }, body: { title: 'Изм.', tags: [] } }
    const res = makeRes()
    await ctrl.update(req, res)

    expect(NoteModel.update).toHaveBeenCalledWith(10, 3, expect.objectContaining({ title: 'Изм.' }))
    expect(res.body.message).toContain('обновлен')
  })

  // ── remove ────────────────────────────────────────────────

  it('remove — 401 если нет userId', async () => {
    const req = { user: null, params: { id: '1' } }
    const res = makeRes()
    await ctrl.remove(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('remove — вызывает softDelete и возвращает сообщение', async () => {
    NoteModel.softDelete = vi.fn().mockResolvedValue()

    const req = { user: { id: 7 }, params: { id: '5' } }
    const res = makeRes()
    await ctrl.remove(req, res)

    expect(NoteModel.softDelete).toHaveBeenCalledWith(5, 7)
    expect(res.body.message).toContain('удален')
  })
})
