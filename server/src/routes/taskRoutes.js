const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const ctrl = require('../controllers/taskController')

router.get('/categories/global',  auth, ctrl.getGlobalCategories)
router.get('/categories',         auth, ctrl.getCategories)
router.get('/participating',      auth, ctrl.getParticipatingTasks)
router.post('/categories/global', auth, ctrl.createGlobalCategory)
router.post('/categories',        auth, ctrl.createCategory)
router.put('/categories/:id',     auth, ctrl.updateCategory)
router.delete('/categories/:id',  auth, ctrl.deleteCategory)
router.post('/',                  auth, ctrl.createTask)
router.put('/:id',                auth, ctrl.updateTask)

module.exports = router
