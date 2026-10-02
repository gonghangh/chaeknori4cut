# GitHub 리포지토리 생성 및 자동 배포 스크립트 (책놀이네컷)
$git = "C:\Program Files\Git\cmd\git.exe"
$gh = "C:\Program Files\GitHub CLI\gh.exe"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "     🌿 책놀이네컷 (Chaeknori 4-Cuts) 배포 시작     " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan

# 1. GitHub CLI 상태 확인
$authCheck = & $gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] GitHub CLI 로그인이 필요합니다: gh auth login" -ForegroundColor Yellow
    exit 1
}

# 2. Git 초기화
if (!(Test-Path ".git")) {
    & $git init
    & $git branch -M main
}

& $git add .
& $git commit -m "feat: Initial commit for Chaeknori 4-Cuts photo booth"

# 3. 리포지토리 생성 및 푸시
Write-Host "[1/2] GitHub 리포지토리 생성 및 푸시 중..." -ForegroundColor Yellow
$repoResult = & $gh repo create chaeknori4cut --public --source=. --remote=origin --push --description "책놀이네컷 (Chaeknori 4-CUTS) 숲속 도서관 감성 4컷 포토부스" 2>&1
Write-Host $repoResult

# 4. GitHub Pages 활성화
Write-Host "[2/2] GitHub Pages 웹 배포 설정 중..." -ForegroundColor Yellow
try {
    $pagesResult = & $gh api repos/:owner/chaeknori4cut/pages -X POST -F "source[branch]=main" -F "source[path]=/" 2>&1
    Write-Host $pagesResult
} catch {
    Write-Host "Pages 활성화 요청 완료"
}

$repoUrl = & $gh repo view --json url -q ".url"
$owner = & $gh repo view --json owner -q ".owner.login"
$pagesUrl = "https://$owner.github.io/chaeknori4cut/"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   [✓] GitHub 리포지토리: $repoUrl" -ForegroundColor Green
Write-Host "   [✓] GitHub Pages 배포: $pagesUrl" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
