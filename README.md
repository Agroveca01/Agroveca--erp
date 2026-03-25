# Agroveca--erp

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/Agroveca01/Agroveca--erp)

## Configuración de Ambientes: Desarrollo & Producción

Este proyecto soporta dos ambientes completamente separados: **Desarrollo** y **Producción**. 

### Archivos de variables de entorno

- **.env.local** → Para desarrollo local. No debe subirse al repo (protegido por .gitignore).
- **.env.production** → Para producción (build final). No debe subirse al repo (protegido por .gitignore).
- Ejemplos con estructura esperada: `.env.local.example` y `.env.production.example`.

### ¿Qué debes hacer al iniciar?
1. Clona el repositorio.
2. Copia el archivo `.env.local.example` como `.env.local` (para desarrollo) y
   el archivo `.env.production.example` como `.env.production` (para builds de producción si lo necesitas localmente).
3. Solicita a tu líder técnico o revisa tu dashboard de Supabase para obtener las URL y keys correctas para cada ambiente.

```
# .env.local (solo para DESARROLLO local)
VITE_SUPABASE_URL=https://<TU-PROYECTO-DEV>.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<PUBLISHABLE-KEY-DEV>

# .env.production (solo para PRODUCCIÓN/final)
VITE_SUPABASE_URL=https://<TU-PROYECTO-PROD>.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<PUBLISHABLE-KEY-PROD>
```

### Variables de entorno en Vercel
- Configura las mismas variables en tu proyecto Vercel, asignando los valores correctos a cada ambiente:
  - **Production:** variables del proyecto Supabase de producción
  - **Preview:** variables del proyecto Supabase de desarrollo

### Seguridad
- **Jamás** subas archivos .env ni claves privadas al repositorio.
- Todas las variables sensibles deben ir solo en archivos ignorados o configuradas desde el dashboard de Vercel.

### Notas adicionales
- Si creas un nuevo entorno Supabase para desarrollo, debes migrar los schemas y reglas según los requerimientos de tu feature/pr.
- El frontend nunca debe usar claves service_role, sólo las ANON/public.
- Para dudas, consulta esta sección antes de hacer despliegues o cambios de ambiente.

---

## Cómo comprobar que tu ambiente está bien configurado

1. Inicia el frontend en modo desarrollo (`npm run dev` o similar) con tu `.env.local` apuntando a Supabase Dev.
2. Realiza un cambio en la base de datos de desarrollo (ejemplo: crea un nuevo usuario/test record en Supabase Dev).
3. Refresca el frontend: el nuevo dato debe aparecer. Si miras el proyecto Prod (panel Supabase Prod) verás que no se modificó.
4. Haz lo mismo en producción para verificar el aislamiento.
5. Si ves datos cruzados, revisa tus variables, despliegue y configuración de Vercel.

## Checklist para el equipo

- [ ] Asegúrate de no tener claves reales en `.env` ni en otros archivos del repo.
- [ ] Reemplaza tu `.env.local` copiando el nuevo `.env.local.example` y coloca las claves correctas.
- [ ] Si haces un deploy en Vercel, valida que el entorno (Production vs Preview) tenga las variables del ambiente correcto.
- [ ] Antes de mergear a `main`, revisa que nada de desarrollo (ni datos ni keys) pase a producción.
- [ ] Ante cualquier duda, consulta a tu líder técnico.
