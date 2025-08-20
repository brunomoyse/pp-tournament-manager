import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.pocketpair.app',
    appName: 'PocketPair',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
    },
};

export default config;