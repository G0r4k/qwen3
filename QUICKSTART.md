# 🚀 Guía Rápida de Inicio - LocalCoder

## ⚡ Inicio Rápido (3 pasos)

### 1. Instalar Ollama

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Descarga desde https://ollama.ai/download

### 2. Descargar el modelo

```bash
ollama pull qwen2.5-coder:3b
```

### 3. ⚠️ IMPORTANTE: Configurar CORS

**Detén Ollama si está corriendo** (Ctrl+C) y reinícialo con:

```bash
OLLAMA_ORIGINS="*" ollama serve
```

**Windows PowerShell:**
```powershell
$env:OLLAMA_ORIGINS="*"; ollama serve
```

**Windows CMD:**
```cmd
set OLLAMA_ORIGINS=* && ollama serve
```

### 4. Iniciar la aplicación

```bash
npm install
npm run dev
```

Abre http://localhost:3000 en tu navegador.

---

## 🔍 ¿Problemas de conexión?

### Diagnóstico rápido

1. **Verifica que Ollama esté corriendo:**
   ```bash
   curl http://localhost:11434/api/tags
   ```
   Debería mostrar los modelos en JSON.

2. **Verifica CORS:**
   - Abre la consola del navegador (F12)
   - Si ves errores de "CORS" o "Access-Control", necesitas configurar `OLLAMA_ORIGINS="*"`

3. **Usa el diagnóstico integrado:**
   - Ve a Settings (ícono de engranaje)
   - Haz clic en "Diagnostic"
   - Te mostrará exactamente qué está fallando y cómo solucionarlo

### Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Not connected" | Ollama no está corriendo | Ejecuta `ollama serve` |
| "CORS Error" | Falta configurar CORS | Reinicia con `OLLAMA_ORIGINS="*" ollama serve` |
| "Model not found" | Modelo no descargado | Ejecuta `ollama pull qwen2.5-coder:3b` |
| "Failed to fetch" | URL incorrecta o firewall | Verifica que la URL sea `http://localhost:11434` |

---

## 💡 Configuración Permanente

Para no tener que configurar CORS cada vez:

**macOS/Linux:**
```bash
echo 'export OLLAMA_ORIGINS="*"' >> ~/.zshrc
source ~/.zshrc
```

**Windows:**
1. Abre "Variables de entorno del sistema"
2. Añade: `OLLAMA_ORIGINS` = `*`
3. Reinicia Ollama

---

## 📖 Más información

- [README.md](./README.md) - Documentación completa
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Guía detallada de solución de problemas

---

## ✅ Checklist

- [ ] Ollama instalado
- [ ] Modelo descargado: `ollama pull qwen2.5-coder:3b`
- [ ] CORS configurado: `OLLAMA_ORIGINS="*"`
- [ ] Ollama corriendo: `ollama serve`
- [ ] Aplicación iniciada: `npm run dev`
- [ ] Conexión verificada en Settings → Diagnostic

Si todo está en verde, ¡estás listo para usar LocalCoder! 🎉
