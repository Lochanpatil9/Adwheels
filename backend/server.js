import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import healthRouter from './routes/health.js'
import leadsRouter from './routes/leads.js'
import paymentsRouter from './routes/payments.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
}))
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/leads', leadsRouter)
app.use('/api/payments', paymentsRouter)

app.listen(PORT, () => {
  console.log(`AdWheels backend running on port ${PORT}`)
})
