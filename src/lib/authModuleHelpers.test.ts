import { describe, expect, it } from 'vitest';

import {
  getAuthCopy,
  isErrorMessage,
  validatePasswordReset,
} from './authModuleHelpers';

describe('authModuleHelpers', () => {
  it('returns the right title and subtitle for each auth mode', () => {
    expect(getAuthCopy('login')).toEqual({
      title: 'Cuida Tu Planta',
      subtitle: 'Sistema de Gestión Empresarial',
    });
    expect(getAuthCopy('forgot')).toEqual({
      title: 'Recuperar Contraseña',
      subtitle: 'Te enviaremos un enlace para restablecer tu contraseña',
    });
    expect(getAuthCopy('reset')).toEqual({
      title: 'Nueva Contraseña',
      subtitle: 'Define una nueva contraseña segura para tu cuenta',
    });
  });

  it('validates password reset inputs', () => {
    expect(validatePasswordReset('123', '123')).toEqual({
      error: 'La nueva contraseña debe tener al menos 6 caracteres',
    });
    expect(validatePasswordReset('123456', '654321')).toEqual({
      error: 'Las contraseñas no coinciden',
    });
    expect(validatePasswordReset('123456', '123456')).toEqual({ error: null });
  });

  it('detects whether a user-facing auth message is an error', () => {
    expect(isErrorMessage('Error al iniciar sesión')).toBe(true);
    expect(isErrorMessage('Las contraseñas no coinciden')).toBe(true);
    expect(isErrorMessage('Cuenta creada exitosamente')).toBe(false);
  });
});
