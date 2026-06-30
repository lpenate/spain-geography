import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { geoMercator, geoPath, geoCentroid } from 'd3-geo'
import { feature } from 'topojson-client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const publicDir = path.join(rootDir, 'public')
const mapsDir = path.join(publicDir, 'maps')
const dataDir = path.join(publicDir, 'data')

const SPAIN_VIEWBOX = { width: 1000, height: 800 }
const EUROPE_VIEWBOX = { width: 1000, height: 860 }

const CANARY_REGION_NAMES = new Set(['Canarias'])
const CANARY_PROVINCE_NAMES = new Set(['Las Palmas', 'Santa Cruz de Tenerife'])

const SPAIN_MAIN_EXTENT = {
  topLeft: [24, 24],
  bottomRight: [700, 776],
}

const SPAIN_CANARY_INSET = {
  topLeft: [732, 590],
  bottomRight: [976, 776],
  frame: { x: 722, y: 578, width: 264, height: 206 },
}

const ICELAND_COUNTRY_NAME = 'Iceland'

const EUROPE_MAIN_EXTENT = {
  topLeft: [240, 16],
  bottomRight: [984, 844],
}

const EUROPE_ICELAND_INSET = {
  topLeft: [40, 40],
  bottomRight: [220, 160],
  frame: { x: 28, y: 28, width: 204, height: 144 },
}

const EXCLUDED_SPAIN_NAMES = new Set([
  'Gibraltar. Territorio no asociado a ninguna autonomía',
  'Gibraltar. Territorio no asociado a ninguna provincia',
])

const COMMUNITY_META = {
  Andalucía: { name: 'Andalucía', aliases: ['andalucia'], capital: 'Sevilla', capitalAliases: ['sevilla'] },
  Aragón: { name: 'Aragón', aliases: ['aragon'], capital: 'Zaragoza', capitalAliases: ['zaragoza'] },
  'Principado de Asturias': {
    name: 'Asturias',
    aliases: ['asturias', 'principado de asturias'],
    capital: 'Oviedo',
    capitalAliases: ['oviedo'],
  },
  'Illes Balears': {
    name: 'Islas Baleares',
    aliases: ['islas baleares', 'illes balears', 'baleares'],
    capital: 'Palma',
    capitalAliases: ['palma', 'palma de mallorca'],
  },
  Canarias: {
    name: 'Canarias',
    aliases: ['islas canarias'],
    capital: 'Santa Cruz de Tenerife',
    capitalAliases: ['santa cruz de tenerife', 'las palmas de gran canaria', 'las palmas'],
  },
  Cantabria: { name: 'Cantabria', aliases: ['cantabria'], capital: 'Santander', capitalAliases: ['santander'] },
  'Castilla-La Mancha': {
    name: 'Castilla-La Mancha',
    aliases: ['castilla la mancha', 'castilla-la mancha'],
    capital: 'Toledo',
    capitalAliases: ['toledo'],
  },
  'Castilla y León': {
    name: 'Castilla y León',
    aliases: ['castilla y leon', 'castilla y león'],
    capital: 'Valladolid',
    capitalAliases: ['valladolid'],
  },
  'Cataluña/Catalunya': {
    name: 'Cataluña',
    aliases: ['cataluna', 'catalunya', 'cataluña'],
    capital: 'Barcelona',
    capitalAliases: ['barcelona'],
  },
  'Comunitat Valenciana': {
    name: 'Comunidad Valenciana',
    aliases: ['comunidad valenciana', 'comunitat valenciana', 'valencia'],
    capital: 'Valencia',
    capitalAliases: ['valencia'],
  },
  Extremadura: { name: 'Extremadura', aliases: ['extremadura'], capital: 'Mérida', capitalAliases: ['merida', 'mérida'] },
  Galicia: { name: 'Galicia', aliases: ['galicia'], capital: 'Santiago de Compostela', capitalAliases: ['santiago', 'santiago de compostela'] },
  'Comunidad de Madrid': {
    name: 'Madrid',
    aliases: ['comunidad de madrid', 'madrid'],
    capital: 'Madrid',
    capitalAliases: ['madrid'],
  },
  'Región de Murcia': {
    name: 'Murcia',
    aliases: ['region de murcia', 'región de murcia', 'murcia'],
    capital: 'Murcia',
    capitalAliases: ['murcia'],
  },
  'Comunidad Foral de Navarra': {
    name: 'Navarra',
    aliases: ['navarra', 'comunidad foral de navarra'],
    capital: 'Pamplona',
    capitalAliases: ['pamplona', 'iruña'],
  },
  'País Vasco/Euskadi': {
    name: 'País Vasco',
    aliases: ['pais vasco', 'euskadi', 'país vasco'],
    capital: 'Vitoria-Gasteiz',
    capitalAliases: ['vitoria', 'vitoria-gasteiz', 'gasteiz'],
  },
  'La Rioja': { name: 'La Rioja', aliases: ['la rioja', 'rioja'], capital: 'Logroño', capitalAliases: ['logrono', 'logroño'] },
  'Ciudad Autónoma de Ceuta': {
    name: 'Ceuta',
    aliases: ['ceuta', 'ciudad autonoma de ceuta'],
    capital: 'Ceuta',
    capitalAliases: ['ceuta'],
  },
  'Ciudad Autónoma de Melilla': {
    name: 'Melilla',
    aliases: ['melilla', 'ciudad autonoma de melilla'],
    capital: 'Melilla',
    capitalAliases: ['melilla'],
  },
}

