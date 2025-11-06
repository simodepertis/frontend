// Elenco completo città internazionali per nazione
export const COUNTRIES_CITIES: Record<string, { name: string; code: string; cities: string[] }> = {
  IT: {
    name: 'Italia',
    code: 'IT',
    cities: ['Agrigento', 'Alessandria', 'Ancona', 'Aosta', 'Arezzo', 'Ascoli', 'Asti', 'Avellino', 'Bari', 'Barletta', 'Belluno', 'Benevento', 'Bergamo', 'Biella', 'Bologna', 'Bolzano', 'Brescia', 'Brindisi', 'Cagliari', 'Caltanissetta', 'Campobasso', 'Carbonia Inglesias', 'Caserta', 'Catania', 'Catanzaro', 'Chieti', 'Como', 'Cosenza', 'Cremona', 'Crotone', 'Cuneo', 'Enna', 'Fermo', 'Ferrara', 'Firenze', 'Foggia', 'Forlì', 'Frosinone', 'Genova', 'Gorizia', 'Grosseto', 'Imperia', 'Iserni', 'L\'aquila', 'La Spezia', 'Latina', 'Lecce', 'Lecco', 'Livorno', 'Lodi', 'Lucca', 'Macerata', 'Mantova', 'Massa Carrara', 'Matera', 'Medio Campidano', 'Messina', 'Milano', 'Modena', 'Monza', 'Napoli', 'Novara', 'Nuoro', 'Ogliastra', 'Olbia Tempio', 'Oristano', 'Padova', 'Palermo', 'Parma', 'Pavia', 'Perugia', 'Pescara', 'Piacenza', 'Pisa', 'Pistoia', 'Pordenone', 'Potenza', 'Prato', 'Ragusa', 'Ravenna', 'Reggio Calabria', 'Reggio Emilia', 'Rimini', 'Rieti', 'Roma', 'Rovigo', 'San Marino', 'Salerno', 'Sassari', 'Savona', 'Siena', 'Siracusa', 'Sondrio', 'Taranto', 'Teramo', 'Terni', 'Torino', 'Trapani', 'Trento', 'Treviso', 'Trieste', 'Udine', 'Urbino', 'Varese', 'Venezia', 'Verbania', 'Vercelli', 'Verona', 'Vibo Valentia', 'Vicenza', 'Viterbo']
  },
  FR: {
    name: 'Francia',
    code: 'FR',
    cities: ['Paris', 'Angers', 'Argenteuil', 'Arles', 'Aix-en-Provence', 'Avignon', 'Angoulême', 'Antibes', 'Arras', 'Ajaccio', 'Albi', 'Agen', 'Amiens', 'Annecy', 'Boulogne-Billancourt', 'Bourges', 'Beauvais', 'Brive-la-Gaillarde', 'Brest', 'Biarritz', 'Béziers', 'Bayonne', 'Bordeaux', 'Besançon', 'Blois', 'Cannes', 'Compiègne', 'Caen', 'Chalon-sur-Saône', 'Châlons', 'Creil', 'Cagnes-sur-Mer', 'Cholet', 'Cergy', 'Colmar', 'Créteil', 'Clermont-Ferrand', 'Chamonix-Mont-Blanc', 'Calais', 'Clichy', 'Drancy', 'Dijon', 'Douai', 'Épinay-sur-Seine', 'Évreux', 'Gien', 'Grasse', 'Grenoble', 'Fréjus', 'Hyères', 'Le Havre', 'Istres', 'Ivry-sur-Seine', 'Lyon', 'Lille', 'Levallois-Perret', 'La Roche-sur-Yon', 'Lorient', 'Mulhouse', 'Montluçon', 'Metz', 'Le Mans', 'Montauban', 'Massy', 'Montpellier', 'Marseille', 'Mont-de-Marsan', 'Noisy-le-Grand', 'Nanterre', 'Nîmes', 'Nancy', 'Narbonne', 'Nantes', 'Nice', 'Orléans', 'Perpignan', 'Pau', 'La Rochelle', 'Rennes', 'Rouen', 'Reims', 'Saint-Étienne', 'Saint-Tropez', 'Saint-Maur-des-Fossés', 'Saint-Denis', 'Saint-Quentin', 'Sartrouville', 'Strasbourg', 'Saint-Brieuc', 'Saint-Malo', 'Sarcelles', 'Troyes', 'Toulouse', 'Tours', 'Toulon', 'Vitry-sur-Seine', 'Vannes', 'Valence', 'Vincennes', 'Versailles', 'Villeurbanne', 'Vichy']
  },
  UK: {
    name: 'Regno Unito',
    code: 'UK',
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Newcastle', 'Sheffield', 'Bristol', 'Edinburgh', 'Leicester', 'Nottingham', 'Coventry', 'Belfast', 'Cardiff', 'Brighton', 'Oxford', 'Cambridge', 'Southampton', 'Portsmouth', 'York', 'Bath', 'Derby', 'Plymouth', 'Wolverhampton', 'Stoke-on-Trent', 'Reading', 'Bradford', 'Aberdeen', 'Dundee', 'Swansea', 'Hull', 'Middlesbrough', 'Sunderland', 'Warrington', 'Milton Keynes', 'Northampton', 'Luton', 'Bolton', 'Bournemouth', 'Norwich', 'Swindon', 'Crawley', 'Ipswich', 'Wigan', 'Croydon', 'Walsall', 'Mansfield', 'Chester', 'Preston', 'Exeter', 'Cheltenham', 'Gloucester', 'Salford', 'Rochdale', 'Rotherham', 'Southend', 'Basildon', 'Peterborough', 'Blackpool', 'Hastings', 'Worcester', 'Lincoln', 'Lancaster', 'Durham', 'Canterbury', 'Carlisle', 'Winchester', 'Salisbury', 'Inverness', 'Stirling', 'Perth']
  },
  DE: {
    name: 'Germania',
    code: 'DE',
    cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bonn', 'Bielefeld', 'Mannheim', 'Karlsruhe', 'Wiesbaden', 'Münster', 'Augsburg', 'Aachen', 'Mönchengladbach', 'Gelsenkirchen', 'Braunschweig', 'Chemnitz', 'Kiel', 'Krefeld', 'Halle', 'Magdeburg', 'Freiburg', 'Lübeck', 'Oberhausen', 'Erfurt', 'Mainz', 'Rostock', 'Kassel', 'Hagen', 'Hamm', 'Saarbrücken', 'Mülheim', 'Potsdam', 'Ludwigshafen', 'Oldenburg', 'Leverkusen', 'Osnabrück', 'Solingen', 'Heidelberg', 'Herne', 'Neuss', 'Darmstadt', 'Paderborn', 'Regensburg', 'Ingolstadt', 'Würzburg', 'Fürth', 'Wolfsburg', 'Offenbach', 'Ulm', 'Heilbronn', 'Pforzheim', 'Göttingen', 'Bottrop', 'Trier', 'Recklinghausen', 'Reutlingen', 'Bremerhaven', 'Koblenz', 'Bergisch Gladbach', 'Jena', 'Remscheid', 'Erlangen', 'Moers', 'Siegen', 'Hildesheim', 'Salzgitter']
  },
  ES: {
    name: 'Spagna',
    code: 'ES',
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Granada', 'Vitoria', 'Elche', 'Oviedo', 'Badalona', 'Cartagena', 'Marbella', 'Ibiza', 'San Sebastian', 'Terrassa', 'Jerez', 'Sabadell', 'Santa Cruz', 'Móstoles', 'Alcalá de Henares', 'Pamplona', 'Fuenlabrada', 'Almería', 'Leganés', 'Santander', 'Burgos', 'Castellón', 'Albacete', 'Getafe', 'Alcorcón', 'Logroño', 'Salamanca', 'Huelva', 'Tarragona', 'León', 'Badajoz', 'Cádiz', 'Lleida', 'Mataró', 'Dos Hermanas', 'Santa Coloma', 'Jaén', 'Algeciras', 'Torrejón', 'Ourense', 'Alcobendas', 'Reus', 'Telde', 'Barakaldo', 'Lugo', 'Girona', 'Santiago', 'Cáceres', 'Lorca', 'Cornellà', 'Ávila', 'Palencia', 'Zamora', 'Segovia', 'Cuenca', 'Toledo', 'Soria', 'Teruel', 'Guadalajara', 'Huesca']
  },
  CH: {
    name: 'Svizzera',
    code: 'CH',
    cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel', 'Thun', 'Köniz', 'La Chaux-de-Fonds', 'Schaffhausen', 'Fribourg', 'Zug', 'Montreux', 'Interlaken', 'Vernier', 'Neuchâtel', 'Uster', 'Sion', 'Emmen', 'Yverdon', 'Kriens', 'Rapperswil', 'Dietikon', 'Wettingen', 'Riehen', 'Baar', 'Allschwil', 'Renens', 'Kreuzlingen', 'Frauenfeld', 'Chur', 'Wil', 'Nyon', 'Vevey', 'Bellinzona', 'Locarno', 'Davos', 'St. Moritz', 'Arosa', 'Gstaad', 'Crans-Montana', 'Verbier', 'Grindelwald', 'Wengen', 'Zermatt', 'Saas-Fee']
  },
  NL: {
    name: 'Paesi Bassi',
    code: 'NL',
    cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen', 'Enschede', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort', 'Apeldoorn', 'Leiden', 'Maastricht', 'Haarlemmermeer', 's-Hertogenbosch', 'Zoetermeer', 'Zwolle', 'Westland', 'Leeuwarden', 'Dordrecht', 'Alphen aan den Rijn', 'Alkmaar', 'Emmen', 'Deventer', 'Delft', 'Venlo', 'Sittard', 'Helmond', 'Hengelo', 'Purmerend', 'Roosendaal', 'Schiedam', 'Spijkenisse', 'Vlaardingen', 'Hilversum', 'Kampen', 'Oss', 'Bergen op Zoom', 'Gouda', 'Ridderkerk', 'Zeist', 'Nieuwegein', 'Veenendaal', 'Roermond', 'Middelburg', 'Hoorn', 'Ede', 'Lelystad']
  },
  BE: {
    name: 'Belgio',
    code: 'BE',
    cities: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Mechelen', 'Aalst', 'La Louvière', 'Kortrijk', 'Hasselt', 'Ostend', 'Genk', 'Tournai', 'Sint-Niklaas', 'Roeselare', 'Mouscron', 'Verviers', 'Dendermonde', 'Beringen', 'Turnhout', 'Waregem', 'Lokeren', 'Braine', 'Brasschaat', 'Ninove', 'Halle', 'Vilvoorde', 'Knokke-Heist', 'Wavre', 'Châtelet', 'Seraing', 'Ieper', 'Menen', 'Tongeren', 'Dinant', 'Spa', 'Waterloo', 'Durbuy']
  },
  AT: {
    name: 'Austria',
    code: 'AT',
    cities: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn', 'Steyr', 'Wiener Neustadt', 'Feldkirch', 'Bregenz', 'Leonding', 'Klosterneuburg', 'Baden', 'Wolfsberg', 'Leoben', 'Krems', 'Traun', 'Amstetten', 'Lustenau', 'Kapfenberg', 'Mödling', 'Hallein', 'Kufstein', 'Traiskirchen', 'Schwechat', 'Braunau', 'Stockerau', 'Saalfelden', 'Ansfelden', 'Tulln', 'Hohenems', 'Spittal', 'Telfs', 'Ternitz', 'Perchtoldsdorf', 'Feldkirchen', 'Bludenz', 'Bad Ischl', 'Wörgl', 'Dornbirn', 'Kitzbühel', 'Zell am See', 'Lienz', 'Gmunden', 'Vöcklabruck']
  },
  PT: {
    name: 'Portogallo',
    code: 'PT',
    cities: ['Lisbon', 'Porto', 'Braga', 'Coimbra', 'Funchal', 'Setúbal', 'Almada', 'Aveiro', 'Évora', 'Faro', 'Guimarães', 'Viseu', 'Lagos', 'Albufeira', 'Cascais', 'Vila Nova de Gaia', 'Amadora', 'Queluz', 'Gondomar', 'Odivelas', 'Loures', 'Matosinhos', 'Sintra', 'Leiria', 'Portimão', 'Santarém', 'Barreiro', 'Barcelos', 'Penafiel', 'Vila Franca de Xira', 'Sesimbra', 'Póvoa de Varzim', 'Espinho', 'Tomar', 'Felgueiras', 'Viana do Castelo', 'Castelo Branco', 'Beja', 'Portalegre', 'Chaves', 'Vila Real', 'Bragança', 'Tavira', 'Olhão', 'Quarteira', 'Vilamoura', 'Praia da Rocha', 'Nazaré', 'Óbidos', 'Ericeira']
  },
  PL: {
    name: 'Polonia',
    code: 'PL',
    cities: ['Warsaw', 'Krakow', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice', 'Białystok', 'Gdynia', 'Częstochowa', 'Radom', 'Sosnowiec', 'Toruń', 'Kielce', 'Zakopane', 'Gliwice', 'Zabrze', 'Olsztyn', 'Bielsko-Biała', 'Rzeszów', 'Ruda Śląska', 'Rybnik', 'Tychy', 'Dąbrowa Górnicza', 'Gorzów Wielkopolski', 'Płock', 'Elbląg', 'Opole', 'Wałbrzych', 'Zielona Góra', 'Włocławek', 'Tarnów', 'Chorzów', 'Koszalin', 'Kalisz', 'Legnica', 'Grudziądz', 'Słupsk', 'Jaworzno', 'Jastrzębie', 'Nowy Sącz', 'Jelenia Góra', 'Siedlce', 'Mysłowice', 'Konin', 'Piła', 'Piotrków', 'Inowrocław', 'Lubin', 'Ostrów', 'Suwałki', 'Stargard', 'Gniezno', 'Sopot', 'Malbork']
  },
  CZ: {
    name: 'Repubblica Ceca',
    code: 'CZ',
    cities: ['Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'České Budějovice', 'Hradec Králové', 'Ústí nad Labem', 'Pardubice', 'Karlovy Vary', 'Zlín', 'Havířov', 'Kladno', 'Most', 'Opava', 'Frýdek-Místek', 'Jihlava', 'Teplice', 'Karviná', 'Děčín', 'Chomutov', 'Jablonec nad Nisou', 'Mladá Boleslav', 'Prostějov', 'Přerov', 'Třebíč', 'Třinec', 'Tábor', 'Znojmo', 'Příbram', 'Cheb', 'Orlová', 'Litvínov', 'Písek', 'Trutnov', 'Kroměříž', 'Vsetín', 'Šumperk', 'Uherské Hradiště', 'Český Těšín', 'Břeclav', 'Hodonín']
  },
  HU: {
    name: 'Ungheria',
    code: 'HU',
    cities: ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár', 'Szombathely', 'Szolnok', 'Tatabánya', 'Kaposvár', 'Békéscsaba', 'Érd', 'Veszprém', 'Zalaegerszeg', 'Sopron', 'Eger', 'Nagykanizsa', 'Dunakeszi', 'Hódmezővásárhely', 'Cegléd', 'Salgótarján', 'Baja', 'Szekszárd', 'Vác', 'Pápa', 'Esztergom', 'Mosonmagyaróvár', 'Keszthely', 'Gyula', 'Budaörs', 'Gyöngyös', 'Szigetszentmiklós', 'Ajka', 'Mezőkövesd', 'Balaton', 'Siófok', 'Hévíz']
  },
  RO: {
    name: 'Romania',
    code: 'RO',
    cities: ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Oradea', 'Brăila', 'Arad', 'Pitești', 'Sibiu', 'Bacău', 'Târgu Mureș', 'Baia Mare', 'Buzău', 'Botoșani', 'Satu Mare', 'Râmnicu Vâlcea', 'Drobeta-Turnu Severin', 'Suceava', 'Piatra Neamț', 'Târgu Jiu', 'Târgoviște', 'Focșani', 'Bistrița', 'Tulcea', 'Reșița', 'Slatina', 'Călărași', 'Giurgiu', 'Deva', 'Hunedoara', 'Zalău', 'Alba Iulia', 'Mediaș', 'Sfântu Gheorghe', 'Vaslui', 'Roman', 'Turda', 'Slobozia', 'Brașov', 'Sinaia', 'Predeal', 'Mamaia', 'Eforie', 'Poiana Brașov']
  },
  GR: {
    name: 'Grecia',
    code: 'GR',
    cities: ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Volos', 'Rhodes', 'Ioannina', 'Chania', 'Chalcis', 'Mykonos', 'Santorini', 'Corfu', 'Piraeus', 'Peristeri', 'Kallithea', 'Nikaia', 'Glyfada', 'Agrinio', 'Kalamata', 'Kavala', 'Katerini', 'Serres', 'Xanthi', 'Drama', 'Kos', 'Alexandroupoli', 'Trikala', 'Lamia', 'Kozani', 'Karditsa', 'Veria', 'Salamis', 'Kilkis', 'Chios', 'Rethymno', 'Zakynthos', 'Naxos', 'Paros', 'Lefkada', 'Kefalonia', 'Skiathos', 'Nafplio', 'Delphi', 'Olympia', 'Meteora', 'Crete', 'Lesbos', 'Samos']
  },
  IE: {
    name: 'Irlanda',
    code: 'IE',
    cities: ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk', 'Swords', 'Bray', 'Kilkenny', 'Ennis', 'Navan', 'Tralee', 'Newbridge', 'Carlow', 'Naas', 'Athlone', 'Portlaoise', 'Mullingar', 'Wexford', 'Letterkenny', 'Celbridge', 'Clonmel', 'Greystones', 'Malahide', 'Leixlip', 'Sligo', 'Carrigaline', 'Tullamore', 'Arklow', 'Maynooth', 'Cobh', 'Killarney', 'Westport', 'Dingle', 'Kinsale', 'Doolin', 'Howth', 'Dalkey', 'Killiney', 'Dun Laoghaire', 'Wicklow']
  },
  SE: {
    name: 'Svezia',
    code: 'SE',
    cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping', 'Lund', 'Umeå', 'Gävle', 'Borås', 'Eskilstuna', 'Södertälje', 'Karlstad', 'Täby', 'Växjö', 'Halmstad', 'Sundsvall', 'Luleå', 'Trollhättan', 'Östersund', 'Borlänge', 'Falun', 'Tumba', 'Kalmar', 'Kristianstad', 'Skellefteå', 'Karlskrona', 'Uddevalla', 'Skövde', 'Lidingö', 'Ängelholm', 'Visby', 'Åre', 'Kiruna', 'Malmberget']
  },
  NO: {
    name: 'Norvegia',
    code: 'NO',
    cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Sandnes', 'Tromsø', 'Sarpsborg', 'Skien', 'Ålesund', 'Sandefjord', 'Haugesund', 'Tønsberg', 'Moss', 'Porsgrunn', 'Bodø', 'Arendal', 'Hamar', 'Ytrebygda', 'Larvik', 'Halden', 'Askøy', 'Lillehammer', 'Mo i Rana', 'Molde', 'Horten', 'Gjøvik', 'Narvik', 'Harstad', 'Flekkefjord', 'Hammerfest', 'Vadsø', 'Nordkapp', 'Lofoten', 'Geirangerfjord', 'Flåm', 'Preikestolen']
  },
  DK: {
    name: 'Danimarca',
    code: 'DK',
    cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde', 'Herning', 'Helsingør', 'Silkeborg', 'Næstved', 'Fredericia', 'Viborg', 'Køge', 'Holstebro', 'Taastrup', 'Slagelse', 'Hillerød', 'Sønderborg', 'Holbæk', 'Frederikshavn', 'Haderslev', 'Nørresundby', 'Ringsted', 'Skive', 'Svendborg', 'Hjørring', 'Ribe', 'Ebeltoft', 'Skagen', 'Gilleleje', 'Helsingør', 'Dragør']
  },
  FI: {
    name: 'Finlandia',
    code: 'FI',
    cities: ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Pori', 'Kouvola', 'Joensuu', 'Lappeenranta', 'Hämeenlinna', 'Vaasa', 'Seinäjoki', 'Rovaniemi', 'Mikkeli', 'Kotka', 'Salo', 'Porvoo', 'Kokkola', 'Hyvinkää', 'Lohja', 'Järvenpää', 'Rauma', 'Tuusula', 'Kirkkonummi', 'Kajaani', 'Kerava', 'Naantali', 'Savonlinna', 'Kemi', 'Tornio', 'Ivalo', 'Inari', 'Saariselkä', 'Levi', 'Ylläs', 'Ruka']
  },
  HR: {
    name: 'Croazia',
    code: 'HR',
    cities: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Pula', 'Slavonski Brod', 'Dubrovnik', 'Varaždin', 'Šibenik', 'Karlovac', 'Sisak', 'Velika Gorica', 'Vinkovci', 'Bjelovar', 'Koprivnica', 'Vukovar', 'Čakovec', 'Samobor', 'Rovinj', 'Poreč', 'Opatija', 'Trogir', 'Makarska', 'Hvar', 'Korčula', 'Brač', 'Vis', 'Krk', 'Rab', 'Pag', 'Cres', 'Motovun', 'Cavtat']
  },
  RS: {
    name: 'Serbia',
    code: 'RS',
    cities: ['Belgrade', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica', 'Zrenjanin', 'Pančevo', 'Čačak', 'Novi Pazar', 'Leskovac', 'Kruševac', 'Valjevo', 'Vranje', 'Šabac', 'Užice', 'Sombor', 'Požarevac', 'Pirot', 'Zaječar', 'Kikinda', 'Sremska Mitrovica', 'Smederevo', 'Jagodina', 'Vršac', 'Bor', 'Prokuplje', 'Loznica', 'Negotin', 'Kopaonik', 'Zlatibor']
  },
  BG: {
    name: 'Bulgaria',
    code: 'BG',
    cities: ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven', 'Sliven', 'Dobrich', 'Shumen', 'Pernik', 'Haskovo', 'Yambol', 'Pazardzhik', 'Blagoevgrad', 'Veliko Tarnovo', 'Vratsa', 'Gabrovo', 'Asenovgrad', 'Vidin', 'Kazanlak', 'Kyustendil', 'Montana', 'Dimitrovgrad', 'Targovishte', 'Lovech', 'Silistra', 'Razgrad', 'Pomorie', 'Nesebar', 'Sunny Beach', 'Golden Sands', 'Bansko', 'Borovets', 'Sozopol', 'Albena']
  },
  SK: {
    name: 'Slovacchia',
    code: 'SK',
    cities: ['Bratislava', 'Košice', 'Prešov', 'Žilina', 'Nitra', 'Banská Bystrica', 'Trnava', 'Martin', 'Trenčín', 'Poprad', 'Prievidza', 'Zvolen', 'Považská Bystrica', 'Nové Zámky', 'Michalovce', 'Spišská Nová Ves', 'Komárno', 'Levice', 'Humenné', 'Bardejov', 'Piešťany', 'Liptovský Mikuláš', 'Ružomberok', 'Dubnica nad Váhom', 'Lučenec', 'Púchov', 'Šaľa', 'High Tatras', 'Štrbské Pleso', 'Jasná']
  },
  SI: {
    name: 'Slovenia',
    code: 'SI',
    cities: ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje', 'Koper', 'Novo Mesto', 'Ptuj', 'Kamnik', 'Trbovlje', 'Jesenice', 'Nova Gorica', 'Domžale', 'Škofja Loka', 'Murska Sobota', 'Slovenj Gradec', 'Izola', 'Krško', 'Vrhnika', 'Postojna', 'Bled', 'Bohinj', 'Piran', 'Portorož', 'Kranjska Gora', 'Rogaška Slatina', 'Radovljica']
  },
  LU: {
    name: 'Lussemburgo',
    code: 'LU',
    cities: ['Luxembourg', 'Dudelange', 'Ettelbruck', 'Esch-sur-Alzette', 'Belvaux', 'Grevenmacher', 'Pétange', 'Bettembourg', 'Schifflange']
  },
  LI: {
    name: 'Liechtenstein',
    code: 'LI',
    cities: ['Vaduz', 'Balzers', 'Triesenberg', 'Gamprin']
  },
  LT: {
    name: 'Lituania',
    code: 'LT',
    cities: ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Zarasai', 'Ukmergė', 'Alytus', 'Tauragė', 'Panevėžys', 'Jonava', 'Visaginas', 'Ignalina', 'Elektrėnai', 'Kazlų Rūda', 'Kėdainiai', 'Širvintos', 'Rietavas', 'Joniškis', 'Skuodas', 'Švenčionys', 'Jurbarkas', 'Mažeikiai', 'Kupiškis', 'Birštonas', 'Pakruojis', 'Plungė', 'Šalčininkai']
  },
  MG: {
    name: 'Madagascar',
    code: 'MG',
    cities: ['Antananarivo']
  },
  MY: {
    name: 'Malaysia',
    code: 'MY',
    cities: ['Kuala Lumpur', 'Kota Kinabalu', 'Malacca', 'George Town', 'Kuching', 'Seremban', 'Johor Bahru', 'Shah Alam', 'Kuantan', 'Lahad Datu', 'Pasir Mas', 'Kota Bharu', 'Alor Setar', 'Bintulu', 'Tawau', 'Muar', 'Butterworth', 'Kota Tinggi', 'Kuala Kubu Bharu', 'Bukit Mertajam', 'Ampang Jaya', 'Petaling Jaya']
  },
  MT: {
    name: 'Malta',
    code: 'MT',
    cities: ['San Ġiljan', 'Msida', 'Mellieħa', 'San Pawl il-Baħar', 'Sliema', 'Valletta', 'Naxxar', 'Victoria', 'Gżira', 'San Ġwann', 'Qormi', 'Żejtun']
  },
  MC: {
    name: 'Monaco',
    code: 'MC',
    cities: ['Monte-Carlo', 'Monaco', 'Fontvieille']
  },
  MN: {
    name: 'Mongolia',
    code: 'MN',
    cities: ['Ulan Bator']
  },
  ME: {
    name: 'Montenegro',
    code: 'ME',
    cities: ['Podgorica', 'Budva', 'Ulcinj', 'Tivat', 'Bar', 'Kotor']
  }
};

export const COUNTRY_LIST = Object.values(COUNTRIES_CITIES).map(c => ({ code: c.code, name: c.name }));
