@echo off
echo ============================================
echo   Push sabai-shop ขึ้น GitHub Pages
echo ============================================
echo.

cd /d E:\project\sabai-shop

echo [1] เริ่มต้น Git...
git init

echo [2] ตั้งค่า remote...
git remote remove origin 2>nul
git remote add origin https://github.com/misterken353-code/sabai-shop.git

echo [3] เพิ่มไฟล์ทั้งหมด...
git add .

echo [4] Commit...
git commit -m "first commit: sabai-shop lazada-style"

echo [5] ตั้ง branch เป็น main...
git branch -M main

echo [6] Push ขึ้น GitHub...
git push -u origin main

echo.
echo ============================================
echo   Push สำเร็จ!
echo   ขั้นต่อไป: เปิด GitHub Pages ใน Settings
echo ============================================
echo.
pause
