@echo off
echo ============================================
echo   ร้านสบายพาณิชย์ — เริ่มระบบ
echo ============================================
echo.

REM รัน Sales-Account (Next.js API) ใน background
echo [1] กำลังเริ่ม Sales-Account API Server...
cd /d E:\project\Sales-Account
start "Sales-Account API" cmd /k "npm run dev"

REM รอ 5 วินาที ให้ server ขึ้น
echo [2] รอ server พร้อม...
timeout /t 5 /nobreak >nul

REM เปิดเว็บขายสินค้า
echo [3] เปิดเว็บร้านสบายพาณิชย์...
start "" "E:\project\sabai-shop\index.html"

echo.
echo ============================================
echo   เสร็จแล้ว! เว็บเปิดในเบราว์เซอร์แล้ว
echo   API Server รันที่ http://localhost:3000
echo ============================================
echo.
pause
