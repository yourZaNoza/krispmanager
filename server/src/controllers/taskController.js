const Category = require('../models/categoryModel')
const Task = require('../models/taskModel')

function safeJSON(val, fallback) {
  if (Array.isArray(val)) return val
  if (val === null || val === undefined) return fallback
  try { return JSON.parse(val) } catch (e) { return fallback }
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
    id:           t.id,
    title:        t.title || '',
    description:  t.description || '',
    deadline:     fmtDate(t.deadline),
    deadlineRaw:  t.deadline || null,
    tags:         safeJSON(t.tags, []),
    lists:        safeJSON(t.lists, []),
    attachments:  safeJSON(t.attachments, []),
    comments:     safeJSON(t.comments, []),
    participants,
    avatarCount:  participants.length,
    enterprise:   t.enterprise || '',
    history:      safeJSON(t.history, []),
    completed:    t.completed === 1 || t.completed === true,
    subtasks:     '',
  }
}

// GET /api/tasks/categories
exports.getCategories = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован: нет id пользователя' })

    const [categories, tasks] = await Promise.all([
      Category.findByUser(userId),
      Task.findByUser(userId),
    ])

    const result = categories.map(cat => ({
      id:       cat.id_category,
      title:    cat.title,
      dotColor: cat.color,
      tasks:    tasks.filter(t => Number(t.id_category) === Number(cat.id_category)).map(mapTask),
    }))

    res.json(result)
  } catch (err) {
    console.error('getCategories error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// PUT /api/tasks/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    const catId = parseInt(req.params.id, 10)
    const { name, color } = req.body
    if (!name) return res.status(400).json({ message: 'Название обязательно' })
    await Category.update(catId, userId, name, color)
    res.json({ message: 'Категория обновлена' })
  } catch (err) {
    console.error('updateCategory error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// DELETE /api/tasks/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    const catId = parseInt(req.params.id, 10)
    await Category.delete(catId, userId)
    res.json({ message: 'Категория удалена' })
  } catch (err) {
    console.error('deleteCategory error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// POST /api/tasks/categories
exports.createCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const { name, color } = req.body
    if (!name) return res.status(400).json({ message: 'Название обязательно' })

    const cat = await Category.create(userId, name, color)
    res.status(201).json({ id: cat.id_category, title: cat.title, dotColor: cat.color, tasks: [] })
  } catch (err) {
    console.error('createCategory error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const { catId, title, description, deadlineRaw, enterprise, tags, lists, participants, attachments, comments } = req.body
    if (!catId || !title) return res.status(400).json({ message: 'catId и title обязательны' })

    const deadline = deadlineRaw ? new Date(deadlineRaw).toISOString().split('T')[0] : null

    const taskId = await Task.create(userId, catId, {
      title, description, deadline, enterprise, tags, lists, participants, attachments, comments,
    })

    const parts = participants || []
    res.status(201).json({
      id:           taskId,
      title,
      description:  description || '',
      deadline:     fmtDate(deadline),
      deadlineRaw:  deadline || null,
      tags:         tags || [],
      lists:        lists || [],
      attachments:  attachments || [],
      comments:     comments || [],
      participants: parts,
      avatarCount:  parts.length,
      enterprise:   enterprise || '',
      history:      [],
      subtasks:     '',
    })
  } catch (err) {
    console.error('createTask error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const taskId = parseInt(req.params.id, 10)
    const { catId, title, description, deadlineRaw, enterprise, tags, lists, participants, attachments, comments, history, completed } = req.body
    if (!catId || !title) return res.status(400).json({ message: 'catId и title обязательны' })

    const deadline = deadlineRaw ? new Date(deadlineRaw).toISOString().split('T')[0] : null

    await Task.update(taskId, userId, catId, {
      title, description, deadline, enterprise, tags, lists, participants, attachments, comments, history, completed,
    })

    res.json({ message: 'Задача обновлена' })
  } catch (err) {
    console.error('updateTask error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}
