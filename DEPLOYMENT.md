# Guía de Despliegue - CTP ERP

## Sistema Multiusuario ERP para Cuida Tu Planta

Esta aplicación es un sistema ERP completo con autenticación multiusuario, gestión de roles, escaneo QR móvil y diseño responsive mobile-first.

---

## Características Implementadas

### Autenticación y Seguridad
- Sistema de login/registro con Supabase Auth
- Gestión de sesiones persistentes
- Protección de rutas automática
- Roles de usuario: Administrador y Operario

### Gestión de Usuarios
- Perfiles de usuario con roles
- Panel de administración de usuarios (solo admins)
- Activación/desactivación de cuentas
- Cambio de roles

### Escaneo QR Móvil
- Escaneo de códigos QR desde la cámara del móvil
- Búsqueda manual de materias primas por código
- Códigos QR únicos para cada materia prima
- Acceso directo a fichas de inventario

### Diseño Mobile-First
- Interfaz optimizada para dispositivos móviles
- Navegación táctil intuitiva
- Tablas responsive
- Diseño adaptativo para todas las pantallas

---

## Despliegue en Vercel (Recomendado)

### Paso 1: Preparar el Proyecto

1. Asegúrate de que tu proyecto esté en un repositorio Git (GitHub, GitLab, Bitbucket)

```bash
git init
git add .
git commit -m "Initial commit - CTP ERP"
git branch -M main
git remote add origin <tu-repositorio-url>
git push -u origin main
```

### Paso 2: Configurar en Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta (puedes usar tu cuenta de GitHub)
2. Haz clic en "Add New Project"
3. Importa tu repositorio de GitHub
4. Configura el proyecto:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Paso 3: Configurar Variables de Entorno

En la sección "Environment Variables" de Vercel, agrega:

```
VITE_SUPABASE_URL=<tu-url-de-supabase>
VITE_SUPABASE_ANON_KEY=<tu-clave-anonima-de-supabase>
```

**Importante**: Estas variables ya están configuradas en tu archivo `.env` local. Cópialas desde ahí.

### Paso 4: Desplegar

1. Haz clic en "Deploy"
2. Espera a que termine el despliegue (2-3 minutos)
3. Tu aplicación estará disponible en: `https://tu-proyecto.vercel.app`

### Paso 5: Configurar Dominio Personalizado (Opcional)

1. En el dashboard de Vercel, ve a "Settings" > "Domains"
2. Agrega tu dominio personalizado: `ctp-erp.vercel.app` o tu propio dominio
3. Sigue las instrucciones para configurar el DNS

---

## Despliegue en Netlify (Alternativa)

### Paso 1: Preparar el Proyecto

Igual que con Vercel, asegúrate de tener tu código en un repositorio Git.

### Paso 2: Configurar en Netlify

