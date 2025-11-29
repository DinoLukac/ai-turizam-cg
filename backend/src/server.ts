import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import poiRoutes from './routes/poiRoutes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3002
const HOST = process.env.HOST || '0.0.0.0'

// CORS configuration - allow requests from Next.js dev server
// This will work for both localhost:3000 and LAN IP:3000
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Allow localhost:3000 (Next.js dev server)
    if (origin.startsWith('http://localhost:3000') || 
        origin.startsWith('http://127.0.0.1:3000')) {
      return callback(null, true)
    }
    
    // Allow LAN IP addresses on port 3000 (for mobile access)
    // This regex matches common private IP ranges: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
    const lanIpRegex = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)\d+\.\d+:3000$/
    if (lanIpRegex.test(origin)) {
      return callback(null, true)
    }
    
    // For development, allow all origins (can be restricted in production)
    callback(null, true)
  },
  credentials: true
}))

app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Turizam CG API is running' })
})

app.use('/api/poi', poiRoutes)

// Start server - listen on all interfaces (0.0.0.0) to allow LAN access
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`)
  console.log(`   Accessible at http://localhost:${PORT} (local)`)
  console.log(`   Accessible from LAN at http://<LAN-IP>:${PORT}`)
})

