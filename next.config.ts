import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Allow cross-origin requests from local network devices (mobile phones)
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://192.168.0.107:3000',
    'http://192.168.*.*:3000',  // Any local network device
  ],
};

export default nextConfig;
