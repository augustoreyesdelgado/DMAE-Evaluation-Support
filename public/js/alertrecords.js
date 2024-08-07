// Función para verificar si al menos un radio button está seleccionado
function validarSeleccionRadio(formularioId) {
    var radios = document.querySelectorAll('input[type="radio"][id="idP"]');
    var radioSeleccionado = false;

    radios.forEach(function(radio) {
        if (radio.checked) {
        radioSeleccionado = true;
        }
    });

    if (!radioSeleccionado) {
            Swal.fire({
            title: 'No ha seleccionado un paciente.',
            text: "Seleccione un paciente.",
            icon: 'warning',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Continuar'
        });
        event.preventDefault();
        return false; // Evitar el envío del formulario si no se seleccionó ningún radio button
    }

    return true; // Permitir el envío del formulario si al menos un radio button está seleccionado
    }

    // Asignar el evento submit a los formularios para que se ejecute la función de validación antes del envío
    document.getElementById('formularioimprimir').addEventListener('submit', function(event) {
    return validarSeleccionRadio('formulario-e');
    });
    document.getElementById('formularioeliminar').addEventListener('submit', function(event) {
        event.preventDefault();
        if (validarSeleccionRadio()){
        Swal.fire({
            title: '¿Estás seguro?',
            html: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Si el usuario confirma, proceder con el envío del formulario
                event.target.submit();
            }
        });
        }
    });