// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;

import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;