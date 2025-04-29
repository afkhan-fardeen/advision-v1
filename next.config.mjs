/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    eslint: {
      ignoreDuringBuilds: true, // ✅ this is the correct key
    },
    typescript: {
      ignoreBuildErrors: true, // ✅ if you want to skip TS errors (not recommended)
    },
  };
  
  export default nextConfig;
  