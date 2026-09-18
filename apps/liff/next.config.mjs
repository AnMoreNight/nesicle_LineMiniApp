/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nesicle/shared"],
  reactStrictMode: true,
  // Type errors are already caught by `npm run typecheck` (plain `tsc --noEmit`). Next's
  // build-time type-checking spawns a separate fork-ts-checker worker process that has been
  // observed to deadlock in this environment; skip it here since it's redundant.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // The jest-worker child process Next spawns for the production minifier (a native SWC
  // binary) has been observed to deadlock indefinitely in this environment (same class of
  // issue as native binaries getting locked during `prisma generate`). Disable minification for
  // production builds entirely to avoid spawning that worker; output is unminified but correct.
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization.minimize = false;
    }
    return config;
  },
};

export default nextConfig;
