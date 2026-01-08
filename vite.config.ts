import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * 앱인토스 미니앱 Vite 설정
 * 
 * 📚 Vite 공식 문서: https://vitejs.dev/config/
 * 📱 앱인토스 WebView 가이드: https://developers-apps-in-toss.toss.im/
 */
export default defineConfig({
  /**
   * 개발 서버 설정
   * granite.config.ts의 web.port와 동일하게 설정하세요.
   */
  server: {
    host: "0.0.0.0", // 실기기 테스트를 위해 모든 IP에서 접근 가능하게 설정
    port: 5173,      // granite.config.ts의 web.port와 동일해야 함
  },

  /**
   * 미리보기 서버 설정 (vite preview)
   */
  preview: {
    host: "0.0.0.0",
    port: 5173,
  },

  /**
   * 플러그인 설정
   */
  plugins: [react()],

  /**
   * 경로 별칭 설정
   * @ = src 디렉토리
   */
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  /**
   * 빌드 설정
   */
  build: {
    outDir: "dist",           // granite.config.ts의 outdir와 동일해야 함
    sourcemap: false,         // 프로덕션에서는 소스맵 비활성화
    minify: "esbuild",        // esbuild로 빠른 minify
    target: "es2020",         // 최신 브라우저 타겟 (앱인토스 WebView 지원)
    rollupOptions: {
      output: {
        // 청크 파일 최적화
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },

  /**
   * 최적화 설정
   */
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
});
