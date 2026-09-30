const apiBase = (process.env.SMOKE_API_URL ?? process.env.API_URL ?? 'http://127.0.0.1:4000/api').replace(/\/$/, '');
const email = process.env.SMOKE_EMAIL ?? 'admin@mediflow.local';
const password = process.env.SMOKE_PASSWORD ?? 'ChangeMe!2025';
const created = new Map();

async function request(path, method = 'GET', body, token) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = text;
  }
  if (!response.ok) {
    throw new Error(`${method} ${path} → ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function permanentlyDelete(resource, id, token) {
  if (!id) return;
  try {
    await request(`/${resource}/${id}/permanent`, 'DELETE', undefined, token);
  } catch (error) {
    console.error(`Nettoyage impossible pour ${resource}/${id}:`, error.message);
  }
}

function listCount(payload) {
  if (Array.isArray(payload)) return payload.length;
  if (payload && Array.isArray(payload.data)) return payload.data.length;
  return 0;
}

const checks = [];
async function check(name, operation) {
  const value = await operation();
  checks.push(name);
  return value;
}

let token;
try {
  token = (await request('/auth/login', 'POST', { email, password })).accessToken;
  if (!token) throw new Error('La connexion de smoke test n’a pas renvoyé de bearer token.');

  const staff = await check('medical-staff create', () => request('/medical-staff', 'POST', {
    staffType: 'OTHER', firstName: 'Runtime', lastName: `Staff ${Date.now()}`, specialty: 'Validation',
  }, token));
  created.set('medical-staff', { resource: 'medical-staff', id: staff.id });
  await check('medical-staff update', () => request(`/medical-staff/${staff.id}`, 'PATCH', { specialty: 'Validation modifiée' }, token));
  await check('medical-staff archive', () => request(`/medical-staff/${staff.id}`, 'DELETE', undefined, token));
  await check('medical-staff restore', () => request(`/medical-staff/${staff.id}/restore`, 'POST', {}, token));

  const partner = await check('partner create', () => request('/partners', 'POST', {
    name: `Runtime Partner ${Date.now()}`, kind: 'Validation', contactName: 'Contact', email: `runtime.partner.${Date.now()}@example.test`,
  }, token));
  created.set('partners', { resource: 'partners', id: partner.id });
  await check('partner update', () => request(`/partners/${partner.id}`, 'PATCH', { notes: 'Persisté par le smoke test' }, token));
  await check('partner archive', () => request(`/partners/${partner.id}`, 'DELETE', undefined, token));
  await check('partner restore', () => request(`/partners/${partner.id}/restore`, 'POST', {}, token));

  const user = await check('user create', () => request('/users', 'POST', {
    firstName: 'Runtime', lastName: `User ${Date.now()}`, email: `runtime.user.${Date.now()}@example.test`,
  }, token));
  created.set('users', { resource: 'users', id: user.id });
  await check('user update', () => request(`/users/${user.id}`, 'PATCH', { phone: '+15145550123' }, token));
  await check('user archive', () => request(`/users/${user.id}`, 'DELETE', undefined, token));
  await check('user restore', () => request(`/users/${user.id}/restore`, 'POST', {}, token));

  const item = await check('inventory create', () => request('/inventory', 'POST', {
    name: `Runtime Stock ${Date.now()}`, unit: 'unité', quantity: 10, minQuantity: 2, category: 'Validation',
  }, token));
  created.set('inventory', { resource: 'inventory', id: item.id });
  await check('inventory update', () => request(`/inventory/${item.id}`, 'PATCH', { quantity: 12 }, token));
  const movement = await check('inventory movement', () => request(`/inventory/${item.id}/movements`, 'POST', {
    type: 'OUT', quantity: 2, reason: 'Validation',
  }, token));
  if (String(movement.quantity) !== '10') throw new Error(`Stock inattendu après mouvement: ${movement.quantity}`);
  await check('inventory archive', () => request(`/inventory/${item.id}`, 'DELETE', undefined, token));
  await check('inventory restore', () => request(`/inventory/${item.id}/restore`, 'POST', {}, token));

  const mission = await check('mission create', () => request('/missions', 'POST', {
    title: `Runtime Mission ${Date.now()}`, scheduledAt: '2030-01-02T10:00:00.000Z', notes: 'Validation',
  }, token));
  created.set('missions', { resource: 'missions', id: mission.id });
  await check('mission update', () => request(`/missions/${mission.id}`, 'PATCH', { title: 'Runtime Mission modifiée' }, token));
  await check('mission status', () => request(`/missions/${mission.id}/status`, 'PATCH', { status: 'IN_PROGRESS' }, token));
  await check('mission archive', () => request(`/missions/${mission.id}`, 'DELETE', undefined, token));
  await check('mission restore', () => request(`/missions/${mission.id}/restore`, 'POST', {}, token));

  const delivery = await check('delivery create', () => request('/deliveries', 'POST', {
    scheduledAt: '2030-01-03T11:00:00.000Z', trackingNote: 'Validation',
  }, token));
  created.set('deliveries', { resource: 'deliveries', id: delivery.id });
  await check('delivery update', () => request(`/deliveries/${delivery.id}`, 'PATCH', { trackingNote: 'Modifiée' }, token));
  await check('delivery status', () => request(`/deliveries/${delivery.id}/status`, 'PATCH', { status: 'IN_PROGRESS' }, token));
  await check('delivery archive', () => request(`/deliveries/${delivery.id}`, 'DELETE', undefined, token));
  await check('delivery restore', () => request(`/deliveries/${delivery.id}/restore`, 'POST', {}, token));

  const document = await check('document create', () => request('/documents/metadata', 'POST', {
    title: 'Runtime document', category: 'Validation', entityType: 'OTHER', fileName: 'runtime.txt', mimeType: 'text/plain',
    storageKey: `runtime/${Date.now()}.txt`, sizeBytes: 12, metadata: { source: 'integration' },
  }, token));
  created.set('documents', { resource: 'documents', id: document.id });
  await check('document update', () => request(`/documents/${document.id}`, 'PATCH', { title: 'Runtime document modifié' }, token));
  await check('document archive', () => request(`/documents/${document.id}`, 'DELETE', undefined, token));
  await check('document restore', () => request(`/documents/${document.id}/restore`, 'POST', {}, token));

  const finance = await check('finance create', () => request('/finance', 'POST', {
    kind: 'Validation', currency: 'CAD', lines: [{ label: 'Service runtime', quantity: 2, unitPriceHt: 50, vatRate: 15 }],
  }, token));
  created.set('finance', { resource: 'finance', id: finance.id });
  if (String(finance.totalTtc) !== '115') throw new Error(`Total finance inattendu: ${finance.totalTtc}`);
  await check('finance update', () => request(`/finance/${finance.id}`, 'PATCH', { notes: 'Modifiée', status: 'ISSUED' }, token));
  await check('finance archive', () => request(`/finance/${finance.id}`, 'DELETE', undefined, token));
  await check('finance restore', () => request(`/finance/${finance.id}/restore`, 'POST', {}, token));

  const medication = await check('medication create', () => request('/reference-data/medications', 'POST', {
    name: `Runtime Medication ${Date.now()}`, form: 'Test', unit: 'boîte',
  }, token));
  created.set('medications', { resource: 'reference-data/medications', id: medication.id });
  await check('medication update', () => request(`/reference-data/medications/${medication.id}`, 'PATCH', { dosage: '10 mg' }, token));
  await check('medication archive', () => request(`/reference-data/medications/${medication.id}`, 'DELETE', undefined, token));
  await check('medication restore', () => request(`/reference-data/medications/${medication.id}/restore`, 'POST', {}, token));

  const referenceType = await check('reference type create', () => request('/reference-data/types', 'POST', {
    kind: 'CONSULTATION', code: `RUNTIME-${Date.now()}`, labels: { fr: 'Runtime test' },
  }, token));
  created.set('reference-types', { resource: 'reference-data/types', id: referenceType.id });
  await check('reference type update', () => request(`/reference-data/types/${referenceType.id}`, 'PATCH', { labels: { fr: 'Runtime test modifié' } }, token));
  await check('reference type archive', () => request(`/reference-data/types/${referenceType.id}`, 'DELETE', undefined, token));
  await check('reference type restore', () => request(`/reference-data/types/${referenceType.id}/restore`, 'POST', {}, token));

  const patient = await check('patient create', () => request('/patients', 'POST', {
    firstName: 'Runtime', lastName: `Patient ${Date.now()}`, email: `runtime.patient.${Date.now()}@example.test`,
  }, token));
  created.set('patients', { resource: 'patients', id: patient.id });
  await check('patient update', () => request(`/patients/${patient.id}`, 'PATCH', { notes: 'Modifiée' }, token));
  await check('patient archive endpoint', () => request(`/patients/${patient.id}/archive`, 'POST', {}, token));
  await check('patient restore', () => request(`/patients/${patient.id}/restore`, 'POST', {}, token));

  const prescription = await check('prescription create', () => request('/prescriptions', 'POST', {
    patientId: patient.id, prescriberId: staff.id, items: [{ manualName: 'Runtime medication', dosage: '1 unité' }],
  }, token));
  created.set('prescriptions', { resource: 'prescriptions', id: prescription.id });
  await check('prescription update', () => request(`/prescriptions/${prescription.id}`, 'PATCH', { instructions: 'Modifiée' }, token));
  await check('prescription cancel', () => request(`/prescriptions/${prescription.id}/cancel`, 'POST', {}, token));
  await check('prescription archive', () => request(`/prescriptions/${prescription.id}`, 'DELETE', undefined, token));
  await check('prescription restore', () => request(`/prescriptions/${prescription.id}/restore`, 'POST', {}, token));

  const reads = await Promise.all([
    request('/medical-staff', 'GET', undefined, token), request('/partners', 'GET', undefined, token), request('/users', 'GET', undefined, token), request('/inventory', 'GET', undefined, token),
    request('/missions', 'GET', undefined, token), request('/deliveries', 'GET', undefined, token), request('/documents', 'GET', undefined, token),
    request('/finance', 'GET', undefined, token), request('/reference-data/medications', 'GET', undefined, token), request('/reference-data/types', 'GET', undefined, token),
    request('/prescriptions?page=1&pageSize=100', 'GET', undefined, token), request('/patients?page=1&pageSize=100', 'GET', undefined, token),
  ]);
  if (reads.some((payload) => listCount(payload) < 1)) throw new Error('Une relecture API après mutation ne contient pas de donnée.');

  console.log(JSON.stringify({ apiBase, passed: checks.length, checks, readBackCounts: reads.map(listCount) }, null, 2));
} finally {
  if (token) {
    // Delete dependencies first, then permanently remove every record created by this run.
    for (const key of ['prescriptions', 'patients', 'documents', 'finance', 'deliveries', 'missions', 'inventory', 'medical-staff', 'partners', 'users', 'medications', 'reference-types']) {
      const item = created.get(key);
      if (item) await permanentlyDelete(item.resource, item.id, token);
    }
  }
}
