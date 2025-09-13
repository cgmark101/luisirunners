from django.core.management.base import BaseCommand
from rest_framework.test import APIClient
from gestion.models import Usuario
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile


class Command(BaseCommand):
    help = "Debug API multipart upload responses"

    def handle(self, *args, **options):
        import uuid
        c = APIClient()
        # Ensure requests use a host allowed by ALLOWED_HOSTS (avoid Bad Request 400)
        # Django test client uses 'testserver' by default which is not in ALLOWED_HOSTS
        # in this project's settings (DEBUG=False). Force an allowed host.
        c.defaults["HTTP_HOST"] = "localhost"
        staff_username = f"staff_{uuid.uuid4().hex[:8]}"
        alumno_username = f"alumno_{uuid.uuid4().hex[:8]}"
        staff = Usuario.objects.create_user(username=staff_username, password='staffpass', is_staff=True, is_superuser=True)
        alumno = Usuario.objects.create_user(username=alumno_username, password='alumnopass', rol='ALUMNO')

        tr = c.post('/api/token/', {'username': staff_username, 'password': 'staffpass'}, format='json')
        self.stdout.write(f'token status: {tr.status_code} data: {getattr(tr, "data", None)}')
        access = None
        if getattr(tr, 'status_code', None) == 200:
            access = getattr(tr, 'data', {}).get('access')
            c.credentials(HTTP_AUTHORIZATION='Bearer ' + access)

        # create pago without file
        r1 = c.post('/api/pagos/', {'alumno': alumno.id, 'fecha_pago': timezone.now().date().isoformat(), 'numero_referencia': 'REFDBG1', 'tipo_transaccion': 'EFECTIVO'}, format='json')
        self.stdout.write(f'r1 status: {getattr(r1, "status_code", None)} data: {getattr(r1, "data", None)}')

        # create pago with file (use a minimal valid PNG to test ImageField acceptance)
        one_pixel_png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
            b"\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01\xe2!\xbc3\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        img = SimpleUploadedFile('test.png', one_pixel_png, content_type='image/png')
        r2 = c.post('/api/pagos/', {'alumno': alumno.id, 'fecha_pago': timezone.now().date().isoformat(), 'numero_referencia': 'REFDBG2', 'tipo_transaccion': 'EFECTIVO', 'captura_comprobante': img}, format='multipart')
        content = getattr(r2, 'content', b'')
        try:
            text = content.decode('utf-8')
        except Exception:
            text = str(content)
        self.stdout.write(f'r2 status: {getattr(r2, "status_code", None)} data: {getattr(r2, "data", None)} content: {text[:2000]}')
