@echo off
chcp 936 >nul
setlocal
title 智养AI 暂停服务

rem 本脚本只停止监听 3100 端口的本项目开发服务器
cd /d "%~dp0"

set "PORT=3100"

echo.
echo ========================================
echo   智养AI 暂停服务
echo   端口：%PORT%
echo ========================================
echo.
echo [说明] 本脚本会结束监听 %PORT% 端口的进程。
echo        如果该端口被其他程序占用，请先确认后再继续。
echo.

set "FOUND="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /C:":%PORT% " ^| findstr /C:"LISTENING"') do (
  set "FOUND=1"
  echo [停止] 正在结束进程 PID %%p ...
  taskkill /F /T /PID %%p >nul 2>nul
)

if not defined FOUND (
  echo [提示] 端口 %PORT% 当前没有监听，服务可能已经停止。
  goto :done
)

timeout /t 1 /nobreak >nul
netstat -ano | findstr /C:":%PORT% " | findstr /C:"LISTENING" >nul
if errorlevel 1 (
  echo [完成] 服务已停止。
) else (
  echo [警告] 端口 %PORT% 仍有进程监听，请手动检查。
)

:done
echo.
pause
endlocal