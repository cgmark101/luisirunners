# Plan de servicios frontend para consumir la API

Objetivo
--------
Crear una carpeta `src/services` dentro de la carpeta `front` con servicios que abstraigan las llamadas HTTP a la API REST del backend (DRF + JWT). Los servicios se escribirán en TypeScript (si el proyecto `front` usa TS) o en JavaScript y retornarán contratos typed (interfaces) para facilitar su uso en componentes.

Estructura propuesta
--------------------
front/
- src/
  - services/
    - apiClient.ts         # instancia de axios con interceptores (baseURL, retry, refresh token)
    - auth.service.ts     # login, refresh, logout, guardar token
    - user.service.ts     # CRUD de usuarios
    - grupo.service.ts    # fetch grupos
    - asistencia.service.ts # CRUD asistencias
    - sessionDay.service.ts # CRUD session days + acciones activate/deactivate
    - pago.service.ts     # CRUD pagos + multipart upload
  - types/
    - api.d.ts            # interfaces para los recursos (Usuario, Grupo, Pago,...)
  - utils/
    - storage.ts         # helpers para localStorage/sessionStorage cookies

Contratos / contratos de las funciones (ejemplos)
-------------------------------------------------
- `auth.service.ts`
  - login(credentials: { username: string; password: string }): Promise<{ access: string; refresh: string }>
  - refresh(refreshToken: string): Promise<{ access: string }>
  - logout(): Promise<void>

- `user.service.ts`
  - listUsers(params?: { page?: number; page_size?: number }): Promise<PageResult<Usuario>>
  - getUser(id: number): Promise<Usuario>
  - createUser(data: CreateUserPayload): Promise<Usuario>
  - updateUser(id: number, data: Partial<CreateUserPayload>): Promise<Usuario>
  - deleteUser(id: number): Promise<void>

- `pago.service.ts`
  - listPagos(params?): Promise<PageResult<Pago>>
  - createPago(formData: FormData): Promise<Pago>  // multipart/form-data
  - updatePago(id: number, formData: FormData): Promise<Pago>
  - deletePago(id: number): Promise<void>

API Client
----------
`apiClient.ts` contendrá la instancia axios con:
- baseURL leída de variable de entorno (REACT_APP_API_URL / VITE_API_URL).
- Interceptor request: añade `Authorization: Bearer <access>` si existe.
- Interceptor response: si recibe 401 y el error es por token expirado puede intentar `refresh` automáticamente (usar un bloqueo para evitar múltiples refreshes en paralelo).
- Manejo de errores: normalizar errores para que los servicios devuelvan mensajes consistentes.

Seguridad y almacenamiento de tokens
-----------------------------------
- Preferible: guardar `refresh` en httpOnly cookie desde el backend. Si no es posible, guardar `access` en memoria y `refresh` en httpOnly cookie o al menos en memory+secure storage.
- En este plan asumimos que los tokens se almacenan en `localStorage` (configurable desde `storage.ts`). Documentar los riesgos.

Manejo de uploads (Pagos)
-------------------------
- `createPago` y `updatePago` deben enviar `FormData` con `captura_comprobante` como `File`.
- Ejemplo:
  ```ts
  const form = new FormData();
  form.append('alumno', String(alumnoId));
  form.append('fecha_pago', fecha);
  form.append('numero_referencia', numero);
  if (file) form.append('captura_comprobante', file);
  await api.post('/pagos/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  ```
- Validar tamaño y tipo de archivo en frontend antes de enviar.

Errores y edge cases
--------------------
- Duplicado `numero_referencia` → muestra el error específico devuelto por la API (campo `numero_referencia`).
- Archivos inválidos → validar mime-type y tamaño.
- Refresh token caducado → forzar logout y redirigir a login.
- Peticiones simultáneas: manejar queue para refresh token.

Tests unitarios (servicios)
---------------------------
- Mockear `axios` (jest + msw) para cada servicio.
- Tests sugeridos:
  - Auth: login success, login failure (400), refresh success, refresh failure→logout.
  - Pago: createPago con file → multipart body enviado.
  - CRUD básico de usuarios/asistencias: list, create, update, delete.

Plan de implementación (pasos)
------------------------------
1. Crear `src/services/apiClient.ts` con la instancia axios y configuraciones de interceptores.
2. Implementar `auth.service.ts` con storage y helpers.
3. Implementar `user.service.ts`, `grupo.service.ts`, `asistencia.service.ts`, `sessionDay.service.ts`.
4. Implementar `pago.service.ts` con manejo multipart.
5. Escribir `types/api.d.ts` con interfaces basadas en `openapi.yaml` (se puede generar automáticamente con herramientas como openapi-typescript).
6. Añadir tests unitarios con mocks de `axios`.
7. Integrar en la app: crear ejemplos de uso en `src/pages` o `src/components`.

Tareas opcionales/avanzadas
--------------------------
- Generar `types/api.d.ts` automáticamente usando `openapi-typescript` y consumirlos en los servicios.
- Usar React Query / SWR para caché y manejo de revalidación.
- Implementar refresh en backend con cookies httpOnly y CSRF.
- Crear un CLI script para generar servicios automáticamente desde `openapi.yaml` (por ejemplo openapi-generator o swagger-typescript-api).

Entrega
-------
He creado este plan en `front/SERVICES_PLAN.md`. Puedo ahora:
- Generar los archivos base (`apiClient.ts`, `auth.service.ts`, `types/api.d.ts` stub) dentro de `front/src/services` y `front/src/types`.
- O esperar tu ok y generar los servicios completos usando TypeScript + axios + tests.

Dime cómo quieres proceder (generar archivos base ahora o primero revisar plan).
