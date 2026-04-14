@echo off
title Wanderly System Starter
color 0B
echo ==========================================
echo    DANG KHOI DONG HE THONG WANDERLY
echo ==========================================
echo.

:: 1. Khoi chay Docker
echo [+] Buoc 1: Dang kich hoat Docker Containers...
docker-compose up -d

:: 2. Doi Database san sang (30 giay la con so an toan)
echo.
echo [+] Buoc 2: Dang doi SQL Server khoi tao du lieu (30s)...
echo     Ban hay di pha mot ly cafe nhe!
timeout /t 30 /nobreak

:: 3. Kiem tra trang thai
echo.
echo [+] Buoc 3: Kiem tra trang thai cac dich vu...
docker ps

echo.
echo ==========================================
echo    MOI THU DA SAN SANG! 
echo    Truy cap: http://localhost:4000
echo ==========================================
pause