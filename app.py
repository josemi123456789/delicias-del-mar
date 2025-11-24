from flask import Flask, render_template, request, jsonify
from flask_mail import Mail, Message
from db import obtener_todo_el_menu, obtener_plato_por_id  # Importamos la base de datos

app = Flask(__name__)

# --- CONFIGURACIÓN DE GMAIL ---
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'messicevallos21@gmail.com' 
app.config['MAIL_PASSWORD'] = 'etin owso xbst bnhx'

mail = Mail(app)

# --- RUTAS DE LA WEB ---

@app.route("/")
def home():
    # 1. Pedimos la lista real a Supabase
    menu_real = obtener_todo_el_menu()
    
    busqueda = request.args.get('q')
    if busqueda:
        # Filtramos si hay búsqueda
        platos_filtrados = [
            p for p in menu_real 
            if busqueda.lower() in p['nombre'].lower() or busqueda.lower() in p['descripcion'].lower()
        ]
        return render_template("index.html", menu=platos_filtrados, cat_actual="todos", busqueda=busqueda)
    
    return render_template("index.html", menu=menu_real, cat_actual="todos")

@app.route("/categoria/<string:nombre_cat>")
def filtrar(nombre_cat):
    # Pedimos todo y filtramos por categoría
    menu_real = obtener_todo_el_menu()
    platos_filtrados = [plato for plato in menu_real if plato["categoria"] == nombre_cat]
    return render_template("index.html", menu=platos_filtrados, cat_actual=nombre_cat)

@app.route("/plato/<int:id_plato>")
def detalle(id_plato):
    # Pedimos el plato específico a Supabase
    plato_seleccionado = obtener_plato_por_id(id_plato)
    
    if plato_seleccionado:
        return render_template("detalle.html", plato=plato_seleccionado)
    return "Plato no encontrado", 404

# --- RUTAS DE CORREO ---

@app.route("/enviar_factura", methods=['POST'])
def enviar_factura():
    datos = request.json
    email_cliente = datos.get('email')
    total_pago = datos.get('total')
    items = datos.get('items')

    # Crear el correo
    cuerpo = f"""
    Hola, gracias por tu compra en Delicias del Mar.
    
    Resumen de tu pedido:
    -----------------------------------
    """
    for item in items:
        cuerpo += f"- {item['nombre']} (${item['precio']})\n"
    
    cuerpo += f"""
    -----------------------------------
    TOTAL PAGADO: ${total_pago}
    
    ¡Gracias por preferirnos!
    """

    try:
        # Enviamos desde TU correo hacia el correo del CLIENTE
        msg = Message("Tu Factura - Delicias del Mar",
                      sender=app.config['MAIL_USERNAME'],
                      recipients=[email_cliente])
        msg.body = cuerpo
        mail.send(msg)
        return jsonify({"mensaje": "Correo enviado", "status": "success"})
    except Exception as e:
        print("Error enviando correo:", e) 
        return jsonify({"mensaje": str(e), "status": "error"})

@app.route("/enviar_reserva", methods=['POST'])
def enviar_reserva():
    datos = request.json
    email = datos.get('email')
    nombre = datos.get('nombre')
    fecha = datos.get('fecha')
    hora = datos.get('hora')
    personas = datos.get('personas')

    cuerpo = f"""
    Hola {nombre},
    
    Tu reserva en Delicias del Mar está CONFIRMADA.
    
    📅 Fecha: {fecha}
    ⏰ Hora: {hora}
    👥 Personas: {personas}
    
    Te esperamos en Puebloviejo. 
    Si deseas cancelar, contáctanos por WhatsApp.
    """

    try:
        msg = Message("Confirmación de Reserva - Delicias del Mar",
                      sender=app.config['MAIL_USERNAME'],
                      recipients=[email])
        msg.body = cuerpo
        mail.send(msg)
        return jsonify({"mensaje": "Reserva enviada", "status": "success"})
    except Exception as e:
        print("Error enviando reserva:", e)
        return jsonify({"mensaje": str(e), "status": "error"})

if __name__ == "__main__":
    app.run(debug=True)