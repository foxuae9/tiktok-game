import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaCog, FaKey, FaClock, FaRandom, FaHeart, FaEraser, FaTiktok } from 'react-icons/fa'
import io from 'socket.io-client'

export default function Admin() {
  const [secretWord, setSecretWord] = useState('')
  const [timer, setTimer] = useState(60)
  const [isRunning, setIsRunning] = useState(false)
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [bonusTime, setBonusTime] = useState(5)
  const [likesRequired, setLikesRequired] = useState(10)
  const [isResetting, setIsResetting] = useState(false)
  const [tiktokUsername, setTiktokUsername] = useState('_terminal2')
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    const newSocket = io(process.env.SOCKET_URL, {
      transports: ['websocket']
    })
    setSocket(newSocket)

    newSocket.on('gameState', (state) => {
      setIsRunning(state.isActive)
      setTimer(state.timer)
      setIsConnected(state.connected)
    })

    newSocket.on('correctAnswer', (data) => {
      alert(`${data.username} فاز! الكلمة الصحيحة هي: ${data.word}`)
    })

    newSocket.on('gameOver', (data) => {
      alert(`انتهى الوقت! الكلمة كانت: ${data.word}`)
      setIsRunning(false)
    })

    newSocket.on('newWordSuggestion', (word) => {
      setSecretWord(word)
    })

    newSocket.on('statsReset', () => {
      setIsResetting(false)
    })

    newSocket.on('connectionStatus', (data) => {
      setIsConnected(data.connected)
      setIsConnecting(false)
    })

    return () => {
      newSocket.close()
    }
  }, [])

  const handleStartGame = () => {
    if (!secretWord) {
      alert('الرجاء إدخال الكلمة السرية')
      return
    }
    socket.emit('updateSecretWord', secretWord)
    socket.emit('updateTimer', timer)
    socket.emit('startGame')
  }

  const handleStopGame = () => {
    socket.emit('stopGame')
  }

  const handleTimerChange = (value) => {
    const newTimer = parseInt(value)
    setTimer(newTimer)
    if (socket) {
      socket.emit('updateTimer', newTimer)
    }
  }

  const handleRequestNewWord = () => {
    socket.emit('requestNewWord')
  }

  const handleUpdateBonusSettings = () => {
    socket.emit('updateBonusSettings', {
      bonusTime,
      likesRequired
    })
  }

  const handleResetStats = () => {
    if (window.confirm('هل أنت متأكد من تصفير جميع الإحصائيات؟')) {
      setIsResetting(true)
      socket.emit('resetStats')
    }
  }

  const handleConnect = async () => {
    if (!tiktokUsername) {
      alert('الرجاء إدخال اسم المستخدم')
      return
    }
    setIsConnecting(true)
    try {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: tiktokUsername }),
      })
      const data = await response.json()
      if (!data.success) {
        alert('حدث خطأ في الاتصال')
        setIsConnecting(false)
      }
    } catch (error) {
      alert('حدث خطأ في الاتصال')
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF0050] to-[#00F2EA] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <FaCog className="text-3xl text-[#00F2EA]" />
              <h1 className="text-3xl font-bold">لوحة التحكم</h1>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
              {isConnected ? 'متصل بالبث' : 'غير متصل'}
            </div>
          </div>

          {/* TikTok Connection */}
          <div className="mb-6">
            <label className="flex items-center gap-2 mb-2">
              <FaTiktok className="text-[#FF0050]" />
              <span>اسم المستخدم في تيك توك</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tiktokUsername}
                onChange={(e) => setTiktokUsername(e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                placeholder="أدخل اسم المستخدم..."
                dir="ltr"
              />
              <button
                onClick={handleConnect}
                disabled={isConnecting || !tiktokUsername}
                className={`px-4 rounded-lg font-bold ${
                  isConnecting || !tiktokUsername
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-[#FF0050] hover:bg-[#E0004A]'
                }`}
              >
                {isConnecting ? '...' : 'اتصال'}
              </button>
            </div>
          </div>

          {/* Reset Stats Button */}
          <div className="mb-6">
            <button
              onClick={handleResetStats}
              disabled={isResetting || !isConnected}
              className={`w-full py-3 px-6 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                isResetting || !isConnected
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              <FaEraser className="text-lg" />
              {isResetting ? 'جاري التصفير...' : 'تصفير الإحصائيات'}
            </button>
          </div>

          {/* Secret Word Input */}
          <div className="mb-6">
            <label className="flex items-center gap-2 mb-2">
              <FaKey className="text-[#FF0050]" />
              <span>الكلمة السرية</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={secretWord}
                onChange={(e) => setSecretWord(e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                placeholder="أدخل الكلمة السرية..."
                dir="rtl"
                disabled={isRunning}
              />
              <button
                onClick={handleRequestNewWord}
                disabled={isRunning}
                className={`p-3 rounded-lg ${isRunning ? 'bg-gray-500' : 'bg-[#00F2EA] hover:bg-[#00D2CA]'}`}
                title="كلمة عشوائية"
              >
                <FaRandom />
              </button>
            </div>
          </div>

          {/* Timer Input */}
          <div className="mb-6">
            <label className="flex items-center gap-2 mb-2">
              <FaClock className="text-[#00F2EA]" />
              <span>الوقت (بالثواني)</span>
            </label>
            <input
              type="number"
              value={timer}
              onChange={(e) => handleTimerChange(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
              min="10"
              max="300"
              disabled={isRunning}
            />
          </div>

          {/* Bonus Time Settings */}
          <div className="mb-8 p-4 bg-black/20 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <FaHeart className="text-[#FF0050]" />
              <h3 className="font-bold">إعدادات الوقت الإضافي</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm">الوقت الإضافي (ثواني)</label>
                <input
                  type="number"
                  value={bonusTime}
                  onChange={(e) => setBonusTime(parseInt(e.target.value))}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white"
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">عدد الإعجابات المطلوبة</label>
                <input
                  type="number"
                  value={likesRequired}
                  onChange={(e) => setLikesRequired(parseInt(e.target.value))}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white"
                  min="5"
                  max="100"
                />
              </div>
            </div>
            <button
              onClick={handleUpdateBonusSettings}
              className="mt-4 w-full bg-[#FF0050] hover:bg-[#E0004A] py-2 rounded-lg font-bold transition-all"
            >
              حفظ إعدادات الوقت الإضافي
            </button>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleStartGame}
              disabled={isRunning || !isConnected}
              className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
                isRunning || !isConnected
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              بدء اللعبة
            </button>
            <button
              onClick={handleStopGame}
              disabled={!isRunning || !isConnected}
              className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
                !isRunning || !isConnected
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              إيقاف اللعبة
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
