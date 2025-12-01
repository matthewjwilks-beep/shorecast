const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Locations: slug -> { name, stationId, lat, lon, facing }
const locations = {
  // ===================
  // SOUTH WALES
  // ===================
  barry: { name: "Barry Island", stationId: "0513", lat: 51.39, lon: -3.26, facing: "south" },
  penarth: { name: "Penarth", stationId: "0514", lat: 51.43, lon: -3.17, facing: "south" },
  coldknap: { name: "Cold Knap", stationId: "0513", lat: 51.40, lon: -3.28, facing: "south" },
  colhuw: { name: "Col-Huw Beach", stationId: "0513", lat: 51.40, lon: -3.49, facing: "south" },
  porthcawl: { name: "Porthcawl", stationId: "0512", lat: 51.48, lon: -3.70, facing: "southwest" },
  restbay: { name: "Rest Bay", stationId: "0512", lat: 51.49, lon: -3.72, facing: "west" },
  ogmore: { name: "Ogmore-by-Sea", stationId: "0512", lat: 51.46, lon: -3.64, facing: "southwest" },
  southerndown: { name: "Southerndown", stationId: "0512", lat: 51.45, lon: -3.60, facing: "south" },
  aberafan: { name: "Aberafan", stationId: "0512", lat: 51.59, lon: -3.81, facing: "southwest" },
  swanseabay: { name: "Swansea Bay", stationId: "0508", lat: 51.61, lon: -3.97, facing: "south" },
  pembrey: { name: "Pembrey", stationId: "0508", lat: 51.69, lon: -4.31, facing: "south" },
  pendine: { name: "Pendine", stationId: "0508", lat: 51.77, lon: -4.56, facing: "south" },

  // ===================
  // GOWER
  // ===================
  mumbles: { name: "Mumbles", stationId: "0508", lat: 51.57, lon: -3.98, facing: "south" },
  braceletbay: { name: "Bracelet Bay", stationId: "0508", lat: 51.57, lon: -3.98, facing: "south" },
  limeslade: { name: "Limeslade Bay", stationId: "0508", lat: 51.57, lon: -3.99, facing: "south" },
  langland: { name: "Langland Bay", stationId: "0508", lat: 51.57, lon: -3.98, facing: "south" },
  caswell: { name: "Caswell Bay", stationId: "0508", lat: 51.57, lon: -3.97, facing: "south" },
  oxwich: { name: "Oxwich Bay", stationId: "0508", lat: 51.56, lon: -4.15, facing: "south" },
  porteynon: { name: "Port Eynon", stationId: "0508", lat: 51.54, lon: -4.21, facing: "south" },
  rhossili: { name: "Rhossili", stationId: "0508", lat: 51.57, lon: -4.29, facing: "west" },

  // ===================
  // PEMBROKESHIRE
  // ===================
  amroth: { name: "Amroth", stationId: "0502", lat: 51.73, lon: -4.66, facing: "south" },
  wisemansbridge: { name: "Wiseman's Bridge", stationId: "0502", lat: 51.72, lon: -4.68, facing: "south" },
  coppethall: { name: "Coppet Hall", stationId: "0502", lat: 51.71, lon: -4.69, facing: "south" },
  saundersfoot: { name: "Saundersfoot", stationId: "0502", lat: 51.71, lon: -4.69, facing: "southeast" },
  tenby: { name: "Tenby North", stationId: "0502", lat: 51.67, lon: -4.70, facing: "east" },
  castlebeach: { name: "Castle Beach Tenby", stationId: "0502", lat: 51.67, lon: -4.70, facing: "east" },
  tenbysouth: { name: "Tenby South", stationId: "0502", lat: 51.66, lon: -4.70, facing: "southeast" },
  penally: { name: "Penally", stationId: "0502", lat: 51.67, lon: -4.72, facing: "southeast" },
  lydstep: { name: "Lydstep", stationId: "0502", lat: 51.64, lon: -4.74, facing: "southeast" },
  manorbier: { name: "Manorbier", stationId: "0502", lat: 51.65, lon: -4.80, facing: "south" },
  freshwatereast: { name: "Freshwater East", stationId: "0502", lat: 51.64, lon: -4.87, facing: "southeast" },
  barafundle: { name: "Barafundle Bay", stationId: "0501", lat: 51.62, lon: -4.90, facing: "south" },
  freshwaterwest: { name: "Freshwater West", stationId: "0501", lat: 51.64, lon: -5.06, facing: "west" },
  broadhaven: { name: "Broad Haven", stationId: "0492B", lat: 51.78, lon: -5.11, facing: "west" },
  littlehaven: { name: "Little Haven", stationId: "0492B", lat: 51.77, lon: -5.10, facing: "west" },
  newgale: { name: "Newgale", stationId: "0492B", lat: 51.85, lon: -5.12, facing: "west" },
  marloes: { name: "Marloes Sands", stationId: "0495", lat: 51.73, lon: -5.21, facing: "southwest" },
  dale: { name: "Dale", stationId: "0495", lat: 51.70, lon: -5.17, facing: "south" },
  caerfai: { name: "Caerfai", stationId: "0492", lat: 51.87, lon: -5.27, facing: "west" },
  whitesands: { name: "Whitesands Bay", stationId: "0492", lat: 51.88, lon: -5.30, facing: "west" },
  newportsands: { name: "Newport Sands", stationId: "0490", lat: 52.02, lon: -4.88, facing: "north" },
  poppit: { name: "Poppit Sands", stationId: "0489", lat: 52.12, lon: -4.68, facing: "northwest" },

  // ===================
  // CEREDIGION
  // ===================
  mwnt: { name: "Mwnt", stationId: "0489", lat: 52.13, lon: -4.56, facing: "northwest" },
  aberporth: { name: "Aberporth", stationId: "0488A", lat: 52.13, lon: -4.55, facing: "west" },
  tresaith: { name: "Tresaith", stationId: "0488", lat: 52.14, lon: -4.51, facing: "west" },
  penbryn: { name: "Penbryn", stationId: "0488", lat: 52.15, lon: -4.49, facing: "west" },
  llangrannog: { name: "Llangrannog", stationId: "0488", lat: 52.16, lon: -4.47, facing: "west" },
  cilborth: { name: "Cilborth", stationId: "0488", lat: 52.17, lon: -4.47, facing: "west" },
  newquay: { name: "New Quay", stationId: "0488", lat: 52.22, lon: -4.35, facing: "west" },
  aberystwyth: { name: "Aberystwyth", stationId: "0487", lat: 52.42, lon: -4.08, facing: "west" },
  clarach: { name: "Clarach South", stationId: "0487", lat: 52.44, lon: -4.07, facing: "west" },
  borth: { name: "Borth", stationId: "0487", lat: 52.49, lon: -4.05, facing: "west" },
  aberdovey: { name: "Aberdovey", stationId: "0486", lat: 52.54, lon: -4.05, facing: "west" },

  // ===================
  // GWYNEDD
  // ===================
  tywyn: { name: "Tywyn", stationId: "0486", lat: 52.59, lon: -4.09, facing: "west" },
  fairbourne: { name: "Fairbourne", stationId: "0485", lat: 52.70, lon: -4.05, facing: "west" },
  barmouth: { name: "Barmouth", stationId: "0485", lat: 52.72, lon: -4.05, facing: "west" },
  talybont: { name: "Tal-y-Bont", stationId: "0485", lat: 52.77, lon: -4.11, facing: "west" },
  llandanwg: { name: "Llandanwg", stationId: "0485", lat: 52.85, lon: -4.12, facing: "west" },
  harlech: { name: "Harlech", stationId: "0485", lat: 52.86, lon: -4.12, facing: "west" },

  // ===================
  // LLŶN PENINSULA
  // ===================
  porthneigwl: { name: "Porth Neigwl", stationId: "0482B", lat: 52.81, lon: -4.52, facing: "south" },
  abersoch: { name: "Abersoch", stationId: "0482B", lat: 52.82, lon: -4.50, facing: "south" },
  aberdaron: { name: "Aberdaron", stationId: "0482A", lat: 52.80, lon: -4.72, facing: "west" },
  pwllheli: { name: "Pwllheli", stationId: "0483", lat: 52.89, lon: -4.40, facing: "south" },
  criccieth: { name: "Criccieth", stationId: "0483A", lat: 52.92, lon: -4.23, facing: "south" },
  morfanefyn: { name: "Morfa Nefyn", stationId: "0481", lat: 52.94, lon: -4.56, facing: "north" },
  porthnefyn: { name: "Porth Nefyn", stationId: "0481", lat: 52.94, lon: -4.52, facing: "north" },
  porthdinllaen: { name: "Porth Dinllaen", stationId: "0481", lat: 52.94, lon: -4.56, facing: "north" },
  morfadinlle: { name: "Morfa Dinlle", stationId: "0480", lat: 53.06, lon: -4.39, facing: "west" },

  // ===================
  // ANGLESEY
  // ===================
  llanddwyn: { name: "Llanddwyn", stationId: "0480", lat: 53.13, lon: -4.41, facing: "southwest" },
  aberffraw: { name: "Aberffraw", stationId: "0479", lat: 53.19, lon: -4.47, facing: "west" },
  rhosneigr: { name: "Rhosneigr", stationId: "0479A", lat: 53.23, lon: -4.51, facing: "west" },
  silverbay: { name: "Silver Bay", stationId: "0479", lat: 53.25, lon: -4.58, facing: "west" },
  trearddur: { name: "Trearddur Bay", stationId: "0479", lat: 53.27, lon: -4.62, facing: "west" },
  porthdafarch: { name: "Porth Dafarch", stationId: "0479", lat: 53.28, lon: -4.64, facing: "west" },
  beaumaris: { name: "Beaumaris", stationId: "0472", lat: 53.26, lon: -4.09, facing: "northeast" },
  llanddona: { name: "Llanddona", stationId: "0476A", lat: 53.31, lon: -4.07, facing: "east" },
  benllech: { name: "Benllech", stationId: "0476A", lat: 53.32, lon: -4.22, facing: "east" },
  traethlligwy: { name: "Traeth Lligwy", stationId: "0476A", lat: 53.36, lon: -4.27, facing: "northeast" },
  churchbay: { name: "Church Bay", stationId: "0477A", lat: 53.38, lon: -4.54, facing: "northwest" },
  cemaes: { name: "Cemaes Bay", stationId: "0477A", lat: 53.41, lon: -4.44, facing: "north" },

  // ===================
  // NORTH WALES COAST
  // ===================
  llanfairfechan: { name: "Llanfairfechan", stationId: "0471", lat: 53.26, lon: -3.99, facing: "north" },
  penmaenmawr: { name: "Penmaenmawr", stationId: "0471", lat: 53.27, lon: -3.93, facing: "north" },
  llandudno: { name: "Llandudno", stationId: "0471", lat: 53.32, lon: -3.83, facing: "north" },
  colwynbay: { name: "Colwyn Bay", stationId: "0470", lat: 53.29, lon: -3.72, facing: "north" },
  portheirias: { name: "Porth Eirias", stationId: "0470", lat: 53.29, lon: -3.73, facing: "north" },
  abergele: { name: "Abergele", stationId: "0470", lat: 53.28, lon: -3.58, facing: "north" },
  kinmelbay: { name: "Kinmel Bay", stationId: "0470", lat: 53.32, lon: -3.51, facing: "north" },
  prestatyn: { name: "Prestatyn", stationId: "0470", lat: 53.34, lon: -3.41, facing: "north" },

  // ===================
  // SOUTHWEST ENGLAND
  // ===================
  sennen: { name: "Sennen Cove", stationId: "0002", lat: 50.07, lon: -5.70, facing: "west" },
  falmouth: { name: "Falmouth", stationId: "0005", lat: 50.15, lon: -5.05, facing: "south" },
  looe: { name: "Looe", stationId: "0011", lat: 50.35, lon: -4.45, facing: "south" },
  salcombe: { name: "Salcombe", stationId: "0020", lat: 50.22, lon: -3.78, facing: "south" },
  torquay: { name: "Torquay", stationId: "0025", lat: 50.47, lon: -3.53, facing: "east" },
  exmouth: { name: "Exmouth", stationId: "0027", lat: 50.62, lon: -3.42, facing: "south" },
  lymeregis: { name: "Lyme Regis", stationId: "0028", lat: 50.72, lon: -2.93, facing: "south" },
  lulworth: { name: "Lulworth Cove", stationId: "0034", lat: 50.62, lon: -2.25, facing: "south" },
  swanage: { name: "Swanage", stationId: "0035", lat: 50.61, lon: -1.95, facing: "east" },
  bournemouth: { name: "Bournemouth", stationId: "0037", lat: 50.72, lon: -1.87, facing: "south" },
  brighton: { name: "Brighton", stationId: "0082", lat: 50.82, lon: -0.10, facing: "south" }
};