const PROVINCE_CAPITALS = {
  Albacete: { name: 'Albacete', aliases: ['albacete'], capital: 'Albacete', capitalAliases: ['albacete'] },
  'Alacant/Alicante': { name: 'Alicante', aliases: ['alicante', 'alacant'], capital: 'Alicante', capitalAliases: ['alicante', 'alacant'] },
  Almería: { name: 'Almería', aliases: ['almeria', 'almería'], capital: 'Almería', capitalAliases: ['almeria', 'almería'] },
  Ávila: { name: 'Ávila', aliases: ['avila', 'ávila'], capital: 'Ávila', capitalAliases: ['avila', 'ávila'] },
  Badajoz: { name: 'Badajoz', aliases: ['badajoz'], capital: 'Badajoz', capitalAliases: ['badajoz'] },
  'Illes Balears': { name: 'Islas Baleares', aliases: ['islas baleares', 'baleares'], capital: 'Palma', capitalAliases: ['palma', 'palma de mallorca'] },
  Barcelona: { name: 'Barcelona', aliases: ['barcelona'], capital: 'Barcelona', capitalAliases: ['barcelona'] },
  Burgos: { name: 'Burgos', aliases: ['burgos'], capital: 'Burgos', capitalAliases: ['burgos'] },
  Cáceres: { name: 'Cáceres', aliases: ['caceres', 'cáceres'], capital: 'Cáceres', capitalAliases: ['caceres', 'cáceres'] },
  Cádiz: { name: 'Cádiz', aliases: ['cadiz', 'cádiz'], capital: 'Cádiz', capitalAliases: ['cadiz', 'cádiz'] },
  'Castelló/Castellón': { name: 'Castellón', aliases: ['castellon', 'castellón', 'castello'], capital: 'Castellón de la Plana', capitalAliases: ['castellon de la plana', 'castellón de la plana', 'castello de la plana'] },
  'Ciudad Real': { name: 'Ciudad Real', aliases: ['ciudad real'], capital: 'Ciudad Real', capitalAliases: ['ciudad real'] },
  Córdoba: { name: 'Córdoba', aliases: ['cordoba', 'córdoba'], capital: 'Córdoba', capitalAliases: ['cordoba', 'córdoba'] },
  'A Coruña': { name: 'A Coruña', aliases: ['a coruña', 'la coruña', 'coruña'], capital: 'A Coruña', capitalAliases: ['a coruña', 'la coruña', 'coruña'] },
  Cuenca: { name: 'Cuenca', aliases: ['cuenca'], capital: 'Cuenca', capitalAliases: ['cuenca'] },
  Girona: { name: 'Girona', aliases: ['girona', 'gerona'], capital: 'Girona', capitalAliases: ['girona', 'gerona'] },
  Granada: { name: 'Granada', aliases: ['granada'], capital: 'Granada', capitalAliases: ['granada'] },
  Guadalajara: { name: 'Guadalajara', aliases: ['guadalajara'], capital: 'Guadalajara', capitalAliases: ['guadalajara'] },
  Gipuzkoa: { name: 'Guipúzcoa', aliases: ['guipuzcoa', 'guipúzcoa', 'gipuzkoa'], capital: 'San Sebastián', capitalAliases: ['san sebastian', 'san sebastián', 'donostia'] },
  Huelva: { name: 'Huelva', aliases: ['huelva'], capital: 'Huelva', capitalAliases: ['huelva'] },
  Huesca: { name: 'Huesca', aliases: ['huesca'], capital: 'Huesca', capitalAliases: ['huesca'] },
  Jaén: { name: 'Jaén', aliases: ['jaen', 'jaén'], capital: 'Jaén', capitalAliases: ['jaen', 'jaén'] },
  León: { name: 'León', aliases: ['leon', 'león'], capital: 'León', capitalAliases: ['leon', 'león'] },
  Lleida: { name: 'Lleida', aliases: ['lleida', 'lerida', 'lérida'], capital: 'Lleida', capitalAliases: ['lleida', 'lerida', 'lérida'] },
  'La Rioja': { name: 'La Rioja', aliases: ['la rioja', 'rioja'], capital: 'Logroño', capitalAliases: ['logrono', 'logroño'] },
  Lugo: { name: 'Lugo', aliases: ['lugo'], capital: 'Lugo', capitalAliases: ['lugo'] },
  Madrid: { name: 'Madrid', aliases: ['madrid'], capital: 'Madrid', capitalAliases: ['madrid'] },
  Málaga: { name: 'Málaga', aliases: ['malaga', 'málaga'], capital: 'Málaga', capitalAliases: ['malaga', 'málaga'] },
  Murcia: { name: 'Murcia', aliases: ['murcia'], capital: 'Murcia', capitalAliases: ['murcia'] },
  Navarra: { name: 'Navarra', aliases: ['navarra'], capital: 'Pamplona', capitalAliases: ['pamplona', 'iruña'] },
  Ourense: { name: 'Ourense', aliases: ['ourense', 'orense'], capital: 'Ourense', capitalAliases: ['ourense', 'orense'] },
  Asturias: { name: 'Asturias', aliases: ['asturias'], capital: 'Oviedo', capitalAliases: ['oviedo'] },
  Palencia: { name: 'Palencia', aliases: ['palencia'], capital: 'Palencia', capitalAliases: ['palencia'] },
  Pontevedra: { name: 'Pontevedra', aliases: ['pontevedra'], capital: 'Pontevedra', capitalAliases: ['pontevedra'] },
  Salamanca: { name: 'Salamanca', aliases: ['salamanca'], capital: 'Salamanca', capitalAliases: ['salamanca'] },
  Cantabria: { name: 'Cantabria', aliases: ['cantabria'], capital: 'Santander', capitalAliases: ['santander'] },
  Segovia: { name: 'Segovia', aliases: ['segovia'], capital: 'Segovia', capitalAliases: ['segovia'] },
  Sevilla: { name: 'Sevilla', aliases: ['sevilla'], capital: 'Sevilla', capitalAliases: ['sevilla'] },
  Soria: { name: 'Soria', aliases: ['soria'], capital: 'Soria', capitalAliases: ['soria'] },
  Tarragona: { name: 'Tarragona', aliases: ['tarragona'], capital: 'Tarragona', capitalAliases: ['tarragona'] },
  Teruel: { name: 'Teruel', aliases: ['teruel'], capital: 'Teruel', capitalAliases: ['teruel'] },
  Toledo: { name: 'Toledo', aliases: ['toledo'], capital: 'Toledo', capitalAliases: ['toledo'] },
  'València/Valencia': { name: 'Valencia', aliases: ['valencia', 'valència'], capital: 'Valencia', capitalAliases: ['valencia', 'valència'] },
  Valladolid: { name: 'Valladolid', aliases: ['valladolid'], capital: 'Valladolid', capitalAliases: ['valladolid'] },
  Bizkaia: { name: 'Vizcaya', aliases: ['vizcaya', 'bizkaia'], capital: 'Bilbao', capitalAliases: ['bilbao'] },
  Zamora: { name: 'Zamora', aliases: ['zamora'], capital: 'Zamora', capitalAliases: ['zamora'] },
  Zaragoza: { name: 'Zaragoza', aliases: ['zaragoza'], capital: 'Zaragoza', capitalAliases: ['zaragoza'] },
  Ceuta: { name: 'Ceuta', aliases: ['ceuta'], capital: 'Ceuta', capitalAliases: ['ceuta'] },
  Melilla: { name: 'Melilla', aliases: ['melilla'], capital: 'Melilla', capitalAliases: ['melilla'] },
  'Araba/Álava': { name: 'Álava', aliases: ['alava', 'álava', 'araba'], capital: 'Vitoria-Gasteiz', capitalAliases: ['vitoria', 'vitoria-gasteiz', 'gasteiz'] },
  'Las Palmas': { name: 'Las Palmas', aliases: ['las palmas'], capital: 'Las Palmas de Gran Canaria', capitalAliases: ['las palmas de gran canaria', 'las palmas'] },
  'Santa Cruz de Tenerife': {
    name: 'Santa Cruz de Tenerife',
    aliases: ['santa cruz de tenerife'],
    capital: 'Santa Cruz de Tenerife',
    capitalAliases: ['santa cruz de tenerife'],
  },
}

