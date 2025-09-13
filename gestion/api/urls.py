from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet,
    GrupoViewSet,
    AsistenciaViewSet,
    SessionDayViewSet,
    PagoViewSet,
    UserStatsView,
)

router = DefaultRouter()
router.register(r"users", UsuarioViewSet, basename="user")
router.register(r"grupos", GrupoViewSet, basename="grupo")
router.register(r"asistencias", AsistenciaViewSet, basename="asistencia")
router.register(r"session-days", SessionDayViewSet, basename="sessionday")
router.register(r"pagos", PagoViewSet, basename="pago")

urlpatterns = router.urls

from django.urls import path

urlpatterns += [
    path('stats/users-count/', UserStatsView.as_view(), name='users-count'),
]
