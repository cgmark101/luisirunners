## Plan de migración a Django REST Framework + Simple JWT

Este documento recoge un plan completo y accionable para extender las vistas y funcionalidades actuales del proyecto para usar Django REST Framework (DRF) y autenticación por tokens con djangorestframework-simplejwt.

Contenido rápido:
- Objetivo y contrata
- Recursos a exponer (endpoints)
- Pasos detallados (tareas incrementalmente numeradas)
- Contratos (inputs/outputs/errores)
- Casos borde a considerar
- Calidad: tests, lint, verificación
- Comandos y notas de despliegue

---

## 1) Objetivo

Permitir consumo programático de los recursos principales (usuarios, asistencias, grupos, session-days, pagos, reportes) mediante una API REST segura. Mantener las vistas y plantillas actuales (HTMX) durante la migración para que sea incremental.

Éxito: tener un conjunto mínimo de endpoints funcionales con autenticación JWT, tests básicos y documentación para obtener/usar tokens.

## 2) Contrato mínimo (resumen)
- Inputs clave:
  - Login: {username, password} -> tokens (access, refresh)
  - Crear asistencia: {alumno(id), fecha(YYYY-MM-DD), presente(bool), nota?}
  - Activar sesión: {grupo(id), fecha}
  - Registrar pago: {alumno(id), fecha_pago, numero_referencia, tipo_transaccion, banco_emisor?, captura_comprobante?}
- Outputs: JSON representando recursos, códigos HTTP 201/200/204 usados apropiadamente.
- Errores: 400 (validación), 401 (no autenticado), 403 (permiso), 404 (no encontrado), 409 (conflicto/duplicado cuando aplique).

## 3) Recursos API propuestos (ruta base: `/api/`)

- Autenticación
  - POST /api/token/ — obtener tokens (Simple JWT)
  - POST /api/token/refresh/ — refrescar token

- Usuarios
  - GET /api/users/
  - POST /api/users/ (staff)
  - GET/PATCH/PUT/DELETE /api/users/{id}/

- Grupos
  - GET /api/grupos/
  - GET /api/grupos/{id}/

- Asistencias
  - GET /api/asistencias/?fecha=...&grupo=...&alumno=...
  - POST /api/asistencias/  (crear)
  - PATCH /api/asistencias/{id}/  (actualizar presente/nota)
  - DELETE /api/asistencias/{id}/
  - (extra) POST /api/asistencias/bulk_create/ o bulk_toggle/

- SessionDay (activar/desactivar)
  - GET /api/session-days/?grupo=...
  - POST /api/session-days/  (crear registro)
  - POST /api/session-days/{id}/activate/  (action)
  - POST /api/session-days/{id}/deactivate/

- Pagos
  - GET /api/pagos/
  - POST /api/pagos/ (archivo upload aceptado)

- Reportes (descargas)
  - GET /api/reportes/asistencias/?grupo=...&semana=...&format=csv|xlsx

Notas:
- Muchos de los endpoints pueden implementarse como ModelViewSet con `@action` para comportamientos especiales (activar, desactivar, descargar).
- Mantener permisos: la mayoría requiere autenticación; acciones administrativas requieren is_staff o rol ADMINISTRADOR.

## 4) Pasos detallados (orden ejecutable)

1) Auditoría del código y modelos (completado)
   - Revisar modelos (ya hecho): `Usuario`, `Asistencia`, `Pago`, `Grupo`, `SessionDay`.

2) Añadir dependencias y configuración básica (PR 1)
   - Añadir a `requirements.txt`:
     - djangorestframework
     - djangorestframework-simplejwt
   - Actualizar `core/settings.py`:
     - Añadir `'rest_framework'` a `INSTALLED_APPS`.
     - Agregar bloque `REST_FRAMEWORK` con defaults (authentication, pagination, permission classes).
     - Agregar `SIMPLE_JWT` settings básicos (token lifetime, rotate refresh tokens si se quiere).
   - No forzar cambios en `allauth` ni en `AUTH_USER_MODEL`.

3) Crear serializers (PR 2)
   - `gestion/api/serializers.py` con Serializers para:
     - `UsuarioSerializer` (NO incluir password en read; crear endpoint separado para set_password)
     - `GrupoSerializer`
     - `AsistenciaSerializer` (validación unique_together)
     - `SessionDaySerializer`
     - `PagoSerializer` (manejar ImageField / upload)
   - Incluir validaciones: fecha no menor a date_joined (opcional), evitar duplicados de Asistencia.

