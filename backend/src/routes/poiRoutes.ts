import { Router, Request, Response } from 'express'
import { fetchNearbyPlaces } from '../services/googlePlacesService'

const router = Router()

router.get('/nearby', async (req: Request, res: Response) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📍 POI /nearby request received')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Query params:', req.query)
    
    const lat = parseFloat(req.query.lat as string)
    const lng = parseFloat(req.query.lng as string)
    const radius = parseInt((req.query.radius as string) || '5000', 10)
    const language = (req.query.language as string) || 'en'
    const keyword = (req.query.keyword as string) || undefined

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      console.error('❌ Invalid coordinates:', { lat, lng })
      return res.status(400).json({
        error: 'lat and lng query params are required and must be valid numbers'
      })
    }

    if (radius > 50000) {
      console.error('❌ Radius too large:', radius)
      return res.status(400).json({
        error: 'radius too large (max 50000m)'
      })
    }

    console.log(`🔍 Fetching POIs for location: ${lat}, ${lng}, radius: ${radius}m`)
    const startTime = Date.now()

    const { pois } = await fetchNearbyPlaces({
      lat,
      lng,
      radius,
      language,
      keyword
    })

    const duration = Date.now() - startTime
    console.log(`✅ Fetched ${pois.length} POIs in ${duration}ms`)

    const sortedPois = pois.sort((a, b) => b.score - a.score)
    const highlight = sortedPois[0] || null

    if (highlight) {
      console.log(`⭐ Highlight POI: ${highlight.name} (score: ${highlight.score.toFixed(2)})`)
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    res.json({
      pois: sortedPois,
      count: sortedPois.length,
      highlight
    })
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ Failed to fetch POI')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Error:', error)
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    res.status(500).json({
      error: 'Failed to fetch nearby POI',
      details: error.message
    })
  }
})

export default router

