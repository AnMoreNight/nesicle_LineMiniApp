/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nesicle/shared"],
  reactStrictMode: true,
  // Type errors are already caught by `npm run typecheck` (plain `tsc --noEmit`). Next's
  // build-time type-checking spawns a separate fork-ts-checker worker process that has been
  // observed to deadlock in this environment; skip it here since it's redundant.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // 利用規約・プライバシーポリシーは運営会社のWebサイトの正式版へ(src/lib/legal.ts と同じURL)。
  // 以前の暫定版のページ(/terms・/privacy)を開いた場合も、正式版を表示する。
  async redirects() {
    return [
      { source: "/terms", destination: "https://optas.co.jp/terms.html", permanent: false },
      { source: "/privacy", destination: "https://optas.co.jp/privacy.html", permanent: false },
    ];
  },
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
