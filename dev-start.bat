@echo off
echo [1/3] adb reverse 설정 중...
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081
if %errorlevel% neq 0 (
  echo USB가 연결되지 않았습니다. USB를 꽂고 다시 실행하세요.
  pause
  exit /b 1
)
echo [2/3] Metro 시작 중...
set NODE_OPTIONS=--max_old_space_size=4096
echo [3/3] 폰 앱에서 localhost:8081 로 Connect 하세요.
npx expo start --dev-client --localhost
