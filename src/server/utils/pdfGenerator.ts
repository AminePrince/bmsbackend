import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Rental, Invoice, Car, Client } from '../types.js';

export async function generateInvoicePDF(invoice: Invoice, rental: Rental, car: Car, client: Client): Promise<string> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `invoice_${invoice.invoiceNumber}.pdf`;
        const dir = path.join(process.cwd(), 'storage', 'app', 'private', 'invoices');
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const filePath = path.join(dir, fileName);
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('FACTURE', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(10).text('BMS RIDER - Gestion de Flotte', { align: 'left' });
        doc.text('Casablanca, Maroc');
        doc.text('Contact: contact@bmsrider.ma');
        doc.moveDown();

        // Invoice Info
        doc.text(`Facture N°: ${invoice.invoiceNumber}`);
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`);
        doc.text(`Statut: ${invoice.status.toUpperCase()}`);
        doc.moveDown();

        // Client Info
        doc.fontSize(12).text('Client:', { underline: true });
        doc.fontSize(10).text(`Nom: ${client.fullName}`);
        doc.text(`Email: ${client.email}`);
        doc.text(`Tél: ${client.phone}`);
        doc.moveDown();

        // Rental Details
        doc.fontSize(12).text('Détails de la location:', { underline: true });
        doc.fontSize(10).text(`Véhicule: ${car.brand} ${car.model} (${car.licensePlate})`);
        doc.text(`Période: Du ${new Date(rental.startDate).toLocaleDateString('fr-FR')} au ${new Date(rental.endDate).toLocaleDateString('fr-FR')}`);
        doc.moveDown();

        // Table Header
        const tableTop = 350;
        doc.font('Helvetica-Bold');
        doc.text('Description', 50, tableTop);
        doc.text('Prix Unitaire', 250, tableTop);
        doc.text('Total HT', 450, tableTop);
        doc.moveDown();
        doc.font('Helvetica');
        
        const itemY = tableTop + 20;
        doc.text(`Location de voiture (${car.brand} ${car.model})`, 50, itemY);
        doc.text(`${rental.pricePerDay} DH/jour`, 250, itemY);
        doc.text(`${invoice.amount} DH`, 450, itemY);

        // Totals
        const totalsY = itemY + 50;
        doc.text('Total HT:', 350, totalsY);
        doc.text(`${invoice.amount} DH`, 450, totalsY);
        
        doc.text('TVA (20%):', 350, totalsY + 20);
        doc.text(`${invoice.tax} DH`, 450, totalsY + 20);
        
        doc.font('Helvetica-Bold');
        doc.text('TOTAL TTC:', 350, totalsY + 40);
        doc.text(`${invoice.totalAmount} DH`, 450, totalsY + 40);

        // Footer
        doc.fontSize(8).text('Merci de votre confiance.', 50, 700, { align: 'center' });

        doc.end();

        stream.on('finish', () => {
            resolve(filePath);
        });

        stream.on('error', (err) => {
            reject(err);
        });
    });
}
