const Employee = require('../models/employeeModel')
const Task     = require('../models/taskModel')
const Note     = require('../models/noteModel')
const db       = require('../config/db')

function safeJSON(val, fallback) {
  if (Array.isArray(val)) return val
  if (val === null || val === undefined) return fallback
  try { return JSON.parse(val) } catch { return fallback }
}

function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt)) return '—'
  return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`
}

function mapTask(t) {
  const participants = safeJSON(t.participants, [])
  return {
    id:          t.id,
    title:       t.title || '',
    description: t.description || '',
    deadline:    fmtDate(t.deadline),
    deadlineRaw: t.deadline || null,
    tags:        safeJSON(t.tags, []),
    lists:       safeJSON(t.lists, []),
    attachments: safeJSON(t.attachments, []),
    comments:    safeJSON(t.comments, []),
    participants,
    avatarCount: participants.length,
    enterprise:  t.enterprise || '',
    history:     safeJSON(t.history, []),
    completed:   t.completed === 1 || t.completed === true,
    deleted:     !!t.deleted_at,
    subtasks:    '',
  }
}

// GET /api/archive/employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll()
    res.json(employees)
  } catch (err) {
    console.error('getEmployees error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// GET /api/archive/users/:id/tasks  — собственные + совместные задачи сотрудника
exports.getUserTasks = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10)
    const tasks = await Task.findAllForEmployeeArchive(userId)
    res.json(tasks.map(mapTask))
  } catch (err) {
    console.error('getUserTasks error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// DELETE /api/archive/tasks/:id  — soft-delete (admin/manager)
exports.deleteTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10)
    await db.execute('UPDATE tasks SET deleted_at = NOW() WHERE id = ?', [taskId])
    res.json({ message: 'Задача удалена' })
  } catch (err) {
    console.error('archive deleteTask error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// PUT /api/archive/tasks/:id/restore  — restore soft-deleted (admin/manager)
exports.restoreTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10)
    await db.execute('UPDATE tasks SET deleted_at = NULL WHERE id = ?', [taskId])
    res.json({ message: 'Задача восстановлена' })
  } catch (err) {
    console.error('archive restoreTask error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// GET /api/archive/users/:id/notes
exports.getUserNotes = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10)
    const notes = await Note.findAllForUserArchive(userId)
    res.json(notes)
  } catch (err) {
    console.error('getUserNotes error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// DELETE /api/archive/notes/:id  — soft-delete
exports.deleteNote = async (req, res) => {
  try {
    const noteId = parseInt(req.params.id, 10)
    await db.execute('UPDATE notes SET deleted_at = NOW() WHERE id = ?', [noteId])
    res.json({ message: 'Заметка удалена' })
  } catch (err) {
    console.error('archive deleteNote error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// PUT /api/archive/notes/:id/restore  — restore soft-deleted
exports.restoreNote = async (req, res) => {
  try {
    const noteId = parseInt(req.params.id, 10)
    await db.execute('UPDATE notes SET deleted_at = NULL WHERE id = ?', [noteId])
    res.json({ message: 'Заметка восстановлена' })
  } catch (err) {
    console.error('archive restoreNote error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}
