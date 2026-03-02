import PdfPrinter from 'pdfmake';

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

function formatDateOnly(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const printer = new PdfPrinter(fonts);

export function generateBudgetPDF(budget, settings) {
  const docDefinition = {
    content: [
      {
        text: settings.companyName || 'Irmão Freios Pneumáticos',
        style: 'header',
        alignment: 'center',
      },
      {
        text: 'ORÇAMENTO',
        style: 'subheader',
        alignment: 'center',
        margin: [0, 10, 0, 20],
      },
      {
        columns: [
          {
            text: [
              { text: 'Nº Orçamento: ', bold: true },
              budget.number.toString(),
            ],
          },
          {
            text: [
              { text: 'Data: ', bold: true },
              formatDate(budget.createdAt),
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 10],
      },
      {
        text: [
          { text: 'Cliente: ', bold: true },
          budget.client.name,
        ],
        margin: [0, 0, 0, 5],
      },
      budget.client.cpfCnpj
        ? {
            text: [
              { text: 'CPF/CNPJ: ', bold: true },
              budget.client.cpfCnpj,
            ],
            margin: [0, 0, 0, 5],
          }
        : {},
      budget.client.phone
        ? {
            text: [
              { text: 'Telefone: ', bold: true },
              budget.client.phone,
            ],
            margin: [0, 0, 0, 10],
          }
        : {},
      {
        text: 'Itens do Orçamento',
        style: 'sectionTitle',
        margin: [0, 10, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 80, 80, 100],
          body: [
            [
              { text: 'Descrição', style: 'tableHeader' },
              { text: 'Qtd', style: 'tableHeader', alignment: 'center' },
              { text: 'Unitário', style: 'tableHeader', alignment: 'right' },
              { text: 'Total', style: 'tableHeader', alignment: 'right' },
            ],
            ...budget.items.map((item) => [
              item.description,
              { text: item.quantity.toString(), alignment: 'center' },
              {
                text: `R$ ${item.unitPrice.toFixed(2)}`,
                alignment: 'right',
              },
              {
                text: `R$ ${item.totalPrice.toFixed(2)}`,
                alignment: 'right',
              },
            ]),
            [
              { text: 'Mão de Obra', colSpan: 3, bold: true },
              {},
              {},
              {
                text: `R$ ${budget.laborCost.toFixed(2)}`,
                alignment: 'right',
                bold: true,
              },
            ],
            [
              { text: 'TOTAL', colSpan: 3, bold: true },
              {},
              {},
              {
                text: `R$ ${budget.totalValue.toFixed(2)}`,
                alignment: 'right',
                bold: true,
              },
            ],
          ],
        },
        margin: [0, 0, 0, 10],
      },
      {
        text: [
          { text: 'Validade: ', bold: true },
          formatDateOnly(budget.validity),
        ],
        margin: [0, 10, 0, 5],
      },
      {
        text: [
          { text: 'Status: ', bold: true },
          budget.status.toUpperCase(),
        ],
        margin: [0, 0, 0, 10],
      },
      budget.notes
        ? {
            text: [
              { text: 'Observações: ', bold: true },
              budget.notes,
            ],
            margin: [0, 10, 0, 10],
          }
        : {},
      settings.signature
        ? {
            text: settings.signature,
            alignment: 'center',
            margin: [0, 30, 0, 0],
            italics: true,
          }
        : {},
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
      },
      subheader: {
        fontSize: 16,
        bold: true,
      },
      sectionTitle: {
        fontSize: 14,
        bold: true,
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
      },
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
    },
  };

  return printer.createPdfKitDocument(docDefinition);
}

export function generateOrderPDF(order, settings) {
  const docDefinition = {
    content: [
      {
        text: settings.companyName || 'Irmão Freios Pneumáticos',
        style: 'header',
        alignment: 'center',
      },
      {
        text: 'ORDEM DE SERVIÇO',
        style: 'subheader',
        alignment: 'center',
        margin: [0, 10, 0, 20],
      },
      {
        columns: [
          {
            text: [
              { text: 'Nº OS: ', bold: true },
              order.number.toString(),
            ],
          },
          {
            text: [
              { text: 'Data: ', bold: true },
              formatDate(order.createdAt),
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 10],
      },
      {
        text: [
          { text: 'Cliente: ', bold: true },
          order.client.name,
        ],
        margin: [0, 0, 0, 5],
      },
      order.client.cpfCnpj
        ? {
            text: [
              { text: 'CPF/CNPJ: ', bold: true },
              order.client.cpfCnpj,
            ],
            margin: [0, 0, 0, 5],
          }
        : {},
      {
        text: [
          { text: 'Status: ', bold: true },
          order.status.toUpperCase(),
        ],
        margin: [0, 0, 0, 10],
      },
      {
        text: 'Itens da OS',
        style: 'sectionTitle',
        margin: [0, 10, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 80, 80, 100],
          body: [
            [
              { text: 'Descrição', style: 'tableHeader' },
              { text: 'Qtd', style: 'tableHeader', alignment: 'center' },
              { text: 'Unitário', style: 'tableHeader', alignment: 'right' },
              { text: 'Total', style: 'tableHeader', alignment: 'right' },
            ],
            ...order.items.map((item) => [
              item.description,
              { text: item.quantity.toString(), alignment: 'center' },
              {
                text: `R$ ${item.unitPrice.toFixed(2)}`,
                alignment: 'right',
              },
              {
                text: `R$ ${item.totalPrice.toFixed(2)}`,
                alignment: 'right',
              },
            ]),
            [
              { text: 'Mão de Obra', colSpan: 3, bold: true },
              {},
              {},
              {
                text: `R$ ${order.laborCost.toFixed(2)}`,
                alignment: 'right',
                bold: true,
              },
            ],
            [
              { text: 'TOTAL', colSpan: 3, bold: true },
              {},
              {},
              {
                text: `R$ ${order.totalValue.toFixed(2)}`,
                alignment: 'right',
                bold: true,
              },
            ],
          ],
        },
        margin: [0, 0, 0, 10],
      },
      order.technicalNotes
        ? {
            text: [
              { text: 'Observações Técnicas: ', bold: true },
              order.technicalNotes,
            ],
            margin: [0, 10, 0, 10],
          }
        : {},
      settings.signature
        ? {
            text: settings.signature,
            alignment: 'center',
            margin: [0, 30, 0, 0],
            italics: true,
          }
        : {},
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
      },
      subheader: {
        fontSize: 16,
        bold: true,
      },
      sectionTitle: {
        fontSize: 14,
        bold: true,
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
      },
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
    },
  };

  return printer.createPdfKitDocument(docDefinition);
}

export function generatePurchasePDF(purchase, settings) {
  const docDefinition = {
    content: [
      {
        text: settings.companyName || 'Irmão Freios Pneumáticos',
        style: 'header',
        alignment: 'center',
      },
      {
        text: 'PEDIDO DE COMPRA',
        style: 'subheader',
        alignment: 'center',
        margin: [0, 10, 0, 20],
      },
      {
        columns: [
          {
            text: [
              { text: 'Nº Pedido: ', bold: true },
              purchase.number.toString(),
            ],
          },
          {
            text: [
              { text: 'Data: ', bold: true },
              formatDate(purchase.createdAt),
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 10],
      },
      purchase.supplier
        ? {
            text: [
              { text: 'Fornecedor: ', bold: true },
              purchase.supplier,
            ],
            margin: [0, 0, 0, 10],
          }
        : {},
      {
        text: 'Itens do Pedido',
        style: 'sectionTitle',
        margin: [0, 10, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 80, 100, 100],
          body: [
            [
              { text: 'Produto', style: 'tableHeader' },
              { text: 'Qtd', style: 'tableHeader', alignment: 'center' },
              { text: 'Unitário', style: 'tableHeader', alignment: 'right' },
              { text: 'Total', style: 'tableHeader', alignment: 'right' },
            ],
            ...purchase.items.map((item) => [
              item.product.description,
              { text: item.quantity.toString(), alignment: 'center' },
              {
                text: `R$ ${item.unitPrice.toFixed(2)}`,
                alignment: 'right',
              },
              {
                text: `R$ ${item.totalPrice.toFixed(2)}`,
                alignment: 'right',
              },
            ]),
            [
              { text: 'TOTAL', colSpan: 3, bold: true },
              {},
              {},
              {
                text: `R$ ${purchase.totalValue.toFixed(2)}`,
                alignment: 'right',
                bold: true,
              },
            ],
          ],
        },
        margin: [0, 0, 0, 10],
      },
      purchase.notes
        ? {
            text: [
              { text: 'Observações: ', bold: true },
              purchase.notes,
            ],
            margin: [0, 10, 0, 10],
          }
        : {},
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
      },
      subheader: {
        fontSize: 16,
        bold: true,
      },
      sectionTitle: {
        fontSize: 14,
        bold: true,
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
      },
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
    },
  };

  return printer.createPdfKitDocument(docDefinition);
}
