@echo off
chcp 936 >nul
setlocal
title 智养AI 开发服务器

rem 始终在脚本所在目录启动，避免从桌面双击时路径不对
cd /d "%~dp0"

set "PORT=3100"

echo.
echo ========================================
echo   智养AI 开发服务器
echo   端口：%PORT%
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先安装 Node.js 24。
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 npm，请检查 Node.js 安装。
  pause
  exit /b 1
)

if not exist ".env.local" (
  if not exist ".env.example" (
    echo [错误] 缺少 .env.local 和 .env.example，无法启动。
    pause
    exit /b 1
  )
  copy ".env.example" ".env.local" >nul
  echo [提示] 已生成 .env.local。
  echo        请填入 DATABASE_URL 与模型/Embedding 密钥后保存，再重新运行本脚本。
  notepad ".env.local"
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [首次启动] 正在安装依赖，可能需要几分钟...
  call npm install
  if errorlevel 1 (
    echo [错误] 依赖安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)

netstat -ano | findstr /C:":%PORT% " | findstr /C:"LISTENING" >nul
if not errorlevel 1 (
  echo [提示] 端口 %PORT% 已在监听，直接打开浏览器。
  start "" "http://localhost:%PORT%"
  pause
  exit /b 0
)

echo [启动] 正在启动开发服务器...
echo        启动后浏览器会自动打开；按 Ctrl+C 停止服务。
echo.

start "" /min cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:%PORT%"
call npm run dev -- -p %PORT%

echo.
echo [已停止] 开发服务器已退出。
pause
endlocal