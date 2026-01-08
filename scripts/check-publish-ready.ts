#!/usr/bin/env npx tsx
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 앱인토스 출시 준비 상태 검증 스크립트
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 출시 전 필수 설정이 올바르게 되어 있는지 자동으로 검증합니다.
 * 
 * 사용법:
 *   npm run check:publish
 * 
 * 검증 항목:
 *   1. granite.config.ts 필수 항목 설정
 *   2. template.config.ts 동기화 상태
 *   3. 앱 아이콘 URL 유효성
 *   4. index.html viewport 설정
 */

import fs from 'fs';
import path from 'path';

// 컬러 출력 헬퍼
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  title: (msg: string) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}  ✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}  ❌ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}  ⚠️  ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}  ℹ️  ${msg}${colors.reset}`),
};

interface CheckResult {
  passed: boolean;
  message: string;
  critical?: boolean;
}

const results: CheckResult[] = [];

function addResult(passed: boolean, message: string, critical = false) {
  results.push({ passed, message, critical });
  if (passed) {
    log.success(message);
  } else if (critical) {
    log.error(message);
  } else {
    log.warning(message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// granite.config.ts 검증
// ═══════════════════════════════════════════════════════════════════════════
async function checkGraniteConfig() {
  log.title('📦 granite.config.ts 검증');
  
  const configPath = path.join(process.cwd(), 'granite.config.ts');
  
  if (!fs.existsSync(configPath)) {
    addResult(false, 'granite.config.ts 파일이 없습니다', true);
    return;
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  
  // appName 검증
  const appNameMatch = content.match(/appName:\s*['"]([^'"]+)['"]/);
  if (appNameMatch) {
    const appName = appNameMatch[1];
    if (appName === 'todo-app') {
      addResult(false, `appName이 기본값('todo-app')입니다. 콘솔에서 등록한 이름으로 변경하세요.`, true);
    } else if (!/^[a-z0-9-]+$/.test(appName)) {
      addResult(false, `appName에 허용되지 않는 문자가 있습니다: '${appName}' (영문 소문자, 숫자, 하이픈만 가능)`, true);
    } else {
      addResult(true, `appName: '${appName}'`);
    }
  } else {
    addResult(false, 'appName 설정을 찾을 수 없습니다', true);
  }

  // displayName 검증
  const displayNameMatch = content.match(/displayName:\s*['"]([^'"]+)['"]/);
  if (displayNameMatch) {
    const displayName = displayNameMatch[1];
    if (displayName === '할일 관리') {
      addResult(false, `displayName이 기본값('할일 관리')입니다. 앱 이름으로 변경하세요.`);
    } else {
      addResult(true, `displayName: '${displayName}'`);
    }
  } else {
    addResult(false, 'displayName 설정을 찾을 수 없습니다', true);
  }

  // primaryColor 검증
  const primaryColorMatch = content.match(/primaryColor:\s*['"]([^'"]+)['"]/);
  if (primaryColorMatch) {
    const color = primaryColorMatch[1];
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      addResult(false, `primaryColor 형식이 올바르지 않습니다: '${color}' (예: #3182F6)`, true);
    } else {
      addResult(true, `primaryColor: '${color}'`);
    }
  } else {
    addResult(false, 'primaryColor 설정을 찾을 수 없습니다', true);
  }

  // icon 검증
  const iconMatch = content.match(/icon:\s*['"]([^'"]*)['"]/);
  if (iconMatch) {
    const icon = iconMatch[1];
    if (!icon || icon.trim() === '') {
      addResult(false, 'icon URL이 설정되지 않았습니다. 600x600px 아이콘 URL을 입력하세요.', true);
    } else if (!icon.startsWith('http')) {
      addResult(false, `icon URL이 유효하지 않습니다: '${icon}'`, true);
    } else {
      addResult(true, `icon: '${icon.substring(0, 50)}...'`);
    }
  } else {
    addResult(false, 'icon 설정을 찾을 수 없습니다', true);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// template.config.ts 검증
// ═══════════════════════════════════════════════════════════════════════════
async function checkTemplateConfig() {
  log.title('🎨 template.config.ts 검증');
  
  const configPath = path.join(process.cwd(), 'src', 'template.config.ts');
  
  if (!fs.existsSync(configPath)) {
    addResult(false, 'src/template.config.ts 파일이 없습니다', true);
    return;
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const graniteContent = fs.readFileSync(path.join(process.cwd(), 'granite.config.ts'), 'utf-8');
  
  // appId 동기화 검증
  const templateAppIdMatch = content.match(/appId:\s*['"]([^'"]+)['"]/);
  const graniteAppNameMatch = graniteContent.match(/appName:\s*['"]([^'"]+)['"]/);
  
  if (templateAppIdMatch && graniteAppNameMatch) {
    if (templateAppIdMatch[1] === graniteAppNameMatch[1]) {
      addResult(true, `appId와 appName 동기화됨: '${templateAppIdMatch[1]}'`);
    } else {
      addResult(false, `appId('${templateAppIdMatch[1]}')와 granite.config.ts의 appName('${graniteAppNameMatch[1]}')이 다릅니다.`, true);
    }
  }

  // primaryColor 동기화 검증
  const templateColorMatch = content.match(/primaryColor:\s*['"]([^'"]+)['"]/);
  const graniteColorMatch = graniteContent.match(/primaryColor:\s*['"]([^'"]+)['"]/);
  
  if (templateColorMatch && graniteColorMatch) {
    if (templateColorMatch[1] === graniteColorMatch[1]) {
      addResult(true, `primaryColor 동기화됨: '${templateColorMatch[1]}'`);
    } else {
      addResult(false, `template의 primaryColor('${templateColorMatch[1]}')와 granite의 primaryColor('${graniteColorMatch[1]}')가 다릅니다.`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// index.html 검증
// ═══════════════════════════════════════════════════════════════════════════
async function checkIndexHtml() {
  log.title('📄 index.html 검증');
  
  const htmlPath = path.join(process.cwd(), 'index.html');
  
  if (!fs.existsSync(htmlPath)) {
    addResult(false, 'index.html 파일이 없습니다', true);
    return;
  }

  const content = fs.readFileSync(htmlPath, 'utf-8');
  
  // viewport 핀치줌 비활성화 검증
  if (content.includes('user-scalable=no') || content.includes('user-scalable=0')) {
    addResult(true, '핀치줌 비활성화 설정됨 (user-scalable=no)');
  } else {
    addResult(false, '핀치줌 비활성화가 필요합니다. viewport에 user-scalable=no 추가하세요.', true);
  }

  // maximum-scale 검증
  if (content.includes('maximum-scale=1')) {
    addResult(true, 'maximum-scale=1 설정됨');
  } else {
    addResult(false, 'viewport에 maximum-scale=1 추가를 권장합니다.');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 빌드 출력물 검증
// ═══════════════════════════════════════════════════════════════════════════
async function checkBuildOutput() {
  log.title('📦 빌드 출력물 검증');
  
  const distPath = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distPath)) {
    addResult(false, 'dist 폴더가 없습니다. npm run build를 실행하세요.');
    return;
  }

  // 폴더 크기 계산
  function getFolderSize(folderPath: string): number {
    let size = 0;
    const files = fs.readdirSync(folderPath);
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        size += getFolderSize(filePath);
      } else {
        size += stat.size;
      }
    }
    
    return size;
  }

  const sizeBytes = getFolderSize(distPath);
  const sizeMB = sizeBytes / (1024 * 1024);
  
  if (sizeMB <= 100) {
    addResult(true, `빌드 용량: ${sizeMB.toFixed(2)}MB (100MB 이하)`);
  } else {
    addResult(false, `빌드 용량: ${sizeMB.toFixed(2)}MB (100MB 초과! 리소스 분리 필요)`, true);
  }

  // index.html 존재 확인
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    addResult(true, 'dist/index.html 존재');
  } else {
    addResult(false, 'dist/index.html이 없습니다', true);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 금지된 패턴 검증
// ═══════════════════════════════════════════════════════════════════════════
async function checkForbiddenPatterns() {
  log.title('🚫 금지된 패턴 검증');
  
  const srcPath = path.join(process.cwd(), 'src');
  
  function searchInFiles(dir: string, pattern: RegExp, description: string): boolean {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (searchInFiles(filePath, pattern, description)) {
          return true;
        }
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (pattern.test(content)) {
          log.info(`${file}에서 발견: ${description}`);
          return true;
        }
      }
    }
    
    return false;
  }

  // 다크 모드 관련 코드 검색
  const hasDarkMode = searchInFiles(srcPath, /dark:|dark-mode|darkMode|prefers-color-scheme:\s*dark/i, '다크 모드 관련 코드');
  if (hasDarkMode) {
    addResult(false, '다크 모드 관련 코드가 발견되었습니다. 앱인토스는 라이트 모드만 지원합니다.');
  } else {
    addResult(true, '다크 모드 관련 코드 없음');
  }

  // 외부 로그인 검색
  const hasExternalLogin = searchInFiles(srcPath, /kakao.*login|naver.*login|google.*login|apple.*login/i, '외부 로그인');
  if (hasExternalLogin) {
    addResult(false, '외부 로그인(카카오/네이버/구글/애플) 관련 코드가 발견되었습니다. 토스 로그인만 허용됩니다.', true);
  } else {
    addResult(true, '외부 로그인 관련 코드 없음');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 실행
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log(`
${colors.bold}${colors.cyan}╔══════════════════════════════════════════════════════════════════╗
║           앱인토스 출시 준비 상태 검증                              ║
╚══════════════════════════════════════════════════════════════════╝${colors.reset}
`);

  await checkGraniteConfig();
  await checkTemplateConfig();
  await checkIndexHtml();
  await checkBuildOutput();
  await checkForbiddenPatterns();

  // 결과 요약
  const critical = results.filter(r => !r.passed && r.critical);
  const warnings = results.filter(r => !r.passed && !r.critical);
  const passed = results.filter(r => r.passed);

  console.log(`
${colors.bold}═══════════════════════════════════════════════════════════════════${colors.reset}
${colors.bold}📊 검증 결과 요약${colors.reset}
${colors.bold}═══════════════════════════════════════════════════════════════════${colors.reset}

  ${colors.green}✅ 통과: ${passed.length}개${colors.reset}
  ${colors.yellow}⚠️  경고: ${warnings.length}개${colors.reset}
  ${colors.red}❌ 필수 수정: ${critical.length}개${colors.reset}
`);

  if (critical.length === 0 && warnings.length === 0) {
    console.log(`${colors.green}${colors.bold}
🎉 출시 준비 완료! 모든 검증을 통과했습니다.

다음 단계:
  1. npm run granite:build  # 빌드
  2. 콘솔에서 .ait 파일 업로드
  3. 검토 요청
${colors.reset}`);
    process.exit(0);
  } else if (critical.length === 0) {
    console.log(`${colors.yellow}${colors.bold}
⚠️  경고 항목이 있지만 출시는 가능합니다.
   권장 사항을 확인하고 필요시 수정하세요.
${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}
❌ 출시 전 반드시 수정이 필요한 항목이 있습니다!

📋 수정 가이드:
  - PUBLISHING_GUIDE.md 참고
  - CHECKLIST.md 체크리스트 확인
${colors.reset}`);
    process.exit(1);
  }
}

main().catch(console.error);
