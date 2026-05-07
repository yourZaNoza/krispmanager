const Employee = require('../models/employeeModel')
const Task = require('../models/taskModel')
const Note = require('../models/noteModel')

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
    const tasks = await Task.findAllForEmployee(userId)
    res.json(tasks.map(mapTask))
  } catch (err) {
    console.error('getUserTasks error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// GET /api/archive/users/:id/notes
exports.getUserNotes = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10)
    const notes = await Note.findByUser(userId)
    res.json(notes)
  } catch (err) {
    console.error('getUserNotes error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}
