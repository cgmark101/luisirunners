from django.forms import ModelForm, Select
from .models import Pago, Usuario

class PagoForm(ModelForm):
    class Meta:
        model = Pago
        fields = ['alumno', 'fecha_pago', 'numero_referencia', 'tipo_transaccion', 'banco_emisor']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['alumno'].queryset = Usuario.objects.filter(rol="ALUMNO") # type: ignore
        # make banco_emisor have a blank default option so user must pick explicitly
        if 'banco_emisor' in self.fields:
            choices = list(self.fields['banco_emisor'].choices)
            # insert blank option at start if not present
            if choices and choices[0][0] != '':
                choices.insert(0, ('', '--- Selecciona banco ---'))
                self.fields['banco_emisor'].choices = choices
        # make tipo_transaccion require explicit selection (no preset default)
        if 'tipo_transaccion' in self.fields:
            tchoices = list(self.fields['tipo_transaccion'].choices)
            if tchoices and tchoices[0][0] != '':
                tchoices.insert(0, ('', '--- Selecciona tipo de transacción ---'))
                self.fields['tipo_transaccion'].choices = tchoices
            # ensure the field starts empty so the user must pick
            self.fields['tipo_transaccion'].initial = ''
        for name, field in self.fields.items():
            if isinstance(field.widget, Select):
                # ensure selects are full-width and responsive on mobile
                existing = field.widget.attrs.get('class', '')
                classes = (existing + ' form-select w-100').strip()
                field.widget.attrs.update({'class': classes, 'style': 'max-width:100%;'})
            else:
                field.widget.attrs.update({'class': 'form-control'})
            # ensure fecha_pago has a predictable id for JS initialization
            if name == 'fecha_pago':
                field.widget.attrs.update({'id': 'fecha_pago_input', 'autocomplete': 'off'})
            if name == 'alumno':
                field.label_from_instance = lambda obj: f"{obj.first_name} {obj.last_name}" # type: ignore

    def clean(self):
        cleaned = super().clean()
        tipo = cleaned.get('tipo_transaccion')
        banco = cleaned.get('banco_emisor')
        if tipo == 'PAGO_MOVIL':
            if not banco:
                self.add_error('banco_emisor', 'El banco emisor es obligatorio para Pago Móvil.')
        return cleaned
