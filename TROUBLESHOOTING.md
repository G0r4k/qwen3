# 🔧 Solución de Problemas - CORS con Ollama

## Problema

La aplicación muestra "Not connected" o "CORS Error" aunque Ollama esté corriendo correctamente.

## Causa

El navegador bloquea las peticiones HTTP desde la aplicación web a Ollama por políticas de seguridad CORS (Cross-Origin Resource Sharing).

## Solución Rápida

### 1. Detén Ollama

```bash
# Presiona Ctrl+C en la terminal donde está corriendo Ollama
```

### 2. Reinicia con CORS habilitado

**macOS/Linux:**
```bash
OLLAMA_ORIGINS="*" ollama serve
```

**Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="*"; ollama serve
```

**Windows (CMD):**
```cmd
set OLLAMA_ORIGINS=* && ollama serve
```

### 3. Verifica la conexión

En la aplicación, ve a **Settings** y haz clic en **Check**. Debería mostrar "Connected".

## Solución Permanente

Para no tener que configurar CORS cada vez que inicias Ollama:

### macOS/Linux

Añade la variable de entorno a tu archivo de configuración de shell:

```bash
# Para bash
echo 'export OLLAMA_ORIGINS="*"' >> ~/.bashrc
source ~/.bashrc

# Para zsh (macOS por defecto)
echo 'export OLLAMA_ORIGINS="*"' >> ~/.zshrc
source ~/.zshrc
```

### Windows

1. Presiona `Win + R` y escribe `sysdm.cpl`
2. Ve a la pestaña **Opciones avanzadas**
3. Haz clic en **Variables de entorno**
4. En **Variables del sistema**, haz clic en **Nueva**
5. Nombre: `OLLAMA_ORIGINS`
6. Valor: `*`
7. Haz clic en **Aceptar** en todas las ventanas
8. Reinicia Ollama

### Linux (systemd)

Si Ollama corre como servicio systemd:

```bash
sudo systemctl edit ollama
```

Añade:
```ini
[Service]
Environment="OLLAMA_ORIGINS=*"
```

Luego:
```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

## Verificación

### 1. Verifica que Ollama esté corriendo

```bash
curl http://localhost:11434/api/tags
```

Debería mostrar los modelos instalados en formato JSON.

### 2. Verifica CORS desde el navegador

Abre la consola del navegador (F12) y ejecuta:

```javascript
fetch('http://localhost:11434/api/tags')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Si funciona, verás los modelos. Si falla con error CORS, necesitas configurar `OLLAMA_ORIGINS`.

### 3. Verifica en la aplicación

- El indicador en la barra superior debe mostrar **"Ollama Connected"** en verde
- En Settings, el estado debe ser **"Connected"**

## Errores Comunes

### "Failed to fetch" o "NetworkError"

- Ollama no está corriendo
- La URL es incorrecta (verifica en Settings)
- Firewall bloqueando el puerto 11434

### "CORS policy" o "Access-Control-Allow-Origin"

- Falta configurar `OLLAMA_ORIGINS="*"`
- Reiniciaste Ollama sin la variable de entorno

### "Model not found"

- El modelo no está descargado
- Ejecuta: `ollama pull qwen2.5-coder:3b`

### La aplicación funciona pero Ollama consume mucha RAM

- Los modelos de 3B requieren ~2-4GB de RAM
- Cierra otras aplicaciones
- Considera usar modelos más pequeños si tienes menos de 8GB de RAM

## Información Adicional

- **Puerto por defecto**: 11434
- **Documentación de Ollama**: https://github.com/ollama/ollama
- **Modelos disponibles**: https://ollama.ai/library

## Soporte

Si después de seguir estos pasos aún tienes problemas:

1. Verifica que Ollama esté en la última versión
2. Revisa los logs de Ollama en la terminal
3. Abre un issue en el repositorio del proyecto
