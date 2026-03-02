import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { companyName: { contains: search } },
            { cpfCnpj: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const clients = await prisma.client.findMany({
      where,
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(clients);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        budgets: {
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(client);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, companyName, cpfCnpj, phone, whatsapp, address, notes } = req.body;

    const client = await prisma.client.create({
      data: {
        name,
        companyName,
        cpfCnpj,
        phone,
        whatsapp,
        address,
        notes,
      },
    });

    res.status(201).json(client);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, companyName, cpfCnpj, phone, whatsapp, address, notes } = req.body;

    const client = await prisma.client.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        companyName,
        cpfCnpj,
        phone,
        whatsapp,
        address,
        notes,
      },
    });

    res.json(client);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

export default router;
