Guía para consumir la API REST de Luisirunners desde un frontend moderno
=====================================================================

Resumen
-------
Esta guía explica cómo conectar un frontend (React, Vue, Next, Svelte, etc.) con la API REST implementada en este repositorio. Cubre: endpoints principales, autenticación JWT, manejo de tokens (refresh), subida de archivos (multipart/form-data), paginación, manejo de errores, ejemplos con axios y recomendaciones de seguridad y despliegue.

Base URL
--------
- Local (desarrollo): http://localhost:8000
- Endpoint base de la API: /api/

Endpoints principales
--------------------
- POST /api/token/  -> Obtener access y refresh tokens
- POST /api/token/refresh/ -> Renovar access
- /api/users/       -> CRUD usuarios (create restringido a admin)
- /api/grupos/      -> Read-only (list, retrieve)
- /api/asistencias/ -> CRUD asistencias (previene duplicados alumno+fecha)
- /api/session-days/-> CRUD session days (+ acciones activate/deactivate)
- /api/pagos/       -> CRUD pagos (captura_comprobante: ImageField opcional)

Formato de listados
-------------------
Los listados usan PageNumberPagination. Respuesta:

{
  "count": <total>,
  "next": "<url>",
  "previous": "<url>",
  "results": [ ... ]
}

Autenticación (JWT)
-------------------
- POST /api/token/ con body JSON: { "username": "...", "password": "..." }
- Respuesta: { "access": "<jwt>", "refresh": "<jwt_refresh>" }

Flujo recomendado:
1. Guardar `access` en memoria (o en Redux/Context), `refresh` preferiblemente en cookie httpOnly (si se implementa).
2. Adjuntar header Authorization: Bearer <access> en peticiones.
3. Si recibes 401, intentar renovar con POST /api/token/refresh/ enviando `{ refresh }`. Si falla, redirigir a login.

Ejemplo con axios (JavaScript)
------------------------------
Archivo: src/api.js

```js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE + "/api/",
  timeout: 15000,
});

let accessToken = null;
export function setAccessToken(token) { accessToken = token; }
export function getAccessToken() { return accessToken; }

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  resp => resp,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      isRefreshing = true;
      const refresh = localStorage.getItem("refresh_token");
      try {
        const r = await axios.post(`${API_BASE}/api/token/refresh/`, { refresh });
        const newAccess = r.data.access;
        setAccessToken(newAccess);
        processQueue(null, newAccess);
        isRefreshing = false;
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return axios(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

Login
-----
```js
import api, { setAccessToken } from './api';

export async function login(username, password) {
  const resp = await api.post('/token/', { username, password });
  const { access, refresh } = resp.data;
  setAccessToken(access);
  localStorage.setItem('refresh_token', refresh);
  return resp;
}
```

Subida de archivos (multipart)
-------------------------------
Para subir `captura_comprobante` (ImageField), usar FormData:

```js
const form = new FormData();
form.append('alumno', 123);
form.append('fecha_pago', '2025-09-12');
form.append('numero_referencia', 'REF123');
form.append('tipo_transaccion', 'EFECTIVO');
form.append('captura_comprobante', fileInput.files[0]);

const resp = await api.post('/pagos/', form, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

Manejo de errores comunes
-------------------------
- 400: Body con errores por campo. Mostrar errores al usuario.
- 401/403: renovar token o redirigir a login.
- 429: throttling; informar y sugerir reintento más tarde.
- 500: reporte y mensaje genérico.

Ejemplo parseo de errores DRF:
```js
function parseDRFErrors(resp) {
  if (!resp || !resp.data) return { non_field_errors: ['Error desconocido'] };
  return resp.data;
}
```

Tip: validación del lado cliente antes de upload (tipo y tamaño) evita roundtrips.

Tipos (TypeScript) sugeridos
---------------------------
```ts
export interface Usuario { id: number; username: string; first_name?: string; last_name?: string; email?: string; rol: string; grupo?: number | null; uuid: string; exento_pago: boolean; inactivo_desde?: string | null; is_active: boolean }
export interface Pago { id: number; alumno: number; fecha_pago: string; numero_referencia: string; banco_emisor?: string | null; tipo_transaccion: string; captura_comprobante?: string | null }
```

CORS y HTTPS
------------
- En producción habilitar CORS para los orígenes del frontend con `django-cors-headers`.
- Usar HTTPS y asegurar cookies (Session/CSRF) con flags `Secure` y `HttpOnly` cuando sea posible.

Checklist de integración
------------------------
1. Configurar API_BASE en frontend.
2. Implementar login y almacenamiento de tokens.
3. Interceptor para adjuntar Authorization y refresco automático.
4. Subida de archivos con FormData.
5. Parseo y display de errores 400.
6. Manejo de paginación.
7. Manejo de límites 429.

Archivos de ejemplo y herramientas
---------------------------------
- `src/api.js` (axios + refresh interceptor) — incluido arriba.
- Postman/Insomnia: crear colección con endpoints: /api/token/, /api/token/refresh/, /api/pagos/ (multipart).

Opciones adicionales (puedo añadir)
----------------------------------
- A) Crear `src/api.ts` y `src/components` de ejemplo en React + TypeScript.
- B) Generar una colección Postman JSON con ejemplos.
- C) Crear un esquema OpenAPI/Swagger básico (esqueleto) basado en serializers.

---

Ruta del archivo en el repo: `API_FRONTEND_GUIDE.md`

He marcado la tarea como completada en el TODO.

Dime si quieres que genere también la colección Postman o ejemplos de componentes React/TS y lo añado al repo.`