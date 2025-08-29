import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.pocketpair.tournamentmanager',
    appName: 'Pocket Pair Tournament Manager',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
    },
};

export default config;