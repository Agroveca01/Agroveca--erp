import { getUserRoleLabel, UserRoleValue } from './supabase';

export interface UserCredentials {
  full_name: string;
  email: string;
  password: string;
  role: UserRoleValue;
}

export const generateWelcomeMessage = (credentials: UserCredentials): string => {
  return `🌱 *Bienvenido/a a CuidaTuPlanta ERP*

¡Hola ${credentials.full_name}!

Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales de acceso:

📧 *Email:* ${credentials.email}
🔐 *Contraseña:* ${credentials.password}
👤 *Rol:* ${getUserRoleLabel(credentials.role)}

🔗 *Accede al sistema aquí:*
${window.location.origin}

⚠️ *Importante:*
• Guarda esta contraseña en un lugar seguro
• Te recomendamos cambiarla después del primer inicio de sesión
• No compartas tus credenciales con nadie

¡Bienvenido/a al equipo! 🎉`;
};

export const copyMessageToClipboard = async (message: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(message);
    return true;
  } catch (err) {
    console.error('Error copying to clipboard:', err);
    return false;
  }
};

export const sendMessageViaWhatsApp = (message: string): void => {
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};
