from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from gestion.models import Usuario, Grupo, Asistencia, SessionDay, Pago
from .serializers import (
    UsuarioSerializer,
    GrupoSerializer,
    AsistenciaSerializer,
    SessionDaySerializer,
    PagoSerializer,
)
from drf_spectacular.utils import extend_schema



@extend_schema(tags=["Usuarios"])
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by("id")
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # Creation of users is allowed only to staff
        if self.action == "create":
            return [permissions.IsAdminUser()]
        return super().get_permissions()


@extend_schema(tags=["Grupos"])
class GrupoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Grupo.objects.all().order_by("nombre")
    serializer_class = GrupoSerializer
    permission_classes = [permissions.IsAuthenticated]


@extend_schema(tags=["Asistencias"])
class AsistenciaViewSet(viewsets.ModelViewSet):
    queryset = Asistencia.objects.all().order_by("-fecha")
    serializer_class = AsistenciaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        alumno = serializer.validated_data.get("alumno")
        fecha = serializer.validated_data.get("fecha")
        if Asistencia.objects.filter(alumno=alumno, fecha=fecha).exists():
            return Response({"detail": "Asistencia ya existe"}, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


@extend_schema(tags=["SessionDays"])
class SessionDayViewSet(viewsets.ModelViewSet):
    queryset = SessionDay.objects.all().order_by("-fecha")
    serializer_class = SessionDaySerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def activate(self, request, pk=None):
        sd = self.get_object()
        sd.active = True
        sd.save()
        return Response(self.get_serializer(sd).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def deactivate(self, request, pk=None):
        sd = self.get_object()
        sd.active = False
        sd.save()
        return Response(self.get_serializer(sd).data)


@extend_schema(tags=["Pagos"])
class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pago.objects.all().order_by("-fecha_pago")
    serializer_class = PagoSerializer
    permission_classes = [permissions.IsAuthenticated]
