# Cybersecurity Toolkit (Vercel Edition)

Esta es una aplicación web de herramientas de ciberseguridad construida con Next.js y diseñada para ser desplegada en Vercel.

## Herramientas Incluidas

- **🔍 Escáner de Puertos**: Un escáner de puertos básico que comprueba si los puertos TCP más comunes están abiertos en un host.
- **🌐 Web Fuzzer**: Busca directorios y archivos comunes en un sitio web para descubrir posibles puntos de entrada o archivos sensibles.
- **🔧 Detector de Tecnología**: Analiza una URL para identificar las tecnologías web que utiliza (CMS, frameworks, librerías, etc.).

## Despliegue en Vercel (Recomendado)

Este proyecto ha sido estructurado para un despliegue fácil y directo en Vercel. Dado que podrías tener problemas para instalar las dependencias localmente, este es el método recomendado.

**Paso 1: Sube el código a GitHub**

1.  Crea un nuevo repositorio en tu cuenta de GitHub (por ejemplo, `cyber-toolkit-vercel`).
2.  En tu máquina local, inicializa un repositorio de git dentro de la carpeta `cyber-toolkit-vercel` que he creado:
    ```bash
    cd "C:\Users\ALEX\Desktop\ALEX-MANCIA\AUDIT VALTORIX\cyber-toolkit-vercel"
    git init -b main
    git add .
    git commit -m "Initial commit"
    ```
3.  Conecta tu repositorio local con el de GitHub y sube el código:
    ```bash
    # Reemplaza <tu-usuario> y <tu-repositorio> con los tuyos
    git remote add origin https://github.com/<tu-usuario>/<tu-repositorio>.git
    git push -u origin main
    ```

**Paso 2: Despliega desde Vercel**

1.  Regístrate o inicia sesión en [Vercel](https://vercel.com/) usando tu cuenta de GitHub.
2.  En tu dashboard de Vercel, haz clic en **"Add New..." -> "Project"**.
3.  Importa el repositorio de GitHub que acabas de crear.
4.  Vercel detectará automáticamente que es un proyecto de Next.js. No necesitas cambiar ninguna configuración de compilación.
5.  Haz clic en **"Deploy"**.

Vercel se encargará de instalar las dependencias, construir el proyecto y desplegarlo. Una vez completado, te proporcionará una URL pública donde tu aplicación estará funcionando.

## Ejecución Local (Opcional)

Si los problemas con `npm` en tu máquina se resuelven, puedes ejecutar el proyecto localmente:

1.  Abre una terminal en la carpeta del proyecto:
    ```bash
    cd "C:\Users\ALEX\Desktop\ALEX-MANCIA\AUDIT VALTORIX\cyber-toolkit-vercel"
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```
4.  Abre [http://localhost:3000](http://localhost:3000) en tu navegador.