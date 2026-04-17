import express from 'express'
import cors from 'cors'

// Import route handlers from backend
import healthRouter from '../backend/routes/health.js'
import leadsRouter from '../backend/routes/leads.js'
import paymentsRouter from '../backend/routes/payments.js'
import campaignsRouter from '../backend/routes/campaigns.js'
import notificationsRouter from '../backend/routes/notifications.js'
import driversRouter from '../backend/routes/drivers.js'

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH'],
}))
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/leads', leadsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/campaigns', campaignsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/drivers', driversRouter)

// Vercel serverless handler
export default app
