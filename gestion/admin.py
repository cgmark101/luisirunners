from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from . import models

class CustomUserAdmin(UserAdmin):
    list_display = ("nombre_completo", "rol", "grupo", "is_active")
    fieldsets = (
        *UserAdmin.fieldsets,
        ("Información adicional", {"fields": ("rol", "grupo", "inactivo_desde", "uuid",)}),
    )
    readonly_fields = getattr(UserAdmin, 'readonly_fields', ()) + ('uuid',)

admin.site.register(models.Usuario, CustomUserAdmin)

@admin.register(models.Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = ("alumno", "fecha", "presente", "nota")
    search_fields = ("alumno__username", "alumno__first_name", "alumno__last_name")
    list_filter = ("fecha", "presente")
    ordering = ("fecha", "alumno")
    list_per_page = 20
    fieldsets = (
        (None, {"fields": ("alumno", "fecha", "presente")}),
        ("Información adicional", {"fields": ("nota",)}),
    )


@admin.register(models.Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ("alumno", "fecha_pago", "numero_referencia", "banco_emisor")
    search_fields = ("alumno__username", "alumno__first_name", "alumno__last_name")
    list_filter = ("fecha_pago",)
    ordering = ("fecha_pago", "alumno")
    list_per_page = 20
    fieldsets = (
        (None, {"fields": ("alumno", "fecha_pago", "numero_referencia")}),
        ("Información adicional", {"fields": ("tipo_transaccion", "banco_emisor")}),
    )

@admin.register(models.Grupo)
class GrupoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "descripcion")
    search_fields = ("nombre", "descripcion")
    list_filter = ("nombre",)
    ordering = ("nombre",)
    list_per_page = 20
    fieldsets = (
        (None, {"fields": ("nombre", "descripcion")}),
    )
    