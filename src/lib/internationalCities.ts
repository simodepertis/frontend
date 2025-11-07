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
  },
  AM: {
    name: 'Armenia',
    code: 'AM',
    cities: ['Erevan', 'Gavar', 'Tsaghkadzor', 'Vanadzor', 'Byureghavan', 'Goris', 'Maralik', 'Alaverdi', 'Tumanyan', 'Artik Shirak', 'Metsamor']
  },
  AU: {
    name: 'Australia',
    code: 'AU',
    cities: ['Adelaide', 'Brisbane', 'Mackay', 'Sydney', 'Newcastle', 'Perth', 'Melbourne', 'Cairns']
  },
  MX: {
    name: 'Messico',
    code: 'MX',
    cities: ['Città del Messico', 'Cancún', 'Tuxtla Gutiérrez', 'Guadalajara', 'Zacatecas', 'Monterrey', 'Cuernavaca', 'Chihuahua', 'Veracruz', 'San Cristóbal de Las Casas', 'Santiago de Querétaro', 'Ciudad Juárez', 'Xalapa', 'Aguascalientes', 'Villahermosa', 'Chilpancingo', 'San Luis Potosí', 'León', 'Mexicali', 'Pachuca', 'San Miguel de Allende', 'Tijuana', 'Los Mochis', 'Mazatlán', 'Ciudad del Carmen', 'Ciudad Madero', 'Ciudad Victoria']
  },
  MA: {
    name: 'Marocco',
    code: 'MA',
    cities: ['Marrakech', 'Casablanca', 'Agadir']
  },
  MZ: {
    name: 'Mozambico',
    code: 'MZ',
    cities: ['Maputo']
  },
  NA: {
    name: 'Namibia',
    code: 'NA',
    cities: ['Windhoek']
  },
  NP: {
    name: 'Nepal',
    code: 'NP',
    cities: ['Katmandu', 'Biratnagar', 'Itahari', 'Hetauda', 'Bhaktapur', 'Butwal', 'Kalaiya', 'Baglung', 'Tansen', 'Dharan']
  },
  AL: {
    name: 'Albania',
    code: 'AL',
    cities: ['Durazzo', 'Elbasan', 'Fiero', 'Kevaje', 'Saranda', 'Tirana', 'Valona']
  },
  AR: {
    name: 'Argentina',
    code: 'AR',
    cities: ['Cordoba', 'Bariloche', 'Buenos Aires']
  },
  AZ: {
    name: 'Azerbaigian',
    code: 'AZ',
    cities: ['Ganja', 'Baku']
  },
  AE: {
    name: 'Emirati Arabi Uniti',
    code: 'AE',
    cities: ['Dubai', 'Abu Dhabi', 'Sharja', 'Fujairah', 'Ras al-Khaimah', 'Ajman']
  },
  BY: {
    name: 'Bielorussia',
    code: 'BY',
    cities: ['Minsk', 'Ashmyany', 'Asipovichy', 'Mahilëŭ', 'Vicebsk', 'Baranavichy', 'Rėčica', 'Lida', 'Žlobin', 'Navapolack', 'Braslaŭ', 'Belaazërsk', 'Navahrudak', 'Haradok']
  },
  BD: {
    name: 'Bangladesh',
    code: 'BD',
    cities: ['Dacca', 'Khulna', 'Chittagong', 'Narayanganj', 'Faridpur', 'Chandpur Sadar', 'Magura']
  },
  BH: {
    name: 'Bahrein',
    code: 'BH',
    cities: ['Al Riffa', 'Manama']
  },
  MD: {
    name: 'Moldova',
    code: 'MD',
    cities: ['Chișinău', 'Tiraspol', 'Balti', 'Orhei', 'Hîncești', 'Florești', 'Nisporeni', 'Glodeni']
  },
  NZ: {
    name: 'Nuova Zelanda',
    code: 'NZ',
    cities: ['Auckland', 'Wellington', 'Christchurch', 'Queenstown', 'Dunedin', 'Tauranga', 'Napier', 'Lower Hutt', 'Gisborne', 'Blenheim', 'Porirua', 'Upper Hutt', 'Oamaru', 'Timaru', 'Balclutha', 'Kaitaia', 'Waitara', 'Rolleston']
  },
  BR: {
    name: 'Brasile',
    code: 'BR',
    cities: ['San Paolo', 'Rio de Janeiro', 'Brasilia', 'Florianópolis', 'Curitiba', 'Belo Horizonte', 'Joao Pessoa', 'Recife', 'Porto Alegre', 'Salvador', 'Campinas', 'Vitoria', 'Uberlandia', 'Belém', 'Campo Grande', 'Boa Vista', 'Goiânia', 'São Gonçalo', 'Ouro Preto', 'São Bernardo do Campo', 'Porto Seguro', 'Nova Iguaçu', 'Santos', 'Londrina', 'Piracicaba', 'Uberlândia', 'Limeira']
  },
  KH: {
    name: 'Cambogia',
    code: 'KH',
    cities: ['Phnom Penh', 'Siem Reap', 'Battambang', 'Kampot', 'Chau Doc']
  },
  CM: {
    name: 'Camerun',
    code: 'CM',
    cities: ['Yaoundé', 'Douala', 'Bafoussam', 'Buéa', 'Victoria']
  },
  CA: {
    name: 'Canada',
    code: 'CA',
    cities: ['Québec', 'Toronto', 'Montréal', 'Vancouver', 'Ottawa', 'Calgary', 'Edmonton', 'Winnipeg', 'Saskatoon', 'Saint Johns', 'Oshawa', 'Halifax', 'Saint John', 'Sherbrooke', 'St. Catharines', 'Kitchener', 'Hamilton', 'Thunder Bay', 'Mississauga', 'Gatineau', 'New Westminster', 'Guelph', 'Fredericton', 'Medicine Hat', 'Brampton', 'Surrey', 'Welland', 'Sarnia', 'Burnaby', 'Laval', 'Vaughan', 'Richmond Hill', 'Saint-Jean-sur-Richelieu', 'Markham']
  },
  NI: {
    name: 'Nicaragua',
    code: 'NI',
    cities: ['Managua', 'Matagalpa', 'Bluefields', 'Estelí', 'Ocotal', 'Corinto', 'San Juan del Sur']
  },
  NG: {
    name: 'Nigeria',
    code: 'NG',
    cities: ['Lagos', 'Abuja', 'Lagos Island', 'Lekki']
  },
  OM: {
    name: 'Oman',
    code: 'OM',
    cities: ['Muscat', 'Al Maabila', 'Barka']
  },
  PK: {
    name: 'Pakistan',
    code: 'PK',
    cities: ['Karachi', 'Islamabad', 'Lahore']
  },
  PA: {
    name: 'Panama',
    code: 'PA',
    cities: ['Panama City', 'Colón', 'Capira', 'Ancón', 'Panama City Beach']
  },
  PY: {
    name: 'Paraguay',
    code: 'PY',
    cities: ['Asunción', 'Ciudad del Este', 'Encarnación', 'Areguá']
  },
  CV: {
    name: 'Capo Verde',
    code: 'CV',
    cities: ['Cidade Velha', 'Praia', 'Porto Mosquito', 'Sale', 'Vila do Maio']
  },
  CR: {
    name: 'Costa Rica',
    code: 'CR',
    cities: ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Puerto Limón', 'Puntarenas', 'Liberia']
  },
  CL: {
    name: 'Cile',
    code: 'CL',
    cities: ['Santiago del Cile', 'Valparaíso', 'Iquique', 'Puerto Montt', 'Viña del Mar', 'Antofagasta', 'Concepción', 'Punta Arenas', 'Puerto Natales', 'La Serena', 'Temuco', 'Talcahuano', 'Coquimbo', 'Los Ángeles', 'Vicuña', 'Concón', 'Vitacura']
  },
  CN: {
    name: 'Cina',
    code: 'CN',
    cities: ['Pechino', 'Shanghai', 'Chengdu', 'Canton', 'Chongqing', 'Hangzhou', 'Nanchino', 'Shenzhen', 'Wuhan', 'Harbin', 'Tientsin', 'Suzhou', 'Shenyang', 'Changchun', 'Jinan', 'Zhengzhou', 'Shijiazhuang', 'Dalian', 'Guiyang', 'Taiyuan', 'Fuzhou', 'Foshan', 'Kashgar', 'Hefei', 'Ürümqi', 'Nanchang', 'Xining', 'Lanzhou', 'Pingdingshan', 'Zibo', 'Zhongshan', 'Xiangyang', 'Ningbo', 'Baoding', 'Weifang']
  },
  CO: {
    name: 'Colombia',
    code: 'CO',
    cities: ['Apartadó', 'Bello', 'Envigado', 'Facatativá', 'Florencia', 'Barrancabermeja', 'Dosquebradas', 'Floridablanca', 'Manizales', 'Cúcuta', 'Bogotá', 'Medellín', 'Bucaramanga', 'Pereira', 'Barranquilla', 'Cartagena de Indias', 'Cali', 'Pasto', 'Popayán', 'Neiva', 'Soacha', 'Villavicencio']
  },
  PE: {
    name: 'Perù',
    code: 'PE',
    cities: ['Lima']
  },
  PH: {
    name: 'Filippine',
    code: 'PH',
    cities: ['Manila', 'Cebu', 'Quezon City', 'Baguio', 'Davao', 'Makati', 'Iloilo', 'Vigan', 'Pasig', 'Zamboanga', 'Angeles', 'Olongapo', 'Parañaque', 'Lapu-Lapu', 'Mandaluyong', 'Iligan', 'Mandaue', 'Danao', 'Tagbilaran', 'Calbayog', 'San Jose']
  },
  QA: {
    name: 'Qatar',
    code: 'QA',
    cities: ['Doha', 'Al-Rayyan', 'Umm Salal Muhammed']
  },
  CD: {
    name: 'Rep. Democratica del Congo',
    code: 'CD',
    cities: ['Kinshasa', 'Goma', 'Bukavu', 'Bandundu', 'Lubumbashi', 'Bunia']
  },
  EC: {
    name: 'Ecuador',
    code: 'EC',
    cities: ['Ambato', 'Azogues', 'Cuenca', 'Guayaquil', 'Durán', 'Guaranda', 'Esmeraldas', 'El Carmen', 'Huaquillas', 'Macas', 'Manta', 'Montecristi', 'Puerto Francisco de Orellana', 'Portoviejo', 'Puerto Ayora', 'Salinas', 'Samborondón', 'Santo Domingo de los Colorados', 'Quito', 'Zamora']
  },
  EG: {
    name: 'Egitto',
    code: 'EG',
    cities: ['Il Cairo', 'Porto Said', 'Marsa Matruh', 'Suez', 'Ismailia', 'Mansura', 'Damietta', 'Tanta', 'Qena', 'Shibin El Kom', 'Zagazig', 'Marsa Alam', 'Esna', 'Porto Fuad', 'Rosetta', 'Al Wasta', 'Sinnuris']
  },
  EE: {
    name: 'Estonia',
    code: 'EE',
    cities: ['Tallinn', 'Pärnu', 'Paide', 'Rapla', 'Jõhvi', 'Viljandi', 'Tartu', 'Valga', 'Võru', 'Kärdla', 'Elva', 'Mustvee', 'Paldiski', 'Hara', 'Sindi', 'Uderna', 'Sillamäe', 'Kiviõli', 'Abja-Paluoja', 'Tapa', 'Kohtla-Järve']
  },
  GT: {
    name: 'Guatemala',
    code: 'GT',
    cities: ['Quetzaltenango', 'Mixco', 'Jutiapa', 'Santa Catarina Pinula', 'Flores', 'San Juan La Laguna']
  },
  GE: {
    name: 'Georgia',
    code: 'GE',
    cities: ['Tbilisi', 'Batumi', 'Kutaisi', 'Gori', 'Mtskheta', 'Vani', 'Sagarejo', 'Kareli', 'Khashuri', 'Ozurgeti', 'Sachkhere', 'Sighnaghi', 'Abasha', 'Akhmeta', 'Dedoplistskaro', 'Gurjaani', 'Bolnisi', 'Akhaltsikhe', 'Zugdidi', 'Telavi', 'Kobuleti']
  },
  GH: {
    name: 'Ghana',
    code: 'GH',
    cities: ['Accra', 'Kumasi', 'Cape Coast', 'East Legon', 'Tema', 'Sekondi-Takoradi', 'Kwahu', 'Tamale']
  },
  HN: {
    name: 'Honduras',
    code: 'HN',
    cities: ['San Pedro Sula', 'La Ceiba', 'Comayagüela', 'La Entrada', 'Tocoa', 'Talanga', 'Guaimaca', 'Olanchito', 'Santa Rita', 'Juticalpa']
  },
  IS: {
    name: 'Islanda',
    code: 'IS',
    cities: ['Reykjavík', 'Akureyri', 'Kópavogur', 'Húsavík', 'Selfoss', 'Reykjanesbær', 'Mosfellsbær', 'Akranes', 'Siglufjordur', 'Blönduós', 'Árborg', 'Borgarnes', 'Neskaupstaður']
  },
  IN: {
    name: 'India',
    code: 'IN',
    cities: ['Mumbai', 'Nuova Delhi', 'Udaipur', 'Jodhpur', 'Bangalore', 'Hyderabad', 'Thiruvananthapuram', 'Kozhikode', 'Pune', 'Patna', 'Pushkar', 'Ahmedabad', 'Pondicherry', 'Kanpur', 'Surat']
  },
  ID: {
    name: 'Indonesia',
    code: 'ID',
    cities: ['Giacarta', 'Medan', 'Bandung', 'Makassar', 'Yogyakarta', 'Bogor', 'Jayapura', 'Bandar Lampung', 'Palangkaraya', 'Ambon', 'Gorontalo', 'Pangkal Pinang', 'Kendari', 'Kupang', 'Manado', 'Banda Aceh', 'Malang', 'Salatiga', 'Pariaman', 'Dumai', 'Padang Sidempuan', 'Balikpapan']
  },
  IR: {
    name: 'Iran',
    code: 'IR',
    cities: ['Teheran', 'Esfahan', 'Abadan', 'Urmia', 'Ardabil', 'Birjand', 'Ahwaz', 'Zahedan', 'Rasht', 'Gorgan', 'Sanandaj', 'Khoy', 'Quchan', 'Yasuj', 'Shahrekord', 'Qaemshahr', 'Dorud', 'Sabzevar']
  },
  JO: {
    name: 'Giordania',
    code: 'JO',
    cities: ['Amman', 'Irbid']
  },
  KZ: {
    name: 'Kazakistan',
    code: 'KZ',
    cities: ['Almaty', 'Aksay', 'Aktau']
  },
  KE: {
    name: 'Kenya',
    code: 'KE',
    cities: ['Nairobi', 'Mombasa', 'Eldoret']
  },
  KR: {
    name: 'Corea del Sud',
    code: 'KR',
    cities: ['Incheon', 'Suwon', 'Pusan', 'Seul', 'Changwon', 'Daedeok-gu', 'Gwangju', 'Cheongju', 'Yeosu', 'Sokcho']
  },
  XK: {
    name: 'Kosovo',
    code: 'XK',
    cities: ['Pristina', 'Ferizaj', 'Prizren']
  },
  KW: {
    name: 'Kuwait',
    code: 'KW',
    cities: ['Al Farwaniyah', 'Città di Kuwait', 'Mahboula']
  },
  KG: {
    name: 'Kirghizistan',
    code: 'KG',
    cities: ['Biškek']
  },
  LV: {
    name: 'Lettonia',
    code: 'LV',
    cities: ['Riga', 'Jūrmala', 'Ogre', 'Jelgava', 'Kandava', 'Madona', 'Sedde']
  },
  LB: {
    name: 'Libano',
    code: 'LB',
    cities: ['Beirut', 'Jounieh', 'Sidone', 'Bsharre']
  },
  TW: {
    name: 'Taiwan',
    code: 'TW',
    cities: ['Taipei', 'Taoyuan']
  },
  TZ: {
    name: 'Tanzania',
    code: 'TZ',
    cities: ['Zanzibar', 'Arusha', 'Dar es Salaam']
  },
  TH: {
    name: 'Thailandia',
    code: 'TH',
    cities: ['Phuket', 'Bangkok', 'Pattaya', 'Ko Samui']
  },
  TM: {
    name: 'Turkmenistan',
    code: 'TM',
    cities: ['Ashgabat']
  },
  TN: {
    name: 'Tunisia',
    code: 'TN',
    cities: ['Tunisi', 'Susa', 'Mahdia', 'Ariana', 'Nabeul', 'La Goletta', 'La Marsa']
  },
  UG: {
    name: 'Uganda',
    code: 'UG',
    cities: ['Kampala']
  },
  IL: {
    name: 'Israele',
    code: 'IL',
    cities: ['Gerusalemme', 'Haifa', 'Tiberiade', 'Elat', 'Beer Sheva', 'Rishon LeZion', 'Or Akiva', 'Ramat Gan', 'Safad', 'Bat Yam', 'Herzliya', 'Ashdod', 'Migdal HaEmek', 'Lod', 'Ascalona', 'Ramat HaSharon', 'Rahat', 'Nazaret Illit', 'Tamra', 'Tayibe', 'Jish', 'Arraba', 'Umm al-Fahm', 'Hod HaSharon', 'Kiryat Gat', 'Rosh HaAyin', 'Rehovot', 'Nahariya', 'Bet Shemesh', 'Tel Aviv']
  },
  CI: {
    name: 'Costa d\'Avorio',
    code: 'CI',
    cities: ['Abidjan', 'Cocody', 'Plateau']
  },
  JM: {
    name: 'Giamaica',
    code: 'JM',
    cities: ['Kingston', 'Montego Bay', 'Portmore']
  },
  JP: {
    name: 'Giappone',
    code: 'JP',
    cities: ['Tokyo', 'Osaka', 'Yokohama', 'Fukuoka', 'Kōbe', 'Takayama', 'Sapporo', 'Nagoya', 'Nagasaki', 'Saitama', 'Naha', 'Nagano', 'Kawasaki', 'Sendai', 'Toyama', 'Shizuoka', 'Aomori', 'Nishinomiya', 'Sagamihara', 'Kitakyūshū', 'Chiba', 'Funabashi', 'Yokosuka', 'Asahikawa', 'Utsunomiya', 'Morioka', 'Kawaguchi', 'Ichikawa', 'Koshigaya', 'Matsudo', 'Kashiwa', 'Fujisawa', 'Hamamatsu']
  },
  CY: {
    name: 'Cipro',
    code: 'CY',
    cities: ['Nicosia', 'Limassol', 'Larnaca', 'Famagosta', 'Kyrenia', 'Aradippou', 'Germasogeia', 'Aglantzia', 'Platres', 'Prastio', 'Spilia', 'Kakopetria', 'Akrotiri', 'Kalopanagiotis']
  },
  LK: {
    name: 'Sri Lanka',
    code: 'LK',
    cities: ['Colombo Fort', 'Puttalam', 'Batticaloa', 'Haputale', 'Colombo', 'Bentota', 'Kalutara']
  },
  TR: {
    name: 'Turchia',
    code: 'TR',
    cities: ['Istanbul', 'Antalya', 'Izmir', 'Ankara', 'Bodrum', 'Alanya', 'Konya', 'Samsun', 'Besiktas', 'Bursa', 'Sakarya', 'Usak', 'Edirne', 'Adana', 'Gaziantep', 'Şanlıurfa', 'Van', 'Afyonkarahisar', 'Avanos', 'Anamur', 'Kaş', 'Kemer', 'Safranbolu', 'Çeşme']
  },
  UA: {
    name: 'Ucraina',
    code: 'UA',
    cities: ['Kiev', 'Leopoli', 'Charkiv', 'Odessa', 'Poltava', 'Chernihiv', 'Dnipro', 'Ternopil', 'Vinnycja', 'Černivci', 'Sumy', 'Ivano-Frankivsk', 'Chmelnyckij', 'Čerkasy', 'Zaporižžja', 'Donetsk', 'Berdiansk', 'Sjevjerodoneck', 'Pavlohrad', 'Kramatorsk', 'Čystjakove', 'Enerhodar', 'Rovenky', 'Novovolynsk']
  },
  US: {
    name: 'Stati Uniti',
    code: 'US',
    cities: ['New York City', 'Las Vegas', 'Atlanta', 'Houston', 'Miami', 'Phoenix', 'Dallas', 'Chicago', 'San Francisco', 'Sacramento', 'Oklahoma City', 'Dayton', 'Grand Rapids', 'Palm Springs', 'Stockton', 'Asheville', 'Bradenton', 'Hollywood', 'Memphis', 'St. Louis', 'Anchorage', 'Atlantic City', 'Cincinnati', 'Concord', 'Fort Collins', 'Garland', 'Grand Prairie', 'Harrisburg', 'Hialeah', 'Indianapolis', 'Jersey City', 'Lincoln', 'Mesa', 'New Orleans', 'Olympia', 'Pasadena', 'Rancho Cucamonga', 'San Jose', 'Shreveport', 'Tampa', 'Vallejo', 'Visalia', 'Denver', 'Kansas City', 'Austin', 'San Antonio', 'Portland', 'Detroit', 'Inglewood', 'Reno', 'Tacoma', 'Baton Rouge', 'Charleston', 'Lakewood', 'Syracuse', 'Annapolis', 'Brownsville', 'Colorado Springs', 'Denton', 'Fort Lauderdale', 'Gilbert', 'Greensboro', 'Hayward', 'Honolulu', 'Irving', 'Lafayette', 'Little Rock', 'Milwaukee', 'Norcross', 'Omaha', 'Philadelphia', 'Riverside', 'Santa Fe', 'Springfield', 'Thousand Oaks', 'Ventura', 'Washington DC', 'Fort Myers', 'Los Angeles', 'Orlando', 'Charlotte', 'Seattle', 'Fort Worth', 'Nashville', 'San Diego', 'Anaheim', 'Boston', 'Columbia', 'Louisville', 'Ocala', 'Toledo', 'Arlington', 'Columbus', 'Elk Grove', 'Fort Smith', 'Glendale', 'Greenville', 'Henderson', 'Independence', 'Jacksonville', 'Lexington', 'Long Beach', 'Mobile', 'Oakland', 'Orange', 'Plano', 'San Bernardino', 'Saratoga Springs', 'Sterling Heights', 'Tucson', 'Victorville', 'Wichita']
  },
  UY: {
    name: 'Uruguay',
    code: 'UY',
    cities: ['Mercedes', 'Montevideo', 'Salto', 'Maldonado', 'Colonia del Sacramento', 'Punta del Este', 'Piriápolis', 'Rocha', 'Bella Unión', 'Pando', 'Paso de Carrasco', 'La Paloma', 'Pan de Azúcar']
  },
  UZ: {
    name: 'Uzbekistan',
    code: 'UZ',
    cities: ['Samarcanda', 'Tashkent', 'Bukhara', 'Khiva', 'Shahrisabz', 'Nurota', 'Xonobod']
  },
  VE: {
    name: 'Venezuela',
    code: 'VE',
    cities: ['Caracas', 'Maracaibo', 'Ciudad Guayana', 'Valencia', 'Barquisimeto', 'Maracay', 'Porlamar', 'San Cristóbal', 'Los Teques', 'Carúpano', 'Santa Teresa del Tuy', 'Turmero', 'El Vigía', 'Puerto La Cruz', 'Altagracia de Orituco', 'Rubio', 'La Guaira', 'Puerto Ayacucho', 'Ciudad Piar']
  },
  VN: {
    name: 'Vietnam',
    code: 'VN',
    cities: ['Danang', 'Ho Chi Minh', 'Hanoi', 'Nha Trang', 'Hội An', 'Qui Nhon', 'Sa Pa Ward', 'Haiphong', 'Ben Tre', 'Tuy Hoa', 'Thanh Hóa', 'Cao Bằng', 'Rach Gia', 'Tay Ninh', 'Tuyen Quang', 'Mỹ Tho', 'Buôn Ma Thuột', 'Long Xuyen', 'Cao Lãnh', 'Tân An', 'Tam Kỳ', 'Việt Trì']
  },
  ZA: {
    name: 'Sudafrica',
    code: 'ZA',
    cities: ['Città del Capo', 'Johannesburg', 'Pretoria', 'Durban', 'Port Elizabeth', 'Bloemfontein', 'Pietermaritzburg', 'East London', 'Witbank', 'Krugersdorp', 'Madibeng', 'Rustenburg', 'Soweto', 'Worcester', 'Midrand', 'Knysna', 'Tembisa', 'Springs', 'Nigel', 'Carletonville', 'Uitenhage', 'Alberton']
  },
  RU: {
    name: 'Russia',
    code: 'RU',
    cities: ['Mosca', 'Kazan', 'Ekaterinburg', 'Nižnij Novgorod', 'Novosibirsk', 'Jakutsk', 'Derbent', 'Šachty', 'Rostov sul Don', 'Ulan-Udė', 'Petropavlovsk', 'Čita', 'Vladivostok', 'Blagoveščensk', 'Engels', 'Balakovo', 'Balašicha', 'Chimki', 'Staryy Oskol', 'Severodvinsk', 'Prokopevsk', 'Voronež', 'Samara', 'Krasnojarsk', 'Barnaul', 'Kemerovo', 'Tomsk']
  },
  RW: {
    name: 'Ruanda',
    code: 'RW',
    cities: ['Kigali']
  },
  SA: {
    name: 'Arabia Saudita',
    code: 'SA',
    cities: ['Riyad', 'Gedda', 'La Mecca', 'Al Balad', 'Dammam', 'Abha', 'Medina', 'Al-Selayy', 'King Abdullah Economic City']
  },
  SN: {
    name: 'Senegal',
    code: 'SN',
    cities: ['Dakar', 'Saint-Louis']
  }
};

export const COUNTRY_LIST = Object.values(COUNTRIES_CITIES).map(c => ({ code: c.code, name: c.name }));
