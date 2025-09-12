from django.urls import path, re_path
from . import views

urlpatterns = [
    path("", views.index, name="portal_index"),
    path("asistencias/grupos", views.view_groups, name="ver_grupos"),
    path("asistencias/download/<int:grupo>/", views.download_attendance_summary, name="download_asistencias"),
    path("asistencias/download/<int:grupo>/semana/<str:semana>/", views.download_weekly_attendance_summary, name="download_asistencias_semana"),
    path("asistencias/download/<int:grupo>/<str:fecha>/", views.download_daily_attendance_summary, name="download_asistencias_diaria"),
    path("asistencias/general/<int:grupo>", views.general_table, name="tabla_general"),
    path("asistencias/semana/<int:grupo>/<str:semana>", views.weekly_table, name="tabla_semanal"),
    re_path(r"^asistencias/(?P<grupo>[\w-]+)/(?P<fecha>[\w-]+)/$", views.daily_attendance, name="asistencia_diaria"),    
    path("asistencia/htmx/create/<int:pk>/", views.htmx_create_asistencia, name="htmx_create_asistencia"),
    path("asistencia/htmx/update/<int:pk>/", views.htmx_update_asistencia, name="htmx_update_asistencia"),
    path("asistencia/htmx/delete/<int:pk>/", views.htmx_delete_asistencia, name="htmx_delete_asistencia"),
    path("asistencia/htmx/activate_session_day/", views.activate_session_day, name="activate_session_day"),
    path("asistencia/htmx/deactivate_session_day/", views.deactivate_session_day, name="deactivate_session_day"),
    path("pagos/", views.registrar_pago, name="registrar_pago"),
    path("pagos/atletas/", views.atletas, name="atletas_list"),
    path("pagos/atletas/edit/<int:pk>/", views.atletas_edit, name="atletas_edit"),
    path("pagos/atletas/row/<int:pk>/", views.atletas_row, name="atletas_row"),
]
