// ─────────────────────────────────────────────────────────────
//  Configuración de Cloudinary
//  1. Crea una cuenta gratuita en https://cloudinary.com
//  2. En tu dashboard, crea un "Upload Preset" de tipo "Unsigned"
//     (Settings → Upload → Upload presets → Add upload preset)
//  3. Copia tu Cloud Name y el nombre del preset aquí:
// ─────────────────────────────────────────────────────────────

const CLOUD_NAME = "dndeygffc";   // ← reemplaza esto
const UPLOAD_PRESET = "mi_preset_app";    // ← reemplaza esto

// ─────────────────────────────────────────────────────────────

export async function uploadToCloudinary(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("resource_type", "raw"); // necesario para archivos 3D

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url);
      } else {
        reject(new Error(`Cloudinary error: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`
    );
    xhr.send(formData);
  });
}
