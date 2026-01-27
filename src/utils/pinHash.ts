/**
 * Utilitários para hash de PIN - FMS
 * 
 * IMPORTANTE: O hash real é feito no edge function usando bcrypt.
 * Este módulo fornece funções auxiliares para o frontend.
 */

/**
 * Valida se o PIN tem exatamente 4 dígitos numéricos
 */
export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/**
 * Gera um PIN aleatório de 4 dígitos
 */
export function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Mascara o PIN para exibição (****)
 */
export function maskPin(pin: string): string {
  if (!pin) return '';
  return '****';
}

/**
 * Formata o PIN removendo caracteres não numéricos
 */
export function formatPin(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}
