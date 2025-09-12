from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.contrib.auth.models import Group, Permission

import uuid



class Grupo(models.Model):
    """
    Grupo de entrenamiento al que pertenece el usuario.
    """

    nombre = models.CharField("Nombre del grupo", max_length=100, unique=True)
    descripcion = models.TextField("Descripción del grupo", blank=True)

    class Meta:
        verbose_name = "Grupo"
        verbose_name_plural = "Grupos"

    def __str__(self):
        return self.nombre


class Usuario(AbstractUser):
    """
    Modelo de usuario extendido.
    """

    # Override inherited fields to avoid reverse accessor clashes
    groups = models.ManyToManyField(
        Group,
        related_name="usuarios",
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="usuarios_permissions",
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )
    grupo = models.ForeignKey(
        Grupo, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Grupo"
    )
    uuid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True, verbose_name="UUID"
    )
    rol = models.CharField(
        max_length=20,
        choices=[
            ("ALUMNO", "Alumno"),
            ("ENTRENADOR", "Entrenador"),
            ("ASISTENTE", "Asistente"),
            ("ADMINISTRADOR", "Administrador"),
        ],
        default="ALUMNO",
        verbose_name="Rol",
    )
    exento_pago = models.BooleanField("Exento de pago", default=False)
    inactivo_desde = models.DateField("Inactivo Desde", null=True, blank=True)

    def save(self, *args, **kwargs):
        from django.utils import timezone
        if self.pk:
            old = Usuario.objects.filter(pk=self.pk).first()
            if old:
                if old.is_active and not self.is_active and not self.inactivo_desde:
                    self.inactivo_desde = timezone.now().date()
                elif not old.is_active and self.is_active:
                    self.inactivo_desde = None
        super().save(*args, **kwargs)

    def nombre_completo(self):
        return f"{self.first_name} {self.last_name}"


class Asistencia(models.Model):
    """
    Registro de asistencia vinculado al Usuario (alumno).
    """

    alumno = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="asistencias"
    )
    fecha = models.DateField("Fecha de la sesión")
    presente = models.BooleanField("Asistió", default=False)
    
    nota = models.CharField("Comentario / Nota", max_length=200, blank=True)

    class Meta:
        verbose_name = "Registro de Asistencia"
        verbose_name_plural = "Registros de Asistencia"
        unique_together = ("alumno", "fecha")
        ordering = ["fecha", "alumno"]

    def __str__(self):
        estado = "✓" if self.presente else "✗"
        return f"{self.fecha:%d/%m/%Y} – {self.alumno}: {estado}"


class SessionDay(models.Model):
    """
    Representa si una sesión de entrenamiento de un grupo en una fecha está activada.
    Solo las sesiones activadas se considerarán en los reportes.
    """

    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name="session_days")
    fecha = models.DateField("Fecha de sesión")
    active = models.BooleanField("Activa", default=False)

    class Meta:
        unique_together = ("grupo", "fecha")
        verbose_name = "Día de sesión"
        verbose_name_plural = "Días de sesión"

    def __str__(self):
        return f"{self.grupo} - {self.fecha:%d/%m/%Y} - {'Activa' if self.active else 'Inactiva'}"


class Pago(models.Model):
    """
    Registro de pago mensual del club de atletismo.
    """

    BANCOS_CHOICES = [
        ("0001", "0001 - Banco Central de Venezuela"),
        ("0102", "0102 - Banco de Venezuela, S.A. Banco Universal"),
        ("0104", "0104 - Banco Venezolano de Crédito, S.A. Banco Universal"),
        ("0105", "0105 - Banco Mercantil C.A., Banco Universal"),
        ("0108", "0108 - Banco Provincial, S.A. Banco Universal"),
        ("0114", "0114 - Banco del Caribe C.A., Banco Universal"),
        ("0115", "0115 - Banco Exterior C.A., Banco Universal"),
        ("0128", "0128 - Banco Caroní C.A., Banco Universal"),
        ("0134", "0134 - Banesco Banco Universal, C.A."),
        ("0137", "0137 - Banco Sofitasa Banco Universal, C.A."),
        ("0138", "0138 - Banco Plaza, Banco Universal"),
        ("0146", "0146 - Banco de la Gente Emprendedora C.A."),
        ("0151", "0151 - Banco Fondo Común, C.A Banco Universal"),
        ("0156", "0156 - 100% Banco, Banco Comercial, C.A"),
        ("0157", "0157 - DelSur, Banco Universal C.A."),
        ("0163", "0163 - Banco del Tesoro C.A., Banco Universal"),
        ("0166", "0166 - Banco Agrícola de Venezuela C.A., Banco Universal"),
        ("0168", "0168 - Bancrecer S.A., Banco Microfinanciero"),
        ("0169", "0169 - Mi Banco, Banco Microfinanciero, C.A."),
        ("0171", "0171 - Banco Activo C.A., Banco Universal"),
        ("0172", "0172 - Bancamiga Banco Universal, C.A."),
        ("0173", "0173 - Banco Internacional de Desarrollo C.A., Banco Universal"),
        ("0174", "0174 - Banplus Banco Universal, C.A."),
        ("0175", "0175 - Banco Bicentenario del Pueblo, Banco Universal C.A."),
        ("0177", "0177 - Banco de la Fuerza Armada Nacional Bolivariana, B.U."),
        ("0178", "0178 - N58 Banco Digital, Banco Microfinanciero"),
        ("0191", "0191 - Banco Nacional de Crédito C.A., Banco Universal"),
        ("0601", "0601 - Instituto Municipal de Crédito Popular"),
    ]

    TIPO_CHOICES = [
        ("PAGO_MOVIL", "Pago Móvil"),
        ("TRANSFERENCIA", "Transferencia Bancaria"),
        ("DEPOSITO", "Depósito Bancario"),
        ("EFECTIVO", "Efectivo"),
        ("ZELLE", "Zelle"),
        ("BINANCE", "Binance"),
        ("PAYPAL", "PayPal"),
        ("OTRO", "Otro"),
    ]

    alumno = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pagos"
    )
    fecha_pago = models.DateField(
        "Fecha de pago", help_text="Fecha en que se realizó el pago"
    )
    numero_referencia = models.CharField(
        "Número de referencia",
        max_length=20,
        unique=True,
        help_text="Identificador único de la transacción",
    )
    banco_emisor = models.CharField(
        "Banco emisor", max_length=4, choices=BANCOS_CHOICES, blank=True, null=True
    )
    tipo_transaccion = models.CharField(
        "Tipo de transacción",
        max_length=20,
        choices=TIPO_CHOICES,
        default="PAGO_MOVIL",
        help_text="Método usado para el pago",
    )

    captura_comprobante = models.ImageField(
        "Comprobante (opcional)",
        upload_to="comprobantes/%Y/%m/",
        null=True,
        blank=True,
        help_text="Sube una captura o foto de la transacción",
    )

    class Meta:
        verbose_name = "Pago"
        verbose_name_plural = "Pagos"
        ordering = ["-fecha_pago", "alumno"]

    def __str__(self):
        return f"{self.alumno.get_full_name()} – {self.fecha_pago:%d/%m/%Y}"
