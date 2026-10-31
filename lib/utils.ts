import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Para buscar sin distinguir mayúsculas ni tildes, e ignorando espacios a los lados. */
export function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

/** Milisegundos para leer un mensaje con calma: 70 ms por carácter, mínimo 5 s. */
export function tiempoDeLectura(texto: string) {
  return Math.max(5000, texto.length * 70)
}
