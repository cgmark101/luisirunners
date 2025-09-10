from django.forms import ModelForm, Select
from .models import Pago, Usuario

class PagoForm(ModelForm):
    class Meta:
        model = Pago
        fields = ['alumno', 'fecha_pago', 'numero_referencia', 'tipo_transaccion', 'banco_emisor']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['alumno'].queryset = Usuario.objects.filter(rol="ALUMNO")
        for name, field in self.fields.items():
            if isinstance(field.widget, Select):
                field.widget.attrs.update({'class': 'form-select'})
            else:
                field.widget.attrs.update({'class': 'form-control'})
            if name == 'alumno':
                field.label_from_instance = lambda obj: f"{obj.first_name} {obj.last_name}"