const EUROPE_META = {
  Albania: { name: 'Albania', aliases: ['albania'], capital: 'Tirana', capitalAliases: ['tirana'] },
  Andorra: { name: 'Andorra', aliases: ['andorra'], capital: 'Andorra la Vella', capitalAliases: ['andorra la vella'] },
  Armenia: { name: 'Armenia', aliases: ['armenia'], capital: 'Ereván', capitalAliases: ['erevan', 'ereván', 'yerevan'] },
  Austria: { name: 'Austria', aliases: ['austria'], capital: 'Viena', capitalAliases: ['viena', 'wien'] },
  Azerbaijan: { name: 'Azerbaiyán', aliases: ['azerbaiyan', 'azerbaiyán'], capital: 'Bakú', capitalAliases: ['baku', 'bakú'] },
  Belarus: { name: 'Bielorrusia', aliases: ['bielorrusia', 'belarus'], capital: 'Minsk', capitalAliases: ['minsk'] },
  Belgium: { name: 'Bélgica', aliases: ['belgica', 'bélgica'], capital: 'Bruselas', capitalAliases: ['bruselas', 'brussels'] },
  'Bosnia and Herzegovina': {
    name: 'Bosnia y Herzegovina',
    aliases: ['bosnia', 'bosnia y herzegovina'],
    capital: 'Sarajevo',
    capitalAliases: ['sarajevo'],
  },
  Bulgaria: { name: 'Bulgaria', aliases: ['bulgaria'], capital: 'Sofía', capitalAliases: ['sofia', 'sofía'] },
  Croatia: { name: 'Croacia', aliases: ['croacia'], capital: 'Zagreb', capitalAliases: ['zagreb'] },
  Cyprus: { name: 'Chipre', aliases: ['chipre'], capital: 'Nicosia', capitalAliases: ['nicosia'] },
  'Czech Republic': {
    name: 'República Checa',
    aliases: ['republica checa', 'república checa', 'chequia', 'czechia'],
    capital: 'Praga',
    capitalAliases: ['praga', 'prague'],
  },
  Denmark: { name: 'Dinamarca', aliases: ['dinamarca'], capital: 'Copenhague', capitalAliases: ['copenhague', 'copenhagen'] },
  Estonia: { name: 'Estonia', aliases: ['estonia'], capital: 'Tallin', capitalAliases: ['tallin', 'tallinn'] },
  Finland: { name: 'Finlandia', aliases: ['finlandia'], capital: 'Helsinki', capitalAliases: ['helsinki'] },
  France: { name: 'Francia', aliases: ['francia'], capital: 'París', capitalAliases: ['paris', 'parís'] },
  Georgia: { name: 'Georgia', aliases: ['georgia'], capital: 'Tiflis', capitalAliases: ['tiflis', 'tbilisi'] },
  Germany: { name: 'Alemania', aliases: ['alemania'], capital: 'Berlín', capitalAliases: ['berlin', 'berlín'] },
  Greece: { name: 'Grecia', aliases: ['grecia'], capital: 'Atenas', capitalAliases: ['atenas', 'athens'] },
  Hungary: { name: 'Hungría', aliases: ['hungria', 'hungría'], capital: 'Budapest', capitalAliases: ['budapest'] },
  Iceland: { name: 'Islandia', aliases: ['islandia'], capital: 'Reikiavik', capitalAliases: ['reikiavik', 'reykjavik'] },
  Ireland: { name: 'Irlanda', aliases: ['irlanda'], capital: 'Dublín', capitalAliases: ['dublin', 'dublín'] },
  Italy: { name: 'Italia', aliases: ['italia'], capital: 'Roma', capitalAliases: ['roma', 'rome'] },
  Latvia: { name: 'Letonia', aliases: ['letonia'], capital: 'Riga', capitalAliases: ['riga'] },
  Liechtenstein: { name: 'Liechtenstein', aliases: ['liechtenstein'], capital: 'Vaduz', capitalAliases: ['vaduz'] },
  Lithuania: { name: 'Lituania', aliases: ['lituania'], capital: 'Vilna', capitalAliases: ['vilna', 'vilnius'] },
  Luxembourg: { name: 'Luxemburgo', aliases: ['luxemburgo'], capital: 'Luxemburgo', capitalAliases: ['luxemburgo'] },
  Malta: { name: 'Malta', aliases: ['malta'], capital: 'La Valeta', capitalAliases: ['la valeta', 'valletta'] },
  Monaco: { name: 'Mónaco', aliases: ['monaco', 'mónaco'], capital: 'Mónaco', capitalAliases: ['monaco', 'mónaco'] },
  Montenegro: { name: 'Montenegro', aliases: ['montenegro'], capital: 'Podgorica', capitalAliases: ['podgorica'] },
  Netherlands: { name: 'Países Bajos', aliases: ['paises bajos', 'países bajos', 'holanda'], capital: 'Ámsterdam', capitalAliases: ['amsterdam', 'ámsterdam'] },
  Norway: { name: 'Noruega', aliases: ['noruega'], capital: 'Oslo', capitalAliases: ['oslo'] },
  Poland: { name: 'Polonia', aliases: ['polonia'], capital: 'Varsovia', capitalAliases: ['varsovia', 'warsaw'] },
  Portugal: { name: 'Portugal', aliases: ['portugal'], capital: 'Lisboa', capitalAliases: ['lisboa'] },
  Romania: { name: 'Rumanía', aliases: ['rumania', 'rumanía'], capital: 'Bucarest', capitalAliases: ['bucarest', 'bucharest'] },
  'Republic of Moldova': { name: 'Moldavia', aliases: ['moldavia', 'moldova'], capital: 'Chisináu', capitalAliases: ['chisinau', 'chisináu', 'kishinev'] },
  Russia: { name: 'Rusia', aliases: ['rusia'], capital: 'Moscú', capitalAliases: ['moscu', 'moscú', 'moscow'] },
  'San Marino': { name: 'San Marino', aliases: ['san marino'], capital: 'San Marino', capitalAliases: ['san marino'] },
  Serbia: { name: 'Serbia', aliases: ['serbia'], capital: 'Belgrado', capitalAliases: ['belgrado', 'belgrade'] },
  Slovakia: { name: 'Eslovaquia', aliases: ['eslovaquia'], capital: 'Bratislava', capitalAliases: ['bratislava'] },
  Slovenia: { name: 'Eslovenia', aliases: ['eslovenia'], capital: 'Liubliana', capitalAliases: ['liubliana', 'ljubljana'] },
  Spain: { name: 'España', aliases: ['espana', 'españa'], capital: 'Madrid', capitalAliases: ['madrid'] },
  Sweden: { name: 'Suecia', aliases: ['suecia'], capital: 'Estocolmo', capitalAliases: ['estocolmo', 'stockholm'] },
  Switzerland: { name: 'Suiza', aliases: ['suiza'], capital: 'Berna', capitalAliases: ['berna', 'bern'] },
  Turkey: { name: 'Turquía', aliases: ['turquia', 'turquía'], capital: 'Ankara', capitalAliases: ['ankara'] },
  'United Kingdom': { name: 'Reino Unido', aliases: ['reino unido', 'inglaterra', 'uk'], capital: 'Londres', capitalAliases: ['londres', 'london'] },
  Ukraine: { name: 'Ucrania', aliases: ['ucrania'], capital: 'Kiev', capitalAliases: ['kiev', 'kyiv'] },
  'The former Yugoslav Republic of Macedonia': {
    name: 'Macedonia del Norte',
    aliases: ['macedonia del norte', 'macedonia'],
    capital: 'Skopie',
    capitalAliases: ['skopie', 'skopje'],
  },
  'Holy See (Vatican City)': {
    name: 'Ciudad del Vaticano',
    aliases: ['vaticano', 'ciudad del vaticano', 'santa sede'],
    capital: 'Ciudad del Vaticano',
    capitalAliases: ['vaticano', 'ciudad del vaticano'],
  },
  'Faroe Islands': {
    name: 'Islas Feroe',
    aliases: ['islas feroe', 'feroe'],
    capital: 'Tórshavn',
    capitalAliases: ['torshavn', 'tórshavn'],
  },
}

