import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
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

    res.json(budgets);
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar orçamentos' });
  }
});

router.get('/:id', async (req, res) => {
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

    res.json(budget);
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    res.status(500).json({ error: 'Erro ao buscar orçamento' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { clientId, validity, laborCost, items, notes } = req.body;

    // Obter próximo número de orçamento
    const lastBudget = await prisma.budget.findFirst({
      orderBy: { number: 'desc' },
    });
    const nextNumber = lastBudget ? lastBudget.number + 1 : 1;

    // Calcular total
    const itemsTotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalValue = itemsTotal + (laborCost || 0);

    const budget = await prisma.budget.create({
      data: {
        number: nextNumber,
        clientId,
        validity: new Date(validity),
        laborCost: laborCost || 0,
        totalValue,
        notes,
        items: {
          create: items.map((item) => ({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0,
            type: item.type || 'service',
          })),
        },
      },
      include: {
        client: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(201).json(budget);
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({ error: 'Erro ao criar orçamento' });
  }
});

router.put('/:id/approve', async (req, res) => {
  try {
    const budget = await prisma.budget.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'aprovado' },
    });

    res.json(budget);
  } catch (error) {
    console.error('Erro ao aprovar orçamento:', error);
    res.status(500).json({ error: 'Erro ao aprovar orçamento' });
  }
});

router.post('/:id/convert-to-order', async (req, res) => {
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
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

    // Obter próximo número de OS
    const lastOrder = await prisma.order.findFirst({
      orderBy: { number: 'desc' },
    });
    const nextNumber = lastOrder ? lastOrder.number + 1 : 1;

    // Calcular custos e lucros
    let costValue = 0;
    let profitValue = 0;

    const orderItems = await Promise.all(
      budget.items.map(async (item) => {
        let itemCostPrice = 0;
        let itemProfit = 0;

        if (item.type === 'product' && item.product) {
          // Assumindo que o preço de custo é 60% do preço de venda (ajuste conforme necessário)
          itemCostPrice = item.unitPrice * 0.6;
          itemProfit = item.totalPrice - itemCostPrice * item.quantity;
          costValue += itemCostPrice * item.quantity;
          profitValue += itemProfit;

          // Baixar estoque
          await prisma.product.update({
            where: { id: item.product.id },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });
        } else {
          // Serviço: assumindo 30% de custo
          itemCostPrice = item.unitPrice * 0.3;
          itemProfit = item.totalPrice - itemCostPrice * item.quantity;
          costValue += itemCostPrice * item.quantity;
          profitValue += itemProfit;
        }

        return {
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: itemCostPrice,
          totalPrice: item.totalPrice,
          type: item.type,
        };
      })
    );

    // Calcular custo e lucro da mão de obra
    const laborCostValue = budget.laborCost * 0.3; // 30% de custo
    const laborProfit = budget.laborCost - laborCostValue;
    costValue += laborCostValue;
    profitValue += laborProfit;

    const totalValue = budget.totalValue;

    // Criar OS
    const order = await prisma.order.create({
      data: {
        number: nextNumber,
        clientId: budget.clientId,
        budgetId: budget.id,
        status: 'aberta',
        laborCost: budget.laborCost,
        totalValue,
        costValue,
        profitValue,
        items: {
          create: orderItems,
        },
      },
      include: {
        client: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Criar registro financeiro
    const companyCash = profitValue * 0.6;
    const salaryCash = profitValue * 0.4;

    await prisma.financial.create({
      data: {
        orderId: order.id,
        type: 'receita',
        description: `OS #${order.number} - ${order.client.name}`,
        grossRevenue: totalValue,
        totalCost: costValue,
        netProfit: profitValue,
        companyCash,
        salaryCash,
      },
    });

    // Atualizar status do orçamento
    await prisma.budget.update({
      where: { id: budget.id },
      data: { status: 'aprovado' },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Erro ao converter orçamento em OS:', error);
    res.status(500).json({ error: 'Erro ao converter orçamento em OS' });
  }
});

export default router;
