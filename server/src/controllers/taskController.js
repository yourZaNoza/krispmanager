const Category     = require('../models/categoryModel')
const Task         = require('../models/taskModel')
const Employee     = require('../models/employeeModel')
const Notification = require('../models/notificationModel')
const store        = require('../config/sseStore')

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
    dateFrom:     fmtDate(t.date_from),
    dateFromRaw:  t.date_from || null,
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
      Task.findAllForEmployee(userId),
    ])

    const result = categories.map(cat => ({
      id:       cat.id_category,
      title:    cat.title,
      dotColor: cat.color,
      isGlobal: cat.user_id === null,
      tasks:    tasks.filter(t => Number(t.id_category) === Number(cat.id_category)).map(mapTask),
    }))

    res.json(result)
  } catch (err) {
    console.error('getCategories error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// GET /api/tasks/categories/global
exports.getGlobalCategories = async (req, res) => {
  try {
    const cats = await Category.findGlobal()
    res.json(cats.map(c => ({ id: c.id_category, title: c.title, dotColor: c.color })))
  } catch (err) {
    console.error('getGlobalCategories error:', err)
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

    const cat = await Category.findOne(catId)
    if (!cat) return res.status(404).json({ message: 'Категория не найдена' })

    if (cat.user_id === null) {
      const employee = await Employee.findById(userId)
      if (employee?.role !== 'администратор') {
        return res.status(403).json({ message: 'Только администратор может изменять общие категории' })
      }
      await Category.updateGlobal(catId, name, color)
    } else {
      await Category.update(catId, userId, name, color)
    }

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

    const cat = await Category.findOne(catId)
    if (!cat) return res.status(404).json({ message: 'Категория не найдена' })

    if (cat.user_id === null) {
      const employee = await Employee.findById(userId)
      if (employee?.role !== 'администратор') {
        return res.status(403).json({ message: 'Только администратор может удалять общие категории' })
      }
      await Category.deleteGlobal(catId)
    } else {
      await Category.delete(catId, userId)
    }

    res.json({ message: 'Категория удалена' })
  } catch (err) {
    console.error('deleteCategory error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// POST /api/tasks/categories  (user-owned, kept for possible future use)
exports.createCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const { name, color } = req.body
    if (!name) return res.status(400).json({ message: 'Название обязательно' })

    const cat = await Category.create(userId, name, color)
    res.status(201).json({ id: cat.id_category, title: cat.title, dotColor: cat.color, isGlobal: false, tasks: [] })
  } catch (err) {
    console.error('createCategory error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// POST /api/tasks/categories/global  (admin only)
exports.createGlobalCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const employee = await Employee.findById(userId)
    if (employee?.role !== 'администратор') {
      return res.status(403).json({ message: 'Только администратор может создавать общие категории' })
    }

    const { name, color } = req.body
    if (!name) return res.status(400).json({ message: 'Название обязательно' })

    const cat = await Category.createGlobal(name, color)
    res.status(201).json({ id: cat.id_category, title: cat.title, dotColor: cat.color, isGlobal: true, tasks: [] })
  } catch (err) {
    console.error('createGlobalCategory error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// Push a notification to DB and then to SSE in one call
async function pushNotif({ recipientId, actorId, actorName, type, taskId, taskTitle, message }) {
  const notifId = await Notification.create({ userId: recipientId, actorId, actorName, type, taskId, taskTitle, message })
  store.pushToUser(recipientId, {
    type:       'notification',
    id:         notifId,
    actor_name: actorName,
    actor_id:   actorId,
    message,
    task_title: taskTitle,
    task_id:    taskId,
    is_read:    0,
    created_at: new Date().toISOString(),
  })
}

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const { catId, title, description, deadlineRaw, dateFromRaw, enterprise, tags, lists, participants, attachments, comments } = req.body
    if (!catId || !title) return res.status(400).json({ message: 'catId и title обязательны' })

    const deadline  = deadlineRaw  ? new Date(deadlineRaw).toISOString().split('T')[0]  : null
    const date_from = dateFromRaw  ? new Date(dateFromRaw).toISOString().split('T')[0]  : null

    const taskId = await Task.create(userId, catId, {
      title, description, deadline, date_from, enterprise, tags, lists, participants, attachments, comments,
    })

    const parts = participants || []

    try {
      const actor = await Employee.findById(userId)
      const actorName = actor?.name || 'Пользователь'
      for (const p of parts) {
        if (Number(p.id) !== Number(userId)) {
          await pushNotif({
            recipientId: p.id, actorId: userId, actorName,
            type: 'task_assigned', taskId, taskTitle: title,
            message: `добавил вас в задачу «${title}»`,
          })
        }
      }
    } catch (e) { console.error('Notification error:', e) }

    res.status(201).json({
      id:           taskId,
      title,
      description:  description || '',
      deadline:     fmtDate(deadline),
      deadlineRaw:  deadline    || null,
      dateFrom:     fmtDate(date_from),
      dateFromRaw:  date_from   || null,
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

// GET /api/tasks/participating — задачи, где текущий пользователь — участник
exports.getParticipatingTasks = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    const tasks = await Task.findParticipating(userId)
    res.json(tasks.map(mapTask))
  } catch (err) {
    console.error('getParticipatingTasks error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// DELETE /api/tasks/:id  (soft-delete)
exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    const taskId = parseInt(req.params.id, 10)
    await Task.softDelete(taskId, userId)
    res.json({ message: 'Задача удалена' })
  } catch (err) {
    console.error('deleteTask error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const taskId = parseInt(req.params.id, 10)
    const { catId, title, description, deadlineRaw, dateFromRaw, enterprise, tags, lists, participants, attachments, comments, history, completed } = req.body
    if (!catId || !title) return res.status(400).json({ message: 'catId и title обязательны' })

    const deadline  = deadlineRaw ? new Date(deadlineRaw).toISOString().split('T')[0] : null
    const date_from = dateFromRaw ? new Date(dateFromRaw).toISOString().split('T')[0] : null

    // Snapshot before update for change detection
    const oldTask = await Task.findById(taskId)

    await Task.update(taskId, userId, catId, {
      title, description, deadline, date_from, enterprise, tags, lists, participants, attachments, comments, history, completed,
    })

    try {
      const actor = await Employee.findById(userId)
      const actorName = actor?.name || 'Пользователь'
      const parts = participants || []

      if (oldTask) {
        const oldParts       = safeJSON(oldTask.participants, [])
        const oldComments    = safeJSON(oldTask.comments, [])
        const oldAttachments = safeJSON(oldTask.attachments, [])
        const oldLists       = safeJSON(oldTask.lists, [])

        // Recipients = current participants minus the actor
        const recipients = parts.filter(p => Number(p.id) !== Number(userId))

        // Build list of general change notifications
        const changes = []

        if (oldTask.title !== title) {
          changes.push({ type: 'task_title_changed', message: `изменил название задачи на «${title}»` })
        }

        if ((oldTask.description || '') !== (description || '')) {
          changes.push({ type: 'task_description_changed', message: `изменил описание задачи «${title}»` })
        }

        const oldDeadline = oldTask.deadline ? new Date(oldTask.deadline).toISOString().split('T')[0] : null
        if (oldDeadline !== deadline) {
          const label = deadline ? fmtDate(deadline) : 'нет срока'
          changes.push({ type: 'task_deadline_changed', message: `изменил срок задачи «${title}» → ${label}` })
        }

        if (Number(oldTask.id_category) !== Number(catId)) {
          changes.push({ type: 'task_category_changed', message: `переместил задачу «${title}» в другую категорию` })
        }

        const commentsArr = comments || []
        if (commentsArr.length > oldComments.length) {
          const latest  = commentsArr.at(-1)
          const preview = latest?.text ? ` "${latest.text.slice(0, 60)}"` : ''
          changes.push({ type: 'task_comment_added', message: `прокомментировал задачу «${title}»:${preview}` })
        }

        if ((attachments || []).length > oldAttachments.length) {
          changes.push({ type: 'task_attachment_added', message: `прикрепил файл к задаче «${title}»` })
        }

        if ((lists || []).length > oldLists.length) {
          changes.push({ type: 'task_list_added', message: `добавил список к задаче «${title}»` })
        }

        const wasCompleted = oldTask.completed === 1 || oldTask.completed === true
        const isCompleted  = Boolean(completed)
        if (wasCompleted !== isCompleted) {
          changes.push({
            type:    'task_completed_changed',
            message: isCompleted ? `завершил задачу «${title}»` : `возобновил задачу «${title}»`,
          })
        }

        // Send general changes to all current recipients
        for (const change of changes) {
          for (const p of recipients) {
            await pushNotif({
              recipientId: p.id, actorId: userId, actorName,
              type: change.type, taskId, taskTitle: title,
              message: change.message,
            })
          }
        }

        // Notify newly added participants
        const newParts = parts.filter(p => !oldParts.some(op => Number(op.id) === Number(p.id)))
        for (const np of newParts) {
          if (Number(np.id) !== Number(userId)) {
            await pushNotif({
              recipientId: np.id, actorId: userId, actorName,
              type: 'task_assigned', taskId, taskTitle: title,
              message: `добавил вас в задачу «${title}»`,
            })
          }
        }
      } else {
        // Old task not found — send generic notification
        for (const p of parts) {
          if (Number(p.id) !== Number(userId)) {
            await pushNotif({
              recipientId: p.id, actorId: userId, actorName,
              type: 'task_updated', taskId, taskTitle: title,
              message: `обновил задачу «${title}»`,
            })
          }
        }
      }
    } catch (e) { console.error('Notification error:', e) }

    res.json({ message: 'Задача обновлена' })
  } catch (err) {
    console.error('updateTask error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}
