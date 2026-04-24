const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const ctrl = require('../controllers/taskController')

router.get('/categories', auth, ctrl.getCategories)
router.post('/categories', auth, ctrl.createCategory)
router.put('/categories/:id', auth, ctrl.updateCategory)
router.delete('/categories/:id', auth, ctrl.deleteCategory)
router.post('/', auth, ctrl.createTask)
router.put('/:id', auth, ctrl.updateTask)

module.exports = router
