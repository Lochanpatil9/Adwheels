import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import healthRouter from './routes/health.js'
import leadsRouter from './routes/leads.js'
import paymentsRouter from './routes/payments.js'
import campaignsRouter from './routes/campaigns.js'
import notificationsRouter from './routes/notifications.js'
import driversRouter from './routes/drivers.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH'],
}))
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/leads', leadsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/campaigns', campaignsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/drivers', driversRouter)

// Auto-expire campaigns: check on startup + every 24 hours
async function runExpiryCheck() {
  try {
    const res = await fetch(`http://localhost:${PORT}/api/campaigns/expiry-check`)
    const data = await res.json()
    console.log('⏰ Campaign expiry check:', data.message || data)

    // Also run expiry warning (5-day notifications)
    const warnRes = await fetch(`http://localhost:${PORT}/api/campaigns/expiry-warning`)
    const warnData = await warnRes.json()
    console.log('⏰ Expiry warnings:', warnData.message || warnData)
  } catch (err) {
    console.error('⏰ Expiry check failed:', err.message)
  }
}

app.listen(PORT, () => {
  console.log(`AdWheels backend running on port ${PORT}`)
  // Run expiry check 3 seconds after startup (wait for server to be ready)
  setTimeout(runExpiryCheck, 3000)
  // Then every 24 hours
  setInterval(runExpiryCheck, 24 * 60 * 60 * 1000)
})
