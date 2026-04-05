import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, Client } from '../types';

export const generateInvoicePDF = (invoice: Invoice, client?: Client) => {
    const doc = new jsPDF();

    const docTypes: Record<string, string> = {
        'order': 'PEDIDO',
        'invoice': 'FACTURA',
        'credit_note': 'NOTA DE CRÉDITO',
        'debit_note': 'NOTA DE DÉBITO'
    };
    const title = docTypes[invoice.type || 'invoice'];

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`No. Documento: ${invoice.id.slice(0, 8)}`, 14, 25);
    doc.text(`Fecha: ${new Date(invoice.date).toLocaleDateString()}`, 14, 30);
    doc.text(`Estado: ${invoice.status.toUpperCase()}`, 14, 35);

    // Client Info
    if (client) {
        doc.text('Cliente:', 14, 45);
        doc.setFontSize(12);
        doc.text(client.name, 14, 50);
        doc.setFontSize(10);
        doc.text(`RNC/Cédula: ${client.taxId}`, 14, 55);
        doc.text(`Dirección: ${client.address}`, 14, 60);
        doc.text(`Tel: ${client.phone}`, 14, 65);
    } else {
        doc.text(`Cliente: ${invoice.clientName}`, 14, 45);
    }

    // Table
    const tableColumn = ["Producto", "Cantidad", "Precio", "Total"];
    const tableRows: (string | number)[][] = [];

    invoice.items.forEach(item => {
        const itemData = [
            item.productName,
            item.quantity,
            `$${item.price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
            `$${item.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 75,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] } // Primary Color
    });

    // Totals
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    doc.text(`Subtotal: $${invoice.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 140, finalY);
    doc.text(`ITBIS (18%): $${invoice.tax.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 140, finalY + 5);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: $${invoice.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 140, finalY + 12);

    // Footer
    if (invoice.notes) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Notas:', 14, finalY + 25);
        doc.text(invoice.notes, 14, finalY + 30);
    }

    doc.save(`${title.toLowerCase().replace(/ /g, '_')}_${invoice.id.slice(0, 8)}.pdf`);
};
