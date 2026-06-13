@echo off
chcp 65001 >nul
title CatIA - Instalador
color 0A

echo ================================================
echo    CatIA - Instalador para Windows
echo ================================================
echo.

:: Instala en la carpeta del usuario (sin necesitar administrador)
set "CATIA=%USERPROFILE%\CatastroIA"

:: ── Verificar Python ──────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python NO esta instalado.
    echo.
    echo  Instala Python desde:
    echo  https://www.python.org/downloads/
    echo.
    echo  IMPORTANTE: marca "Add Python to PATH" al instalar
    echo  Luego cierra y vuelve a abrir este archivo.
    echo.
    start https://www.python.org/downloads/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do echo [OK] %%i

:: ── Verificar Node.js ─────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js NO esta instalado.
    echo.
    echo  Instala Node.js desde:
    echo  https://nodejs.org/  (version LTS)
    echo  Luego cierra y vuelve a abrir este archivo.
    echo.
    start https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo [OK] Node %%i

:: ── Crear carpeta ─────────────────────────────────
echo.
echo [1/5] Creando carpeta en %CATIA%
if not exist "%CATIA%" mkdir "%CATIA%"

:: ── Descargar ZIP ─────────────────────────────────
echo [2/5] Descargando proyecto...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/juanheco12/CatastroIA/archive/refs/heads/claude/wonderful-cori-iw233n.zip' -OutFile '%CATIA%\proyecto.zip'"

if not exist "%CATIA%\proyecto.zip" (
    echo [ERROR] No se pudo descargar. Verifica tu internet.
    pause
    exit /b 1
)
echo [OK] Descargado

:: ── Extraer ───────────────────────────────────────
echo [3/5] Extrayendo archivos...
powershell -Command "Expand-Archive -Path '%CATIA%\proyecto.zip' -DestinationPath '%CATIA%\' -Force"

xcopy "%CATIA%\CatastroIA-claude-wonderful-cori-iw233n\*" "%CATIA%\" /E /Y /Q >nul 2>&1
rmdir /S /Q "%CATIA%\CatastroIA-claude-wonderful-cori-iw233n" >nul 2>&1
del "%CATIA%\proyecto.zip" >nul 2>&1
echo [OK] Archivos en %CATIA%

:: ── Backend ───────────────────────────────────────
echo [4/5] Instalando Backend Python...
cd /d "%CATIA%\backend"
python -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install -r requirements.txt --quiet
if not exist ".env" copy .env.example .env >nul
echo [OK] Backend listo

:: ── Frontend ──────────────────────────────────────
echo [5/5] Instalando Frontend Node...
cd /d "%CATIA%\frontend"
call npm install --legacy-peer-deps
echo [OK] Frontend listo

:: ── Clave API ─────────────────────────────────────
echo.
echo ================================================
echo  ULTIMO PASO: Tu clave de Anthropic
echo ================================================
echo.
echo  Obtenla en: https://console.anthropic.com/
echo.
set /p "APIKEY=  Pega tu clave (sk-ant-...): "

powershell -Command "(Get-Content '%CATIA%\backend\.env') -replace 'sk-ant-your-key-here', '%APIKEY%' | Set-Content '%CATIA%\backend\.env'"

:: ── Crear iniciar.bat ─────────────────────────────
(
echo @echo off
echo title CatIA
echo echo Iniciando CatIA...
echo start "Backend" cmd /k "cd /d %CATIA%\backend ^&^& .venv\Scripts\activate ^&^& uvicorn main:app --reload"
echo timeout /t 4 /nobreak ^>nul
echo start "Frontend" cmd /k "cd /d %CATIA%\frontend ^&^& npm run dev"
echo timeout /t 6 /nobreak ^>nul
echo start http://localhost:3000
) > "%CATIA%\iniciar.bat"

echo.
echo ================================================
echo  INSTALACION COMPLETADA
echo ================================================
echo.
echo  Para abrir CatIA en el futuro usa:
echo  %CATIA%\iniciar.bat
echo.
echo  Iniciando ahora...
pause
call "%CATIA%\iniciar.bat"
