@echo off
cd /d "C:\Users\thede\Desktop\devbranchSpring\devbranch_team_spring26\devbranch-angular-app\devbranchAngular"

echo Installing angular-cli-ghpages...
call npm install angular-cli-ghpages --save-dev

echo.
echo Building and deploying to GitHub Pages...
call npx ng deploy --base-href=/devbranch_team_spring26/

pause
