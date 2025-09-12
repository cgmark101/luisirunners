from django.forms import ModelForm, Select
from .models import Pago, Usuario

class PagoForm(ModelForm):
    class Meta:
        model = Pago
        fields = ['alumno', 'fecha_pago', 'numero_referencia', 'tipo_transaccion', 'banco_emisor']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['alumno'].queryset = Usuario.objects.filter(rol="ALUMNO") # type: ignore
        for name, field in self.fields.items():
            if isinstance(field.widget, Select):
                field.widget.attrs.update({'class': 'form-select'})
            else:
                field.widget.attrs.update({'class': 'form-control'})
            # ensure fecha_pago has a predictable id for JS initialization
            if name == 'fecha_pago':
                field.widget.attrs.update({'id': 'fecha_pago_input', 'autocomplete': 'off'})
            if name == 'alumno':
                field.label_from_instance = lambda obj: f"{obj.first_name} {obj.last_name}" # type: ignore