// =============================================================================
// SEWAGE ALERTS - Welsh Water API
// =============================================================================

const WELSH_WATER_ENDPOINT = 'https://services3.arcgis.com/KLNF7YxtENPLYVey/arcgis/rest/services/Spill_Prod__view/FeatureServer/0/query';

const BEACH_TO_WELSH_WATER = {
  // South Wales
  "Barry Island": "Whitmore Bay Barry Island",
  "Penarth": "Penarth Beach",
  "Cold Knap": "Cold Knap Barry",
  "Col-Huw Beach": "Col-Huw Beach (Llantwit Major)",
  "Porthcawl": "Sandy Bay Porthcawl",
  "Rest Bay": "Rest Bay Porthcawl",
  "Ogmore-by-Sea": "Ogmore-By-Sea",
  "Southerndown": "Southerndown",
  "Aberafan": "Aberafan",
  "Swansea Bay": "Swansea Bay",
  "Pembrey": "Pembrey",
  "Pendine": "Pendine",

  // Gower
  "Mumbles": "Bracelet Bay",
  "Bracelet Bay": "Bracelet Bay",
  "Limeslade Bay": "Limeslade Bay",
  "Langland Bay": "Langland Bay",
  "Caswell Bay": "Caswell Bay",
  "Oxwich Bay": "Oxwich Bay",
  "Port Eynon": "Port Eynon Bay",
  "Rhossili": "Rhossili",

  // Pembrokeshire
  "Amroth": "Amroth Central",
  "Wiseman's Bridge": "Wiseman's Bridge",
  "Coppet Hall": "Coppet Hall",
  "Saundersfoot": "Saundersfoot",
  "Tenby North": "Tenby North",
  "Castle Beach Tenby": "Castle Beach Tenby",
  "Tenby South": "Tenby South",
  "Penally": "Penally",
  "Lydstep": "Lydstep",
  "Manorbier": "Manorbier",
  "Freshwater East": "Freshwater East",
  "Barafundle Bay": "Barafundle",
  "Freshwater West": "Freshwater West",
  "Broad Haven": "Broad Haven (Central)",
  "Little Haven": "Little Haven",
  "Newgale": "Newgale",
  "Marloes Sands": "Marloes Sands",
  "Dale": "Dale",
  "Caerfai": "Caerfai",
  "Whitesands Bay": "Whitesands",
  "Newport Sands": "Newport North",
  "Poppit Sands": "Poppit West",

  // Ceredigion
  "Mwnt": "Mwnt",
  "Aberporth": "Aberporth",
  "Tresaith": "Tresaith",
  "Penbryn": "Penbryn",
  "Llangrannog": "Llangrannog",
  "Cilborth": "Cilborth",
  "New Quay": "New Quay Harbour",
  "Aberystwyth": "Aberystwyth North",
  "Clarach South": "Clarach South",
  "Borth": "Borth",
  "Aberdovey": "Aberdyfi",

  // Gwynedd
  "Tywyn": "Tywyn",
  "Fairbourne": "Fairbourne",
  "Barmouth": "Barmouth",
  "Tal-y-Bont": "Tal-y-Bont",
  "Llandanwg": "Llandanwg",
  "Harlech": "Harlech",

  // Llŷn Peninsula
  "Porth Neigwl": "Porth Neigwl",
  "Abersoch": "Abersoch",
  "Aberdaron": "Aberdaron",
  "Pwllheli": "Glan Don Beach",
  "Criccieth": "Criccieth",
  "Morfa Nefyn": "Morfa Nefyn",
  "Porth Nefyn": "Porth Nefyn",
  "Porth Dinllaen": "Morfa Nefyn",
  "Morfa Dinlle": "Morfa Dinlle",

  // Anglesey
  "Llanddwyn": "Llanddwyn",
  "Aberffraw": "Aberffraw",
  "Rhosneigr": "Rhosneigr",
  "Silver Bay": "Silver Bay Rhoscolyn",
  "Trearddur Bay": "Trearddur Bay",
  "Porth Dafarch": "Porth Dafarch",
  "Beaumaris": "Beaumaris",
  "Llanddona": "Llanddona",
  "Benllech": "Benllech",
  "Traeth Lligwy": "Traeth Lligwy",
  "Church Bay": "Church Bay",
  "Cemaes Bay": "Cemaes",

  // North Wales Coast
  "Llanfairfechan": "Llanfairfechan",
  "Penmaenmawr": "Penmaenmawr",
  "Llandudno": "Llandudno West Shore",
  "Colwyn Bay": "Colwyn Bay",
  "Porth Eirias": "Colwyn Bay Porth Eirias",
  "Abergele": "Abergele (Pensarn)",
  "Kinmel Bay": "Kinmel Bay (Sandy Cove)",
  "Prestatyn": "Prestatyn"
};

