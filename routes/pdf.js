import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import {
  generateBudgetPDF,
  generateOrderPDF,
  generatePurchasePDF,
} from '../utils/pdfGenerator.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

router.get('/budget/:id', async (req, res) => {
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        client: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    const settings = await prisma.settings.findFirst();

    const doc = generateBudgetPDF(budget, settings || {});

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=orcamento-${budget.number}.pdf`
    );

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Erro ao gerar PDF do orçamento:', error);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

router.get('/order/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        client: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'OS não encontrada' });
    }

    const settings = await prisma.settings.findFirst();

    const doc = generateOrderPDF(order, settings || {});

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=os-${order.number}.pdf`
    );

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Erro ao gerar PDF da OS:', error);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

router.get('/purchase/:id', async (req, res) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const settings = await prisma.settings.findFirst();

    const doc = generatePurchasePDF(purchase, settings || {});

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=pedido-${purchase.number}.pdf`
    );

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Erro ao gerar PDF do pedido:', error);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

export default router;
