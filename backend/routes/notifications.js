import { Router } from 'express'
import { sendNotification } from '../lib/notify.js'

const router = Router()

// POST /api/notifications — Insert a notification (called from frontend)
router.post('/', async (req, res) => {
  const { userId, type, title, message } = req.body

  if (!userId || !type || !title || !message) {
    return res.status(400).json({ error: 'userId, type, title, and message are required' })
  }

  try {
    await sendNotification(userId, type, title, message)
    res.json({ success: true })
  } catch (err) {
    console.error('Notification route error:', err)
    res.status(500).json({ error: 'Failed to send notification' })
  }
})

export default router
