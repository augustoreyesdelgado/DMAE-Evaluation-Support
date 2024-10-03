document.querySelectorAll('.formulario-eliminar').forEach(function(form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault();
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
    });
  });