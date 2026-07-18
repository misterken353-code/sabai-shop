@echo off
cd /d E:\project\sabai-shop
del /f ".git\index.lock" 2>nul
git add index.html
git commit -m "Add HTTPS redirect"
git push origin main
echo Push done!
pause
