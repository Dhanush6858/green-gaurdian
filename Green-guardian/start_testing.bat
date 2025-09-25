@echo off
echo 🌱 CartHero Testing Setup
echo =====================

echo.
echo 1. Starting backend server...
cd backend
start "CartHero Backend" python app.py

echo.
echo 2. Waiting for server to start...
timeout /t 3 /nobreak >nul

echo.
echo 3. Testing API endpoints...
cd ..
python test_api.py

echo.
echo 4. Opening test page...
start test_features.html

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Load extension in Chrome (chrome://extensions/)
echo 2. The test page should open automatically
echo 3. Check that all features appear in the overlay
echo.
pause