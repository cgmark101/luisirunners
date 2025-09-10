# LuisiRunners

## Descripción
LuisiRunners es una aplicación web desarrollada con Django para gestionar usuarios, asistencias y pagos en un club de atletismo. Incluye funcionalidades como registro de usuarios, control de asistencias diarias y semanales, y administración de pagos.

## Estructura del Proyecto
- **core/**: Configuración principal del proyecto Django.
- **gestion/**: Aplicación principal que contiene modelos, vistas, formularios y plantillas.
- **templates/**: Archivos HTML para la interfaz de usuario.
- **static/**: Archivos estáticos como CSS, JavaScript e imágenes.
- **media/**: Archivos subidos por los usuarios, como comprobantes de pago.

## Instalación
1. Clona el repositorio:
   ```bash
   git clone https://github.com/cgmark101/luisirunners
   cd luisirunner
   ```
2. Crea un entorno virtual:
   ```bash
   python -m venv .venv
   source env/bin/activate  # Linux/Mac
   . .venv\Scripts\activate     # Windows
   ```
3. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Configura las variables de entorno usando un archivo `.env`.

## Uso
1. Ejecuta las migraciones:
   ```bash
   python manage.py migrate account, admin, auth, contenttypes, sessions
   python manage.py migrate gestion
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   python manage.py runserver
   ```
3. Accede a la aplicación en [http://localhost:8000/](http://localhost:8000/).

## Funcionalidades
- **Gestión de Usuarios**: Registro y administración de usuarios con roles personalizados.
- **Control de Asistencias**: Registro de asistencias diarias y semanales.
- **Gestión de Pagos**: Registro y consulta de pagos realizados por los usuarios.

## Pruebas
Ejecuta las pruebas con:
```bash
python manage.py test
```

## Contribuciones
Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request con tus mejoras.

## Licencia
Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
```