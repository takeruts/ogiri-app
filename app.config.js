module.exports = {
  expo: {
    name: 'オオギリ検定',
    slug: 'ogiri-app',
    version: '1.0.0',
    description: 'AIがあなたのお笑いセンスを診断するウェブアプリ。4つの観点でAI採点、ヒントも貰える。',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#FBCFE8',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.ogiriapp.mobile',
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          'お題に画像を添付するために写真ライブラリへのアクセスが必要です',
        NSCameraUsageDescription:
          'お題に写真を撮影して添付するためにカメラへのアクセスが必要です',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FBCFE8',
      },
      package: 'com.ogiriapp.mobile',
      permissions: [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.CAMERA',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'single',
      name: 'オオギリ検定',
      shortName: 'オオギリ検定',
      description: 'AIがあなたのお笑いセンスを診断するウェブアプリ',
      lang: 'ja',
      scope: '/',
      themeColor: '#F59E0B',
      backgroundColor: '#0F172A',
      display: 'standalone',
      orientation: 'portrait',
    },
    plugins: [],
    scheme: 'ogiri-app',
    extra: {
      eas: {
        projectId: 'your-project-id-here',
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
