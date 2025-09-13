from rest_framework.test import APIClient
from gestion.models import Usuario
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile

c = APIClient()
staff = Usuario.objects.create_user(username='staff', password='staffpass', is_staff=True, is_superuser=True)
alumno = Usuario.objects.create_user(username='alumno', password='alumnopass', rol='ALUMNO')

tr = c.post('/api/token/', {'username': 'staff', 'password': 'staffpass'}, format='json')
print('token status', tr.status_code)
print('token data:', getattr(tr, 'data', None))
print('token content:', tr.content[:500])

access = None
if tr.status_code == 200:
    access = tr.data.get('access')
    c.credentials(HTTP_AUTHORIZATION='Bearer ' + access)

# create pago without file
r1 = c.post('/api/pagos/', {'alumno': alumno.id, 'fecha_pago': timezone.now().date().isoformat(), 'numero_referencia': 'REFDBG1', 'tipo_transaccion': 'EFECTIVO'}, format='json')
print('r1 status', r1.status_code)
print('r1 data', getattr(r1, 'data', None))
print('r1 content:', r1.content[:1000])

# create pago with file
img = SimpleUploadedFile('test.jpg', b'filecontent', content_type='image/jpeg')
r2 = c.post('/api/pagos/', {'alumno': alumno.id, 'fecha_pago': timezone.now().date().isoformat(), 'numero_referencia': 'REFDBG2', 'tipo_transaccion': 'EFECTIVO', 'captura_comprobante': img}, format='multipart')
print('r2 status', r2.status_code)
print('r2 data', getattr(r2, 'data', None))
print('r2 content:', r2.content[:1000])
