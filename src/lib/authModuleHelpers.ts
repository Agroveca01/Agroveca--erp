export type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export interface AuthCopy {
  title: string;
  subtitle: string;
}

export interface PasswordResetValidation {
  error: string | null;
}

export const getAuthCopy = (mode: AuthMode): AuthCopy => {
  if (mode === 'forgot') {
    return {
      title: 'Recuperar Contraseña',
      subtitle: 'Te enviaremos un enlace para restablecer tu contraseña',
    };
  }

  if (mode === 'reset') {
    return {
      title: 'Nueva Contraseña',
      subtitle: 'Define una nueva contraseña segura para tu cuenta',
    };
  }

  return {
    title: 'Cuida Tu Planta',
    subtitle: 'Sistema de Gestión Empresarial',
  };
};

export const validatePasswordReset = (
  password: string,
  confirmPassword: string,
): PasswordResetValidation => {
  if (password.length < 6) {
    return { error: 'La nueva contraseña debe tener al menos 6 caracteres' };
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden' };
  }

  return { error: null };
};

export const isErrorMessage = (message: string) => {
  return (
    message.includes('Error') ||
    message.includes('error') ||
    message.includes('no coinciden')
  );
};
