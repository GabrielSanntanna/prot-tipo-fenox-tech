/**
 * Validador de CPF/CNPJ para o sistema FMS
 * 
 * CPF: 11 dígitos - formato: 000.000.000-00
 * CNPJ: 14 dígitos - formato: 00.000.000/0000-00
 */

/**
 * Remove caracteres não numéricos
 */
export function cleanDocument(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Aplica máscara de CPF: 000.000.000-00
 */
export function formatCPF(cpf: string): string {
  const cleaned = cleanDocument(cpf);
  return cleaned
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cleanDocument(cnpj);
  return cleaned
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Formata automaticamente baseado no tamanho
 */
export function formatDocument(value: string, type: 'cpf' | 'cnpj'): string {
  return type === 'cpf' ? formatCPF(value) : formatCNPJ(value);
}

/**
 * Valida CPF usando algoritmo oficial
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cleanDocument(cpf);
  
  // Deve ter 11 dígitos
  if (cleaned.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

/**
 * Valida CNPJ usando algoritmo oficial
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cleanDocument(cnpj);
  
  // Deve ter 14 dígitos
  if (cleaned.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleaned.charAt(12))) return false;
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleaned.charAt(13))) return false;
  
  return true;
}

/**
 * Valida documento baseado no tipo
 */
export function validateDocument(value: string, type: 'cpf' | 'cnpj'): boolean {
  return type === 'cpf' ? validateCPF(value) : validateCNPJ(value);
}

/**
 * Aplica máscara de telefone: (00) 00000-0000
 */
export function formatPhone(phone: string): string {
  const cleaned = cleanDocument(phone);
  return cleaned
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

/**
 * Valida telefone com 11 dígitos
 */
export function validatePhone(phone: string): boolean {
  const cleaned = cleanDocument(phone);
  return cleaned.length === 11 && /^\d{11}$/.test(cleaned);
}
