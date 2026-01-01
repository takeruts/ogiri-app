module.exports = {
  expo: {
    name: 'オオギリハブ',
    slug: 'ogiri-app',
    version: '1.0.0',
    description: 'みんなで楽しむ大喜利のモバイル・ウェブアプリケーション。お題を投稿して回答を集めよう！',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
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
        backgroundColor: '#ffffff',
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
      name: 'オオギリハブ',
      shortName: 'オオギリハブ',
      description: 'みんなで楽しむ大喜利のモバイル・ウェブアプリケーション',
      lang: 'ja',
      scope: '/',
      themeColor: '#007AFF',
      backgroundColor: '#ffffff',
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
