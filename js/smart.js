// Smart suggestion: title ar description dekhe category ar priority anumaan kore.
// Eta shudhu poramorsho, final decision admin er.

const SMART_RULES = {
  categories: {
    'Safety': ['gas$', 'fire$', 'smok', 'spark', 'shock', 'exposed', 'collaps', 'unsafe', 'danger', 'burning', 'short circuit'],
    'Electrical': ['fan$', 'light', 'bulb', 'tube', 'switch', 'socket', 'wire$', 'wiring', 'power', 'electric', 'voltage', 'ac$', 'generator'],
    'Plumbing': ['leak', 'pipe', 'tap$', 'faucet', 'water', 'toilet', 'washroom', 'sink', 'drain', 'flush', 'sewage', 'basin'],
    'Facilities': ['door', 'window', 'chair', 'bench', 'desk', 'table', 'ceiling', 'wall', 'paint', 'roof', 'lift', 'elevator', 'stair', 'floor', 'lock', 'furniture', 'glass', 'whiteboard'],
    'Network and IT': ['wifi', 'wi-fi', 'internet', 'network', 'router', 'computer', 'pc$', 'projector', 'printer', 'server', 'lan$', 'monitor', 'keyboard', 'mouse', 'software', 'portal']
  },
  critical: ['exposed wire', 'live wire', 'open wire', 'spark', 'shock', 'short circuit', 'gas$', 'fire$', 'smok', 'burning', 'flood', 'collaps', 'electrocut'],
  high: ['leak', 'no power', 'power cut', 'power outage', 'blackout', 'no water', 'overflow', 'block', 'clog', 'internet down', 'network down', 'no internet', 'stuck', 'broken glass', 'urgent', 'emergency', 'dangerous', 'unsafe']
};

// "$" shesh e thakle exact shobdo (plural shoho), na hole shobdo-r shuru milale hobe
function makeRegex(kw) {
  const exact = kw.slice(-1) === '$';
  const word = exact ? kw.slice(0, -1) : kw;
  const safe = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(exact ? '\\b' + safe + '(s|es)?\\b' : '\\b' + safe + '\\w*', 'i');
}

function findMatches(text, list) {
  const found = [];
  list.forEach(function (kw) {
    const m = text.match(makeRegex(kw));
    if (m) found.push(m[0].toLowerCase());
  });
  return found;
}

function smartSuggest(title, description) {
  const text = ((title || '') + ' ' + (description || '')).toLowerCase();
  let bestCat = '';
  let bestScore = 0;
  let catHits = [];

  Object.keys(SMART_RULES.categories).forEach(function (cat) {
    const hits = findMatches(text, SMART_RULES.categories[cat]);
    const score = hits.length * (cat === 'Safety' ? 3 : 1);
    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
      catHits = hits;
    }
  });

  const critical = findMatches(text, SMART_RULES.critical);
  const high = findMatches(text, SMART_RULES.high);
  let priority = 'Normal';
  let priorityHits = [];
  if (critical.length) { priority = 'Critical'; priorityHits = critical; }
  else if (high.length) { priority = 'High'; priorityHits = high; }

  return { category: bestCat, priority: priority, categoryHits: catHits, priorityHits: priorityHits };
}