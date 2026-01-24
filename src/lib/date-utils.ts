import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/it';

// Configura dayjs con plugin e locale italiano
dayjs.extend(relativeTime);
dayjs.locale('it');

/**
 * Formatta una data come tempo relativo in italiano
 * Es: "2 ore fa", "ieri", "3 giorni fa"
 */
export function formatRelativeDate(date: string | Date): string {
  const now = dayjs();
  const targetDate = dayjs(date);

  // Se la data è nel futuro, ritorna la data formattata
  if (targetDate.isAfter(now)) {
    return targetDate.format('DD/MM/YYYY');
  }

  const daysDiff = now.diff(targetDate, 'day');

  // Se più di 7 giorni, mostra la data formattata
  if (daysDiff > 7) {
    return targetDate.format('DD/MM/YYYY');
  }

  // Usa il formato relativo per date recenti
  return targetDate.fromNow();
}

/**
 * Formatta una data in formato completo italiano
 * Es: "24 gennaio 2026"
 */
export function formatFullDate(date: string | Date): string {
  return dayjs(date).format('DD MMMM YYYY');
}

/**
 * Formatta una data con ora
 * Es: "24/01/2026 alle 18:30"
 */
export function formatDateWithTime(date: string | Date): string {
  return dayjs(date).format('DD/MM/YYYY [alle] HH:mm');
}