const slugify = (value) =>
  value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const toPercentLabel = (centroid, viewBox) => ({
  x: Number(((centroid[0] / viewBox.width) * 100).toFixed(2)),
  y: Number(((centroid[1] / viewBox.height) * 100).toFixed(2)),
})

const createProjectionForExtent = (features, topLeft, bottomRight) => {
  const projection = geoMercator().fitExtent([topLeft, bottomRight], {
    type: 'FeatureCollection',
    features,
  })

  return { projection, path: geoPath(projection) }
}

const createProjectionForAlignedExtent = (features, topLeft, bottomRight) => {
  const { projection } = createProjectionForExtent(features, topLeft, bottomRight)
  const path = geoPath(projection)
  let minX = Infinity
  let minY = Infinity

  for (const featureItem of features) {
    const bounds = path.bounds(featureItem)
    minX = Math.min(minX, bounds[0][0])
    minY = Math.min(minY, bounds[0][1])
  }

  const [translateX, translateY] = projection.translate()
  projection.translate([translateX + (topLeft[0] - minX), translateY + (topLeft[1] - minY)])

  return { projection, path: geoPath(projection) }
}

const isCanaryRegion = (item) => CANARY_REGION_NAMES.has(item.properties.name)
const isCanaryProvince = (item) => CANARY_PROVINCE_NAMES.has(item.properties.name)
const isIcelandCountry = (item) => item.properties.NAME === ICELAND_COUNTRY_NAME

