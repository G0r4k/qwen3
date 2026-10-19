# 🔧 SOLUCIÓN AL PROBLEMA DE CONEXIÓN CON OLLAMA

## ⚠️ Problema Identificado

La aplicación no se conecta a Ollama debido a una restricción de seguridad del navegador llamada **CORS** (Cross-Origin Resource Sharing).

## ✅ Solución Definitiva (3 pasos)

### Paso 1: Detener Ollama

Si tienes Ollama corriendo, deténlo:
- Ve a la terminal donde está corriendo Ollama
- Presiona `Ctrl+C`

### Paso 2: Reiniciar Ollama con CORS habilitado

**En macOS/Linux:**
```bash
OLLAMA_ORIGINS="*" ollama serve
```

**En Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="*"; ollama serve
```

**En Windows (CMD):**
```cmd
set OLLAMA_ORIGINS=* && ollama serve
```

### Paso 3: Verificar la conexión

1. Abre la aplicación: `npm run dev`
2. Ve a http://localhost:3000
3. Haz clic en el ícono de engranaje (Settings)
4. Verás el estado de conexión:
   - 🟢 **Ollama Connected** = ¡Funciona!
   - 🟠 **CORS Error** = Aún hay problemas
   - 🔴 **Ollama Offline** = Ollama no está corriendo

---

## 🎯 ¿Por qué necesito hacer esto?

Los navegadores web tienen una política de seguridad que bloquea las peticiones HTTP entre diferentes orígenes (dominios/puertos). 

- Tu aplicación web corre en: `http://localhost:3000`
- Ollama corre en: `http://localhost:11434`

Sin configurar `OLLAMA_ORIGINS="*"`, el navegador bloquea las peticiones por seguridad.

---

## 🔒 ¿Es seguro hacer esto?

**Sí, es seguro para uso local.** La variable `OLLAMA_ORIGINS="*"` permite que cualquier página web en tu máquina se conecte a Ollama. Como Ollama solo corre en tu computadora (localhost), no hay riesgo de seguridad.

Si quieres ser más restrictivo, puedes usar:
```bash
OLLAMA_ORIGINS="http://localhost:3000" ollama serve
```

Esto solo permite conexiones desde tu aplicación web.

---

## 💾 Configuración Permanente

Para no tener que configurar CORS cada vez que inicias Ollama:

### macOS/Linux

```bash
# Para zsh (macOS por defecto)
echo 'export OLLAMA_ORIGINS="*"' >> ~/.zshrc
source ~/.zshrc

# Para bash
echo 'export OLLAMA_ORIGINS="*"' >> ~/.bashrc
source ~/.bashrc
```

Luego puedes iniciar Ollama normalmente:
```bash
ollama serve
```

### Windows

**Método 1: Variable de entorno del sistema**
1. Presiona `Win + R` y escribe `sysdm.cpl`
2. Ve a la pestaña **Opciones avanzadas**
3. Haz clic en **Variables de entorno**
4. En **Variables del sistema**, haz clic en **Nueva**
5. Nombre: `OLLAMA_ORIGINS`
6. Valor: `*`
7. Haz clic en **Aceptar** en todas las ventanas
8. Reinicia Ollama

**Método 2: Script de inicio**
Crea un archivo `start-ollama.bat`:
```batch
@echo off
set OLLAMA_ORIGINS=*
ollama serve
```

Y ejecútalo en lugar de `ollama serve`.

---

## 🔍 Diagnóstico Completo

### Script automático

**macOS/Linux:**
```bash
bash verify-connection.sh
```

**Windows:**
```cmd
verify-connection.bat
```

### Diagnóstico manual

1. **Verificar que Ollama responde:**
   ```bash
   curl http://localhost:11434/api/tags
   ```
   Debería mostrar los modelos en formato JSON.

2. **Verificar desde el navegador:**
   - Abre la consola del navegador (F12)
   - Ejecuta:
     ```javascript
     fetch('http://localhost:11434/api/tags')
       .then(r => r.json())
       .then(console.log)
       .catch(console.error)
     ```
   - Si funciona, verás los modelos
   - Si falla con "CORS", necesitas configurar `OLLAMA_ORIGINS`

3. **Diagnóstico integrado:**
   - Abre la aplicación web
   - Ve a Settings → Diagnostic
   - Te mostrará exactamente qué está fallando

---

## ❓ Preguntas Frecuentes

### ¿Por qué no funciona si Ollama está corriendo?

Porque el navegador bloquea las peticiones por CORS. Aunque Ollama esté corriendo, el navegador no permite que la aplicación web se conecte a menos que configures `OLLAMA_ORIGINS="*"`.

### ¿Puedo usar la aplicación sin configurar CORS?

No. La aplicación web necesita conectarse a Ollama a través del navegador, y el navegador bloquea las peticiones por seguridad.

### ¿Hay alguna alternativa?

Podrías usar un proxy CORS, pero no es recomendable para uso local. La solución más simple y segura es configurar `OLLAMA_ORIGINS="*"`.

### ¿Funciona en producción?

Esta aplicación está diseñada para uso local. Para producción, necesitarías un backend que se conecte a Ollama.

### ¿Qué pasa si cambio el puerto de Ollama?

Si Ollama corre en un puerto diferente, actualiza la URL en Settings:
- Por defecto: `http://localhost:11434`
- Si cambias el puerto: `http://localhost:NUEVO_PUERTO`

---

## 🆘 Aún no funciona

Si después de seguir todos los pasos aún no se conecta:

1. **Verifica que Ollama esté en la última versión:**
   ```bash
   ollama --version
   ```

2. **Reinicia tu computadora** (a veces ayuda con problemas de red)

3. **Verifica el firewall:**
   - Asegúrate de que el puerto 11434 no esté bloqueado
   - En Windows: Configuración de firewall de Windows

4. **Prueba con otro navegador:**
   - Chrome, Firefox, Edge deberían funcionar
   - Safari puede tener restricciones adicionales

5. **Revisa los logs de Ollama:**
   - Mira la terminal donde está corriendo Ollama
   - Busca mensajes de error

6. **Consulta la documentación:**
   - [README.md](./README.md)
   - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
   - [QUICKSTART.md](./QUICKSTART.md)

---

## 📞 Soporte

Si nada funciona, abre un issue en el repositorio con:
1. Tu sistema operativo
2. Versión de Ollama (`ollama --version`)
3. Resultado del diagnóstico integrado
4. Mensajes de error exactos

---

**Recuerda: La solución más común es simplemente ejecutar:**

```bash
OLLAMA_ORIGINS="*" ollama serve
```

¡Y eso debería solucionar el problema en el 99% de los casos! 🎉
