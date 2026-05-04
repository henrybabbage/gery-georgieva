import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['vimeo-video-element', 'media-chrome', 'ce-la-react'],
  async redirects() {
    return [{source: '/features', destination: '/', permanent: true}]
  },
  env: {
    // Matches the behavior of `sanity dev` which sets styled-components to use the fastest way of inserting CSS rules in both dev and production. It's default behavior is to disable it in dev mode.
    SC_DISABLE_SPEEDY: 'false',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
