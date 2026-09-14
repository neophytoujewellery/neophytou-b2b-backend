import { GREECE_CITIES } from './greece-cities.js';

// ---------------------------------------------------------------------------
// Universal (language-agnostic / English) signal keywords, reused everywhere.
// Per-country files below add their own native-language terms on top.
// ---------------------------------------------------------------------------
const BASE_POSITIVE = [
  '18k', '18kt', '18 kt', '18 karat', '750', 'diamond', 'lab-grown', 'lab grown', 'labgrown',
  'brilliant', 'tennis bracelet', 'tennis necklace', 'engagement', 'bridal', 'solitaire',
  'carat', 'luxury', 'white gold', 'yellow gold', 'rose gold', 'fine jewel',
];

const BASE_NEGATIVE = [
  'stainless', 'steel', 'costume', 'fashion jewel', 'fashion accessor', 'plated',
  'gold plated', 'silver plated', 'sterling silver', '925 silver', 'pawn', 'cash for gold',
];

// ---------------------------------------------------------------------------
// Country registry. To add a European country later, add one entry here —
// no other code needs to change.
// ---------------------------------------------------------------------------
export const COUNTRIES = {
  greece: {
    name: 'Greece',
    regionCode: 'GR',
    languageCode: 'el',
    typeQuery: 'κοσμήματα',
    searchTerms: ['κοσμηματοπωλείο', 'κοσμήματα', 'χρυσοχοείο'],
    positive: ['διαμ', 'μπριγιαν', 'μπριγιάν', 'λευκόχρυσ', 'λευκοχρυσ', 'αρραβ', 'νυφικ',
               'μονόπετρ', 'μονοπετρ', 'καρατ', 'καράτ', 'πολύτιμ', 'πολυτιμ', 'χρυσ'],
    negative: ['ατσαλι', 'ατσάλι', 'ασημ', 'ασήμ', 'επιχρυσ', 'ενεχυρ', 'ενεχυροδαν'],
    jewelleryName: /jewel|joyer|gioieller|bijou|schmuck|κοσμημ|κοσμήμ|κόσμημ|χρυσοχ/i,
    cities: GREECE_CITIES,
  },

  italy: {
    name: 'Italy',
    regionCode: 'IT',
    languageCode: 'it',
    typeQuery: 'gioielli',
    searchTerms: ['gioielleria', 'gioielli', 'oreficeria'],
    positive: ['diamant', 'oro bianco', 'oro giallo', 'oro rosa', 'fidanzamento', 'fede',
               'fedi', 'solitario', 'carat', 'brillant', 'lusso'],
    negative: ['acciaio', 'bigiotteria', 'argento', 'placcat', 'banco pegni', 'compro oro'],
    jewelleryName: /jewel|gioieller|oreficer|gioielli/i,
    cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Venice'],
  },

  france: {
    name: 'France',
    regionCode: 'FR',
    languageCode: 'fr',
    typeQuery: 'bijoux',
    searchTerms: ['bijouterie', 'bijoux', 'joaillerie'],
    positive: ['diamant', 'or blanc', 'or jaune', 'or rose', 'fiançailles', 'alliance',
               'solitaire', 'carat', 'brillant', 'luxe', 'haute joaillerie'],
    negative: ['acier', 'fantaisie', 'argent', 'plaqué', 'plaqué or', 'rachat d\'or', 'mont-de-piété'],
    jewelleryName: /jewel|bijouter|bijoux|joailler/i,
    cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux', 'Lille', 'Montpellier'],
  },

  spain: {
    name: 'Spain',
    regionCode: 'ES',
    languageCode: 'es',
    typeQuery: 'joyas',
    searchTerms: ['joyería', 'joyas', 'orfebrería'],
    positive: ['diamante', 'oro blanco', 'oro amarillo', 'oro rosa', 'compromiso', 'alianza',
               'solitario', 'quilate', 'brillante', 'lujo', 'alta joyería'],
    negative: ['acero', 'bisutería', 'plata', 'chapado', 'baño de oro', 'compro oro', 'casa de empeño'],
    jewelleryName: /jewel|joyer|joyas|orfebr/i,
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Malaga', 'Bilbao', 'Alicante', 'Granada', 'Palma'],
  },

  germany: {
    name: 'Germany',
    regionCode: 'DE',
    languageCode: 'de',
    typeQuery: 'schmuck',
    searchTerms: ['juwelier', 'schmuck', 'goldschmied'],
    positive: ['diamant', 'weißgold', 'gelbgold', 'roségold', 'verlobung', 'trauring',
               'solitär', 'karat', 'brillant', 'luxus', 'feinschmuck'],
    negative: ['edelstahl', 'modeschmuck', 'silber', 'vergoldet', 'pfandhaus', 'goldankauf'],
    jewelleryName: /jewel|juwelier|schmuck|goldschmied/i,
    cities: ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Dresden'],
  },

  portugal: {
    name: 'Portugal',
    regionCode: 'PT',
    languageCode: 'pt',
    typeQuery: 'joias',
    searchTerms: ['joalharia', 'joias', 'ourivesaria'],
    positive: ['diamante', 'ouro branco', 'ouro amarelo', 'ouro rosa', 'noivado', 'aliança',
               'solitário', 'quilate', 'brilhante', 'luxo', 'alta joalharia'],
    negative: ['aço', 'bijutaria', 'prata', 'folheado', 'banho de ouro', 'compro ouro', 'penhores'],
    jewelleryName: /jewel|joalhar|joias|ourives/i,
    cities: ['Lisbon', 'Porto', 'Braga', 'Coimbra', 'Funchal', 'Faro', 'Aveiro', 'Setúbal', 'Guimarães', 'Viseu'],
  },

  romania: {
    name: 'Romania',
    regionCode: 'RO',
    languageCode: 'ro',
    typeQuery: 'bijuterii',
    searchTerms: ['bijuterie', 'bijuterii', 'giuvaiergerie'],
    positive: ['diamant', 'aur alb', 'aur galben', 'aur roz', 'logodnă', 'verighetă',
               'solitar', 'carat', 'briliant', 'lux', 'bijuterii fine'],
    negative: ['inox', 'oțel', 'fantezie', 'argint', 'placat', 'amanet', 'casa de amanet'],
    jewelleryName: /jewel|bijuter|giuvaier/i,
    cities: ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Oradea'],
  },
};

/**
 * Merged (base + country) signal keywords + jewellery-name matcher for a country.
 * Falls back to Greece if the key is unknown.
 */
export function signalsFor(countryKey) {
  const c = COUNTRIES[countryKey] || COUNTRIES.greece;
  return {
    positive: [...BASE_POSITIVE, ...c.positive],
    negative: [...BASE_NEGATIVE, ...c.negative],
    jewelleryName: c.jewelleryName,
  };
}

/** Map a stored country name ("Greece") to its registry key ("greece"), default greece. */
export function countryKey(name) {
  const k = String(name || 'greece').toLowerCase();
  return COUNTRIES[k] ? k : 'greece';
}