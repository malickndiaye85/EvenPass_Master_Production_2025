export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('221') && cleaned.length >= 12) {
    const localNumber = cleaned.substring(3);
    return `+221 ${localNumber.substring(0, 5)}****`;
  }

  if (cleaned.length >= 9) {
    return `${cleaned.substring(0, 5)}****`;
  }

  if (cleaned.length >= 5) {
    return cleaned.substring(0, 3) + '****';
  }

  return phone;
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
  }

  if (cleaned.length === 12 && cleaned.startsWith('221')) {
    return `+221 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
  }

  return phone;
}
