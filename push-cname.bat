@echo off
echo ============================================
echo   Push CNAME ขึ้น GitHub
echo ============================================
cd /d E:\project\sabai-shop
git add CNAME
git commit -m "Add CNAME for custom domain geargao.com"
git push origin main
echo.
echo Push สำเร็จ!
pause
