/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [require('path').join(__dirname, 'styles')],
  },
};

module.exports = nextConfig;
