// Load with playwright-cli run-code --filename after opening the local Vite page.
// Every API request is intercepted; this fixture never changes production data.
async page => {
  await page.unroute('**/api/**');
  const user = {
    id: 'admin-test',
    name: 'Inno Yönetici',
    email: 'yonetici@example.test',
    username: 'inno',
    role: 'super_admin',
    status: 'active',
    mustChangePassword: false,
    createdAt: '2026-09-01T09:00:00Z',
  };
  const stages = ['application_stage', 'erasmus_stage', 'returned_home'];
  const names = [
    'Deniz Yılmaz',
    'Ece Demir',
    'Mehmet Ali Öztürk',
    'Zeynep Şahin',
    'Alexandra Constantinopoulos',
    'Can Arslan',
  ];
  const docs = [
    {
      id: 'doc-photo',
      type: 'photo_activity_report',
      fileName: 'faaliyet-fotograflari.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 253000,
      status: 'ok',
      physicalDeliveryStatus: 'not_required',
      uploadedAt: '2026-09-12T09:00:00Z',
    },
    {
      id: 'doc-boarding',
      type: 'boarding_pass_outbound',
      fileName: 'gidis-binis-karti.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 138500,
      status: 'unread',
      physicalDeliveryStatus: 'awaiting_original',
      uploadedAt: '2026-09-12T09:00:00Z',
    },
  ];
  const items = Array.from({ length: 27 }, (_, i) => ({
    id: 'app-' + i,
    userId: 'user-' + i,
    programId: 'program-1',
    programName:
      i % 2
        ? 'Avrupa Dayanışma Programı'
        : 'ESC · Gençlik ve Sürdürülebilirlik',
    status: stages[i % 3],
    decisionStatus: i === 4 ? 'rejected' : 'active',
    decisionReason: i === 4 ? 'Eksik başvuru bilgileri' : undefined,
    personalInfo: {
      fullName: names[i % names.length],
      nationality: 'Türkiye',
      identityType: 'turkish_id',
      bloodGroup: 'A Rh+',
      birthDate: '2001-04-12',
    },
    documents: docs.map(doc => ({ ...doc })),
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-20T13:45:00Z',
    submittedAt: i === 26 ? undefined : '2026-09-02T09:00:00Z',
  }));
  const candidates = items.map((item, i) => ({
    ...user,
    id: 'user-' + i,
    name: item.personalInfo.fullName,
    email: 'aday' + i + '@example.test',
    phone: '+90 555 000 00 00',
    role: 'candidate',
    status: i % 2 ? 'active' : 'pending',
  }));
  const admins = [
    user,
    {
      ...user,
      id: 'second-admin',
      name: 'Elif Kaya',
      email: 'elif@example.test',
      username: 'elif',
      role: 'admin',
    },
  ];
  await page.route('**/api/**', async route => {
    const req = route.request();
    const path = req.url().replace('http://127.0.0.1:5173', '').split('?')[0];
    const body = req.method() === 'GET' ? {} : req.postDataJSON() || {};
    let data;
    if (path === '/api/auth/login')
      data = {
        user,
        accessToken: 'ui-test-access',
        refreshToken: 'ui-test-refresh',
      };
    else if (path === '/api/auth/me') data = user;
    else if (path === '/api/applications') data = items;
    else if (path === '/api/admin/candidates') data = candidates;
    else if (path === '/api/admin/admins') {
      if (req.method() === 'POST') {
        admins.push({ ...body, id: 'created-admin', status: 'active' });
      }
      data = req.method() === 'POST' ? admins.at(-1) : admins;
    } else if (path === '/api/admin/audit')
      data = Array.from({ length: 25 }, (_, i) => ({
        id: 'log-' + i,
        actorUserId: 'admin-test',
        action: i % 2 ? 'document_uploaded' : 'application_stage_changed',
        entityType: i % 2 ? 'document' : 'application',
        entityId: 'app-' + i,
        createdAt: '2026-09-20T10:20:00Z',
      }));
    else if (path.startsWith('/api/applications/')) {
      const parts = path.split('/');
      const item = items.find(value => value.id === parts[3]);
      if (parts[4] === 'stage') item.status = body.stage;
      if (parts[4] === 'decision') {
        item.decisionStatus = body.status;
        item.decisionReason = body.reason;
      }
      if (parts[4] === 'documents') {
        const doc = item.documents.find(value => value.id === parts[5]);
        if (parts[6] === 'verify') {
          doc.status = body.status;
          doc.verifyNote = body.note;
        } else doc.physicalDeliveryStatus = body.status;
      }
      data = item;
    } else if (path === '/api/documents/doc-photo/download') {
      const response = await page.request.get(
        'http://127.0.0.1:5173/inno-logo.jpg',
      );
      return route.fulfill({
        status: 200,
        contentType: 'image/jpeg',
        body: await response.body(),
      });
    } else if (path === '/api/documents/doc-boarding/download') {
      const stream = 'BT /F1 22 Tf 40 170 Td (INNO - TEST DOCUMENT) Tj ET';
      const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 240] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      ];
      let pdf = '%PDF-1.4\n';
      const offsets = [0];
      objects.forEach((object, index) => {
        offsets.push(pdf.length);
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
      });
      const xref = pdf.length;
      pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
        .slice(1)
        .map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`)
        .join(
          '',
        )}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: pdf,
      });
    } else if (path === '/api/admin/exports/applications.csv')
      return route.fulfill({
        status: 500,
        json: { message: 'Test: dışa aktarım şu an kullanılamıyor.' },
      });
    else if (path.endsWith('/status')) {
      const admin = admins.find(value => path.includes(value.id));
      admin.status = body.status;
      data = admin;
    } else if (
      path.includes('temporary-password') ||
      path.includes('reset-password') ||
      path === '/api/auth/logout' ||
      path === '/api/auth/forgot-password'
    )
      data = { message: 'Tamam' };
    else
      return route.fulfill({
        status: 404,
        json: { message: 'Test endpoint not provided' },
      });
    return route.fulfill({ status: 200, json: data });
  });
  await page.reload();
}
