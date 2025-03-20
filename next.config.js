/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.proto$/,
      type: 'asset/source'
    });
    return config;
  },
  env: {
    SOCKET_URL: process.env.NODE_ENV === 'production' 
      ? 'https://your-server-url.herokuapp.com' // سيتم تغيير هذا لاحقاً
      : 'http://localhost:3000'
  }
}

module.exports = nextConfig
