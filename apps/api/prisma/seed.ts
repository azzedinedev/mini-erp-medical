import { PrismaClient, ReferenceKind, StaffType, Gender } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const permissionActions = ['view', 'create', 'update', 'delete', 'archive', 'export'];
const modules = ['patients', 'prescriptions', 'inventory', 'deliveries', 'missions', 'documents', 'medical-staff', 'partners', 'users', 'references', 'finance', 'settings'];

async function main() {
  const permissions = modules.flatMap((module) => permissionActions.map((action) => ({ module, action })));
  const adminRole = await prisma.role.upsert({ where: { name: 'Administrateur' }, create: { name: 'Administrateur', description: 'Accès complet', isSystem: true }, update: {} });
  await Promise.all(permissions.map((permission) => prisma.rolePermission.upsert({ where: { roleId_module_action: { roleId: adminRole.id, module: permission.module, action: permission.action } }, create: { roleId: adminRole.id, ...permission }, update: {} })));
  const passwordHash = await bcrypt.hash('ChangeMe!2025', 12);
  const admin = await prisma.user.upsert({ where: { email: 'admin@mediflow.local' }, create: { email: 'admin@mediflow.local', passwordHash, firstName: 'Sofia', lastName: 'Martin', roles: { create: { roleId: adminRole.id } } }, update: {} });
  await prisma.codeSequence.createMany({ data: [{ prefix: 'PAT' }, { prefix: 'ORD' }, { prefix: 'INV' }, { prefix: 'LIV' }, { prefix: 'MIS' }, { prefix: 'DOC' }, { prefix: 'FAC' }], skipDuplicates: true });
  const consultationTypes = [
    { code: 'CONSULT-GEN', labels: { fr: 'Consultation générale', en: 'General consultation', ar: 'استشارة عامة', es: 'Consulta general' }, icon: 'Stethoscope', color: '#2c8a82' },
    { code: 'CARDIO', labels: { fr: 'Cardiologie', en: 'Cardiology', ar: 'أمراض القلب', es: 'Cardiología' }, icon: 'HeartPulse', color: '#d96c5f' },
    { code: 'RADIO', labels: { fr: 'Radiologie', en: 'Radiology', ar: 'الأشعة', es: 'Radiología' }, icon: 'ScanLine', color: '#5b77c8' },
  ];
  for (const type of consultationTypes) await prisma.referenceType.upsert({ where: { code: type.code }, create: { kind: ReferenceKind.CONSULTATION, ...type }, update: type });
  await prisma.referenceType.upsert({ where: { code: 'PANSEMENT' }, create: { kind: ReferenceKind.NURSING, code: 'PANSEMENT', labels: { fr: 'Pansement', en: 'Dressing', ar: 'تضميد', es: 'Vendaje' }, icon: 'Bandage', color: '#e5a749' }, update: {} });
  const medications = [
    { code: 'MED-001', name: 'Paracétamol 1 g', molecule: 'Paracétamol', form: 'Comprimé', dosage: '1 g', unit: 'boîte' },
    { code: 'MED-002', name: 'Amoxicilline 500 mg', molecule: 'Amoxicilline', form: 'Gélule', dosage: '500 mg', unit: 'boîte' },
    { code: 'MED-003', name: 'Sérum physiologique', molecule: 'Chlorure de sodium', form: 'Solution', dosage: '0,9 %', unit: 'flacon' },
  ];
  for (const medication of medications) await prisma.medication.upsert({ where: { code: medication.code }, create: medication, update: medication });
  const patients = [
    { code: 'PAT-000001', firstName: 'Camille', lastName: 'Bernard', birthDate: new Date('1983-04-12'), gender: Gender.FEMALE, phone: '+33 6 12 48 71 09', email: 'camille.bernard@example.com', notes: 'Suivi cardiologique trimestriel.' },
    { code: 'PAT-000002', firstName: 'Youssef', lastName: 'Haddad', birthDate: new Date('1958-11-04'), gender: Gender.MALE, phone: '+33 6 33 19 04 22', email: 'youssef.haddad@example.com', notes: 'Soins à domicile, secteur Lyon 3.' },
    { code: 'PAT-000003', firstName: 'Élodie', lastName: 'Petit', birthDate: new Date('1991-07-28'), gender: Gender.FEMALE, phone: '+33 7 80 14 52 66', email: 'elodie.petit@example.com' },
  ];
  for (const patient of patients) await prisma.patient.upsert({ where: { code: patient.code }, create: { ...patient, createdById: admin.id }, update: {} });
  const staff = [
    { firstName: 'Sofia', lastName: 'Martin', staffType: StaffType.DOCTOR, specialty: 'Cardiologie', licenseNumber: 'ORD-75-1842', email: 'sofia.martin@mediflow.local' },
    { firstName: 'Nina', lastName: 'Rossi', staffType: StaffType.NURSE, specialty: 'Soins à domicile', licenseNumber: 'IDE-69-2271', email: 'nina.rossi@mediflow.local' },
    { firstName: 'Thomas', lastName: 'Nguyen', staffType: StaffType.TECHNICIAN, specialty: 'Biologie', licenseNumber: 'TEC-69-0972', email: 'thomas.nguyen@mediflow.local' },
  ];
  for (const member of staff) await prisma.medicalStaff.upsert({ where: { licenseNumber: member.licenseNumber }, create: member, update: member });
  const inventory = [
    { code: 'INV-000001', name: 'Gants nitrile — taille M', category: 'Protection', unit: 'boîte', quantity: 42, minQuantity: 20, location: 'Réserve A · Étagère 02', barcode: 'INV-000001' },
    { code: 'INV-000002', name: 'Pansements stériles 10 × 10', category: 'Soins', unit: 'boîte', quantity: 8, minQuantity: 12, location: 'Réserve A · Étagère 04', barcode: 'INV-000002' },
    { code: 'INV-000003', name: 'Seringues 5 ml', category: 'Injection', unit: 'boîte', quantity: 31, minQuantity: 15, location: 'Réserve B · Étagère 01', barcode: 'INV-000003' },
  ];
  for (const item of inventory) await prisma.inventoryItem.upsert({ where: { code: item.code }, create: item, update: item });
  await prisma.systemSetting.upsert({ where: { key: 'app' }, create: { key: 'app', value: { appName: 'MediFlow', defaultLanguage: 'fr', defaultTheme: 'light' } }, update: {} });
  console.log(`Seed terminé pour ${admin.email}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
