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
