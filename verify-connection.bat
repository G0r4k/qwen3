@echo off
REM Script de verificación de conexión para LocalCoder (Windows)
REM Ejecutar con: verify-connection.bat

echo 🔍 Verificando conexión con Ollama...
echo.

REM Verificar si Ollama está instalado
echo 1️⃣  Verificando instalación de Ollama...
where ollama >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Ollama está instalado
    ollama --version
) else (
    echo ✗ Ollama no está instalado
    echo Instálalo desde: https://ollama.ai/download
    pause
    exit /b 1
)
echo.

REM Verificar si Ollama está corriendo
echo 2️⃣  Verificando si Ollama está corriendo...
curl -s http://localhost:11434/ >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Ollama está corriendo en localhost:11434
) else (
    echo ✗ Ollama no está corriendo
    echo Inícialo con: ollama serve
    echo.
    echo ⚠️  IMPORTANTE: Si vas a usar la aplicación web, debes iniciar Ollama con:
    echo    set OLLAMA_ORIGINS=* ^&^& ollama serve
    pause
    exit /b 1
)
echo.

REM Verificar modelos disponibles
echo 3️⃣  Verificando modelos disponibles...
curl -s http://localhost:11434/api/tags > temp_models.json 2>&1
findstr "name" temp_models.json >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Modelos disponibles:
    type temp_models.json | findstr "name"
    
    findstr "qwen2.5-coder" temp_models.json >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✓ Modelo qwen2.5-coder encontrado
    ) else (
        echo ⚠️  Modelo qwen2.5-coder no encontrado
        echo Descárgalo con: ollama pull qwen2.5-coder:3b
    )
) else (
    echo ✗ No hay modelos instalados
    echo Descarga el modelo con: ollama pull qwen2.5-coder:3b
)
del temp_models.json >nul 2>&1
echo.

REM Verificar CORS
echo 4️⃣  Verificando configuración CORS...
echo Para verificar CORS, abre la aplicación web y usa el diagnóstico integrado:
echo   1. Abre http://localhost:3000
echo   2. Ve a Settings (ícono de engranaje)
echo   3. Haz clic en "Diagnostic"
echo.
echo Si ves "CORS Error", reinicia Ollama con:
echo   set OLLAMA_ORIGINS=* ^&^& ollama serve
echo.

REM Prueba de chat simple
echo 5️⃣  Probando API de chat...
curl -s -X POST http://localhost:11434/api/chat ^
    -H "Content-Type: application/json" ^
    -d "{\"model\":\"qwen2.5-coder:3b\",\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}],\"stream\":false,\"options\":{\"num_predict\":5}}" > temp_chat.json 2>&1

findstr "message" temp_chat.json >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ API de chat funcionando correctamente
) else (
    echo ✗ Error en la API de chat
    echo Verifica que el modelo esté descargado
)
del temp_chat.json >nul 2>&1
echo.

REM Resumen
echo ═══════════════════════════════════════════════════
echo 📊 Resumen:
echo ═══════════════════════════════════════════════════
echo.
echo Si todo está configurado correctamente, puedes iniciar la aplicación con:
echo   npm run dev
echo.
echo Y abrir http://localhost:3000 en tu navegador
echo.
echo ⚠️  RECUERDA: Para que la aplicación web funcione, Ollama debe iniciarse con:
echo    set OLLAMA_ORIGINS=* ^&^& ollama serve
echo.
echo Para más información, consulta:
echo   - QUICKSTART.md
echo   - TROUBLESHOOTING.md
echo ═══════════════════════════════════════════════════
echo.
pause
