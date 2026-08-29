import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sportship.app",
  appName: "Sportship",
  webDir: "public",
  server: {
    url: "https://phase-1-fast-build.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
};

export default config;