async function fetchWelshSewageStatus(beachName) {
  const wwName = BEACH_TO_WELSH_WATER[beachName];
  if (!wwName) return { status: 'no_data', message: 'No sewage monitoring data available', safetyRank: null };
  
  try {
    const safeName = wwName.replace(/'/g, "''");
    const params = new URLSearchParams({
      where: `Linked_Bathing_Water LIKE '%${safeName}%'`,
      outFields: 'asset_name,status,discharge_duration_last_7_daysH,Receiving_Water',
      returnGeometry: 'false',
      f: 'json'
    });
    
    const response = await fetch(`${WELSH_WATER_ENDPOINT}?${params}`);
    if (!response.ok) throw new Error('Welsh Water API error');
    
    const data = await response.json();
    const features = data.features || [];
    
    if (features.length === 0) return { status: 'no_monitors', message: 'No nearby sewage outfalls', safetyRank: 1 };
    
    const active = features.filter(f => f.attributes.status === 'Overflow Operating');
    const recent24h = features.filter(f => (f.attributes.status || '').includes('Has in the last 24 hours'));
    const investigating = features.filter(f => f.attributes.status === 'Under Investigation');
    const total7dHours = features.reduce((sum, f) => sum + (f.attributes.discharge_duration_last_7_daysH || 0), 0);
    
    if (active.length > 0) return { status: 'warning', message: `${active.length} active sewage discharge${active.length > 1 ? 's' : ''}`, hours7d: total7dHours, safetyRank: 6 };
    if (recent24h.length > 0) return { status: 'recent', message: 'Discharge in last 24 hours', hours7d: total7dHours, safetyRank: 5 };
    if (investigating.length > 0) return { status: 'caution', message: 'Monitor under investigation', hours7d: total7dHours, safetyRank: 4 };
    if (total7dHours > 12) return { status: 'recent_week', message: `${Math.round(total7dHours)} hours discharge in last 7 days`, hours7d: total7dHours, safetyRank: 3 };
    
    return { status: 'clear', message: 'No recent discharge', hours7d: total7dHours, safetyRank: 2 };
  } catch (err) {
    console.error('Welsh sewage fetch error:', err.message);
    return { status: 'error', message: 'Could not check sewage status', safetyRank: null };
  }
}

// =============================================================================
// SEWAGE ALERTS - English Water APIs
// =============================================================================

const ENGLISH_SEWAGE_APIS = {
  sww: 'https://utility.arcgis.com/usrsvcs/servers/df8c2995624b470a99b5ed684b3f1853/rest/services/spillreporting_all_overflows_PROD/FeatureServer/0/query',
  southern: 'https://services-eu1.arcgis.com/XxS6FebPX29TRGDJ/arcgis/rest/services/Southern_Water_Storm_Overflow_Activity/FeatureServer/0/query',
  wessex: 'https://services.arcgis.com/3SZ6e0uCvPROr4mS/arcgis/rest/services/Wessex_Water_Storm_Overflow_Activity/FeatureServer/0/query'
};

const ENGLISH_BEACHES = {
  sennen: { company: 'sww', beachName: 'SENNEN' },
  falmouth: { company: 'sww', beachName: 'GYLLYNGVASE' },
  looe: { company: 'sww', beachName: 'LOOE' },
  salcombe: { company: 'sww', beachName: 'SOUTH SANDS' },
  torquay: { company: 'sww', beachName: 'TORRE ABBEY' },
  exmouth: { company: 'sww', beachName: 'EXMOUTH' },
  lymeregis: { company: 'sww', beachName: 'LYME REGIS' },
  lulworth: { company: 'wessex', lat: 50.6199, lng: -2.2485 },
  swanage: { company: 'wessex', lat: 50.6078, lng: -1.9571 },
  bournemouth: { company: 'wessex', lat: 50.7167, lng: -1.8750 },
  brighton: { company: 'southern', lat: 50.8214, lng: -0.1372 }
};

async function fetchSWWSewageStatus(beachSlug) {
  const beach = ENGLISH_BEACHES[beachSlug];
  if (!beach || beach.company !== 'sww') return null;

  try {
    const params = new URLSearchParams({
      where: `beach LIKE '%${beach.beachName}%'`,
      outFields: 'name,beach,isActivated,activationStartedUtc,activationStoppedUtc',
      returnGeometry: false,
      f: 'json'
    });

    const response = await fetch(`${ENGLISH_SEWAGE_APIS.sww}?${params}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    return parseSWWResponse(data.features || [], beach.beachName);
  } catch (error) {
    console.error(`SWW API error:`, error.message);
    return { status: 'error', safetyRank: null };
  }
}

function parseSWWResponse(features, beachName) {
  if (!features.length) return { status: 'no_data', message: `No monitors for ${beachName}`, safetyRank: null };

  const active = features.filter(f => f.attributes.isActivated === 1);
  const recent = features.filter(f => {
    if (f.attributes.isActivated === 1) return false;
    const stop = f.attributes.activationStoppedUtc;
    if (!stop) return false;
    const hours = (Date.now() - new Date(stop).getTime()) / 3600000;
    return hours > 0 && hours < 48;
  });

  if (active.length > 0) return { status: 'warning', count: active.length, total: features.length, safetyRank: 6 };
  if (recent.length > 0) return { status: 'recent', count: recent.length, total: features.length, safetyRank: 5 };
  return { status: 'clear', total: features.length, safetyRank: 2 };
}

async function fetchNSOHSewageStatus(beachSlug) {
  const beach = ENGLISH_BEACHES[beachSlug];
  if (!beach || beach.company === 'sww') return null;

  const apiUrl = ENGLISH_SEWAGE_APIS[beach.company];
  if (!apiUrl) return { status: 'error', safetyRank: null };

  try {
    const params = new URLSearchParams({
      where: '1=1',
      geometry: JSON.stringify({ x: beach.lng, y: beach.lat, spatialReference: { wkid: 4326 } }),
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      distance: 3000,
      units: 'esriSRUnit_Meter',
      outFields: '*',
      returnGeometry: false,
      f: 'json'
    });

    const response = await fetch(`${apiUrl}?${params}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    return parseNSOHResponse(data.features || []);
  } catch (error) {
    console.error(`NSOH API error for ${beachSlug}:`, error.message);
    return { status: 'error', safetyRank: null };
  }
}

function parseNSOHResponse(features) {
  if (!features.length) return { status: 'no_data', safetyRank: null };

  const active = features.filter(f => f.attributes.Status === 1);
  const recent = features.filter(f => {
    if (f.attributes.Status === 1) return false;
    const stop = f.attributes.LatestEventEnd;
    if (!stop) return false;
    const hours = (Date.now() - stop) / 3600000;
    return hours > 0 && hours < 48;
  });

  if (active.length > 0) return { status: 'warning', count: active.length, total: features.length, safetyRank: 6 };
  if (recent.length > 0) return { status: 'recent', count: recent.length, total: features.length, safetyRank: 5 };
  return { status: 'clear', total: features.length, safetyRank: 2 };
}

async function fetchEnglishSewageStatus(beachSlug) {
  const beach = ENGLISH_BEACHES[beachSlug];
  if (!beach) return null;
  
  if (beach.company === 'sww') return await fetchSWWSewageStatus(beachSlug);
  return await fetchNSOHSewageStatus(beachSlug);
}

// =============================================================================
// UNIFIED SEWAGE FETCH
// =============================================================================

async function fetchSewageStatus(beachSlug, beachName) {
  if (ENGLISH_BEACHES[beachSlug]) {
    return await fetchEnglishSewageStatus(beachSlug);
  }
  return await fetchWelshSewageStatus(beachName);
}

// =============================================================================
// RECOMMENDATION ENGINE
// =============================================================================

function getRecommendation(conditions, mode = 'swimming') {
  const issues = [];
  const positives = [];
  let status = 'green';
  let statusText = 'great';
  
  const sewage = conditions.sewage || {};
  const weather = conditions.weather || {};
  const waveHeight = conditions.waveHeightRaw || 0;
  const seaTemp = conditions.seaTempRaw || 12;
  const airTemp = weather.airTempRaw || 10;
  const feelsLike = weather.feelsLikeRaw || airTemp;
  const windSpeed = weather.windSpeedRaw || 0;
  const uvIndex = weather.uvIndex || 0;
  const cloudCover = weather.cloudCover || 0;
  const precipitation = weather.precipitation || 0;
  
  // ===================
  // SWIMMING MODE
  // ===================
  if (mode === 'swimming') {
    // Sewage - deal breaker
    if (sewage.status === 'warning') {
      status = 'red';
      statusText = 'avoid';
      issues.push('active sewage discharge');
    } else if (sewage.status === 'recent') {
      if (status !== 'red') { status = 'amber'; statusText = 'caution'; }
      issues.push('sewage discharge in last 48 hours');
    }
    
    // Waves
    if (waveHeight > 2) {
      status = 'red';
      statusText = 'rough';
      issues.push(`waves at ${waveHeight.toFixed(1)}m - very rough`);
    } else if (waveHeight > 1.5) {
      if (status !== 'red') { status = 'amber'; statusText = 'choppy'; }
      issues.push(`choppy conditions (${waveHeight.toFixed(1)}m waves)`);
    } else if (waveHeight < 0.5) {
      positives.push('calm water');
    }
    
    // Wind
    if (windSpeed > 40) {
      if (status !== 'red') { status = 'amber'; statusText = 'windy'; }
      issues.push(`strong wind (${Math.round(windSpeed)} km/h)`);
    } else if (windSpeed < 15) {
      positives.push('light breeze');
    }
    
    // Water temperature
    if (seaTemp < 8) {
      if (status !== 'red') { status = 'amber'; statusText = 'cold'; }
      issues.push(`cold water (${Math.round(seaTemp)}°C) - limit swim time`);
    } else if (seaTemp >= 14) {
      positives.push(`pleasant water temperature (${Math.round(seaTemp)}°C)`);
    }
    
    // UV warning
    if (uvIndex >= 6) {
      positives.push(`UV index ${uvIndex} - bring sun protection`);
    }
    
    // Rain
    if (precipitation > 0) {
      issues.push('rain expected');
    }
    
    // Clear conditions bonus
    if (cloudCover < 30 && status === 'green') {
      positives.push('clear skies');
    }
  }
  
  // ===================
  // DIPPING MODE
  // ===================
  if (mode === 'dipping') {
    // Sewage - stricter for dipping (more skin contact risk)
    if (sewage.status === 'warning') {
      status = 'red';
      statusText = 'avoid';
      issues.push('active sewage discharge');
    } else if (sewage.status === 'recent') {
      status = 'red';
      statusText = 'avoid';
      issues.push('recent sewage - higher risk for dipping');
    }
    
    // Water temperature - INVERTED (colder is better for dipping!)
    if (seaTemp <= 8) {
      positives.push(`proper cold at ${Math.round(seaTemp)}°C - perfect for cold therapy`);
      if (status === 'green') statusText = 'perfect';
    } else if (seaTemp <= 10) {
      positives.push(`nice and cold at ${Math.round(seaTemp)}°C`);
    } else if (seaTemp >= 13) {
      if (status !== 'red') { status = 'amber'; statusText = 'mild'; }
      issues.push(`water at ${Math.round(seaTemp)}°C - not that winter bite`);
    }
    
    // Wind chill - critical for dipping (affects recovery)
    if (feelsLike < 0) {
      if (status !== 'red') { status = 'amber'; statusText = 'bitter'; }
      issues.push(`feels like ${Math.round(feelsLike)}°C - wrap up quickly after`);
    } else if (feelsLike < 5) {
      positives.push(`brisk air (feels like ${Math.round(feelsLike)}°C) - have warm layers ready`);
    }
    
    // Rain - uncomfortable for changing
    if (precipitation > 0) {
      if (status !== 'red') { status = 'amber'; statusText = 'wet'; }
      issues.push('rain - changing will be uncomfortable');
    }
    
    // Strong wind - affects comfort
    if (windSpeed > 30) {
      if (status !== 'red') { status = 'amber'; statusText = 'blustery'; }
      issues.push(`blustery (${Math.round(windSpeed)} km/h) - find a sheltered spot`);
    }
    
    // Ignore waves for dipping - staying shallow
  }
  
  // ===================
  // BUILD RECOMMENDATION TEXT
  // ===================
  let recommendation = '';
  
  if (status === 'red') {
    if (issues.length > 0) {
      recommendation = `**not recommended.** ${issues.join('. ')}.`;
    } else {
      recommendation = `**not recommended today.**`;
    }
  } else if (status === 'amber') {
    recommendation = `**check conditions.** ${issues.join('. ')}.`;
    if (positives.length > 0) {
      recommendation += ` on the plus side: ${positives.join(', ')}.`;
    }
  } else {
    // Green
    if (positives.length > 0) {
      recommendation = `**looking good.** ${positives.join(', ')}.`;
    } else {
      recommendation = `**conditions look fine.**`;
    }
    if (issues.length > 0) {
      recommendation += ` note: ${issues.join(', ')}.`;
    }
  }
  
  // Add orientation context for sunset/sunrise
  const facing = conditions.facing;
  const hour = new Date().getHours();
  
  if (facing && status !== 'red') {
    if ((facing === 'west' || facing === 'southwest' || facing === 'northwest') && hour >= 15 && cloudCover < 50) {
      recommendation += ` west-facing beach - good for sunset.`;
    }
    if ((facing === 'east' || facing === 'southeast' || facing === 'northeast') && hour < 10 && cloudCover < 50) {
      recommendation += ` east-facing beach - catch the sunrise.`;
    }
  }
  
  return {
    status,
    statusText,
    recommendation: recommendation.trim()
  };
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

function getSunTimes(lat, lon, date = new Date()) {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const declination = -23.45 * Math.cos(rad * (360 / 365) * (dayOfYear + 10));
  const cosHourAngle = -Math.tan(lat * rad) * Math.tan(declination * rad);
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle))) / rad;
  const solarNoon = 12 - (lon / 15);
  const sunrise = solarNoon - (hourAngle / 15);
  const sunset = solarNoon + (hourAngle / 15);
  const formatTime = (h) => `${Math.floor(h).toString().padStart(2, '0')}:${Math.round((h - Math.floor(h)) * 60).toString().padStart(2, '0')}`;
  return { sunrise: formatTime(sunrise), sunset: formatTime(sunset) };
}

