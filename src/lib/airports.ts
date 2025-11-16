// src/lib/airports.ts

// Tipado del JSON
type CityRecord = {
  ciudad: string; // nombre de la ciudad en el JSON (ej: "ABIDJAN")
  codigo: string; // código IATA (ej: "ABJ")
  pais: string;   // país en español (ej: "COSTA DE MARFIL")
};

// Importamos el JSON.
// Asegúrate de tener el archivo en src/lib/codigos_IATA.json
// y que tu tsconfig permite "resolveJsonModule".
import codigos from '../assets/codigos_IATA.json';

const records = codigos as CityRecord[];

// Normaliza cadenas: quita acentos, pasa a minúsculas, recorta espacios
function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // quita tildes
    .toLowerCase()
    .trim();
}

// Índice por ciudad normalizada -> lista de registros (por si hay varias ciudades con el mismo nombre en distintos países)
const cityIndex = new Map<string, CityRecord[]>();

for (const rec of records) {
  const key = normalize(rec.ciudad);
  const list = cityIndex.get(key);
  if (list) {
    list.push(rec);
  } else {
    cityIndex.set(key, [rec]);
  }
}

/**
 * Intenta encontrar el código IATA de una ciudad.
 *
 * - cityName: nombre de la ciudad que introduce el usuario (ej: "Abidjan", "abidjan", "ABIDJAN").
 * - countryName: país opcional (ej: "Costa de Marfil") para desambiguar si hay varias.
 *
 * Devuelve el código IATA (ej: "ABJ") o null si no encuentra nada.
 */
export function guessAirportCodeFromCity(
  cityName: string,
  countryName?: string
): string | null {
  if (!cityName) return null;

  const normCity = normalize(cityName);
  const candidates = cityIndex.get(normCity);
  if (!candidates || candidates.length === 0) {
    return null;
  }

  // Si sólo hay un registro para esa ciudad → directo
  if (candidates.length === 1 || !countryName) {
    return candidates[0].codigo || null;
  }

  // Si hay varios y tenemos país, intentamos matchear por país
  const normCountry = normalize(countryName);
  const fromSameCountry = candidates.find(
    (rec) => normalize(rec.pais) === normCountry
  );

  if (fromSameCountry) {
    return fromSameCountry.codigo || null;
  }

  // Si no coincide ninguno por país, devolvemos el primero
  return candidates[0].codigo || null;
}
