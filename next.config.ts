import type { NextConfig } from "next";
import path from 'node:path';

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(process.cwd()) },
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas'],
  outputFileTracingIncludes: {
    '/api/admin/documents': [
      './node_modules/pdf-parse/dist/worker/**/*',
      './node_modules/@napi-rs/canvas*/**/*',
    ],
  },
};

export default nextConfig;