async function fetchTideData(stationId) {
  const apiKey = process.env.ADMIRALTY_API_KEY;
  if (!apiKey) throw new Error('ADMIRALTY_API_KEY not set');
  const url = `https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations/${stationId}/TidalEvents`;
  const response = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': apiKey } });
  if (!response.ok) throw new Error(`Admiralty API error: ${response.status}`);
  const data = await response.json();
  const now = new Date();
  const upcoming = data.filter(e => new Date(e.DateTime) > now);
  const nextHigh = upcoming.find(e => e.EventType === 'HighWater');
  const nextLow = upcoming.find(e => e.EventType === 'LowWater');
  const fmt = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return {
    nextHighTide: nextHigh ? { time: fmt(nextHigh.DateTime), height: nextHigh.Height ? `${nextHigh.Height.toFixed(1)}m` : null } : null,
    nextLowTide: nextLow ? { time: fmt(nextLow.DateTime), height: nextLow.Height ? `${nextLow.Height.toFixed(1)}m` : null } : null
  };
}

async function fetchMarineData(lat, lon) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_period,swell_wave_height,sea_surface_temperature&timezone=Europe/London`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open-Meteo API error: ${response.status}`);
  const data = await response.json();
  const c = data.current;
  return {
    seaTemp: c.sea_surface_temperature ? `${Math.round(c.sea_surface_temperature)}°C` : null,
    seaTempRaw: c.sea_surface_temperature || null,
    waveHeight: c.wave_height ? `${c.wave_height.toFixed(1)}m` : null,
    waveHeightRaw: c.wave_height || null,
    wavePeriod: c.wave_period ? `${Math.round(c.wave_period)}s` : null,
    swellHeight: c.swell_wave_height ? `${c.swell_wave_height.toFixed(1)}m` : null
  };
}

