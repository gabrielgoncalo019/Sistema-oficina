import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          companyName: 'Irmão Freios Pneumáticos',
          defaultMinStock: 5,
        },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

router.put('/', requireAdmin, async (req, res) => {
  try {
    const {
      companyName,
      cnpj,
      address,
      phone,
      email,
      logo,
      signature,
      defaultMinStock,
    } = req.body;

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          companyName: companyName || 'Irmão Freios Pneumáticos',
          cnpj: cnpj || null,
          address: address || null,
          phone: phone || null,
          email: email || null,
          logo: logo || null,
          signature: signature || null,
          defaultMinStock: defaultMinStock || 5,
        },
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          companyName: companyName || settings.companyName,
          cnpj: cnpj !== undefined ? cnpj : settings.cnpj,
          address: address !== undefined ? address : settings.address,
          phone: phone !== undefined ? phone : settings.phone,
          email: email !== undefined ? email : settings.email,
          logo: logo !== undefined ? logo : settings.logo,
          signature: signature !== undefined ? signature : settings.signature,
          defaultMinStock: defaultMinStock !== undefined ? defaultMinStock : settings.defaultMinStock,
        },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

export default router;
