import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

/* ========================= LISTAR PRODUTOS ========================= */

router.get('/', async (req, res) => {
  try {
    const { search, lowStock } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { description: 'asc' },
    });

    const filteredProducts =
      lowStock === 'true'
        ? products.filter((p) => p.quantity <= p.minQuantity)
        : products;

    res.json(filteredProducts);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

/* ========================= BUSCAR POR ID ========================= */

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

/* ========================= CRIAR PRODUTO ========================= */

router.post('/', async (req, res) => {
  try {
    const { code, description, quantity, minQuantity, unitPrice } = req.body;

    const product = await prisma.product.create({
      data: {
        code,
        description,
        quantity: parseFloat(quantity) || 0,
        minQuantity: parseFloat(minQuantity) || 0,
        unitPrice: parseFloat(unitPrice) || 0,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

/* ========================= ATUALIZAR PRODUTO ========================= */

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { code, description, quantity, minQuantity, unitPrice } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        code,
        description,
        quantity: parseFloat(quantity),
        minQuantity: parseFloat(minQuantity),
        unitPrice: parseFloat(unitPrice),
      },
    });

    res.json(product);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

/* ========================= ENTRADA DE ESTOQUE ========================= */

router.post('/:id/entry', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const quantity = parseFloat(req.body.quantity);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Quantidade inválida' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        quantity: {
          increment: quantity,
        },
      },
    });

    res.json(product);
  } catch (error) {
    console.error('Erro ao registrar entrada:', error);
    res.status(500).json({ error: 'Erro ao registrar entrada' });
  }
});

/* ========================= SAÍDA DE ESTOQUE ========================= */

router.post('/:id/exit', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const quantity = parseFloat(req.body.quantity);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Quantidade inválida' });
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Quantidade insuficiente em estoque' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao registrar saída:', error);
    res.status(500).json({ error: 'Erro ao registrar saída' });
  }
});

export default router;