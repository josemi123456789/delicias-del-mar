document.addEventListener('DOMContentLoaded', function() {
    // Carrusel
    const slides = document.querySelectorAll('.carousel-slide');
    let currentSlide = 0;
    if (slides.length > 0) {
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 5000);
    }
    
    actualizarContador();

    // ==========================================================
    // LÓGICA DE RESERVA (CORREO + WHATSAPP)
    // ==========================================================
    const formReserva = document.getElementById('formReserva');
    if(formReserva) {
        formReserva.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 1. Capturar datos
            const nombre = document.getElementById('res_nombre').value;
            const email = document.getElementById('res_email').value;
            const fecha = document.getElementById('res_fecha').value;
            const hora = document.getElementById('res_hora').value;
            const personas = document.getElementById('res_personas').value;
            const btn = formReserva.querySelector('button');

            // Validar correo
            if(!email.includes('@')) {
                alert("Escribe un correo válido");
                return;
            }

            btn.innerText = "Enviando...";
            btn.disabled = true;

            // 2. Enviar correo (Python)
            fetch('/enviar_reserva', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, fecha, hora, personas }),
            })
            .then(response => response.json())
            .then(data => {
                console.log("Correo reserva:", data);

                // 3. Abrir WhatsApp
                const telefono = "593989884016"; // TU NÚMERO
                const mensaje = `Hola, quiero reservar:%0A👤 Nombre: ${nombre}%0A📧 Correo: ${email}%0A📅 Fecha: ${fecha}%0A⏰ Hora: ${hora}%0A👥 Personas: ${personas}`;
                
                window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
                
                alert(`¡Reserva lista! Hemos enviado la confirmación a ${email}`);
                formReserva.reset();
                btn.innerText = "Reservar";
                btn.disabled = false;
            })
            .catch(error => {
                console.error("Error:", error);
                // Si falla el correo, abrir WhatsApp de todas formas
                const telefono = "593989884016";
                const mensaje = `Hola, quiero reservar (Falló correo):%0A👤 Nombre: ${nombre}%0A📅 Fecha: ${fecha}`;
                window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
                btn.disabled = false;
            });
        });
    }
});

// ... (El resto del código del carrito y pagos se mantiene igual) ...

let carrito = JSON.parse(localStorage.getItem('miCarrito')) || [];

function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre: nombre, precio: parseFloat(precio) });
    localStorage.setItem('miCarrito', JSON.stringify(carrito));
    actualizarContador();
    alert(`¡${nombre} agregado!`);
}

function actualizarContador() {
    const contador = document.getElementById('cart-count');
    if(contador) contador.innerText = carrito.length;
}

function abrirModalCarrito() {
    const modal = document.getElementById('modalPago');
    const tbody = document.getElementById('tabla-carrito-body');
    const totalSpan = document.getElementById('total-carrito');
    const msgVacio = document.getElementById('carrito-vacio-msg');
    const opcionesPago = document.getElementById('opciones-pago');

    tbody.innerHTML = "";
    let total = 0;

    if (carrito.length === 0) {
        msgVacio.style.display = 'block';
        opcionesPago.style.display = 'none';
        totalSpan.innerText = "0.00";
    } else {
        msgVacio.style.display = 'none';
        opcionesPago.style.display = 'block';

        carrito.forEach((prod, index) => {
            total += prod.precio;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 10px;">${prod.nombre}</td>
                <td style="padding: 10px;">$${prod.precio.toFixed(2)}</td>
                <td style="padding: 10px; text-align: right;">
                    <button onclick="eliminarDelCarrito(${index})" style="color:red; border:none; background:none; cursor:pointer;">X</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        totalSpan.innerText = total.toFixed(2);
    }
    modal.style.display = 'flex';
    document.getElementById('mensaje-exito').style.display = 'none';
    if(carrito.length > 0) {
        document.querySelector('.tabs').style.display = 'flex';
        document.getElementById('tab-tarjeta').style.display = 'block';
        document.getElementById('tab-whatsapp').style.display = 'none';
    }
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    localStorage.setItem('miCarrito', JSON.stringify(carrito));
    actualizarContador();
    abrirModalCarrito();
}

function enviarPedidoWhatsApp() {
    const telefono = "593989884016"; 
    let mensaje = "Hola, pedido web:%0A";
    let total = 0;
    carrito.forEach(prod => {
        mensaje += `- ${prod.nombre} ($${prod.precio.toFixed(2)})%0A`;
        total += prod.precio;
    });
    mensaje += `%0A*TOTAL: $${total.toFixed(2)}*`;
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
    cerrarModal();
}

function procesarPago(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button');
    const emailCliente = document.getElementById('pago_email').value;
    
    if(!emailCliente.includes('@')) {
        alert("Escribe un correo válido");
        return;
    }

    btn.innerText = "Procesando...";
    btn.disabled = true;

    const datosPedido = {
        email: emailCliente,
        total: document.getElementById('total-carrito').innerText,
        items: carrito
    };

    fetch('/enviar_factura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosPedido),
    })
    .then(response => response.json())
    .then(data => {
        const telefono = "593989884016";
        let mensajeWsp = `Hola, pagué mi pedido.%0A%0A📧 Factura a: ${emailCliente}%0A💰 Total: $${datosPedido.total}`;
        window.open(`https://wa.me/${telefono}?text=${mensajeWsp}`, '_blank');

        carrito = [];
        localStorage.setItem('miCarrito', JSON.stringify(carrito));
        actualizarContador();

        document.getElementById('formPagoTarjeta').style.display = 'none';
        document.getElementById('opciones-pago').style.display = 'none';
        document.querySelector('.total-section').style.display = 'none';
        document.getElementById('msg-factura-enviada').innerText = `Factura enviada a: ${emailCliente}`;
        document.getElementById('mensaje-exito').style.display = 'block';
        btn.disabled = false;
        btn.innerText = "Pagar";
    })
    .catch((error) => {
        console.error('Error:', error);
        alert("Error al enviar correo, contactando por WhatsApp...");
        const telefono = "593989884016";
        window.open(`https://wa.me/${telefono}?text=Error en pago web`, '_blank');
        btn.disabled = false;
    });
}

function cerrarModal() {
    document.getElementById('modalPago').style.display = 'none';
    document.querySelector('.total-section').style.display = 'block';
}

function cambiarTab(evt, tabName) {
    const contents = document.getElementsByClassName("tab-content");
    for (let c of contents) c.style.display = "none";
    const links = document.getElementsByClassName("tab-link");
    for (let l of links) l.classList.remove("active");
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

window.onclick = function(event) {
    const modal = document.getElementById('modalPago');
    if (event.target == modal) cerrarModal();
}