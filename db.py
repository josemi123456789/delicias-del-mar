from supabase import create_client, Client

# --- TUS CREDENCIALES DE SUPABASE ---
SUPABASE_URL = "https://roiolzyxmyhyolluvccn.supabase.co"
# Usamos la clave 'secret' que encontraste (funciona perfecta aquí)
SUPABASE_KEY = "sb_secret_zDscG82SjcvQK5ld7uJVDQ_06vzPog3"

# Conectamos
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print("Error conectando a Supabase:", e)

# --- FUNCIONES PARA PEDIR DATOS ---

def obtener_todo_el_menu():
    """Descarga todos los platos de tu tabla 'platos'"""
    try:
        # 'select *' significa traer todas las columnas
        response = supabase.table('platos').select("*").order('id').execute()
        return response.data
    except Exception as e:
        print("Error obteniendo menú:", e)
        return []

def obtener_plato_por_id(id_plato):
    """Busca un solo plato por su ID"""
    try:
        response = supabase.table('platos').select("*").eq('id', id_plato).execute()
        if len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error buscando plato {id_plato}:", e)
        return None