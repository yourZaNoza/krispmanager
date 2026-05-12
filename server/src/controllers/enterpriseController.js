const db             = require('../config/db')
const EnterpriseCategory = require('../models/enterpriseCategoryModel')
const Enterprise = require('../models/enterpriseModel')
const Employee   = require('../models/employeeModel')

function mapEnterprise(e) {
  return {
    id:             e.id,
    name:           e.name || '',
    city:           e.city || '',
    address:        e.address || '',
    contact_person: e.contact_person || '',
    contact_id:     e.contact_id || null,
    phone:          e.phone || e.phone_number || '',
    categoryId:     e.category_id,
  }
}

// GET /api/enterprises
exports.getAll = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const viewer = await Employee.findById(userId)
    const isPrivileged = viewer && (viewer.role === 'администратор' || viewer.role === 'менеджер')

    let categories = await EnterpriseCategory.findByUser(userId)
    if (!categories.length) {
      await EnterpriseCategory.seedDefaults(userId)
      categories = await EnterpriseCategory.findByUser(userId)
    }

    let result
    if (isPrivileged) {
      const allEnterprises = await Enterprise.findAllSystem()
      result = categories.map(cat => ({
        id:          cat.id,
        title:       cat.title,
        color:       cat.color,
        enterprises: allEnterprises
          .filter(e => e.cat_title === cat.title)
          .map(mapEnterprise),
      }))
    } else {
      const enterprises = await Enterprise.findByUser(userId)
      result = categories.map(cat => ({
        id:          cat.id,
        title:       cat.title,
        color:       cat.color,
        enterprises: enterprises
          .filter(e => e.category_id === cat.id)
          .map(mapEnterprise),
      }))
    }

    res.json(result)
  } catch (err) {
    console.error('getAll enterprises error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// POST /api/enterprises/categories
exports.createCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    const { title, color } = req.body
    if (!title) return res.status(400).json({ message: 'title обязателен' })
    const cat = await EnterpriseCategory.create(userId, title, color)
    res.status(201).json({ id: cat.id, title: cat.title, color: cat.color })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// PUT /api/enterprises/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    const { title, color } = req.body
    if (!title) return res.status(400).json({ message: 'title обязателен' })
    await EnterpriseCategory.update(parseInt(req.params.id), userId, title, color)
    res.json({ message: 'Категория обновлена' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// DELETE /api/enterprises/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    await EnterpriseCategory.delete(parseInt(req.params.id), userId)
    res.json({ message: 'Категория удалена' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// POST /api/enterprises
exports.createEnterprise = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const { categoryId, name, city, address, contact_person, contact_id, phone } = req.body
    if (!name || !categoryId) return res.status(400).json({ message: 'name и categoryId обязательны' })

    const id = await Enterprise.create(userId, categoryId, { name, city, address, contact_person, contact_id, phone })
    res.status(201).json({ id, name, city: city || '', address: address || '', contact_person: contact_person || '', contact_id: contact_id || null, phone: phone || '', categoryId: Number(categoryId) })
  } catch (err) {
    console.error('createEnterprise error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// PUT /api/enterprises/:id
exports.updateEnterprise = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const id = parseInt(req.params.id, 10)
    const { categoryId, name, city, address, contact_person, contact_id, phone } = req.body
    if (!name || !categoryId) return res.status(400).json({ message: 'name и categoryId обязательны' })

    await Enterprise.update(id, userId, categoryId, { name, city, address, contact_person, contact_id, phone })
    res.json({ message: 'Предприятие обновлено' })
  } catch (err) {
    console.error('updateEnterprise error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// DELETE /api/enterprises/:id
exports.deleteEnterprise = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const id = parseInt(req.params.id, 10)
    await Enterprise.delete(id, userId)
    res.json({ message: 'Предприятие удалено' })
  } catch (err) {
    console.error('deleteEnterprise error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// GET /api/enterprises/report?categoryId=<id|all>&enterpriseId=<id>
exports.getEnterpriseReport = async (req, res) => {
  const userId = req.user && req.user.id
  if (!userId) return res.status(401).json({ message: 'Не авторизован' })

  const { categoryId, categoryTitle, enterpriseId } = req.query

  try {
    let enterprises = []

    if (enterpriseId) {
      const [rows] = await db.execute(
        `SELECT e.*, ec.title AS cat_title
         FROM enterprises e
         LEFT JOIN enterprise_categories ec ON e.category_id = ec.id
         WHERE e.id = ?`,
        [parseInt(enterpriseId)]
      )
      enterprises = rows
    } else if (categoryId && categoryId !== 'all') {
      const [rows] = await db.execute(
        `SELECT e.*, ec.title AS cat_title
         FROM enterprises e
         LEFT JOIN enterprise_categories ec ON e.category_id = ec.id
         WHERE e.category_id = ?`,
        [parseInt(categoryId)]
      )
      enterprises = rows
    } else if (categoryTitle && categoryTitle !== 'all') {
      const [rows] = await db.execute(
        `SELECT e.*, ec.title AS cat_title
         FROM enterprises e
         LEFT JOIN enterprise_categories ec ON e.category_id = ec.id
         WHERE ec.title = ?`,
        [categoryTitle]
      )
      enterprises = rows
    } else {
      const [rows] = await db.execute(
        `SELECT e.*, ec.title AS cat_title
         FROM enterprises e
         LEFT JOIN enterprise_categories ec ON e.category_id = ec.id`
      )
      enterprises = rows
    }

    enterprises.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'))

    const result = []
    for (const ent of enterprises) {
      const [tasks] = await db.execute(
        `SELECT id, title, description, deadline, date_from, lists, participants, comments, attachments
         FROM tasks
         WHERE enterprise = ? AND deleted_at IS NULL
         ORDER BY title ASC`,
        [ent.name]
      )

      result.push({
        id:             ent.id,
        name:           ent.name || '',
        city:           ent.city || '',
        address:        ent.address || '',
        phone:          ent.phone || '',
        contact_person: ent.contact_person || '',
        catTitle:       ent.cat_title || '',
        tasks: tasks.map(t => {
          let lists = [], participants = [], comments = [], attachments = []
          try { lists        = JSON.parse(t.lists        || '[]') } catch {}
          try { participants = JSON.parse(t.participants || '[]') } catch {}
          try { comments     = JSON.parse(t.comments     || '[]') } catch {}
          try { attachments  = JSON.parse(t.attachments  || '[]') } catch {}
          return {
            id:           t.id,
            title:        t.title || '',
            description:  t.description || '',
            deadline:     t.deadline  ? new Date(t.deadline).toISOString()  : null,
            date_from:    t.date_from ? new Date(t.date_from).toISOString() : null,
            lists,
            participants,
            commentCount: Array.isArray(comments)    ? comments.length    : 0,
            fileCount:    Array.isArray(attachments)  ? attachments.length : 0,
          }
        }),
      })
    }

    res.json(result)
  } catch (err) {
    console.error('getEnterpriseReport error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}
