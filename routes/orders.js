import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const orders = await prisma.order.findMany({
      where,
      include: {
        client: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('Erro ao buscar OS:', error);
    res.status(500).json({ error: 'Erro ao buscar OS' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        client: true,
        budget: true,
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

    res.json(order);
  } catch (error) {
    console.error('Erro ao buscar OS:', error);
    res.status(500).json({ error: 'Erro ao buscar OS' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });

    res.json(order);
  } catch (error) {
    console.error('Erro ao atualizar status da OS:', error);
    res.status(500).json({ error: 'Erro ao atualizar status da OS' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, technicalNotes } = req.body;

    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        technicalNotes,
      },
    });

    res.json(order);
  } catch (error) {
    console.error('Erro ao atualizar OS:', error);
    res.status(500).json({ error: 'Erro ao atualizar OS' });
  }
});

export default router;
