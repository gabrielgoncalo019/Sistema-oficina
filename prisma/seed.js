import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário administrador padrão
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      name: 'Administrador',
      login: 'admin',
      password: hashedPassword,
      profile: 'Administrador',
      active: true,
    },
  });

  console.log('✅ Usuário admin criado:', admin.login);

  // Criar configurações padrão
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      companyName: 'Irmão Freios Pneumáticos',
      defaultMinStock: 5,
    },
  });

  console.log('✅ Configurações padrão criadas');

  // Criar alguns produtos de exemplo
  const products = [
    {
      code: 'FR001',
      description: 'Pastilha de Freio Dianteira',
      quantity: 20,
      minQuantity: 10,
      unitPrice: 45.00,
    },
    {
      code: 'FR002',
      description: 'Pastilha de Freio Traseira',
      quantity: 15,
      minQuantity: 10,
      unitPrice: 38.00,
    },
    {
      code: 'FR003',
      description: 'Disco de Freio Dianteiro',
      quantity: 8,
      minQuantity: 5,
      unitPrice: 120.00,
    },
    {
      code: 'FR004',
      description: 'Disco de Freio Traseiro',
      quantity: 5,
      minQuantity: 5,
      unitPrice: 110.00,
    },
    {
      code: 'FR005',
      description: 'Cilindro de Freio',
      quantity: 3,
      minQuantity: 5,
      unitPrice: 85.00,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: {},
      create: product,
    });
  }

  console.log('✅ Produtos de exemplo criados');

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
