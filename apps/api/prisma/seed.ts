import path from 'node:path';
import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ReferenceKind } from '@prisma/client/wasm';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const permissionActions = ['view', 'create', 'update', 'delete', 'delete_permanent', 'archive', 'export'];
const modules = ['patients', 'prescriptions', 'inventory', 'deliveries', 'missions', 'documents', 'medical-staff', 'partners', 'users', 'references', 'finance', 'settings'];

async function main() {
  const permissions = modules.flatMap((module) => permissionActions.map((action) => ({ module, action })));
  const adminRole = await prisma.role.upsert({ where: { name: 'Administrateur' }, create: { name: 'Administrateur', description: 'Accès complet', isSystem: true }, update: {} });
  await Promise.all(permissions.map((permission) => prisma.rolePermission.upsert({ where: { roleId_module_action: { roleId: adminRole.id, module: permission.module, action: permission.action } }, create: { roleId: adminRole.id, ...permission }, update: {} })));
  const passwordHash = await bcrypt.hash('ChangeMe!2025', 12);
  const admin = await prisma.user.upsert({ where: { email: 'admin@mediflow.local' }, create: { email: 'admin@mediflow.local', passwordHash, firstName: 'Sofia', lastName: 'Martin', roles: { create: { roleId: adminRole.id } } }, update: {} });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } }, create: { userId: admin.id, roleId: adminRole.id }, update: {} });
  await prisma.codeSequence.createMany({ data: [{ prefix: 'PAT' }, { prefix: 'ORD' }, { prefix: 'INV' }, { prefix: 'LIV' }, { prefix: 'MIS' }, { prefix: 'DOC' }, { prefix: 'FAC' }, { prefix: 'PAR' }, { prefix: 'MED' }], skipDuplicates: true });
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
  await prisma.systemSetting.upsert({ where: { key: 'app' }, create: { key: 'app', value: { appName: 'MediFlow', defaultLanguage: 'fr', defaultTheme: 'light' } }, update: {} });
  console.log(`Seed terminé pour ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
