@echo off
title Wanderly System Starter - Build Mode
color 0B
echo ==========================================
echo    DANG KHOI DONG VA REBUILD WANDERLY
echo ==========================================
echo.

:: 1. Khoi chay Docker voi tham so --build
echo [+] Buoc 1: Dang build va kich hoat Containers...
docker-compose up --build -d

:: 2. Doi Database san sang
echo.
echo [+] Buoc 2: Dang doi SQL Server khoi tao (30s)...
echo Hay di pha 1 ly ca phe trong luc cho doi...
timeout /t 30 /nobreak

:: 3. Kiem tra trang thai
echo.
echo [+] Buoc 3: Kiem tra trang thai cac dich vu...
docker ps

echo.
echo ==========================================
echo    MOI THU DA CAP NHAT MOI NHAT!
echo    Truy cap: http://localhost:4000
echo ==========================================
echo Neu co van de, hay chay lenh sau: docker restart wanderly-main
pause 