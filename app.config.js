module.exports = {
  expo: {
    name: '壁打ちオオギリ',
    slug: 'ogiri-app',
    version: '1.0.0',
    description: 'AIが出すお題に挑戦して大喜利の腕を磨けるウェブアプリ。4つの観点でAI採点、ヒントも貰える。',
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
      name: '壁打ちオオギリ',
      shortName: '壁打ちオオギリ',
      description: 'AIが出すお題に挑戦して大喜利の腕を磨けるウェブアプリ',
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
