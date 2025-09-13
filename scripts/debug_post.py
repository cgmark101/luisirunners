from django.test import Client
from gestion.models import Usuario
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile

# create users
staff = Usuario.objects.create_user(username='staff', password='staffpass', is_staff=True, is_superuser=True)
alumno = Usuario.objects.create_user(username='alumno', password='alumnopass', rol='ALUMNO')

c = Client()
# obtain token
tr = c.post('/api/token/', {'username':'staff', 'password':'staffpass'})
print('token status', tr.status_code, tr.content)

access = None
try:
    import json
    access = json.loads(tr.content).get('access')
except Exception as e:
    print('error parsing token response', e)

if access:
    c.defaults['HTTP_AUTHORIZATION'] = 'Bearer ' + access

# post without file
resp = c.post('/api/pagos/', {'alumno': alumno.id, 'fecha_pago': timezone.now().date().isoformat(), 'numero_referencia':'REFX1', 'tipo_transaccion':'EFECTIVO'}, content_type='application/json')
print('no-file status', resp.status_code, resp.content)

# post with file (multipart)
img = SimpleUploadedFile('test.jpg', b'filecontent', content_type='image/jpeg')
resp2 = c.post('/api/pagos/', {'alumno': alumno.id, 'fecha_pago': timezone.now().date().isoformat(), 'numero_referencia':'REFX2', 'tipo_transaccion':'EFECTIVO', 'captura_comprobante': img})
print('with-file status', resp2.status_code, resp2.content)

# print resp2.json if available
try:
    print('json:', resp2.json())
except Exception:
    pass
