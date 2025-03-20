const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const next = require('next');

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

let tiktokConnection = null;
let isConnected = false;
let currentSecretWord = '';
let currentTimer = 60;
let gameActive = false;
let timerInterval = null;
let bonusTimePerLikes = 5;
let likeCounter = 0;
let totalLikes = 0;
const LIKES_FOR_BONUS = 10;

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.emit('gameState', {
      secretWord: currentSecretWord ? '_'.repeat(currentSecretWord.length) : '_ _ _ _',
      timer: currentTimer,
      isActive: gameActive,
      connected: isConnected
    });

    socket.on('connect-tiktok', async (username) => {
      try {
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

          if (gameActive) {
            likeCounter += data.likeCount;
            if (likeCounter >= LIKES_FOR_BONUS) {
              currentTimer += bonusTimePerLikes;
              likeCounter = 0;
              io.emit('bonusTime', {
                seconds: bonusTimePerLikes,
                newTotal: currentTimer
              });
            }
          }
        });

        await tiktokConnection.connect();
        isConnected = true;
        socket.emit('connectionStatus', { connected: true });
      } catch (error) {
        console.error('Failed to connect:', error);
        isConnected = false;
        socket.emit('connectionStatus', { connected: false, error: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
      if (tiktokConnection) {
        tiktokConnection.disconnect();
      }
    });
  });

  expressApp.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
