import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    // Caixa do dia
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFinancials = await prisma.financial.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayCash = todayFinancials.reduce(
      (acc, item) => {
        acc.companyCash += item.companyCash;
        acc.salaryCash += item.salaryCash;
        return acc;
      },
      { companyCash: 0, salaryCash: 0 }
    );

    // OS em aberto
    const openOrders = await prisma.order.count({
      where: {
        status: {
          in: ['aberta', 'em_andamento'],
        },
      },
    });

    // Peças em estoque mínimo
    const allProducts = await prisma.product.findMany();
    const lowStockProducts = allProducts.filter(
      (p) => p.quantity <= p.minQuantity
    );

    // Faturamento do mês
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthFinancials = await prisma.financial.findMany({
      where: {
        date: {
          gte: firstDayOfMonth,
        },
      },
    });

    const monthRevenue = monthFinancials.reduce(
      (sum, item) => sum + item.grossRevenue,
      0
    );

    // Orçamentos vencendo (próximos 7 dias)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringBudgets = await prisma.budget.findMany({
      where: {
        status: {
          in: ['enviado', 'aprovado'],
        },
        validity: {
          lte: sevenDaysFromNow,
          gte: today,
        },
      },
      include: {
        client: true,
      },
    });

    // OS paradas há mais de 3 dias
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const stalledOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['aberta', 'em_andamento'],
        },
        updatedAt: {
          lt: threeDaysAgo,
        },
      },
      include: {
        client: true,
      },
    });

    res.json({
      todayCash,
      openOrders,
      lowStockCount: lowStockProducts.length,
      monthRevenue,
      lowStockProducts: lowStockProducts.slice(0, 5),
      expiringBudgets: expiringBudgets.slice(0, 5),
      stalledOrders: stalledOrders.slice(0, 5),
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

export default router;
