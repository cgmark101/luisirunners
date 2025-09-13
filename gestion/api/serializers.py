from rest_framework import serializers
from gestion.models import Usuario, Grupo, Asistencia, SessionDay, Pago


class GrupoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grupo
        fields = ["id", "nombre", "descripcion"]


class UsuarioSerializer(serializers.ModelSerializer):
    grupo = serializers.PrimaryKeyRelatedField(queryset=Grupo.objects.all(), allow_null=True)

    class Meta:
        model = Usuario
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "rol",
            "grupo",
            "uuid",
            "exento_pago",
            "inactivo_desde",
            "is_active",
        ]
        read_only_fields = ["uuid"]


class AsistenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asistencia
        fields = ["id", "alumno", "fecha", "presente", "nota"]

    def create(self, validated_data):
        alumno = validated_data.get("alumno")
        fecha = validated_data.get("fecha")
        # Prevent duplicate asistencia for same alumno+fecha
        if Asistencia.objects.filter(alumno=alumno, fecha=fecha).exists():
            raise serializers.ValidationError("Asistencia ya existe para este alumno y fecha")
        return super().create(validated_data)


class SessionDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionDay
        fields = ["id", "grupo", "fecha", "active"]


class PagoSerializer(serializers.ModelSerializer):
    captura_comprobante = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Pago
        fields = [
            "id",
            "alumno",
            "fecha_pago",
            "numero_referencia",
            "banco_emisor",
            "tipo_transaccion",
            "captura_comprobante",
        ]
