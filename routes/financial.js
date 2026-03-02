import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const financials = await prisma.financial.findMany({
      where,
      include: {
        order: {
          include: {
            client: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(financials);
  } catch (error) {
    console.error('Erro ao buscar registros financeiros:', error);
    res.status(500).json({ error: 'Erro ao buscar registros financeiros' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const financials = await prisma.financial.findMany({
      where,
    });

    const summary = financials.reduce(
      (acc, item) => {
        acc.grossRevenue += item.grossRevenue;
        acc.totalCost += item.totalCost;
        acc.netProfit += item.netProfit;
        acc.companyCash += item.companyCash;
        acc.salaryCash += item.salaryCash;
        return acc;
      },
      {
        grossRevenue: 0,
        totalCost: 0,
        netProfit: 0,
        companyCash: 0,
        salaryCash: 0,
      }
    );

    res.json(summary);
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo financeiro' });
  }
});

router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const financials = await prisma.financial.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todaySummary = financials.reduce(
      (acc, item) => {
        acc.companyCash += item.companyCash;
        acc.salaryCash += item.salaryCash;
        return acc;
      },
      {
        companyCash: 0,
        salaryCash: 0,
      }
    );

    res.json(todaySummary);
  } catch (error) {
    console.error('Erro ao buscar caixa do dia:', error);
    res.status(500).json({ error: 'Erro ao buscar caixa do dia' });
  }
});

export default router;
