/**
 * الشهيد صالح سالم الشعب — Google Sheets backend
 *
 * Google Sheets structure:
 * profile: key | value
 * timeline: id | title | description | order
 * stories: id | title | content | author | relation | date
 * memories: id | name | relation | title | story | contact | status | createdAt
 * gallery: id | image | title | description | date
 * quotes: id | quote
 * achievements: id | title | description | date
 */

const SHEET_ID = '1xJ46mga_dKevcodPGjb_o216iFQuV2qq-M4AfOwbQWQ';
const ADMIN_TOKEN_PROPERTY = 'ADMIN_TOKEN';
const SHEETS = {
  profile: ['key','value'],
  timeline: ['id','title','description','order'],
  stories: ['id','title','content','author','relation','date'],
  memories: ['id','name','relation','title','story','contact','status','createdAt'],
  gallery: ['id','image','title','description','date'],
  quotes: ['id','quote'],
  achievements: ['id','title','description','date']
};

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'readPublic';
  try {
    if (action === 'readPublic') return out_(readData_(true));
    if (action === 'readAdmin') {
      auth_((e.parameter || {}).token);
      return out_(readData_(false));
    }
    if (action === 'health') return out_({ok:true, service:'saleh-memorial'});
    return out_({ok:false,error:'unknown action'});
  } catch (err) {
    return out_({ok:false,error:String(err)});
  }
}

function doPost(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    const action = p.action || '';

    if (action === 'createMemory') {
      const record = {
        id: Utilities.getUuid(),
        name: clean_(p.name),
        relation: clean_(p.relation),
        title: clean_(p.title),
        story: clean_(p.story),
        contact: clean_(p.contact),
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      appendObject_('memories', record);
      return out_({ok:true,id:record.id});
    }

    auth_(p.token);

    if (action === 'upsertProfile') {
      const profile = JSON.parse(p.profile || '{}');
      writeProfile_(profile);
      return out_({ok:true});
    }

    if (action === 'upsert') {
      const type = clean_(p.type);
      if (!SHEETS[type] || type === 'profile') throw new Error('invalid type');
      const record = JSON.parse(p.record || '{}');
      upsertObject_(type, record);
      return out_({ok:true,id:record.id});
    }

    if (action === 'delete') {
      const type = clean_(p.type);
      const id = clean_(p.id);
      if (!SHEETS[type] || type === 'profile') throw new Error('invalid type');
      deleteById_(type, id);
      return out_({ok:true});
    }

    if (action === 'setMemoryStatus') {
      updateMemoryStatus_(clean_(p.id), clean_(p.status));
      return out_({ok:true});
    }

    if (action === 'setupSheets') {
      setupSheets_();
      return out_({ok:true});
    }

    return out_({ok:false,error:'unknown action'});
  } catch (err) {
    return out_({ok:false,error:String(err)});
  }
}

function setup() {
  setupSheets_();
}

function setupSheets_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  Object.keys(SHEETS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = SHEETS[name];
    if (sh.getLastRow() === 0) {
      sh.getRange(1,1,1,headers.length).setValues([headers]);
    }
  });
  const profile = ss.getSheetByName('profile');
  const existing = readProfile_(profile);
  if (!existing.name) {
    writeProfile_({
      name: 'صالح سالم الشعب',
      location: 'البيضاء - اليمن',
      tagline: 'سيرة رجل ترك أثرًا في قلوب من عرفوه',
      intro: 'هذا الموقع أرشيف شخصي لحفظ سيرة الشهيد صالح سالم الشعب ومواقفه وذكريات من عرفوه.',
      birth: '', death: '', bio: '', hero_image: '', job: '', martyrdomDate: '', martyrdomPlace: '', story: '', departure: '', sonLetter: 'إلى أبي الذي رحل وأنا ما زلت صغيرًا...'
    });
  }
}