const buildSpainPaths = (features, layer, getId, isCanaryFeature, projections) =>
  features
    .map((featureItem) => {
      const id = getId(featureItem)
      const pathGenerator = isCanaryFeature(featureItem)
        ? projections.canary.path
        : projections.mainland.path
      const d = pathGenerator(featureItem)
      if (!d) return ''
      return `<path id="${id}" data-layer="${layer}" d="${d}" />`
    })
    .join('\n    ')

const projectSpainCentroid = (featureItem, isCanaryFeature, projections) => {
  const projection = isCanaryFeature(featureItem)
    ? projections.canary.projection
    : projections.mainland.projection

  return projection(geoCentroid(featureItem))
}

const buildEuropePaths = (features, layer, getId, useIcelandProjection, projections) =>
  features
    .map((featureItem) => {
      const id = getId(featureItem)
      const pathGenerator = useIcelandProjection(featureItem)
        ? projections.iceland.path
        : projections.mainland.path
      const d = pathGenerator(featureItem)
      if (!d) return ''
      return `<path id="${id}" data-layer="${layer}" d="${d}" />`
    })
    .join('\n    ')

const projectEuropeCentroid = (featureItem, useIcelandProjection, projections) => {
  const projection = useIcelandProjection(featureItem)
    ? projections.iceland.projection
    : projections.mainland.projection

  return projection(geoCentroid(featureItem))
}

