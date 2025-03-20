import { WebcastPushConnection } from 'tiktok-live-connector'

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { username } = req.body
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' })
    }

    const tiktokConnection = new WebcastPushConnection(username)

    tiktokConnection.connect().then(state => {
      console.log(`Connected to roomId ${state.roomId}`)
      
      // استماع للتعليقات
      tiktokConnection.on('chat', data => {
        res.write(`data: ${JSON.stringify({
          type: 'comment',
          data: {
            id: Date.now(),
            username: data.nickname,
            text: data.comment,
            avatar: data.avatarUrl
          }
        })}\n\n`)
      })

      // استماع للإعجابات
      tiktokConnection.on('like', data => {
        res.write(`data: ${JSON.stringify({
          type: 'like',
          data: data.likeCount
        })}\n\n`)
      })

    }).catch(err => {
      console.error('Failed to connect', err)
      res.status(500).json({ error: 'Failed to connect to TikTok Live' })
    })

    // إعداد SSE (Server-Sent Events)
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    // عند إغلاق الاتصال
    res.on('close', () => {
      tiktokConnection.disconnect()
    })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
