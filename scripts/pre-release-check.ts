#!/usr/bin/env tsx
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 앱인토스 미니앱 출시 전 검증 스크립트
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 이 스크립트는 앱인토스 출시 검토 전에 필수 설정을 확인합니다.
 * 
 * 실행 방법:
 *   npm run pre-release-check
 *   또는
 *   npx tsx scripts/pre-release-check.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

const results: CheckResult[] = [];

function log(message: string) {
  console.log(message);
}

function success(message: string) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function error(message: string) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

function warning(message: string) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function info(message: string) {
  log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function header(message: string) {
  log(`\n${colors.bold}${colors.cyan}═══ ${message} ═══${colors.reset}\n`);
}

function addResult(name: string, passed: boolean, message: string, severity: 'error' | 'warning' | 'info' = 'error') {
  results.push({ name, passed, message, severity });
  if (passed) {
    success(message);
  } else if (severity === 'error') {
    error(message);
  } else if (severity === 'warning') {
    warning(message);
  } else {
    info(message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 검사 함수들
// ═══════════════════════════════════════════════════════════════════════════

function checkGraniteConfig() {
  header('granite.config.ts 검사');
  
  const configPath = path.join(process.cwd(), 'granite.config.ts');
  
  if (!fs.existsSync(configPath)) {
    addResult('granite.config.ts', false, 'granite.config.ts 파일이 없습니다');
    return;
  }
  
  const content = fs.readFileSync(configPath, 'utf-8');
  
  // appName 검사
  const appNameMatch = content.match(/appName:\s*['"]([^'"]+)['"]/);
  if (!appNameMatch) {
    addResult('appName', false, 'appName이 설정되지 않았습니다');
  } else if (appNameMatch[1] === 'todo-app') {
    addResult('appName', false, 'appName이 기본값(todo-app)입니다. 실제 앱 이름으로 변경하세요', 'warning');
  } else {
    addResult('appName', true, `appName: "${appNameMatch[1]}"`);
  }
  
  // displayName 검사
  const displayNameMatch = content.match(/displayName:\s*['"]([^'"]+)['"]/);
  if (!displayNameMatch) {
    addResult('displayName', false, 'displayName이 설정되지 않았습니다');
  } else if (displayNameMatch[1] === '할일 관리') {
    addResult('displayName', false, 'displayName이 기본값입니다. 실제 앱 이름으로 변경하세요', 'warning');
  } else {
    addResult('displayName', true, `displayName: "${displayNameMatch[1]}"`);
  }
  
  // primaryColor 검사
  const colorMatch = content.match(/primaryColor:\s*['"]([^'"]+)['"]/);
  if (!colorMatch) {
    addResult('primaryColor', false, 'primaryColor가 설정되지 않았습니다');
  } else {
    addResult('primaryColor', true, `primaryColor: "${colorMatch[1]}"`);
  }
  
  // icon 검사 (가장 중요!)
  const iconMatch = content.match(/icon:\s*['"]([^'"]*)['"]/);
  if (!iconMatch) {
    addResult('icon', false, 'icon이 설정되지 않았습니다');
  } else if (iconMatch[1] === '' || iconMatch[1].trim() === '') {
    addResult('icon', false, '⚠️ icon URL이 비어있습니다! 600x600px 아이콘 URL을 입력하세요');
  } else if (!iconMatch[1].startsWith('http')) {
    addResult('icon', false, 'icon URL이 올바른 형식이 아닙니다 (https://... 형식 필요)');
  } else {
    addResult('icon', true, `icon URL이 설정되어 있습니다`);
  }
}

function checkTemplateConfig() {
  header('template.config.ts 검사');
  
  const configPath = path.join(process.cwd(), 'src', 'template.config.ts');
  
  if (!fs.existsSync(configPath)) {
    addResult('template.config.ts', false, 'template.config.ts 파일이 없습니다');
    return;
  }
  
  const content = fs.readFileSync(configPath, 'utf-8');
  
  // appId 검사
  const appIdMatch = content.match(/appId:\s*['"]([^'"]+)['"]/);
  if (!appIdMatch) {
    addResult('appId', false, 'appId가 설정되지 않았습니다');
  } else if (appIdMatch[1] === 'todo-app') {
    addResult('appId', false, 'appId가 기본값입니다. granite.config.ts의 appName과 동일하게 변경하세요', 'warning');
  } else {
    addResult('appId', true, `appId: "${appIdMatch[1]}"`);
  }
  
  // deepLink 검사
  const deepLinkMatch = content.match(/production:\s*['"]([^'"]+)['"]/);
  if (deepLinkMatch && deepLinkMatch[1].includes('todo-app')) {
    addResult('deepLink', false, 'deepLink가 기본값입니다. 실제 appId로 변경하세요', 'warning');
  }
}

function checkIndexHtml() {
  header('index.html 검사');
  
  const htmlPath = path.join(process.cwd(), 'index.html');
  
  if (!fs.existsSync(htmlPath)) {
    addResult('index.html', false, 'index.html 파일이 없습니다');
    return;
  }
  
  const content = fs.readFileSync(htmlPath, 'utf-8');
  
  // user-scalable=no 검사 (핀치줌 비활성화)
  if (content.includes('user-scalable=no')) {
    addResult('핀치줌 비활성화', true, 'user-scalable=no 설정됨');
  } else {
    addResult('핀치줌 비활성화', false, 'user-scalable=no가 설정되지 않았습니다 (앱인토스 필수)');
  }
  
  // viewport-fit=cover 검사
  if (content.includes('viewport-fit=cover')) {
    addResult('viewport-fit', true, 'viewport-fit=cover 설정됨');
  } else {
    addResult('viewport-fit', false, 'viewport-fit=cover가 설정되지 않았습니다', 'warning');
  }
}

function checkForDarkMode() {
  header('다크모드 CSS 검사');
  
  const cssPath = path.join(process.cwd(), 'src', 'index.css');
  
  if (!fs.existsSync(cssPath)) {
    info('index.css 파일을 찾을 수 없습니다');
    return;
  }
  
  const content = fs.readFileSync(cssPath, 'utf-8');
  
  // 다크모드 관련 키워드 검사
  const darkModePatterns = [
    'prefers-color-scheme: dark',
    'dark-mode',
    '.dark ',
    '[data-theme="dark"]',
    'theme-dark',
  ];
  
  let hasDarkMode = false;
  for (const pattern of darkModePatterns) {
    if (content.toLowerCase().includes(pattern.toLowerCase())) {
      hasDarkMode = true;
      break;
    }
  }
  
  if (hasDarkMode) {
    addResult('다크모드', false, '다크모드 CSS가 감지되었습니다. 앱인토스는 라이트모드만 지원합니다', 'warning');
  } else {
    addResult('다크모드', true, '다크모드 CSS 없음 (정상)');
  }
}

function checkForCustomHeader() {
  header('커스텀 헤더 검사');
  
  const homeScreenPath = path.join(process.cwd(), 'src', 'features', 'home', 'HomeScreen.tsx');
  
  if (!fs.existsSync(homeScreenPath)) {
    info('HomeScreen.tsx 파일을 찾을 수 없습니다');
    return;
  }
  
  const content = fs.readFileSync(homeScreenPath, 'utf-8');
  
  // 커스텀 헤더 패턴 검사
  const headerPatterns = [
    '<header',
    '<Header',
    '<nav',
    '<Nav',
    'className="header',
    'className="nav',
  ];
  
  let hasCustomHeader = false;
  for (const pattern of headerPatterns) {
    if (content.includes(pattern)) {
      hasCustomHeader = true;
      break;
    }
  }
  
  if (hasCustomHeader) {
    addResult('커스텀 헤더', false, '커스텀 헤더가 감지되었습니다. 앱인토스 네비게이션 바를 사용해야 합니다', 'warning');
  } else {
    addResult('커스텀 헤더', true, '커스텀 헤더 없음 (정상)');
  }
}

function checkDependencies() {
  header('의존성 검사');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    addResult('package.json', false, 'package.json 파일이 없습니다');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // 필수 의존성 확인
  if (deps['@apps-in-toss/web-framework']) {
    addResult('@apps-in-toss/web-framework', true, '@apps-in-toss/web-framework 설치됨');
  } else {
    addResult('@apps-in-toss/web-framework', false, '@apps-in-toss/web-framework가 설치되지 않았습니다');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 실행
// ═══════════════════════════════════════════════════════════════════════════

function main() {
  console.log(`
${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        🚀 앱인토스 미니앱 출시 전 검증 스크립트 🚀             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  // 검사 실행
  checkGraniteConfig();
  checkTemplateConfig();
  checkIndexHtml();
  checkForDarkMode();
  checkForCustomHeader();
  checkDependencies();
  
  // 결과 요약
  header('검사 결과 요약');
  
  const errors = results.filter(r => !r.passed && r.severity === 'error');
  const warnings = results.filter(r => !r.passed && r.severity === 'warning');
  const passed = results.filter(r => r.passed);
  
  log(`${colors.green}✅ 통과: ${passed.length}개${colors.reset}`);
  log(`${colors.yellow}⚠️  경고: ${warnings.length}개${colors.reset}`);
  log(`${colors.red}❌ 오류: ${errors.length}개${colors.reset}`);
  
  if (errors.length > 0) {
    log(`\n${colors.red}${colors.bold}출시 전 수정이 필요합니다!${colors.reset}`);
    log('\n다음 항목을 수정하세요:');
    errors.forEach((e, i) => {
      log(`  ${i + 1}. ${e.message}`);
    });
    process.exit(1);
  } else if (warnings.length > 0) {
    log(`\n${colors.yellow}${colors.bold}경고 사항을 확인하세요.${colors.reset}`);
    log('출시는 가능하지만, 위 경고 사항을 확인하시기 바랍니다.');
    process.exit(0);
  } else {
    log(`\n${colors.green}${colors.bold}🎉 모든 검사를 통과했습니다!${colors.reset}`);
    log('\n다음 단계:');
    log('  1. npm run granite:build');
    log('  2. 앱인토스 콘솔에서 .ait 파일 업로드');
    log('  3. 출시 검토 요청');
    process.exit(0);
  }
}

main();