const ensureDirs = () => {
  fs.mkdirSync(mapsDir, { recursive: true })
  fs.mkdirSync(dataDir, { recursive: true })
}

const loadSpainTopo = () => {
  const regionsTopo = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'node_modules/es-atlas/es/autonomous_regions.json'), 'utf8'),
  )
  const provincesTopo = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'node_modules/es-atlas/es/provinces.json'), 'utf8'),
  )

  const regions = feature(regionsTopo, regionsTopo.objects.autonomous_regions).features.filter(
    (item) => !EXCLUDED_SPAIN_NAMES.has(item.properties.name),
  )

  const provinces = feature(provincesTopo, provincesTopo.objects.provinces).features.filter(
    (item) => !EXCLUDED_SPAIN_NAMES.has(item.properties.name),
  )

  return { regions, provinces }
}

const loadEuropeGeo = () => {
  const europePath = path.join(rootDir, 'data-sources/europe.geojson')
  const geo = JSON.parse(fs.readFileSync(europePath, 'utf8'))
  return geo.features.filter((item) => EUROPE_META[item.properties.NAME])
}

const loadNorthAfricaCoast = () => {
  const moroccoPath = path.join(rootDir, 'data-sources/morocco.geojson')
  const morocco = JSON.parse(fs.readFileSync(moroccoPath, 'utf8')).features[0]

  return [morocco]
}

