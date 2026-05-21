import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import path from 'path';
import { fileURLToPath } from 'url';

initOpenNextCloudflareForDev();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