function readData_(publicOnly) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const out = {profile:{},timeline:[],achievements:[],stories:[],memories:[],quotes:[],gallery:[]};

  out.profile = readProfile_(ss.getSheetByName('profile'));
  out.timeline = readRowsAsObjects_(ss.getSheetByName('timeline'), ['id','title','description','order']);
  out.achievements = readRowsAsObjects_(ss.getSheetByName('achievements'), ['id','title','description','date']);
  out.stories = readRowsAsObjects_(ss.getSheetByName('stories'), ['id','title','content','author','relation','date']);
  out.quotes = readRowsAsObjects_(ss.getSheetByName('quotes'), ['id','quote']);
  out.gallery = readRowsAsObjects_(ss.getSheetByName('gallery'), ['id','image','title','description','date']);
  out.memories = readRowsAsObjects_(ss.getSheetByName('memories'), ['id','name','relation','title','story','contact','status','createdAt']);

  out.memories = out.memories.filter(m => String(m.status || '').toLowerCase() === 'approved');
  if (!publicOnly) {
    // Admin needs all memory statuses and contacts; reread separately.
    out.memories = readRowsAsObjects_(ss.getSheetByName('memories'), ['id','name','relation','title','story','contact','status','createdAt']);
  } else {
    out.memories.forEach(m => delete m.contact);
  }

  out.timeline.sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  return out;
}

function readProfile_(sh) {
  const out = {};
  if (!sh) return out;
  const values = sh.getDataRange().getValues();
  for (let i=1;i<values.length;i++) {
    const key = String(values[i][0] || '').trim();
    if (key) out[key] = String(values[i][1] ?? '');
  }
  return out;
}

function readRowsAsObjects_(sh, headers) {
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  return values.slice(1).filter(row => row.some(v => String(v ?? '').trim() !== '')).map(row => {
    const obj = {};
    headers.forEach((h,i)=>obj[h] = row[i] ?? '');
    return obj;
  });
}

function appendObject_(type, obj) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(type);
  if (!sh) throw new Error('sheet not found: ' + type);
  const headers = SHEETS[type];
  sh.appendRow(headers.map(h => obj[h] ?? ''));
}

function upsertObject_(type, obj) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(type);
  if (!sh) throw new Error('sheet not found: ' + type);
  const headers = SHEETS[type];
  const id = String(obj.id || Utilities.getUuid());
  const values = sh.getDataRange().getValues();
  let rowNumber = -1;
  for (let i=1;i<values.length;i++) if (String(values[i][0]) === id) { rowNumber = i+1; break; }
  const row = headers.map(h => obj[h] ?? '');
  row[0] = id;
  if (rowNumber < 0) sh.appendRow(row); else sh.getRange(rowNumber,1,1,headers.length).setValues([row]);
}

function writeProfile_(profile) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName('profile');
  if (!sh) throw new Error('profile sheet not found');
  sh.clearContents();
  sh.getRange(1,1,1,2).setValues([SHEETS.profile]);
  Object.keys(profile).filter(k=>k!=='id').forEach((key,i)=>sh.getRange(i+2,1,1,2).setValues([[key, profile[key] ?? '']]));
}

function deleteById_(type, id) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(type);
  const values = sh.getDataRange().getValues();
  for (let i=1;i<values.length;i++) {
    if (String(values[i][0]) === String(id)) { sh.deleteRow(i+1); return; }
  }
  throw new Error('not found');
}

function updateMemoryStatus_(id, status) {
  if (!['pending','approved','rejected'].includes(status)) throw new Error('invalid status');
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName('memories');
  const values = sh.getDataRange().getValues();
  for (let i=1;i<values.length;i++) {
    if (String(values[i][0]) === String(id)) { sh.getRange(i+1,7).setValue(status); return; }
  }
  throw new Error('memory not found');
}

function auth_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty(ADMIN_TOKEN_PROPERTY);
  if (!expected || !token || token !== expected) throw new Error('unauthorized');
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function clean_(value) { return String(value ?? '').trim(); }
