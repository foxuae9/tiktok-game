const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  path: '/socket.io',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});
const { WebcastPushConnection } = require('tiktok-live-connector');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

let tiktokConnection = null;
let isConnected = false;
let currentSecretWord = '';
let currentTimer = 60;
let gameActive = false;
let timerInterval = null;
let bonusTimePerLikes = 5; // إضافة 5 ثواني لكل إعجاب
let likeCounter = 0;
let totalLikes = 0; // إضافة عداد الإعجابات الكلي
const LIKES_FOR_BONUS = 10; // عدد الإعجابات المطلوبة للحصول على وقت إضافي

// إعداد Socket.IO
io.on('connection', (socket) => {
    console.log('Client connected');
    
    // إرسال حالة اللعبة الحالية
    socket.emit('gameState', {
        secretWord: currentSecretWord ? '_'.repeat(currentSecretWord.length) : '_ _ _ _',
        timer: currentTimer,
        isActive: gameActive,
        connected: isConnected
    });

    // استقبال تحديث الكلمة السرية
    socket.on('updateSecretWord', (word) => {
        currentSecretWord = word;
        io.emit('gameState', {
            secretWord: '_'.repeat(word.length),
            timer: currentTimer,
            isActive: gameActive
        });
    });

    // استقبال تحديث المؤقت
    socket.on('updateTimer', (seconds) => {
        currentTimer = seconds;
        io.emit('gameState', {
            secretWord: currentSecretWord ? '_'.repeat(currentSecretWord.length) : '_ _ _ _',
            timer: currentTimer,
            isActive: gameActive
        });
    });

    // طلب كلمة عشوائية
    socket.on('requestNewWord', () => {
        const words = [
            'سيارة', 'قطار', 'طائرة', 'دراجة',
            'تفاحة', 'موزة', 'برتقال', 'عنب',
            'قلم', 'كتاب', 'مدرسة', 'طالب',
            'بيت', 'شقة', 'غرفة', 'مطبخ'
        ];
        const newWord = words[Math.floor(Math.random() * words.length)];
        socket.emit('newWordSuggestion', newWord);
    });

    // تحديث إعدادات الوقت الإضافي
    socket.on('updateBonusSettings', (settings) => {
        bonusTimePerLikes = settings.bonusTime;
        LIKES_FOR_BONUS = settings.likesRequired;
    });

    // بدء اللعبة
    socket.on('startGame', () => {
        if (!gameActive && currentSecretWord) {
            gameActive = true;
            likeCounter = 0;
            if (timerInterval) clearInterval(timerInterval);
            
            timerInterval = setInterval(() => {
                currentTimer--;
                io.emit('gameState', {
                    secretWord: '_'.repeat(currentSecretWord.length),
                    timer: currentTimer,
                    isActive: gameActive
                });

                if (currentTimer <= 0) {
                    clearInterval(timerInterval);
                    gameActive = false;
                    io.emit('gameOver', { word: currentSecretWord });
                }
            }, 1000);

            io.emit('gameState', {
                secretWord: '_'.repeat(currentSecretWord.length),
                timer: currentTimer,
                isActive: true
            });
        }
    });

    // إيقاف اللعبة
    socket.on('stopGame', () => {
        gameActive = false;
        if (timerInterval) clearInterval(timerInterval);
        io.emit('gameState', {
            secretWord: currentSecretWord ? '_'.repeat(currentSecretWord.length) : '_ _ _ _',
            timer: currentTimer,
            isActive: false
        });
    });

    // تصفير الإحصائيات
    socket.on('resetStats', () => {
        totalLikes = 0;
        io.emit('statsReset');
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// دالة الاتصال بـ TikTok Live
const connectToTikTok = (username) => {
    if (tiktokConnection) {
        tiktokConnection.disconnect();
    }

    tiktokConnection = new WebcastPushConnection(username);

    tiktokConnection.on('chat', (data) => {
        io.emit('comment', {
            id: Date.now(),
            username: data.nickname,
            text: data.comment,
            avatar: data.profilePictureUrl || null
        });

        // التحقق من الإجابة
        if (gameActive && data.comment.trim().toLowerCase() === currentSecretWord.toLowerCase()) {
            io.emit('correctAnswer', {
                username: data.nickname,
                word: currentSecretWord
            });
            gameActive = false;
            if (timerInterval) clearInterval(timerInterval);
        }
    });

    tiktokConnection.on('like', (data) => {
        totalLikes += data.likeCount;
        io.emit('like', {
            count: data.likeCount,
            total: totalLikes
        });

        // إضافة وقت إضافي عند تجميع عدد معين من الإعجابات
        if (gameActive) {
            likeCounter += data.likeCount;
            if (likeCounter >= LIKES_FOR_BONUS) {
                currentTimer += bonusTimePerLikes;
                likeCounter = 0; // إعادة تصفير العداد
                io.emit('bonusTime', {
                    seconds: bonusTimePerLikes,
                    newTotal: currentTimer
                });
            }
        }
    });

    tiktokConnection.on('connected', (state) => {
        console.log(`Connected to roomId ${state.roomId}`);
        isConnected = true;
        io.emit('connectionStatus', { connected: true });
    });

    tiktokConnection.on('disconnected', () => {
        console.log('Disconnected from TikTok');
        isConnected = false;
        io.emit('connectionStatus', { connected: false });
    });

    tiktokConnection.connect().catch((err) => {
        console.error('Failed to connect:', err);
        isConnected = false;
        io.emit('connectionStatus', { connected: false });
    });
};

// API Routes
app.post('/api/connect', express.json(), (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }
    
    try {
        connectToTikTok(username);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Next.js handler
nextApp.prepare().then(() => {
    app.all('*', (req, res) => {
        return nextHandler(req, res);
    });

    const PORT = process.env.PORT || 3000;
    http.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        // اتصال تلقائي باسم المستخدم
        connectToTikTok('_terminal2');
    });
});
