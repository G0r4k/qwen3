#!/bin/bash

# Script de verificación de conexión para LocalCoder
# Ejecutar con: bash verify-connection.sh

echo "🔍 Verificando conexión con Ollama..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si Ollama está instalado
echo "1️⃣  Verificando instalación de Ollama..."
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✓ Ollama está instalado${NC}"
    ollama --version
else
    echo -e "${RED}✗ Ollama no está instalado${NC}"
    echo "Instálalo desde: https://ollama.ai/download"
    exit 1
fi
echo ""

# Verificar si Ollama está corriendo
echo "2️⃣  Verificando si Ollama está corriendo..."
if curl -s http://localhost:11434/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama está corriendo en localhost:11434${NC}"
else
    echo -e "${RED}✗ Ollama no está corriendo${NC}"
    echo "Inícialo con: ollama serve"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE: Si vas a usar la aplicación web, debes iniciar Ollama con:${NC}"
    echo -e "${YELLOW}   OLLAMA_ORIGINS=\"*\" ollama serve${NC}"
    exit 1
fi
echo ""

# Verificar modelos disponibles
echo "3️⃣  Verificando modelos disponibles..."
MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

if [ -z "$MODELS" ]; then
    echo -e "${RED}✗ No hay modelos instalados${NC}"
    echo "Descarga el modelo con: ollama pull qwen2.5-coder:3b"
    exit 1
else
    echo -e "${GREEN}✓ Modelos disponibles:${NC}"
    echo "$MODELS" | while read -r model; do
        echo "  - $model"
    done
    
    # Verificar si está el modelo específico
    if echo "$MODELS" | grep -q "qwen2.5-coder"; then
        echo -e "${GREEN}✓ Modelo qwen2.5-coder encontrado${NC}"
    else
        echo -e "${YELLOW}⚠️  Modelo qwen2.5-coder no encontrado${NC}"
        echo "Descárgalo con: ollama pull qwen2.5-coder:3b"
    fi
fi
echo ""

# Verificar CORS
echo "4️⃣  Verificando configuración CORS..."
CORS_HEADER=$(curl -s -I -X OPTIONS http://localhost:11434/api/tags \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: GET" \
    | grep -i "access-control-allow-origin")

if [ -z "$CORS_HEADER" ]; then
    echo -e "${RED}✗ CORS no está configurado${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  La aplicación web no podrá conectarse a Ollama${NC}"
    echo ""
    echo "Solución:"
    echo "1. Detén Ollama (Ctrl+C)"
    echo "2. Reinicia con: OLLAMA_ORIGINS=\"*\" ollama serve"
    echo ""
    echo "Para configuración permanente:"
    echo "  macOS/Linux: Añade 'export OLLAMA_ORIGINS=\"*\"' a ~/.zshrc o ~/.bashrc"
    echo "  Windows: Añade la variable de entorno OLLAMA_ORIGINS = *"
else
    echo -e "${GREEN}✓ CORS está configurado correctamente${NC}"
    echo "  $CORS_HEADER"
fi
echo ""

# Prueba de chat simple
echo "5️⃣  Probando API de chat..."
CHAT_RESPONSE=$(curl -s -X POST http://localhost:11434/api/chat \
    -H "Content-Type: application/json" \
    -d '{
        "model": "qwen2.5-coder:3b",
        "messages": [{"role": "user", "content": "Hi"}],
        "stream": false,
        "options": {"num_predict": 5}
    }' 2>&1)

if echo "$CHAT_RESPONSE" | grep -q "message"; then
    echo -e "${GREEN}✓ API de chat funcionando correctamente${NC}"
else
    echo -e "${RED}✗ Error en la API de chat${NC}"
    echo "Respuesta: $CHAT_RESPONSE"
fi
echo ""

# Resumen
echo "═══════════════════════════════════════════════════"
echo "📊 Resumen:"
echo "═══════════════════════════════════════════════════"

if [ -n "$CORS_HEADER" ] && echo "$CHAT_RESPONSE" | grep -q "message"; then
    echo -e "${GREEN}✓ Todo está configurado correctamente${NC}"
    echo ""
    echo "Puedes iniciar la aplicación con:"
    echo "  npm run dev"
    echo ""
    echo "Y abrir http://localhost:3000 en tu navegador"
else
    echo -e "${RED}✗ Hay problemas que necesitan solución${NC}"
    echo ""
    echo "Revisa los errores arriba y sigue las instrucciones."
    echo ""
    echo "Para más información, consulta:"
    echo "  - QUICKSTART.md"
    echo "  - TROUBLESHOOTING.md"
fi

echo "═══════════════════════════════════════════════════"
