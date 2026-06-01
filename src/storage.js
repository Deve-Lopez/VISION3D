import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xnyhvaksqrpwwzfsiohc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sHLL-mFL9fNj9J1U890hRw_v0OsDBnk";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LIMIT_50MB = 50 * 1024 * 1024;

export async function uploadToStorage(file) {
  // Si pesa más de 50MB, devolvemos URL local temporal (no se guarda en Supabase)
  if (file.size > LIMIT_50MB) {
    return { url: URL.createObjectURL(file), local: true };
  }

  const fileName = `${Date.now()}_${file.name}`;

  const { error } = await supabase.storage
    .from('models3d')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(`Error en Supabase: ${error.message}`);

  const { data: publicUrlData } = supabase.storage
    .from('models3d')
    .getPublicUrl(fileName);

  return { url: publicUrlData.publicUrl, local: false };
}

export async function listModelsFromStorage() {
  const { data, error } = await supabase.storage
    .from('models3d')
    .list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) throw new Error(`Error al listar Supabase: ${error.message}`);

  return data
    .filter(file => file.name !== '.emptyFolderPlaceholder')
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
        ext,
      };
    });
}