import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaHeart, FaClock, FaComment } from 'react-icons/fa'
import io from 'socket.io-client'

export default function Home() {
  const [comments, setComments] = useState([])
  const [secretWord, setSecretWord] = useState('_ _ _ _')
  const [timer, setTimer] = useState(60)
  const [likes, setLikes] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState(null)
  const [winner, setWinner] = useState(null)
  const [showBonusTime, setShowBonusTime] = useState(false)

  useEffect(() => {
    const newSocket = io(process.env.SOCKET_URL, {
      transports: ['websocket']
    })
    setSocket(newSocket)

    // استماع لحالة الاتصال
    newSocket.on('connectionStatus', (data) => {
      setIsConnected(data.connected)
    })

    // استماع للتعليقات
    newSocket.on('comment', (data) => {
      setComments(prev => [data, ...prev].slice(0, 50))
    })

    // استماع للإعجابات
    newSocket.on('like', (data) => {
      setLikes(data.total)
    })

    // استماع لتصفير الإحصائيات
    newSocket.on('statsReset', () => {
      setLikes(0)
      setComments([])
    })

    // استماع لحالة اللعبة
    newSocket.on('gameState', (state) => {
      setSecretWord(state.secretWord)
      setTimer(state.timer)
    })

    // استماع للإجابة الصحيحة
    newSocket.on('correctAnswer', (data) => {
      setWinner(data.username)
      setSecretWord(data.word)
    })

    // استماع لانتهاء الوقت
    newSocket.on('gameOver', (data) => {
      setSecretWord(data.word)
      setWinner('انتهى الوقت')
    })

    // استماع للوقت الإضافي
    newSocket.on('bonusTime', (data) => {
      setShowBonusTime(true)
      setTimeout(() => setShowBonusTime(false), 3000)
    })

    return () => {
      newSocket.close()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF0050] to-[#00F2EA] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Secret Word Section */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/10"
        >
          <h2 className="text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#FF0050] to-[#00F2EA]">
            الكلمة السرية
          </h2>
          <p className="text-4xl text-center font-mono tracking-widest">{secretWord}</p>
          {winner && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mt-4 text-center"
            >
              <p className="text-2xl font-bold text-green-400">
                {winner === 'انتهى الوقت' ? 'انتهى الوقت!' : `🎉 الفائز: ${winner}`}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Timer and Likes Section */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="relative bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <FaClock className="text-2xl text-[#00F2EA]" />
              <h3 className="text-xl font-bold">الوقت المتبقي</h3>
            </div>
            <div className="relative">
              <p className="text-4xl text-center font-bold text-[#00F2EA]">{timer}s</p>
              {/* Bonus Time Animation */}
              <AnimatePresence>
                {showBonusTime && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.5 }}
                    animate={{ opacity: 1, y: -30, scale: 1.5 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 font-bold text-3xl"
                  >
                    <span className="bg-gradient-to-r from-green-400 to-green-600 text-transparent bg-clip-text drop-shadow-[0_2px_2px_rgba(0,255,0,0.5)]">
                      +5
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <FaHeart className="text-2xl text-[#FF0050]" />
              <h3 className="text-xl font-bold">التكبيسات</h3>
            </div>
            <p className="text-6xl text-center font-bold text-white drop-shadow-[0_2px_2px_rgba(255,0,80,0.5)] [text-shadow:_2px_2px_0_rgb(255_0_80_/_50%)]">
              {likes}
            </p>
          </motion.div>
        </div>

        {/* Comments Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FaComment className="text-2xl text-[#00F2EA]" />
              <h2 className="text-2xl font-bold">التعليقات</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
              {isConnected ? 'متصل' : 'غير متصل'}
            </div>
          </div>
          
          {!isConnected ? (
            <div className="text-center py-8 text-white/70">
              في انتظار بدء البث المباشر...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-white/70">
              لا توجد تعليقات بعد...
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {comments.map((comment) => comment && (
                  <motion.div
                    key={comment.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="bg-white/10 rounded-lg p-4 flex items-center gap-3"
                  >
                    {comment.avatar ? (
                      <img 
                        src={comment.avatar}
                        alt={comment.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF0050] to-[#00F2EA] flex items-center justify-center text-lg font-bold">
                        {comment.username[0]}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-[#00F2EA]">{comment.username}</span>
                      <p className="text-white/90">{comment.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
