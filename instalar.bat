@echo off
chcp 65001 >nul
title CatIA - Instalador automático
color 0A

echo ================================================
echo    CatIA - Instalador automático para Windows
echo ================================================
echo.

:: ── Verificar Python ──────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python NO está instalado.
    echo.
    echo  1. Abre este enlace en tu navegador:
    echo     https://www.python.org/downloads/
    echo.
    echo  2. Descarga e instala Python
    echo  3. MUY IMPORTANTE: marca "Add Python to PATH"
    echo  4. Cuando termines, vuelve a ejecutar este archivo
    echo.
    pause
    exit /b 1
)
echo [OK] Python encontrado
python --version

:: ── Verificar Node.js ─────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js NO está instalado.
    echo.
    echo  1. Abre este enlace en tu navegador:
    echo     https://nodejs.org/
    echo  2. Descarga e instala la versión LTS
    echo  3. Cuando termines, vuelve a ejecutar este archivo
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js encontrado
node --version

:: ── Descargar proyecto ────────────────────────────
echo.
echo [1/5] Descargando el proyecto desde GitHub...

if not exist "C:\CatastroIA" mkdir C:\CatastroIA

powershell -Command "Invoke-WebRequest -Uri 'https://github.com/juanheco12/CatastroIA/archive/refs/heads/claude/wonderful-cori-iw233n.zip' -OutFile 'C:\CatastroIA\proyecto.zip'" 2>nul

if not exist "C:\CatastroIA\proyecto.zip" (
    echo [ERROR] No se pudo descargar. Verifica tu conexión a internet.
    pause
    exit /b 1
)
echo [OK] Descargado

:: ── Extraer ZIP ───────────────────────────────────
echo [2/5] Extrayendo archivos...
powershell -Command "Expand-Archive -Path 'C:\CatastroIA\proyecto.zip' -DestinationPath 'C:\CatastroIA\' -Force"

:: Mover contenido de subcarpeta al directorio principal
set "SUBFOLDER=C:\CatastroIA\CatastroIA-claude-wonderful-cori-iw233n"
if exist "%SUBFOLDER%" (
    xcopy "%SUBFOLDER%\*" "C:\CatastroIA\" /E /Y /Q >nul
    rmdir /S /Q "%SUBFOLDER%"
)
del "C:\CatastroIA\proyecto.zip" >nul 2>&1
echo [OK] Archivos extraídos en C:\CatastroIA\

:: ── Configurar Backend ────────────────────────────
echo [3/5] Configurando Backend (Python)...
cd /d C:\CatastroIA\backend

python -m venv .venv
call .venv\Scripts\activate
pip install -r requirements.txt --quiet

if not exist ".env" (
    copy .env.example .env >nul
)
echo [OK] Backend configurado

:: ── Configurar Frontend ───────────────────────────
echo [4/5] Instalando dependencias del Frontend (puede tardar)...
cd /d C:\CatastroIA\frontend
call npm install --legacy-peer-deps --silent
echo [OK] Frontend configurado

:: ── Configurar clave API ──────────────────────────
echo.
echo [5/5] Configuración de la clave Anthropic
echo ================================================
echo.
echo  Necesitas ingresar tu clave de API de Anthropic.
echo  La puedes obtener en: https://console.anthropic.com/
echo.
set /p "APIKEY=  Pega tu clave aqui (sk-ant-...): "

powershell -Command "(Get-Content 'C:\CatastroIA\backend\.env') -replace 'sk-ant-your-key-here', '%APIKEY%' | Set-Content 'C:\CatastroIA\backend\.env'"

echo.
echo ================================================
echo  [LISTO] Instalación completada
echo ================================================
echo.
echo  Para iniciar la aplicación ejecuta:
echo     C:\CatastroIA\iniciar.bat
echo.

:: ── Crear script de inicio ────────────────────────
(
echo @echo off
echo title CatIA
echo echo Iniciando CatIA...
echo echo.
echo start "CatIA Backend" cmd /k "cd /d C:\CatastroIA\backend && .venv\Scripts\activate && uvicorn main:app --reload"
echo timeout /t 3 /nobreak ^>nul
echo start "CatIA Frontend" cmd /k "cd /d C:\CatastroIA\frontend && npm run dev"
echo timeout /t 5 /nobreak ^>nul
echo start http://localhost:3000
echo echo Abriendo http://localhost:3000 en el navegador...
) > C:\CatastroIA\iniciar.bat

echo  Iniciando la aplicación ahora...
echo.
pause
call C:\CatastroIA\iniciar.bat
