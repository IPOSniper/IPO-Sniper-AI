import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Without this, Next.js infers the workspace root by walking up
   * looking for a lockfile — and on the dev machine this project has
   * been run from (C:\Users\<user>\OneDrive\Documents\IPOSniperFinal\frontend),
   * there is a second package-lock.json one level up in the OneDrive
   * Documents folder. Next.js picked THAT as the root ("Next.js
   * inferred your workspace root... selected the directory of
   * C:\Users\<user>\package-lock.json"), one directory above this
   * project. That misdetection is the most likely explanation for
   * proxy.ts (the auth gate) appearing not to run — file-system
   * routing conventions like proxy.ts are resolved relative to
   * whatever Next.js believes the root is, and it wasn't this folder.
   * Pinning it here removes the ambiguity regardless of what other
   * lockfiles exist elsewhere on disk.
   */
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
