/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  basePath: '',
  webpack: (config) => {
    config.module.rules.push({
      test: /\.proto$/,
      type: 'asset/source'
    });
    return config;
  },
  env: {
    SOCKET_URL: process.env.NODE_ENV === 'production' 
      ? 'wss://web-production-2cf2.up.railway.app'
      : 'http://localhost:3000'
  }
}

module.exports = nextConfig
