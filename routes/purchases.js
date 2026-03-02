import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(purchases);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

router.get('/low-stock-products', async (req, res) => {
  try {
    const allProducts = await prisma.product.findMany({
      orderBy: { description: 'asc' },
    });
    const products = allProducts.filter((p) => p.quantity <= p.minQuantity);

    res.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos com estoque baixo:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos com estoque baixo' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { supplier, items, notes } = req.body;

    // Obter próximo número de pedido
    const lastPurchase = await prisma.purchase.findFirst({
      orderBy: { number: 'desc' },
    });
    const nextNumber = lastPurchase ? lastPurchase.number + 1 : 1;

    // Calcular total
    const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const purchase = await prisma.purchase.create({
      data: {
        number: nextNumber,
        supplier,
        totalValue,
        notes,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Atualizar estoque dos produtos
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          quantity: {
            increment: item.quantity,
          },
        },
      });
    }

    res.status(201).json(purchase);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

router.get('/:id', async (req, res) => {
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

    res.json(purchase);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

export default router;
