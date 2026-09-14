import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.amgdistribuicao.app",
  appName: "AMG Distribuição",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: "#0a1f66",
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: "#0a1f66",
      style: "LIGHT",
    },
  },
};

export default config;
