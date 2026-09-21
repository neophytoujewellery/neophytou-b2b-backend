import { GREECE_CITIES } from './greece-cities.js';

// Universal (English) signal keywords, reused across countries.
const BASE_POSITIVE = [
  '18k', '18kt', '18 kt', '18 karat', '750', 'diamond', 'lab-grown', 'lab grown', 'labgrown',
  'brilliant', 'tennis bracelet', 'tennis necklace', 'engagement', 'bridal', 'solitaire',
  'carat', 'luxury', 'white gold', 'yellow gold', 'rose gold', 'fine jewel',
];
const BASE_NEGATIVE = [
  'stainless', 'steel', 'costume', 'fashion jewel', 'fashion accessor', 'plated',
  'gold plated', 'silver plated', 'sterling silver', '925 silver', 'pawn', 'cash for gold',
];

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

  unitedkingdom: {
    name: 'United Kingdom',
    regionCode: 'GB',
    languageCode: 'en',
    typeQuery: 'jewellery',
    searchTerms: ['jeweller', 'jewellery', 'fine jewellery'],
    positive: ['hallmark', '9ct', '9 carat', 'platinum'],
    negative: ['costume', 'fashion accessor', 'silver plated', 'pawnbroker', 'cash for gold'],
    jewelleryName: /goldsmith|jeweller|jewel/i,
    cities: ['London', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield', 'Edinburgh', 'Cardiff', 'Leicester', 'Nottingham', 'Newcastle', 'Southampton', 'Brighton', 'Aberdeen', 'Cambridge', 'Oxford', 'York', 'Bath', 'Belfast', 'Chester', 'Norwich', 'Exeter', 'Reading', 'Coventry', 'Hull', 'Plymouth', 'Derby', 'Wolverhampton'],
  },

  ireland: {
    name: 'Ireland',
    regionCode: 'IE',
    languageCode: 'en',
    typeQuery: 'jewellery',
    searchTerms: ['jeweller', 'jewellery', 'fine jewellery'],
    positive: ['hallmark', 'platinum'],
    negative: ['costume', 'fashion accessor', 'pawnbroker', 'cash for gold'],
    jewelleryName: /goldsmith|jeweller|jewel/i,
    cities: ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Kilkenny', 'Drogheda', 'Dundalk', 'Sligo', 'Wexford', 'Ennis', 'Killarney', 'Athlone', 'Bray', 'Naas', 'Tralee'],
  },

  malta: {
    name: 'Malta',
    regionCode: 'MT',
    languageCode: 'en',
    typeQuery: 'jewellery',
    searchTerms: ['jeweller', 'jewellery', 'fine jewellery'],
    positive: ['filigree', 'platinum'],
    negative: ['costume', 'fashion accessor'],
    jewelleryName: /goldsmith|jeweller|jewel/i,
    cities: ['Valletta', 'Sliema', 'Birkirkara', 'Mosta', 'Qormi', 'Zabbar', 'Rabat', 'Victoria', 'St Julian\'s', 'Naxxar'],
  },

  cyprus: {
    name: 'Cyprus',
    regionCode: 'CY',
    languageCode: 'el',
    typeQuery: 'κοσμήματα',
    searchTerms: ['κοσμηματοπωλείο', 'κοσμήματα', 'χρυσοχοείο'],
    positive: ['διαμ', 'λευκόχρυσ', 'αρραβ', 'νυφικ', 'μονόπετρ', 'καρατ', 'χρυσ'],
    negative: ['ατσαλι', 'ασημ', 'επιχρυσ', 'ενεχυρ'],
    jewelleryName: /κόσμημ|κοσμημ|χρυσοχ|κοσμήμ|jewel/i,
    cities: ['Nicosia', 'Limassol', 'Larnaca', 'Paphos', 'Famagusta', 'Kyrenia', 'Paralimni', 'Aradippou', 'Strovolos', 'Latsia'],
  },

  italy: {
    name: 'Italy',
    regionCode: 'IT',
    languageCode: 'it',
    typeQuery: 'gioielli',
    searchTerms: ['gioielleria', 'gioielli', 'oreficeria'],
    positive: ['diamant', 'oro bianco', 'oro giallo', 'oro rosa', 'fidanzamento', 'fede', 'fedi', 'solitario', 'carat', 'brillant', 'lusso'],
    negative: ['acciaio', 'bigiotteria', 'argento', 'placcat', 'banco pegni', 'compro oro'],
    jewelleryName: /gioieller|oreficer|gioielli|jewel/i,
    cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania', 'Venice', 'Verona', 'Messina', 'Padua', 'Trieste', 'Brescia', 'Parma', 'Modena', 'Reggio Calabria', 'Perugia', 'Ravenna', 'Livorno', 'Cagliari', 'Rimini', 'Salerno', 'Ferrara', 'Sassari', 'Bergamo', 'Pescara', 'Vicenza'],
  },

  france: {
    name: 'France',
    regionCode: 'FR',
    languageCode: 'fr',
    typeQuery: 'bijoux',
    searchTerms: ['bijouterie', 'bijoux', 'joaillerie'],
    positive: ['diamant', 'or blanc', 'or jaune', 'or rose', 'fiançailles', 'alliance', 'solitaire', 'carat', 'brillant', 'luxe', 'haute joaillerie'],
    negative: ['acier', 'fantaisie', 'argent', 'plaqué', 'rachat d\'or', 'mont-de-piété'],
    jewelleryName: /joailler|bijouter|bijoux|jewel/i,
    cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Saint-Étienne', 'Le Havre', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Clermont-Ferrand', 'Aix-en-Provence', 'Brest', 'Tours', 'Limoges', 'Amiens', 'Metz', 'Perpignan', 'Besançon', 'Orléans', 'Rouen', 'Caen', 'Nancy', 'Avignon', 'Cannes'],
  },

  spain: {
    name: 'Spain',
    regionCode: 'ES',
    languageCode: 'es',
    typeQuery: 'joyas',
    searchTerms: ['joyería', 'joyas', 'orfebrería'],
    positive: ['diamante', 'oro blanco', 'oro amarillo', 'oro rosa', 'compromiso', 'alianza', 'solitario', 'quilate', 'brillante', 'lujo', 'alta joyería'],
    negative: ['acero', 'bisutería', 'plata', 'chapado', 'baño de oro', 'compro oro', 'casa de empeño'],
    jewelleryName: /orfebr|jewel|joyer|joyas/i,
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Malaga', 'Murcia', 'Palma', 'Bilbao', 'Alicante', 'Cordoba', 'Valladolid', 'Vigo', 'Gijon', 'Granada', 'A Coruna', 'Vitoria', 'Elche', 'Oviedo', 'Santa Cruz de Tenerife', 'Pamplona', 'Almeria', 'San Sebastian', 'Burgos', 'Santander', 'Castellon', 'Logrono', 'Salamanca', 'Marbella', 'Tarragona'],
  },

  portugal: {
    name: 'Portugal',
    regionCode: 'PT',
    languageCode: 'pt',
    typeQuery: 'joias',
    searchTerms: ['joalharia', 'joias', 'ourivesaria'],
    positive: ['diamante', 'ouro branco', 'ouro amarelo', 'ouro rosa', 'noivado', 'aliança', 'solitário', 'quilate', 'brilhante', 'luxo', 'alta joalharia'],
    negative: ['aço', 'bijutaria', 'prata', 'folheado', 'banho de ouro', 'compro ouro', 'penhores'],
    jewelleryName: /joalhar|ourives|joias|jewel/i,
    cities: ['Lisbon', 'Porto', 'Braga', 'Coimbra', 'Funchal', 'Faro', 'Aveiro', 'Setubal', 'Guimaraes', 'Viseu', 'Leiria', 'Barreiro', 'Almada', 'Amadora', 'Braganca', 'Evora', 'Viana do Castelo', 'Portimao', 'Cascais', 'Sintra'],
  },

  germany: {
    name: 'Germany',
    regionCode: 'DE',
    languageCode: 'de',
    typeQuery: 'schmuck',
    searchTerms: ['juwelier', 'schmuck', 'goldschmied'],
    positive: ['diamant', 'weißgold', 'gelbgold', 'roségold', 'verlobung', 'trauring', 'solitär', 'karat', 'brillant', 'luxus', 'feinschmuck'],
    negative: ['edelstahl', 'modeschmuck', 'silber', 'vergoldet', 'pfandhaus', 'goldankauf'],
    jewelleryName: /goldschmied|juwelier|schmuck|jewel/i,
    cities: ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Dresden', 'Essen', 'Bremen', 'Hannover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bonn', 'Mannheim', 'Karlsruhe', 'Wiesbaden', 'Münster', 'Augsburg', 'Aachen', 'Mönchengladbach', 'Braunschweig', 'Kiel', 'Freiburg', 'Mainz', 'Heidelberg'],
  },

  romania: {
    name: 'Romania',
    regionCode: 'RO',
    languageCode: 'ro',
    typeQuery: 'bijuterii',
    searchTerms: ['bijuterie', 'bijuterii', 'giuvaiergerie'],
    positive: ['diamant', 'aur alb', 'aur galben', 'aur roz', 'logodnă', 'verighetă', 'solitar', 'carat', 'briliant', 'lux', 'bijuterii fine'],
    negative: ['inox', 'oțel', 'fantezie', 'argint', 'placat', 'amanet'],
    jewelleryName: /giuvaier|bijuter|jewel/i,
    cities: ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Oradea', 'Brăila', 'Arad', 'Pitești', 'Sibiu', 'Bacău', 'Târgu Mureș', 'Baia Mare', 'Buzău', 'Botoșani', 'Satu Mare', 'Râmnicu Vâlcea', 'Suceava', 'Piatra Neamț', 'Drobeta', 'Focșani'],
  },

  austria: {
    name: 'Austria',
    regionCode: 'AT',
    languageCode: 'de',
    typeQuery: 'schmuck',
    searchTerms: ['juwelier', 'schmuck', 'goldschmied'],
    positive: ['diamant', 'weißgold', 'gelbgold', 'roségold', 'verlobung', 'trauring', 'solitär', 'karat', 'brillant', 'luxus'],
    negative: ['edelstahl', 'modeschmuck', 'silber', 'vergoldet', 'pfandhaus', 'goldankauf'],
    jewelleryName: /goldschmied|juwelier|schmuck|jewel/i,
    cities: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn', 'Wiener Neustadt', 'Steyr', 'Bregenz', 'Leonding', 'Klosterneuburg'],
  },

  switzerland: {
    name: 'Switzerland',
    regionCode: 'CH',
    languageCode: 'de',
    typeQuery: 'schmuck',
    searchTerms: ['juwelier', 'bijouterie', 'schmuck'],
    positive: ['diamant', 'weißgold', 'or blanc', 'verlobung', 'trauring', 'solitär', 'karat', 'brillant', 'luxus', 'horlogerie'],
    negative: ['edelstahl', 'modeschmuck', 'silber', 'vergoldet', 'acier', 'fantaisie'],
    jewelleryName: /goldschmied|bijouter|juwelier|schmuck|jewel/i,
    cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel', 'Thun', 'Köniz', 'La Chaux-de-Fonds', 'Fribourg', 'Neuchâtel', 'Sion'],
  },

  luxembourg: {
    name: 'Luxembourg',
    regionCode: 'LU',
    languageCode: 'fr',
    typeQuery: 'bijoux',
    searchTerms: ['bijouterie', 'joaillerie', 'juwelier'],
    positive: ['diamant', 'or blanc', 'fiançailles', 'alliance', 'solitaire', 'carat', 'luxe'],
    negative: ['acier', 'fantaisie', 'argent', 'plaqué'],
    jewelleryName: /joailler|bijouter|juwelier|jewel/i,
    cities: ['Luxembourg', 'Esch-sur-Alzette', 'Differdange', 'Dudelange', 'Ettelbruck', 'Diekirch', 'Wiltz', 'Echternach'],
  },

  netherlands: {
    name: 'Netherlands',
    regionCode: 'NL',
    languageCode: 'nl',
    typeQuery: 'sieraden',
    searchTerms: ['juwelier', 'sieraden', 'goudsmid'],
    positive: ['diamant', 'witgoud', 'geelgoud', 'roségoud', 'verloving', 'trouwring', 'solitair', 'karaat', 'briljant', 'luxe'],
    negative: ['edelstaal', 'namaak', 'zilver', 'verguld', 'goud inkoop', 'pandjeshuis'],
    jewelleryName: /sieraden|juwelier|goudsmid|jewel/i,
    cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen', 'Enschede', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort', 'Apeldoorn', 'Den Bosch', 'Hoofddorp', 'Maastricht', 'Leiden', 'Dordrecht', 'Zoetermeer', 'Zwolle', 'Deventer', 'Delft'],
  },

  belgium: {
    name: 'Belgium',
    regionCode: 'BE',
    languageCode: 'nl',
    typeQuery: 'sieraden',
    searchTerms: ['juwelier', 'sieraden', 'joaillerie'],
    positive: ['diamant', 'witgoud', 'or blanc', 'verloving', 'fiançailles', 'trouwring', 'solitair', 'karaat', 'briljant', 'luxe'],
    negative: ['edelstaal', 'namaak', 'zilver', 'verguld', 'acier', 'fantaisie'],
    jewelleryName: /bijouter|sieraden|juwelier|joailler|jewel/i,
    cities: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst', 'Mechelen', 'La Louvière', 'Kortrijk', 'Hasselt', 'Ostend', 'Genk', 'Roeselare', 'Tournai', 'Sint-Niklaas'],
  },

  denmark: {
    name: 'Denmark',
    regionCode: 'DK',
    languageCode: 'da',
    typeQuery: 'smykker',
    searchTerms: ['guldsmed', 'smykker', 'juveler'],
    positive: ['diamant', 'hvidguld', 'gulguld', 'rosaguld', 'forlovelse', 'vielsesring', 'solitaire', 'karat', 'brillant', 'luksus'],
    negative: ['stål', 'modesmykker', 'sølv', 'forgyldt', 'pantelåner'],
    jewelleryName: /guldsmed|juveler|smykker|jewel/i,
    cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde', 'Herning', 'Silkeborg', 'Næstved', 'Fredericia', 'Viborg', 'Køge', 'Holstebro', 'Slagelse', 'Helsingør', 'Hillerød'],
  },

  sweden: {
    name: 'Sweden',
    regionCode: 'SE',
    languageCode: 'sv',
    typeQuery: 'smycken',
    searchTerms: ['guldsmed', 'smycken', 'juvelerare'],
    positive: ['diamant', 'vitguld', 'gulguld', 'roséguld', 'förlovning', 'vigselring', 'solitär', 'karat', 'briljant', 'lyx'],
    negative: ['stål', 'modesmycken', 'silver', 'förgylld', 'pantbank'],
    jewelleryName: /juvelerare|guldsmed|smycken|jewel/i,
    cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping', 'Lund', 'Umeå', 'Gävle', 'Borås', 'Södertälje', 'Eskilstuna', 'Halmstad', 'Växjö', 'Karlstad', 'Sundsvall', 'Östersund', 'Trollhättan', 'Luleå', 'Kalmar'],
  },

  norway: {
    name: 'Norway',
    regionCode: 'NO',
    languageCode: 'no',
    typeQuery: 'smykker',
    searchTerms: ['gullsmed', 'smykker', 'juvelér'],
    positive: ['diamant', 'hvitt gull', 'gult gull', 'rosegull', 'forlovelse', 'giftering', 'solitær', 'karat', 'brilliant', 'luksus'],
    negative: ['stål', 'motesmykker', 'sølv', 'forgylt', 'pantelåner'],
    jewelleryName: /gullsmed|smykker|juvel|jewel/i,
    cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Sandnes', 'Tromsø', 'Sarpsborg', 'Skien', 'Ålesund', 'Sandefjord', 'Haugesund', 'Tønsberg', 'Moss', 'Porsgrunn', 'Bodø', 'Arendal', 'Hamar'],
  },

  finland: {
    name: 'Finland',
    regionCode: 'FI',
    languageCode: 'fi',
    typeQuery: 'korut',
    searchTerms: ['kultaseppä', 'korut', 'koruliike'],
    positive: ['timantti', 'valkokulta', 'keltakulta', 'punakulta', 'kihla', 'vihkisormus', 'solitaire', 'karaatti', 'briljantti', 'luksus'],
    negative: ['teräs', 'muotikorut', 'hopea', 'kullattu', 'panttilainaamo'],
    jewelleryName: /kultasepp|jewel|korut/i,
    cities: ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Pori', 'Kouvola', 'Joensuu', 'Lappeenranta', 'Hämeenlinna', 'Vaasa', 'Rovaniemi', 'Seinäjoki', 'Mikkeli', 'Kotka', 'Salo'],
  },

  poland: {
    name: 'Poland',
    regionCode: 'PL',
    languageCode: 'pl',
    typeQuery: 'biżuteria',
    searchTerms: ['jubiler', 'biżuteria', 'złotnik'],
    positive: ['diament', 'brylant', 'białe złoto', 'żółte złoto', 'różowe złoto', 'zaręczyn', 'obrączka', 'solit', 'karat', 'luksus'],
    negative: ['stal', 'biżuteria sztuczna', 'srebro', 'pozłacan', 'lombard', 'skup złota'],
    jewelleryName: /biżuteri|jubiler|złotnik|jewel/i,
    cities: ['Warsaw', 'Krakow', 'Lodz', 'Wroclaw', 'Poznan', 'Gdansk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice', 'Bialystok', 'Gdynia', 'Czestochowa', 'Radom', 'Sosnowiec', 'Torun', 'Kielce', 'Gliwice', 'Zabrze', 'Bytom', 'Olsztyn', 'Rzeszow', 'Ruda Slaska', 'Rybnik', 'Opole'],
  },

  czechia: {
    name: 'Czechia',
    regionCode: 'CZ',
    languageCode: 'cs',
    typeQuery: 'šperky',
    searchTerms: ['klenotnictví', 'šperky', 'zlatnictví'],
    positive: ['diamant', 'briliant', 'bílé zlato', 'žluté zlato', 'růžové zlato', 'zásnub', 'snubní prsten', 'solit', 'karát', 'luxus'],
    negative: ['ocel', 'bižuterie', 'stříbro', 'pozlacen', 'zastavárna', 'výkup zlata'],
    jewelleryName: /klenotnic|zlatnic|jewel|šperk/i,
    cities: ['Prague', 'Brno', 'Ostrava', 'Pilsen', 'Liberec', 'Olomouc', 'Ústí nad Labem', 'Hradec Králové', 'České Budějovice', 'Pardubice', 'Zlín', 'Havířov', 'Kladno', 'Most', 'Opava', 'Frýdek-Místek', 'Karviná', 'Jihlava', 'Teplice', 'Děčín'],
  },

  slovakia: {
    name: 'Slovakia',
    regionCode: 'SK',
    languageCode: 'sk',
    typeQuery: 'šperky',
    searchTerms: ['klenotníctvo', 'šperky', 'zlatníctvo'],
    positive: ['diamant', 'briliant', 'biele zlato', 'žlté zlato', 'ružové zlato', 'zásnub', 'obrúčka', 'solit', 'karát', 'luxus'],
    negative: ['oceľ', 'bižutéria', 'striebro', 'pozlát', 'záložňa', 'výkup zlata'],
    jewelleryName: /klenotníc|zlatníc|jewel|šperk/i,
    cities: ['Bratislava', 'Kosice', 'Presov', 'Zilina', 'Nitra', 'Banska Bystrica', 'Trnava', 'Martin', 'Trencin', 'Poprad', 'Prievidza', 'Zvolen', 'Povazska Bystrica', 'Michalovce', 'Nove Zamky', 'Spisska Nova Ves'],
  },

  hungary: {
    name: 'Hungary',
    regionCode: 'HU',
    languageCode: 'hu',
    typeQuery: 'ékszer',
    searchTerms: ['ékszerbolt', 'ékszer', 'ötvös'],
    positive: ['gyémánt', 'briliáns', 'fehérarany', 'sárgaarany', 'rózsaarany', 'eljegyzés', 'karikagyűrű', 'solit', 'karát', 'luxus'],
    negative: ['acél', 'divatékszer', 'ezüst', 'aranyozott', 'zálogház', 'aranyfelvásárlás'],
    jewelleryName: /ékszer|ötvös|jewel/i,
    cities: ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár', 'Szombathely', 'Szolnok', 'Tatabánya', 'Kaposvár', 'Békéscsaba', 'Érd', 'Veszprém', 'Zalaegerszeg', 'Sopron', 'Eger', 'Dunaújváros'],
  },

  bulgaria: {
    name: 'Bulgaria',
    regionCode: 'BG',
    languageCode: 'bg',
    typeQuery: 'бижута',
    searchTerms: ['бижутерия', 'бижута', 'златарски'],
    positive: ['диамант', 'брилянт', 'бяло злато', 'жълто злато', 'розово злато', 'годеж', 'венчална халка', 'карат', 'лукс'],
    negative: ['стомана', 'неръждаема', 'сребро', 'позлат', 'заложна къща', 'изкупуване на злато'],
    jewelleryName: /златар|jewel|бижут/i,
    cities: ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven', 'Sliven', 'Dobrich', 'Shumen', 'Pernik', 'Haskovo', 'Yambol', 'Pazardzhik', 'Blagoevgrad', 'Veliko Tarnovo', 'Vratsa', 'Gabrovo', 'Vidin', 'Kazanlak'],
  },

  croatia: {
    name: 'Croatia',
    regionCode: 'HR',
    languageCode: 'hr',
    typeQuery: 'nakit',
    searchTerms: ['zlatarna', 'nakit', 'draguljarnica'],
    positive: ['dijamant', 'bijelo zlato', 'žuto zlato', 'ružičasto zlato', 'zaruke', 'vjenčani prsten', 'solit', 'karat', 'luksuz'],
    negative: ['čelik', 'bižuterija', 'srebro', 'pozlaćen', 'zalagaonica', 'otkup zlata'],
    jewelleryName: /draguljar|zlatarn|nakit|jewel/i,
    cities: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Slavonski Brod', 'Pula', 'Karlovac', 'Sisak', 'Varazdin', 'Sibenik', 'Dubrovnik', 'Bjelovar', 'Kastela', 'Samobor', 'Vinkovci'],
  },

  slovenia: {
    name: 'Slovenia',
    regionCode: 'SI',
    languageCode: 'sl',
    typeQuery: 'nakit',
    searchTerms: ['zlatarna', 'nakit', 'draguljarna'],
    positive: ['diamant', 'belo zlato', 'rumeno zlato', 'rožnato zlato', 'zaroka', 'poročni prstan', 'solit', 'karat', 'luksuz'],
    negative: ['jeklo', 'bižuterija', 'srebro', 'pozlačen', 'zastavljalnica', 'odkup zlata'],
    jewelleryName: /draguljar|zlatarn|nakit|jewel/i,
    cities: ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje', 'Koper', 'Novo Mesto', 'Ptuj', 'Trbovlje', 'Kamnik', 'Jesenice', 'Nova Gorica', 'Domzale', 'Skofja Loka', 'Murska Sobota'],
  },

  serbia: {
    name: 'Serbia',
    regionCode: 'RS',
    languageCode: 'sr',
    typeQuery: 'nakit',
    searchTerms: ['zlatara', 'nakit', 'juvelirnica'],
    positive: ['dijamant', 'belo zlato', 'žuto zlato', 'roze zlato', 'veridba', 'burma', 'solit', 'karat', 'luksuz'],
    negative: ['čelik', 'bižuterija', 'srebro', 'pozlaćen', 'zalagaonica', 'otkup zlata'],
    jewelleryName: /juvelir|zlatar|nakit|jewel/i,
    cities: ['Belgrade', 'Novi Sad', 'Nis', 'Kragujevac', 'Subotica', 'Zrenjanin', 'Pancevo', 'Cacak', 'Novi Pazar', 'Kraljevo', 'Smederevo', 'Leskovac', 'Valjevo', 'Krusevac', 'Vranje', 'Sombor'],
  },

  estonia: {
    name: 'Estonia',
    regionCode: 'EE',
    languageCode: 'et',
    typeQuery: 'ehted',
    searchTerms: ['juveliiripood', 'ehted', 'kullassepp'],
    positive: ['teemant', 'valge kuld', 'kollane kuld', 'roosa kuld', 'kihlus', 'abielusõrmus', 'solit', 'karaat', 'luksus'],
    negative: ['teras', 'moeehted', 'hõbe', 'kullatud', 'pandimaja', 'kulla kokkuost'],
    jewelleryName: /kullassepp|juveliir|ehted|jewel/i,
    cities: ['Tallinn', 'Tartu', 'Narva', 'Pärnu', 'Kohtla-Järve', 'Viljandi', 'Rakvere', 'Maardu', 'Kuressaare', 'Sillamäe', 'Valga', 'Võru', 'Jõhvi', 'Haapsalu'],
  },

  latvia: {
    name: 'Latvia',
    regionCode: 'LV',
    languageCode: 'lv',
    typeQuery: 'rotaslietas',
    searchTerms: ['juvelierizstrādājumi', 'rotaslietas', 'zeltkalis'],
    positive: ['dimants', 'baltais zelts', 'dzeltenais zelts', 'rozā zelts', 'saderināšanās', 'laulību gredzens', 'solit', 'karāt', 'luksus'],
    negative: ['tērauds', 'bižutērija', 'sudrabs', 'apzeltīts', 'lombards', 'zelta iepirkšana'],
    jewelleryName: /rotaslietas|juvelier|zeltkal|jewel/i,
    cities: ['Riga', 'Daugavpils', 'Liepaja', 'Jelgava', 'Jurmala', 'Ventspils', 'Rezekne', 'Valmiera', 'Jekabpils', 'Ogre', 'Tukums', 'Cesis', 'Salaspils', 'Kuldiga'],
  },

  lithuania: {
    name: 'Lithuania',
    regionCode: 'LT',
    languageCode: 'lt',
    typeQuery: 'papuošalai',
    searchTerms: ['juvelyrika', 'papuošalai', 'auksakalys'],
    positive: ['deimantas', 'baltas auksas', 'geltonas auksas', 'rožinis auksas', 'sužadėtuvės', 'vestuvinis žiedas', 'solit', 'karat', 'prabanga'],
    negative: ['plienas', 'bižuterija', 'sidabras', 'paauksuot', 'lombardas', 'aukso supirkimas'],
    jewelleryName: /papuošal|auksakal|juvelyr|jewel/i,
    cities: ['Vilnius', 'Kaunas', 'Klaipeda', 'Siauliai', 'Panevezys', 'Alytus', 'Marijampole', 'Mazeikiai', 'Jonava', 'Utena', 'Kedainiai', 'Telsiai', 'Taurage', 'Ukmerge', 'Visaginas'],
  },
};

export function signalsFor(countryKey) {
  const c = COUNTRIES[countryKey] || COUNTRIES.greece;
  return {
    positive: [...BASE_POSITIVE, ...c.positive],
    negative: [...BASE_NEGATIVE, ...c.negative],
    jewelleryName: c.jewelleryName,
  };
}

export function countryKey(name) {
  const k = String(name || 'greece').toLowerCase().replace(/\s+/g, '');
  return COUNTRIES[k] ? k : 'greece';
}