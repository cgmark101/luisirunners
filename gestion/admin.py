from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from . import models

class CustomUserAdmin(UserAdmin):
    list_display = ("nombre_completo", "rol", "grupo", "is_active", "exento_pago")
    list_filter = ("rol", "is_active", "exento_pago")
    search_fields = ("username", "first_name", "last_name")
    fieldsets = (
        *UserAdmin.fieldsets,
        ("Información adicional", {"fields": ("rol", "grupo", "inactivo_desde", "uuid", "exento_pago")} ),
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
    change_list_template = "admin/pagos_change_list.html"

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        my_urls = [
            path('download_monthly_report/', self.admin_site.admin_view(self.download_monthly_report), name='pagos_download_monthly_report'),
        ]
        return my_urls + urls

    def download_monthly_report(self, request):
        """Admin view: download CSV of pagos filtered by month and year from GET params."""
        import csv
        from django.http import HttpResponse
        from datetime import datetime

        month = request.GET.get('month')
        year = request.GET.get('year')
        try:
            if not month or not year:
                raise ValueError('month and year required')
            month_i = int(month)
            year_i = int(year)
            if not (1 <= month_i <= 12):
                raise ValueError('month out of range')
        except Exception as e:
            # render a simple page with the error and the selector form
            ctx = {'message': f'Parámetros inválidos: {e}'}
            from django.shortcuts import render
            return render(request, 'admin/pagos_download_error.html', ctx)

        qs = models.Pago.objects.filter(fecha_pago__year=year_i, fecha_pago__month=month_i).select_related('alumno')

        filename = f"pagos_{year_i}_{month_i:02d}.csv"
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        writer = csv.writer(response)
        writer.writerow(['alumno_username', 'alumno_nombre', 'fecha_pago', 'numero_referencia', 'tipo_transaccion', 'banco_emisor'])
        for p in qs:
            writer.writerow([
                p.alumno.username,
                (p.alumno.get_full_name() or f"{p.alumno.first_name} {p.alumno.last_name}"),
                p.fecha_pago.isoformat(),
                p.numero_referencia,
                p.tipo_transaccion,
                p.banco_emisor or '',
            ])
        return response

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
    