4) Implementar viewsets y routers (PR 3)
   - `gestion/api/views.py`: ViewSets (ModelViewSet o ReadOnly) para cada modelo.
   - Registrar un `DefaultRouter()` en `core/urls.py` o crear `gestion/api/urls.py` y `include('gestion.api.urls')` en `core/urls.py` con prefijo `/api/`.
   - Mapear acciones custom con `@action` (detail=False o detail=True según convenga) para: activar sesión, desactivar, togglear asistencia, descargar reportes.

5) Configurar permisos y JWT (PR 4)
   - En `core/settings.py` ajustar `REST_FRAMEWORK`:
     - 'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework_simplejwt.authentication.JWTAuthentication',)
     - 'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',)
   - Añadir endpoints para token en `core/urls.py`:
     - from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
     - path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair')
     - path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh')
   - Considerar políticas de CORS/CSRF si se usan cookies.

6) Mantener compatibilidad con vistas HTMX
   - No eliminar vistas existentes. Proveer API endpoints que repliquen la lógica.
   - Migración incremental: reemplazar botones HTMX por llamadas fetch() que usen JWT (si se adopta) o mantener sesiones si el frontend continúa usando cookies.

7) Tests y validación (PR 5)
   - Tests para:
     - Autenticación JWT (obtain + refresh)
     - Crear Asistencia (happy path y duplicado -> 400/409)
     - Activar SessionDay (permissions)
   - Ejecutar `pytest`/`manage.py test` y arreglar fallos.

8) Documentación y ejemplos (PR 6)
   - Añadir sección en `README.md` o `docs/API.md` con ejemplos curl/JS para:
     - Obtener tokens
     - Usar token en header Authorization: Bearer <token>
     - Subir comprobante (multipart/form-data)

9) Mejoras opcionales
   - Page-filters (django-filter), throttling, paginación personalizada, búsquedas, permisos por rol más finos.

## 5) Validaciones / casos borde importantes

- Asistencia.unique_together: validar en serializer.create/update y devolver 400 con mensaje claro.
- Crear usuario con username duplicado: manejar en serializer.
- Subida de imagen grande: configurar `DATA_UPLOAD_MAX_MEMORY_SIZE` y manejar storage.
- Fechas fuera de rango (fecha > hoy?), usuarios inactivos, usuarios con date_joined posterior a la fecha de asistencia.
- Descargas grandes: usar streaming responses si dataset es grande.

## 6) Quality gates antes del merge

- Linter / Syntax: correr flake8 / pylint (si aplica) y corregir errores menores.
- Tests: añadir tests mínimos y asegurar que `manage.py test` pasa.
- Verificar no se rompen vistas existentes manualmente (smoke test de UI): loguearse y cargar `gestion/` página.

## 7) Comandos útiles y ejemplos (PowerShell)

Instalar dependencias localmente (no ejecutes esto automático sin revisar virtualenv):

```powershell
pip install djangorestframework djangorestframework-simplejwt
pip freeze > requirements.txt
```

Ejemplo: obtener token via curl (ejemplo, adaptarlo a PowerShell if needed):

```powershell
curl -X POST http://localhost:8000/api/token/ -d '{"username":"admin","password":"pass"}' -H "Content-Type: application/json"
```

Ejemplo JS fetch para usar token:

```js
fetch('/api/asistencias/', {
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json()).then(console.log)
```

## 8) Archivos a crear/editar (lista propuesta)

- `requirements.txt` — añadir drf y simplejwt
- `core/settings.py` — INSTALLED_APPS + REST_FRAMEWORK + SIMPLE_JWT
- `gestion/api/serializers.py` — serializers
- `gestion/api/views.py` — viewsets
- `gestion/api/urls.py` — router registration
- `core/urls.py` — incluir `gestion.api.urls` y rutas token
- `tests/test_api_auth.py`, `tests/test_asistencias.py` — tests básicos

## 9) Plan de PRs recomendado (pequeños y revisables)

PR 1: Dependencias + settings (pequeño, fácil revertir)
PR 2: Serializers
PR 3: Viewsets + routers básicos (read-only inicialmente)
PR 4: Actions (activar sesión, toggles, crear pago) + permissions
PR 5: Tests + docs

---

Si quieres, puedo ya:
- A) Aplicar PR 1 (añadir dependencias y settings) ahora.
- B) Crear de inmediato los serializers y viewsets mínimos (PR 2+3) en la misma tanda.

Elige A o B o dime si quieres que ajuste el plan antes de guardarlo.
