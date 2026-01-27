/**
 * Serviço de Cálculo de Horas - FMS
 * 
 * Regras por tipo de contrato:
 * 
 * CLT:
 * - Jornada padrão: 8h
 * - Hora extra: após 11 minutos excedidos
 * - Atrasos: geram horas negativas
 * - Banco de horas quadrimestral
 * 
 * HORISTA:
 * - Qualquer minuto extra = hora positiva
 * - Nunca gera hora negativa
 * 
 * PJ:
 * - Apenas registro de presença
 * - Sem horas extras
 */

export type ContractType = 'clt' | 'pj';
export type PaymentType = 'hourly' | 'fixed';

export interface TimeRecord {
  entry?: Date;
  lunchOut?: Date;
  lunchIn?: Date;
  exit?: Date;
}

export interface HoursResult {
  workedMinutes: number;
  workedHours: string; // Formatted HH:MM
  extraMinutes: number;
  extraHours: string;
  negativeMinutes: number;
  negativeHours: string;
  isComplete: boolean;
}

const STANDARD_JOURNEY_MINUTES = 8 * 60; // 480 minutes = 8 hours
const CLT_OVERTIME_THRESHOLD = 11; // Minutes after which overtime counts

/**
 * Formata minutos para string HH:MM
 */
export function formatMinutesToHours(minutes: number): string {
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  const sign = minutes < 0 ? '-' : '';
  return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calcula a diferença em minutos entre duas datas
 */
function diffInMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Calcula horas trabalhadas para CLT (regime fixo)
 */
export function calculateCLTHours(records: TimeRecord): HoursResult {
  const result: HoursResult = {
    workedMinutes: 0,
    workedHours: '00:00',
    extraMinutes: 0,
    extraHours: '00:00',
    negativeMinutes: 0,
    negativeHours: '00:00',
    isComplete: false,
  };

  if (!records.entry || !records.exit) {
    return result;
  }

  // Calcular período da manhã (entrada até almoço)
  let morningMinutes = 0;
  if (records.lunchOut) {
    morningMinutes = diffInMinutes(records.entry, records.lunchOut);
  }

  // Calcular período da tarde (retorno do almoço até saída)
  let afternoonMinutes = 0;
  if (records.lunchIn) {
    afternoonMinutes = diffInMinutes(records.lunchIn, records.exit);
  } else if (!records.lunchOut) {
    // Sem intervalo de almoço - jornada contínua
    afternoonMinutes = diffInMinutes(records.entry, records.exit);
    morningMinutes = 0;
  }

  const totalMinutes = morningMinutes + afternoonMinutes;
  result.workedMinutes = totalMinutes;
  result.workedHours = formatMinutesToHours(totalMinutes);
  result.isComplete = !!records.entry && !!records.exit;

  // Calcular horas extras ou negativas
  const difference = totalMinutes - STANDARD_JOURNEY_MINUTES;

  if (difference > CLT_OVERTIME_THRESHOLD) {
    // Hora extra: só conta após os 11 minutos de tolerância
    result.extraMinutes = difference;
    result.extraHours = formatMinutesToHours(difference);
  } else if (difference < 0) {
    // Atraso: gera horas negativas
    result.negativeMinutes = Math.abs(difference);
    result.negativeHours = formatMinutesToHours(Math.abs(difference));
  }

  return result;
}

/**
 * Calcula horas trabalhadas para HORISTA
 * Qualquer minuto extra é positivo, nunca gera negativo
 */
export function calculateHouristaHours(records: TimeRecord): HoursResult {
  const result: HoursResult = {
    workedMinutes: 0,
    workedHours: '00:00',
    extraMinutes: 0,
    extraHours: '00:00',
    negativeMinutes: 0,
    negativeHours: '00:00',
    isComplete: false,
  };

  if (!records.entry || !records.exit) {
    return result;
  }

  // Calcular total trabalhado
  let morningMinutes = 0;
  if (records.lunchOut) {
    morningMinutes = diffInMinutes(records.entry, records.lunchOut);
  }

  let afternoonMinutes = 0;
  if (records.lunchIn) {
    afternoonMinutes = diffInMinutes(records.lunchIn, records.exit);
  } else if (!records.lunchOut) {
    afternoonMinutes = diffInMinutes(records.entry, records.exit);
    morningMinutes = 0;
  }

  const totalMinutes = morningMinutes + afternoonMinutes;
  result.workedMinutes = totalMinutes;
  result.workedHours = formatMinutesToHours(totalMinutes);
  result.isComplete = !!records.entry && !!records.exit;

  // Para horista, qualquer minuto trabalhado conta
  // Não há conceito de hora negativa
  if (totalMinutes > STANDARD_JOURNEY_MINUTES) {
    result.extraMinutes = totalMinutes - STANDARD_JOURNEY_MINUTES;
    result.extraHours = formatMinutesToHours(result.extraMinutes);
  }

  return result;
}

/**
 * Calcula horas trabalhadas para PJ
 * Apenas registro de presença, sem horas extras
 */
export function calculatePJHours(records: TimeRecord): HoursResult {
  const result: HoursResult = {
    workedMinutes: 0,
    workedHours: '00:00',
    extraMinutes: 0,
    extraHours: '00:00',
    negativeMinutes: 0,
    negativeHours: '00:00',
    isComplete: false,
  };

  if (!records.entry || !records.exit) {
    return result;
  }

  // Calcular total trabalhado (apenas para registro)
  let morningMinutes = 0;
  if (records.lunchOut) {
    morningMinutes = diffInMinutes(records.entry, records.lunchOut);
  }

  let afternoonMinutes = 0;
  if (records.lunchIn) {
    afternoonMinutes = diffInMinutes(records.lunchIn, records.exit);
  } else if (!records.lunchOut) {
    afternoonMinutes = diffInMinutes(records.entry, records.exit);
    morningMinutes = 0;
  }

  const totalMinutes = morningMinutes + afternoonMinutes;
  result.workedMinutes = totalMinutes;
  result.workedHours = formatMinutesToHours(totalMinutes);
  result.isComplete = !!records.entry && !!records.exit;

  // PJ não tem horas extras nem negativas
  return result;
}

/**
 * Calcula horas baseado no tipo de contrato e pagamento
 */
export function calculateHours(
  records: TimeRecord,
  contractType: ContractType,
  paymentType: PaymentType
): HoursResult {
  if (contractType === 'pj') {
    return calculatePJHours(records);
  }

  if (paymentType === 'hourly') {
    return calculateHouristaHours(records);
  }

  return calculateCLTHours(records);
}

/**
 * Calcula o banco de horas para um período
 */
export interface BankOfHoursResult {
  totalExtraMinutes: number;
  totalNegativeMinutes: number;
  balanceMinutes: number;
  balanceHours: string;
}

export function calculateBankOfHours(
  dailyResults: HoursResult[]
): BankOfHoursResult {
  let totalExtra = 0;
  let totalNegative = 0;

  for (const day of dailyResults) {
    totalExtra += day.extraMinutes;
    totalNegative += day.negativeMinutes;
  }

  const balance = totalExtra - totalNegative;

  return {
    totalExtraMinutes: totalExtra,
    totalNegativeMinutes: totalNegative,
    balanceMinutes: balance,
    balanceHours: formatMinutesToHours(balance),
  };
}
