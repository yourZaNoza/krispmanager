const router = require('express').Router()
const ctrl   = require('../controllers/sseController')

router.get('/stream', ctrl.stream)

module.exports = router
