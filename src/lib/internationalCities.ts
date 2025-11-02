// Elenco completo città internazionali per nazione
export const COUNTRIES_CITIES: Record<string, { name: string; code: string; cities: string[] }> = {
  FR: {
    name: 'Francia',
    code: 'FR',
    cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne', 'Cannes', 'Monaco']
  },
  UK: {
    name: 'Regno Unito',
    code: 'UK',
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Newcastle', 'Sheffield', 'Bristol', 'Edinburgh', 'Leicester', 'Nottingham', 'Coventry', 'Belfast', 'Cardiff', 'Brighton', 'Oxford', 'Cambridge', 'Southampton', 'Portsmouth', 'York', 'Bath']
  },
  DE: {
    name: 'Germania',
    code: 'DE',
    cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bonn', 'Bielefeld', 'Mannheim', 'Karlsruhe', 'Wiesbaden']
  },
  ES: {
    name: 'Spagna',
    code: 'ES',
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Granada', 'Vitoria', 'Elche', 'Oviedo', 'Badalona', 'Cartagena', 'Marbella', 'Ibiza', 'San Sebastian']
  },
  CH: {
    name: 'Svizzera',
    code: 'CH',
    cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel', 'Thun', 'Köniz', 'La Chaux-de-Fonds', 'Schaffhausen', 'Fribourg', 'Zug', 'Montreux', 'Interlaken']
  },
  NL: {
    name: 'Paesi Bassi',
    code: 'NL',
    cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen', 'Enschede', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort', 'Apeldoorn', 'Leiden', 'Maastricht']
  },
  BE: {
    name: 'Belgio',
    code: 'BE',
    cities: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Mechelen', 'Aalst', 'La Louvière', 'Kortrijk', 'Hasselt', 'Ostend', 'Genk', 'Tournai']
  },
  AT: {
    name: 'Austria',
    code: 'AT',
    cities: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn', 'Steyr', 'Wiener Neustadt', 'Feldkirch', 'Bregenz']
  },
  PT: {
    name: 'Portogallo',
    code: 'PT',
    cities: ['Lisbon', 'Porto', 'Braga', 'Coimbra', 'Funchal', 'Setúbal', 'Almada', 'Aveiro', 'Évora', 'Faro', 'Guimarães', 'Viseu', 'Lagos', 'Albufeira', 'Cascais']
  },
  PL: {
    name: 'Polonia',
    code: 'PL',
    cities: ['Warsaw', 'Krakow', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice', 'Białystok', 'Gdynia', 'Częstochowa', 'Radom', 'Sosnowiec', 'Toruń', 'Kielce', 'Zakopane']
  },
  CZ: {
    name: 'Repubblica Ceca',
    code: 'CZ',
    cities: ['Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'České Budějovice', 'Hradec Králové', 'Ústí nad Labem', 'Pardubice', 'Karlovy Vary']
  },
  HU: {
    name: 'Ungheria',
    code: 'HU',
    cities: ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár', 'Szombathely']
  },
  RO: {
    name: 'Romania',
    code: 'RO',
    cities: ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Oradea', 'Brăila', 'Arad', 'Pitești', 'Sibiu', 'Bacău']
  },
  GR: {
    name: 'Grecia',
    code: 'GR',
    cities: ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Volos', 'Rhodes', 'Ioannina', 'Chania', 'Chalcis', 'Mykonos', 'Santorini', 'Corfu']
  },
  IE: {
    name: 'Irlanda',
    code: 'IE',
    cities: ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk', 'Swords', 'Bray', 'Kilkenny', 'Ennis']
  },
  SE: {
    name: 'Svezia',
    code: 'SE',
    cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping', 'Lund', 'Umeå']
  },
  NO: {
    name: 'Norvegia',
    code: 'NO',
    cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Sandnes', 'Tromsø', 'Sarpsborg']
  },
  DK: {
    name: 'Danimarca',
    code: 'DK',
    cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde']
  },
  FI: {
    name: 'Finlandia',
    code: 'FI',
    cities: ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Pori']
  },
  HR: {
    name: 'Croazia',
    code: 'HR',
    cities: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Pula', 'Slavonski Brod', 'Dubrovnik', 'Varaždin', 'Šibenik']
  },
  RS: {
    name: 'Serbia',
    code: 'RS',
    cities: ['Belgrade', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica', 'Zrenjanin', 'Pančevo', 'Čačak', 'Novi Pazar']
  },
  BG: {
    name: 'Bulgaria',
    code: 'BG',
    cities: ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven', 'Sliven', 'Dobrich']
  },
  SK: {
    name: 'Slovacchia',
    code: 'SK',
    cities: ['Bratislava', 'Košice', 'Prešov', 'Žilina', 'Nitra', 'Banská Bystrica', 'Trnava', 'Martin', 'Trenčín']
  },
  SI: {
    name: 'Slovenia',
    code: 'SI',
    cities: ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje', 'Koper', 'Novo Mesto', 'Ptuj']
  },
  LU: {
    name: 'Lussemburgo',
    code: 'LU',
    cities: ['Luxembourg City', 'Esch-sur-Alzette', 'Dudelange', 'Differdange', 'Ettelbruck']
  }
};

export const COUNTRY_LIST = Object.values(COUNTRIES_CITIES).map(c => ({ code: c.code, name: c.name }));