async function fetchWeatherData(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,windspeed_10m,winddirection_10m,cloudcover,precipitation,weathercode,uv_index&timezone=Europe/London`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open-Meteo Weather API error: ${response.status}`);
  const data = await response.json();
  const c = data.current;
  
  // Convert wind direction degrees to compass
  const windDirCompass = (deg) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };
  
  return {
    airTemp: c.temperature_2m ? `${Math.round(c.temperature_2m)}°C` : null,
    airTempRaw: c.temperature_2m || null,
    feelsLike: c.apparent_temperature ? `${Math.round(c.apparent_temperature)}°C` : null,
    feelsLikeRaw: c.apparent_temperature || null,
    windSpeed: c.windspeed_10m ? `${Math.round(c.windspeed_10m)} km/h` : null,
    windSpeedRaw: c.windspeed_10m || null,
    windDirection: c.winddirection_10m ? windDirCompass(c.winddirection_10m) : null,
    windDirectionRaw: c.winddirection_10m || null,
    cloudCover: c.cloudcover || 0,
    precipitation: c.precipitation || 0,
    weatherCode: c.weathercode || 0,
    uvIndex: c.uv_index || 0
  };
}

async function getConditions(locationSlug, mode = 'swimming') {
  const location = locations[locationSlug];
  if (!location) return null;
  
  const [tideData, marineData, weatherData, sewageData] = await Promise.all([
    fetchTideData(location.stationId).catch(err => { console.error('Tide error:', err.message); return { nextHighTide: null, nextLowTide: null }; }),
    fetchMarineData(location.lat, location.lon).catch(err => { console.error('Marine error:', err.message); return { seaTemp: null, waveHeight: null }; }),
    fetchWeatherData(location.lat, location.lon).catch(err => { console.error('Weather error:', err.message); return { airTemp: null, windSpeed: null }; }),
    fetchSewageStatus(locationSlug, location.name).catch(err => { console.error('Sewage error:', err.message); return { status: 'error' }; })
  ]);
  
  const sunTimes = getSunTimes(location.lat, location.lon);
  
  const conditions = { 
    location: location.name, 
    slug: locationSlug,
    facing: location.facing,
    timestamp: new Date().toISOString(), 
    sunrise: sunTimes.sunrise, 
    sunset: sunTimes.sunset, 
    ...tideData, 
    ...marineData, 
    weather: weatherData,
    sewage: sewageData 
  };
  
  // Add recommendation based on mode
  conditions.mode = mode;
  conditions.recommendation = getRecommendation(conditions, mode);
  
  return conditions;
}