1. Ve a [netlify.com](https://netlify.com) y crea una cuenta
2. Haz clic en "Add new site" > "Import an existing project"
3. Conecta tu repositorio de GitHub
4. Configura el build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### Paso 3: Configurar Variables de Entorno

En "Site settings" > "Environment variables", agrega:

```
VITE_SUPABASE_URL=<tu-url-de-supabase>
VITE_SUPABASE_ANON_KEY=<tu-clave-anonima-de-supabase>
```

### Paso 4: Desplegar

1. Haz clic en "Deploy site"
2. Tu aplicación estará disponible en: `https://tu-proyecto.netlify.app`

### Paso 5: Configurar Dominio Personalizado (Opcional)

1. En "Domain settings" > "Add custom domain"
2. Agrega: `ctp-erp.netlify.app` o tu propio dominio

---

## Configuración de Supabase

### Paso 1: Habilitar Autenticación por Email

1. Ve a tu proyecto de Supabase
2. Authentication > Providers
3. Asegúrate de que "Email" esté habilitado
4. **Importante**: Desactiva "Confirm email" para permitir registro sin confirmación

### Paso 2: Configurar URLs Permitidas

En Authentication > URL Configuration, agrega:

```
Site URL: https://tu-proyecto.vercel.app
Redirect URLs:
  - https://tu-proyecto.vercel.app
  - https://tu-proyecto.vercel.app/**
  - http://localhost:5173 (para desarrollo local)
```

### Paso 3: Crear Primer Usuario Administrador

Después del despliegue:

1. Abre tu aplicación desplegada
2. Regístrate con tu email y contraseña
3. Ve a Supabase > Table Editor > `user_profiles`
4. Encuentra tu usuario y cambia el campo `role` de `operator` a `admin`
5. Cierra sesión y vuelve a iniciar sesión para ver los módulos de administrador

---

## Acceso desde Dispositivos Móviles

Una vez desplegado, puedes acceder desde cualquier dispositivo:

1. **iPhone/iPad**: Abre Safari y ve a tu URL
2. **Android**: Abre Chrome y ve a tu URL
3. **PWA (Progressive Web App)**:
   - En el menú del navegador, selecciona "Agregar a pantalla de inicio"
   - La app funcionará como una aplicación nativa

### Permisos de Cámara para Escaneo QR

Al usar el escáner QR por primera vez, el navegador pedirá permiso para acceder a la cámara:

- **iOS Safari**: Permite el acceso a la cámara cuando se solicite
- **Android Chrome**: Permite el acceso a la cámara cuando se solicite

---

## Gestión de Códigos QR

### Generar Códigos QR para Materias Primas

Cada materia prima en la base de datos tiene un código QR único. Para imprimir los códigos:

1. Accede al módulo de Inventario
2. Cada materia prima tiene un campo `qr_code` único
3. Puedes usar servicios en línea para generar códigos QR:
   - [QR Code Generator](https://www.qr-code-generator.com/)
   - [QR Code Monkey](https://www.qrcode-monkey.com/)

4. Imprime y pega los códigos en tus bidones/contenedores

### Usar el Escáner QR

1. Abre la aplicación en tu móvil
2. Haz clic en el icono de QR en la esquina superior derecha
3. Permite el acceso a la cámara
4. Apunta al código QR del bidón
5. El sistema abrirá automáticamente la ficha del material

---

## Actualizar la Aplicación

### Despliegue Automático

Tanto Vercel como Netlify configuran despliegue automático:

1. Haz cambios en tu código local
2. Commit y push a tu repositorio:
```bash
git add .
git commit -m "Descripción de los cambios"
git push
```
3. La aplicación se desplegará automáticamente (2-3 minutos)

### Despliegue Manual

Si necesitas redesplegar manualmente:

- **Vercel**: Dashboard > Deployments > "Redeploy"
- **Netlify**: Dashboard > Deploys > "Trigger deploy"

---

## Solución de Problemas

### Error: "Missing Supabase environment variables"

**Solución**: Verifica que las variables de entorno estén correctamente configuradas en tu plataforma de despliegue.

### No puedo registrarme

**Solución**: Verifica que la autenticación por email esté habilitada en Supabase y que "Confirm email" esté desactivado.

### El escáner QR no funciona

**Solución**:
- Asegúrate de estar usando HTTPS (no HTTP)
- Verifica que hayas dado permisos de cámara al navegador
- Prueba en un navegador diferente (Chrome en Android, Safari en iOS)

### No veo el módulo de Usuarios

**Solución**: Solo los administradores pueden ver este módulo. Cambia tu rol a `admin` en la tabla `user_profiles` de Supabase.

---

## Seguridad

### Buenas Prácticas Implementadas

- Autenticación con Supabase Auth (industry standard)
- Row Level Security (RLS) en todas las tablas
- Validación de roles del lado del servidor
- Variables de entorno para credenciales sensibles
- HTTPS obligatorio en producción

### Recomendaciones

1. **Contraseñas fuertes**: Mínimo 6 caracteres (configurable)
2. **Backup regular**: Exporta tu base de datos periódicamente desde Supabase
3. **Monitoreo**: Revisa los logs en Supabase y Vercel/Netlify
4. **Actualizaciones**: Mantén las dependencias actualizadas

---

## Soporte y Recursos

### Documentación Oficial

- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev/)

### Stack Tecnológico

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **QR Scanner**: html5-qrcode
- **Icons**: Lucide React
- **Build Tool**: Vite

---

## URL de Ejemplo

Después del despliegue, tu aplicación estará disponible en:

- Vercel: `https://ctp-erp.vercel.app`
- Netlify: `https://ctp-erp.netlify.app`

Puedes compartir esta URL con tu equipo para que accedan desde cualquier dispositivo.

---

## Próximos Pasos

1. Despliega la aplicación siguiendo esta guía
2. Regístrate como primer usuario
3. Convierte tu usuario en administrador
4. Invita a tu equipo a registrarse
5. Asigna roles según corresponda
6. Genera e imprime códigos QR para tus materias primas
7. Empieza a usar el sistema desde tu móvil

---

**¡Listo! Tu ERP multiusuario está funcionando en la web y accesible desde cualquier dispositivo móvil.**
