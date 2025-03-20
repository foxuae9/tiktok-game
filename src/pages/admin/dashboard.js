import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Dashboard() {
  const router = useRouter()
  const [secretWord, setSecretWord] = useState('')
  const [timer, setTimer] = useState(60)
  const [enableLikes, setEnableLikes] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const checkAuth = () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
      if (!loggedIn) {
        router.push('/admin/login')
      } else {
        setIsLoggedIn(true)
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    router.push('/admin/login')
  }

  const updateSecretWord = () => {
    // تحديث الكلمة السرية
    // سيتم إضافة الاتصال بالخادم لاحقاً
  }

  const updateTimer = (value) => {
    setTimer(Math.max(0, Math.min(300, value))) // حد أقصى 5 دقائق
  }

  if (!isLoggedIn) {
    return null // أو شاشة تحميل
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">لوحة التحكم</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              تسجيل خروج
            </button>
          </div>

          {/* Secret Word Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">الكلمة السرية</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={secretWord}
                onChange={(e) => setSecretWord(e.target.value)}
                className="flex-1 p-2 border rounded"
                placeholder="أدخل الكلمة السرية"
              />
              <button
                onClick={updateSecretWord}
                className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
              >
                تحديث
              </button>
            </div>
          </div>

          {/* Timer Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">الوقت</h2>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={timer}
                onChange={(e) => updateTimer(parseInt(e.target.value))}
                className="w-24 p-2 border rounded"
                min="0"
                max="300"
              />
              <span>ثانية</span>
              <button
                onClick={() => updateTimer(timer + 30)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                +30 ثانية
              </button>
              <button
                onClick={() => updateTimer(timer - 30)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                -30 ثانية
              </button>
            </div>
          </div>

          {/* Likes Settings */}
          <div>
            <h2 className="text-xl font-bold mb-4">إعدادات التكبيسات</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={enableLikes}
                  onChange={(e) => setEnableLikes(e.target.checked)}
                  className="mr-2"
                />
                تفعيل زيادة الوقت بالتكبيسات
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              كل 20 تكبيسة = 10 ثواني إضافية
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
