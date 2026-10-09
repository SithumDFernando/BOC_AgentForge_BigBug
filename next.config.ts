import type { NextConfig } from "next";
import path from 'node:path';

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(process.cwd()) },
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
};

export default nextConfig;
