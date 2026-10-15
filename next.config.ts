import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Par défaut une Server Action refuse tout corps > 1 Mo.
      // Un envoi = jusqu'à 10 photos de 5 Mo.
      bodySizeLimit: "60mb",
    },
  },
  
};

export default nextConfig;