const writeSpainAssets = (regions, provinces) => {
  const mainlandRegions = regions.filter((item) => !isCanaryRegion(item))
  const canaryRegions = regions.filter(isCanaryRegion)
  const mainlandProvinces = provinces.filter((item) => !isCanaryProvince(item))
  const canaryProvinces = provinces.filter(isCanaryProvince)

  const projections = {
    mainland: createProjectionForExtent(
      [...mainlandRegions, ...mainlandProvinces],
      SPAIN_MAIN_EXTENT.topLeft,
      SPAIN_MAIN_EXTENT.bottomRight,
    ),
    canary: createProjectionForExtent(
      [...canaryRegions, ...canaryProvinces],
      SPAIN_CANARY_INSET.topLeft,
      SPAIN_CANARY_INSET.bottomRight,
    ),
  }

  const mainlandCommunityPaths = buildSpainPaths(
    mainlandRegions,
    'comunidad',
    (item) => slugify(COMMUNITY_META[item.properties.name].name),
    () => false,
    projections,
  )

  const canaryCommunityPaths = buildSpainPaths(
    canaryRegions,
    'comunidad',
    (item) => slugify(COMMUNITY_META[item.properties.name].name),
    () => true,
    projections,
  )

  const mainlandProvincePaths = buildSpainPaths(
    mainlandProvinces,
    'provincia',
    (item) => `provincia-${slugify(PROVINCE_CAPITALS[item.properties.name].name)}`,
    () => false,
    projections,
  )

  const canaryProvincePaths = buildSpainPaths(
    canaryProvinces,
    'provincia',
    (item) => `provincia-${slugify(PROVINCE_CAPITALS[item.properties.name].name)}`,
    () => true,
    projections,
  )

  const africaCoastPaths = loadNorthAfricaCoast()
    .map((coastFeature) => {
      const d = projections.mainland.path(coastFeature)
      if (!d) return ''
      return `<path id="africa-coast-morocco" data-layer="referencia" d="${d}" />`
    })
    .join('\n    ')

  const { frame } = SPAIN_CANARY_INSET

  const spainSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SPAIN_VIEWBOX.width} ${SPAIN_VIEWBOX.height}" role="img" aria-label="Mapa simplificado de España">
  <g id="africa-coast" fill="#e7e5e4" stroke="#a8a29e" stroke-width="0.9">
    ${africaCoastPaths}
  </g>
  <g id="peninsula">
    <g id="comunidades-peninsula" fill="#dbeafe" stroke="#2563eb" stroke-width="1.2">
      ${mainlandCommunityPaths}
    </g>
    <g id="provincias-peninsula" fill="transparent" stroke="#64748b" stroke-width="0.6">
      ${mainlandProvincePaths}
    </g>
  </g>
  <g id="canarias-inset">
    <rect
      x="${frame.x}"
      y="${frame.y}"
      width="${frame.width}"
      height="${frame.height}"
      rx="10"
      fill="#f8fafc"
      stroke="#94a3b8"
      stroke-width="1.2"
      stroke-dasharray="5 4"
    />
    <text x="${frame.x + 12}" y="${frame.y + 20}" font-size="13" fill="#64748b" font-family="system-ui, sans-serif">Canarias</text>
    <g id="comunidades-canarias" fill="#dbeafe" stroke="#2563eb" stroke-width="1.2">
      ${canaryCommunityPaths}
    </g>
    <g id="provincias-canarias" fill="transparent" stroke="#64748b" stroke-width="0.6">
      ${canaryProvincePaths}
    </g>
  </g>
