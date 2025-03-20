/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  basePath: '/tiktok-game',
  webpack: (config) => {
    config.module.rules.push({
      test: /\.proto$/,
      type: 'asset/source'
    });
    return config;
  },
  env: {
    SOCKET_URL: process.env.NODE_ENV === 'production' 
      ? 'wss://tiktok-game-app.vercel.app'
      : 'http://localhost:3000'
  }
}

module.exports = nextConfig
