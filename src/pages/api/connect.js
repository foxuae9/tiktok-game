import { WebcastPushConnection } from 'tiktok-live-connector'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { username } = req.body

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' })
  }

  try {
    const tiktokConnection = new WebcastPushConnection(username)

    // التحقق من الاتصال
    await tiktokConnection.connect()

    // إعادة تعيين المتغيرات العالمية
    global.tiktokConnection = tiktokConnection
    global.totalLikes = 0

    // تسجيل الأحداث
    tiktokConnection.on('like', (data) => {
      if (global.io) {
        global.totalLikes += data.likeCount
        global.io.emit('like', { total: global.totalLikes })
      }
    })

    tiktokConnection.on('chat', (data) => {
      if (global.io) {
        global.io.emit('comment', {
          id: data.userId,
          username: data.uniqueId,
          text: data.comment,
          avatar: data.profilePictureUrl
        })
      }
    })

    tiktokConnection.on('streamEnd', () => {
      if (global.io) {
        global.io.emit('connectionStatus', { connected: false })
      }
    })

    // إرسال حالة الاتصال للعميل
    if (global.io) {
      global.io.emit('connectionStatus', { connected: true })
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('TikTok connection error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
