import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sportship.app",
  appName: "Sportship",
  webDir: "public",
  server: {
    url: "https://social-sport-app-sportship.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
};

export default config;