</svg>`

  fs.writeFileSync(path.join(mapsDir, 'spain.svg'), spainSvg)

  const communityItems = regions.map((item) => {
    const sourceName = item.properties.name
    const meta = COMMUNITY_META[sourceName]
    const centroid = projectSpainCentroid(item, isCanaryRegion, projections)
    const label = toPercentLabel(centroid, SPAIN_VIEWBOX)

    return {
      id: slugify(meta.name),
      name: meta.name,
      aliases: meta.aliases,
      svgPathId: slugify(meta.name),
      label,
      capital: {
        name: meta.capital,
        aliases: meta.capitalAliases,
        label,
      },
    }
  })

  const provinciaItems = provinces.map((item) => {
    const sourceName = item.properties.name
    const meta = PROVINCE_CAPITALS[sourceName]
    const centroid = projectSpainCentroid(item, isCanaryProvince, projections)
    const label = toPercentLabel(centroid, SPAIN_VIEWBOX)

    return {
      id: `provincia-${slugify(meta.name)}`,
      name: meta.name,
      aliases: meta.aliases,
      svgPathId: `provincia-${slugify(meta.name)}`,
      label,
      capital: {
        name: meta.capital,
        aliases: meta.capitalAliases,
        label,
      },
    }
  })

  fs.writeFileSync(
    path.join(dataDir, 'spain-comunidades.json'),
    JSON.stringify(
      {
        id: 'comunidades',
        region: 'spain',
        title: 'Comunidades autónomas',
        map: '/maps/spain.svg',
        viewBox: `0 0 ${SPAIN_VIEWBOX.width} ${SPAIN_VIEWBOX.height}`,
        hiddenCount: 10,
        layer: 'comunidad',
        items: communityItems,
      },
      null,
      2,
    ),
  )

  fs.writeFileSync(
    path.join(dataDir, 'spain-provincias.json'),
    JSON.stringify(
      {
        id: 'provincias',
        region: 'spain',
        title: 'Provincias',
        map: '/maps/spain.svg',
        viewBox: `0 0 ${SPAIN_VIEWBOX.width} ${SPAIN_VIEWBOX.height}`,
        hiddenCount: 10,
        layer: 'provincia',
        items: provinciaItems,
      },
      null,
      2,
    ),
  )
}

const writeEuropeAssets = (countries) => {
  const mainlandCountries = countries.filter((item) => !isIcelandCountry(item))
  const icelandCountries = countries.filter(isIcelandCountry)

  const projections = {
    mainland: createProjectionForAlignedExtent(
      mainlandCountries,
      EUROPE_MAIN_EXTENT.topLeft,
      EUROPE_MAIN_EXTENT.bottomRight,
    ),
    iceland: createProjectionForExtent(
      icelandCountries,
      EUROPE_ICELAND_INSET.topLeft,
      EUROPE_ICELAND_INSET.bottomRight,
    ),
  }

  const mainlandCountryPaths = buildEuropePaths(
    mainlandCountries,
    'pais',
    (item) => slugify(EUROPE_META[item.properties.NAME].name),
    () => false,
    projections,
  )

  const icelandCountryPaths = buildEuropePaths(
    icelandCountries,
    'pais',
    (item) => slugify(EUROPE_META[item.properties.NAME].name),
    () => true,
    projections,
  )

  const { frame } = EUROPE_ICELAND_INSET

  const europeSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${EUROPE_VIEWBOX.width} ${EUROPE_VIEWBOX.height}" role="img" aria-label="Mapa simplificado de Europa">
  <g id="continente">
    <g id="paises-continente" fill="#dcfce7" stroke="#16a34a" stroke-width="1">
      ${mainlandCountryPaths}
    </g>
  </g>
  <g id="islandia-inset">
    <rect
      x="${frame.x}"
      y="${frame.y}"
      width="${frame.width}"
      height="${frame.height}"
      rx="10"
      fill="#f8fafc"
      stroke="#94a3b8"
      stroke-width="1.2"
      stroke-dasharray="5 4"
    />
    <text x="${frame.x + 12}" y="${frame.y + 20}" font-size="13" fill="#64748b" font-family="system-ui, sans-serif">Islandia</text>
    <g id="paises-islandia" fill="#dcfce7" stroke="#16a34a" stroke-width="1">
      ${icelandCountryPaths}
    </g>
  </g>
</svg>`

  fs.writeFileSync(path.join(mapsDir, 'europe.svg'), europeSvg)

  const countryItems = countries.map((item) => {
    const meta = EUROPE_META[item.properties.NAME]
    const centroid = projectEuropeCentroid(item, isIcelandCountry, projections)
    const label = toPercentLabel(centroid, EUROPE_VIEWBOX)

    return {
      id: slugify(meta.name),
      name: meta.name,
      aliases: meta.aliases,
      svgPathId: slugify(meta.name),
      label,
      capital: {
        name: meta.capital,
        aliases: meta.capitalAliases,
        label,
      },
    }
  })

  const capitalItems = countryItems.map((item) => ({
    id: `capital-${item.id}`,
    name: item.capital.name,
    aliases: item.capital.aliases,
    country: item.name,
    countryAliases: item.aliases,
    svgPathId: item.id,
    label: item.capital.label,
  }))

  fs.writeFileSync(
    path.join(dataDir, 'europe-paises.json'),
    JSON.stringify(
      {
        id: 'paises',
        region: 'europe',
        title: 'Países de Europa',
        map: '/maps/europe.svg',
        viewBox: `0 0 ${EUROPE_VIEWBOX.width} ${EUROPE_VIEWBOX.height}`,
        hiddenCount: 10,
        layer: 'pais',
        items: countryItems,
      },
      null,
      2,
    ),
  )

  fs.writeFileSync(
    path.join(dataDir, 'europe-capitales.json'),
    JSON.stringify(
      {
        id: 'capitales',
        region: 'europe',
        title: 'Capitales europeas',
        map: '/maps/europe.svg',
        viewBox: `0 0 ${EUROPE_VIEWBOX.width} ${EUROPE_VIEWBOX.height}`,
        hiddenCount: 10,
        layer: 'capital',
        items: capitalItems,
      },
      null,
      2,
    ),
  )
}

const main = () => {
  ensureDirs()
  const { regions, provinces } = loadSpainTopo()
  const countries = loadEuropeGeo()

  writeSpainAssets(regions, provinces)
  writeEuropeAssets(countries)

  console.log('Mapas y datos generados en public/maps y public/data')
}

main()
