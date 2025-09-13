from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from gestion.models import Usuario, Grupo, Asistencia
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile


class APITestCase(TestCase):
    def setUp(self):
        # create a staff user
        self.staff = Usuario.objects.create_user(username="staff", password="staffpass", is_staff=True, is_superuser=True)
        # create a normal alumno user
        self.alumno = Usuario.objects.create_user(username="alumno", password="alumnopass", rol="ALUMNO")
        self.client = APIClient()

    def test_jwt_token_obtain(self):
        url = reverse("token_obtain_pair")
        resp = self.client.post(url, {"username": "staff", "password": "staffpass"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access", resp.data) # type: ignore
        self.assertIn("refresh", resp.data)

    def test_create_asistencia_requires_auth_and_prevents_duplicates(self):
        url = "/api/asistencias/"

        # unauthenticated should be 401
        resp = self.client.post(url, {"alumno": self.alumno.id, "fecha": timezone.now().date().isoformat(), "presente": True}, format="json")
        self.assertIn(resp.status_code, (401, 403))

        # obtain token
        token_resp = self.client.post(reverse("token_obtain_pair"), {"username": "staff", "password": "staffpass"}, format="json")
        access = token_resp.data.get("access")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        # create asistencia
        fecha = timezone.now().date().isoformat()
        resp2 = self.client.post(url, {"alumno": self.alumno.id, "fecha": fecha, "presente": True}, format="json")
        self.assertEqual(resp2.status_code, 201)

        # duplicate attempt should return 400
        resp3 = self.client.post(url, {"alumno": self.alumno.id, "fecha": fecha, "presente": True}, format="json")
        self.assertEqual(resp3.status_code, 400)

    def test_create_pago_and_duplicate_reference(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        url = "/api/pagos/"

        # unauthenticated should be 401
        resp = self.client.post(url, {"alumno": self.alumno.id, "fecha_pago": timezone.now().date().isoformat(), "numero_referencia": "REF123"}, format="json")
        self.assertIn(resp.status_code, (401, 403))

        # authenticate as staff
        token_resp = self.client.post(reverse("token_obtain_pair"), {"username": "staff", "password": "staffpass"}, format="json")
        access = token_resp.data.get("access")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        # create pago without file
        resp2 = self.client.post(url, {"alumno": self.alumno.id, "fecha_pago": timezone.now().date().isoformat(), "numero_referencia": "REF123", "tipo_transaccion": "EFECTIVO"}, format="json")
        self.assertEqual(resp2.status_code, 201)

        # duplicate numero_referencia should fail (unique=True)
        resp3 = self.client.post(url, {"alumno": self.alumno.id, "fecha_pago": timezone.now().date().isoformat(), "numero_referencia": "REF123", "tipo_transaccion": "EFECTIVO"}, format="json")
        self.assertEqual(resp3.status_code, 400)
        
        # create with file upload using an actual PNG generated in-memory with Pillow
        from PIL import Image
        import io

        buf = io.BytesIO()
        Image.new("RGBA", (1, 1), (255, 0, 0, 0)).save(buf, format="PNG")
        buf.seek(0)
        img = SimpleUploadedFile("test2.png", buf.read(), content_type="image/png")
        resp4 = self.client.post(url, {"alumno": self.alumno.id, "fecha_pago": timezone.now().date().isoformat(), "numero_referencia": "REF124", "tipo_transaccion": "EFECTIVO", "captura_comprobante": img}, format="multipart")
        # Expect success when a valid image is sent
        self.assertIn(resp4.status_code, (200, 201))