// =============================================================================
// ROUTES
// =============================================================================

app.get('/', async (req, res) => { 
  const mode = req.query.mode || 'swimming';
  try { res.json(await getConditions('barry', mode)); } catch (err) { res.status(500).json({ error: err.message }); } 
});

app.get('/conditions', async (req, res) => { 
  const mode = req.query.mode || 'swimming';
  try { res.json(await getConditions('barry', mode)); } catch (err) { res.status(500).json({ error: err.message }); } 
});

app.get('/conditions/:location', async (req, res) => {
  const slug = req.params.location.toLowerCase();
  const mode = req.query.mode || 'swimming';
  if (!locations[slug]) return res.status(404).json({ error: 'Location not found', available: Object.keys(locations) });
  try { res.json(await getConditions(slug, mode)); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/locations', (req, res) => { res.json(Object.entries(locations).map(([slug, data]) => ({ slug, name: data.name, facing: data.facing }))); });

app.get('/stations', async (req, res) => {
  const apiKey = process.env.ADMIRALTY_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ADMIRALTY_API_KEY not set' });
  try {
    const response = await fetch('https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations', { headers: { 'Ocp-Apim-Subscription-Key': apiKey } });
    if (!response.ok) throw new Error(`Admiralty API error: ${response.status}`);
    res.json(await response.json());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// DEBUG / TEST ENDPOINTS
// =============================================================================

app.get('/test-english/:beach', async (req, res) => {
  const slug = req.params.beach.toLowerCase();
  const config = ENGLISH_BEACHES[slug];
  const result = await fetchEnglishSewageStatus(slug);
  res.json({ beach: slug, config, result });
});

app.get('/sww-beaches', async (req, res) => {
  try {
    const params = new URLSearchParams({ where: "beach IS NOT NULL AND beach <> ''", outFields: 'beach', returnDistinctValues: true, returnGeometry: false, f: 'json' });
    const response = await fetch(`${ENGLISH_SEWAGE_APIS.sww}?${params}`);
    const data = await response.json();
    const beaches = [...new Set(data.features?.map(f => f.attributes.beach))].sort();
    res.json({ count: beaches.length, beaches });
  } catch (e) { res.json({ error: e.message }); }
});

app.get('/debug-nsoh/:company', async (req, res) => {
  const url = ENGLISH_SEWAGE_APIS[req.params.company];
  if (!url) return res.json({ error: 'Unknown company. Use: sww, southern, wessex' });
  try {
    const params = new URLSearchParams({ where: '1=1', outFields: '*', resultRecordCount: 1, f: 'json' });
    const response = await fetch(`${url}?${params}`);
    const data = await response.json();
    res.json({ fields: data.features?.[0] ? Object.keys(data.features[0].attributes) : [], sample: data.features?.[0]?.attributes });
  } catch (e) { res.json({ error: e.message }); }
});

app.get('/debug-welsh-water/:search', async (req, res) => {
  try {
    const search = req.params.search;
    const params = new URLSearchParams({
      where: `Linked_Bathing_Water LIKE '%${search}%'`,
      outFields: 'asset_name,Linked_Bathing_Water,status',
      returnGeometry: 'false',
      f: 'json'
    });
    const response = await fetch(`${WELSH_WATER_ENDPOINT}?${params}`);
    const data = await response.json();
    const results = (data.features || []).map(f => ({
      asset: f.attributes.asset_name,
      bathingWater: f.attributes.Linked_Bathing_Water,
      status: f.attributes.status
    }));
    res.json({ search, count: results.length, results });
  } catch (e) { res.json({ error: e.message }); }
});

app.get('/debug-welsh-water-list', async (req, res) => {
  try {
    const params = new URLSearchParams({
      where: "Linked_Bathing_Water IS NOT NULL AND Linked_Bathing_Water <> ''",
      outFields: 'Linked_Bathing_Water',
      returnGeometry: 'false',
      f: 'json'
    });
    const response = await fetch(`${WELSH_WATER_ENDPOINT}?${params}`);
    const data = await response.json();
    const names = [...new Set((data.features || []).map(f => f.attributes.Linked_Bathing_Water))].sort();
    res.json({ count: names.length, bathingWaters: names });
  } catch (e) { res.json({ error: e.message }); }
});

// =============================================================================
// ALEXA ENDPOINT
// =============================================================================

function parseBeachSlug(input) {
  return input.toLowerCase()
    .replace(' island', '').replace(' bay', '').replace(' cove', '').replace(' sands', '').replace(' beach', '')
    .replace('lyme regis', 'lymeregis')
    .replace('rest bay', 'restbay')
    .replace('colwyn bay', 'colwynbay')
    .replace('new quay', 'newquay')
    .replace('newport sands', 'newportsands')
    .replace('broad haven', 'broadhaven')
    .replace('little haven', 'littlehaven')
    .replace('freshwater west', 'freshwaterwest')
    .replace('freshwater east', 'freshwatereast')
    .replace('porth dinllaen', 'porthdinllaen')
    .replace('porth neigwl', 'porthneigwl')
    .replace("hell's mouth", 'porthneigwl')
    .replace('hells mouth', 'porthneigwl')
    .replace('port eynon', 'porteynon')
    .replace('bracelet bay', 'braceletbay')
    .replace('limeslade bay', 'limeslade')
    .replace('oxwich bay', 'oxwich')
    .replace('swansea bay', 'swanseabay')
    .replace('cold knap', 'coldknap')
    .replace('col-huw', 'colhuw')
    .replace('col huw', 'colhuw')
    .replace('morfa nefyn', 'morfanefyn')
    .replace('porth nefyn', 'porthnefyn')
    .replace('morfa dinlle', 'morfadinlle')
    .replace('tal-y-bont', 'talybont')
    .replace('taly bont', 'talybont')
    .replace('silver bay', 'silverbay')
    .replace('porth dafarch', 'porthdafarch')
    .replace('church bay', 'churchbay')
    .replace('traeth lligwy', 'traethlligwy')
    .replace('kinmel bay', 'kinmelbay')
    .replace('trearddur bay', 'trearddur')
    .replace('cemaes bay', 'cemaes')
    .replace('clarach south', 'clarach')
    .replace("wiseman's bridge", 'wisemansbridge')
    .replace('wisemans bridge', 'wisemansbridge')
    .replace('coppet hall', 'coppethall')
    .replace('castle beach', 'castlebeach')
    .replace('tenby south', 'tenbysouth')
    .replace('porth eirias', 'portheirias')
    .replace(/ /g, '');
}

function buildAlexaSpeech(conditions) {
  const rec = conditions.recommendation;
  const name = conditions.location;
  const weather = conditions.weather || {};
  
  let speech = '';
  
  if (rec.status === 'red') {
    speech = `${name} isn't looking good right now. `;
    if (conditions.sewage?.status === 'warning') {
      speech += `There's an active sewage discharge, so swimming is not recommended. `;
    } else if (conditions.sewage?.status === 'recent') {
      speech += `There was sewage discharge in the last 48 hours. `;
    }
    if (conditions.waveHeightRaw > 2) {
      speech += `Waves are ${conditions.waveHeight}, which is very rough. `;
    }
    if (weather.windSpeedRaw > 40) {
      speech += `It's also very windy at ${weather.windSpeed}. `;
    }
  } else if (rec.status === 'amber') {
    speech = `${name} is okay, but check the details. `;
    if (conditions.sewage?.status === 'recent') {
      speech += `There was sewage discharge in the last 48 hours. `;
    }
    if (conditions.waveHeightRaw > 1.5) {
      speech += `Waves are ${conditions.waveHeight}, a bit choppy. `;
    }
    speech += `Water temperature is ${conditions.seaTemp}. `;
    if (conditions.nextHighTide) {
      speech += `High tide is at ${conditions.nextHighTide.time}. `;
    }
  } else {
    speech = `${name} is looking good for a swim! `;
    speech += `Water temperature is ${conditions.seaTemp}. `;
    if (conditions.waveHeightRaw < 0.5) {
      speech += `The water is calm. `;
    } else {
      speech += `Waves are ${conditions.waveHeight}. `;
    }
    if (conditions.nextHighTide) {
      speech += `High tide is at ${conditions.nextHighTide.time}. `;
    }
    if (conditions.sewage?.status === 'clear') {
      speech += `No sewage alerts. `;
    }
    const hour = new Date().getHours();
    if ((conditions.facing === 'west' || conditions.facing === 'southwest') && hour >= 15 && weather.cloudCover < 50) {
      speech += `It's west-facing, so good for sunset. `;
    }
    if ((conditions.facing === 'east' || conditions.facing === 'southeast') && hour < 10 && weather.cloudCover < 50) {
      speech += `It's east-facing, great for catching the sunrise. `;
    }
  }
  
  return speech.trim();
}

app.post('/alexa', express.json(), async (req, res) => {
  const requestType = req.body.request.type;
  
  if (requestType === 'LaunchRequest') {
    return res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: 'Welcome to Shorecast. Ask me about conditions at a beach, like Porthcawl or Barry Island.' }, shouldEndSession: false } });
  }
  
  if (requestType === 'IntentRequest') {
    const intentName = req.body.request.intent.name;
    
    if (intentName === 'GetConditionsIntent') {
      const locationSlot = req.body.request.intent.slots?.location?.value;
      if (!locationSlot) return res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: 'Which beach would you like conditions for? Try saying Porthcawl or Barry Island.' }, shouldEndSession: false } });
      
      const slug = parseBeachSlug(locationSlot);
      const conditions = await getConditions(slug, 'swimming');
      
      if (!conditions) return res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: `Sorry, I don't have data for ${locationSlot}. Try Barry, Porthcawl, Tenby, Rhossili, or Llangrannog.` }, shouldEndSession: false } });
      
      const speech = buildAlexaSpeech(conditions);
      return res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: speech }, shouldEndSession: true } });
    }
    
    if (intentName === 'ListLocationsIntent') return res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: `I have conditions for ${Object.keys(locations).length} beaches across Wales and Southwest England. Ask me about any beach by name.` }, shouldEndSession: false } });
    if (intentName === 'AMAZON.HelpIntent') return res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: 'Ask me for conditions at a beach. For example, say: conditions at Porthcawl, or what is Llangrannog like.' }, shouldEndSession: false } });
    if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') return res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: 'Happy swimming!' }, shouldEndSession: true } });
  }
  
  res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: "Sorry, I didn't understand that. Ask me about conditions at a beach." }, shouldEndSession: false } });
});

app.listen(PORT, () => { console.log(`Shorecast running on port ${PORT} with ${Object.keys(locations).length} beaches`); });
