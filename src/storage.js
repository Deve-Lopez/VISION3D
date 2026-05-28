import { createClient } from '@supabase/supabase-js';

// 1. REEMPLAZA ESTOS DOS VALORES CON LOS DE TU PROYECTO
// Los encuentras en Supabase: Project Settings (engranaje) -> API

const SUPABASE_URL = "https://xnyhvaksqrpwwzfsiohc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sHLL-mFL9fNj9J1U890hRw_v0OsDBnk";

// Inicializamos el cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function uploadToStorage(file) {
  // Creamos un nombre único para el archivo combinando la fecha actual y su nombre original
  const fileName = `${Date.now()}_${file.name}`;
  
  // 2. Subimos el archivo al bucket 'models3d' que creamos en el panel
  const { data, error } = await supabase.storage
    .from('models3d')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  // Si Supabase devuelve un error (por ejemplo, si pasa de 50MB), lo capturamos aquí
  if (error) {
    throw new Error(`Error en Supabase: ${error.message}`);
  }

  // 3. Si todo sale bien, generamos la URL pública para tu visor 3D
  const { data: publicUrlData } = supabase.storage
    .from('models3d')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

// ── NUEVA FUNCIÓN: TRAER LOS MODELOS GUARDADOS ──
export async function listModelsFromStorage() {
  const { data, error } = await supabase.storage
    .from('models3d')
    .list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' } // Trae los más nuevos primero
    });

  if (error) {
    throw new Error(`Error al listar Supabase: ${error.message}`);
  }

  // Mapeamos los archivos para limpiar el nombre y construir su URL pública
  return data
  .filter(file => file.name !== '.emptyFolderPlaceholder') // ← añade esto
  .map(file => {
    const { data: publicUrlData } = supabase.storage
      .from('models3d')
      .getPublicUrl(file.name);

    const ext = file.name.split('.').pop().toLowerCase();
    
    const cleanName = file.name.includes('_') 
      ? file.name.split('_').slice(1).join('_') 
      : file.name;

    return {
      id: file.id,
      name: cleanName,
      url: publicUrlData.publicUrl,
      ext: ext
    };
  });
}