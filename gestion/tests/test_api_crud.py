from django.test import TestCase
from rest_framework.test import APIClient
from django.utils import timezone
from django.urls import reverse
from gestion.models import Usuario, Grupo, Asistencia, SessionDay
from django.core.files.uploadedfile import SimpleUploadedFile


class APICRUDTestCase(TestCase):
    def setUp(self):
        # admin/staff user
        self.staff = Usuario.objects.create_user(username="staff2", password="staffpass", is_staff=True, is_superuser=True)
        # normal alumno
        self.alumno = Usuario.objects.create_user(username="alumno2", password="alumnopass", rol="ALUMNO")
        # a grupo for relations
        self.grupo = Grupo.objects.create(nombre="G1", descripcion="Grupo 1")
        self.client = APIClient()

    def obtain_token(self, username, password):
        resp = self.client.post(reverse("token_obtain_pair"), {"username": username, "password": password}, format="json")
        return resp.data.get("access")

    def test_users_crud_and_permissions(self):
        url = "/api/users/"

        # unauthenticated list -> 401/403
        resp = self.client.get(url)
        self.assertIn(resp.status_code, (401, 403))

        # list as staff
        access = self.obtain_token("staff2", "staffpass")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)

        # create user as non-admin should be forbidden
        access_al = self.obtain_token("alumno2", "alumnopass")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_al}")
        resp = self.client.post(url, {"username": "newuser", "password": "pw"}, format="json")
        self.assertIn(resp.status_code, (401, 403))
        # create user as admin
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        # serializer does not accept password field, so API creation should return 400
        resp = self.client.post(url, {"username": "newuser", "password": "pw", "rol": "ALUMNO"}, format="json")
        self.assertEqual(resp.status_code, 400)

        # create the user via ORM for subsequent CRUD checks
        new = Usuario.objects.create_user(username="newuser", password="pw", rol="ALUMNO")
        uid = new.id

        # retrieve
        resp = self.client.get(f"{url}{uid}/")
        self.assertEqual(resp.status_code, 200)

        # update
        resp = self.client.patch(f"{url}{uid}/", {"first_name": "Test"}, format="json")
        self.assertEqual(resp.status_code, 200)

        # delete
        resp = self.client.delete(f"{url}{uid}/")
        self.assertIn(resp.status_code, (204, 200))

    def test_grupos_list_and_retrieve(self):
        url = "/api/grupos/"
        access = self.obtain_token("staff2", "staffpass")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        # retrieve
        gid = self.grupo.id
        resp = self.client.get(f"{url}{gid}/")
        self.assertEqual(resp.status_code, 200)

    def test_asistencia_full_crud(self):
        url = "/api/asistencias/"
        access = self.obtain_token("staff2", "staffpass")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        # create
        fecha = timezone.now().date().isoformat()
        resp = self.client.post(url, {"alumno": self.alumno.id, "fecha": fecha, "presente": True}, format="json")
        self.assertEqual(resp.status_code, 201)
        aid = resp.data.get("id")

        # list
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)

        # retrieve
        resp = self.client.get(f"{url}{aid}/")
        self.assertEqual(resp.status_code, 200)

        # update
        resp = self.client.patch(f"{url}{aid}/", {"presente": False}, format="json")
        self.assertEqual(resp.status_code, 200)

        # delete
        resp = self.client.delete(f"{url}{aid}/")
        self.assertIn(resp.status_code, (204, 200))

    def test_sessionday_crud_and_activate(self):
        url = "/api/session-days/"
        access = self.obtain_token("staff2", "staffpass")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        # create
        resp = self.client.post(url, {"grupo": self.grupo.id, "fecha": timezone.now().date().isoformat(), "active": False}, format="json")
        self.assertEqual(resp.status_code, 201)
        sid = resp.data.get("id")

        # activate (admin-only action)
        resp = self.client.post(f"{url}{sid}/activate/")
        self.assertEqual(resp.status_code, 200)

        # deactivate
        resp = self.client.post(f"{url}{sid}/deactivate/")
        self.assertEqual(resp.status_code, 200)

        # update
        resp = self.client.patch(f"{url}{sid}/", {"active": True}, format="json")
        self.assertEqual(resp.status_code, 200)

        # delete
        resp = self.client.delete(f"{url}{sid}/")
        self.assertIn(resp.status_code, (204, 200))

    def test_pago_crud_and_file_upload(self):
        url = "/api/pagos/"
        access = self.obtain_token("staff2", "staffpass")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        # create without file
        resp = self.client.post(url, {"alumno": self.alumno.id, "fecha_pago": timezone.now().date().isoformat(), "numero_referencia": "PR1", "tipo_transaccion": "EFECTIVO"}, format="json")
        self.assertEqual(resp.status_code, 201)
        pid = resp.data.get("id")

        # retrieve
        resp = self.client.get(f"{url}{pid}/")
        self.assertEqual(resp.status_code, 200)

        # update
        resp = self.client.patch(f"{url}{pid}/", {"numero_referencia": "PR1-UPDATED"}, format="json")
        self.assertEqual(resp.status_code, 200)

        # create with file upload using an actual PNG generated in-memory with Pillow
        from PIL import Image
        import io

        buf = io.BytesIO()
        Image.new("RGBA", (1, 1), (0, 0, 0, 0)).save(buf, format="PNG")
        buf.seek(0)
        img = SimpleUploadedFile("test2.png", buf.read(), content_type="image/png")
        resp2 = self.client.post(url, {"alumno": self.alumno.id, "fecha_pago": timezone.now().date().isoformat(), "numero_referencia": "PR2", "tipo_transaccion": "EFECTIVO", "captura_comprobante": img}, format="multipart")
        self.assertIn(resp2.status_code, (200, 201))

        # delete
        resp = self.client.delete(f"{url}{pid}/")
        self.assertIn(resp.status_code, (204, 200))
