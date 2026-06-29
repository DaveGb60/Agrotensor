import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FarmProject, FarmAnimal, BreedingProjectDetails } from './db';
import { format, parse } from 'date-fns';
import { formatCurrency } from './breedingFinance';

interface BreedingPDFExportOptions {
  project: FarmProject;
  animals: FarmAnimal[];
  details: BreedingProjectDetails;
  type: 'full' | 'animals' | 'events' | 'financial';
}

export function generateBreedingPDF(options: BreedingPDFExportOptions): void {
  const { project, animals, details, type } = options;
  const doc = new jsPDF();

  const primaryColor: [number, number, number] = [34, 84, 61];
  const accentColor: [number, number, number] = [22, 163, 74];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 220, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AgroTensor', 14, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Breeding Project Report', 14, 30);

  // Project Info
  doc.setTextColor(0, 0, 0);
  let yPos = 50;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(project.title, 14, yPos);
  yPos += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Project ID: ${project.id.slice(0, 8)}`, 14, yPos);
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`, 80, yPos);
  if (project.isCompleted) {
    doc.text(`Status: Completed`, 160, yPos);
  }
  yPos += 8;

  // Report Title
  const reportTitle = type === 'full' ? 'Full Breeding Report' :
                      type === 'animals' ? 'Animals Report' :
                      type === 'events' ? 'Events Report' : 'Financial Report';
  doc.setTextColor(...accentColor);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, 14, yPos);
  yPos += 10;

  // Project Details Section
  if (type === 'full' || type === 'financial') {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Details', 14, yPos);
    yPos += 6;

    const detailsData = [
      ['Breed', details.breed || 'Not set'],
      ['Herd Size', details.herdSize?.toString() || 'Not set'],
      ['Breeding Goal', details.breedingGoal || 'Not set'],
      ['Capital Investment', formatCurrency(details.capitalInvestment || 0)],
      ['Total Costs', formatCurrency(details.totalCosts || 0)],
      ['Estimated Revenue', formatCurrency(details.estimatedRevenue || 0)],
      ['Breeding Season', details.breedingSeasonStart && details.breedingSeasonEnd ?
        `${format(parse(details.breedingSeasonStart, 'yyyy-MM-dd', new Date()), 'MMM d')} - ${format(parse(details.breedingSeasonEnd, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}` :
        'Not set'],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Field', 'Value']],
      body: detailsData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 110 },
      },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Animals Summary
  if (type === 'full' || type === 'animals') {
    if (animals.length > 0) {
      if (yPos > 240) { doc.addPage(); yPos = 20; }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Animals Summary', 14, yPos);
      yPos += 6;

      const animalsData = animals.map((a) => [
        a.animalId,
        a.sex === 'male' ? 'Male' : 'Female',
        a.breed || '-',
        a.healthStatus.replace('_', ' '),
        a.currentStatus || 'active',
        formatCurrency(a.acquisitionCost || 0),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Tag', 'Sex', 'Breed', 'Health', 'Status', 'Acquisition']],
        body: animalsData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 15 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 22 },
          5: { cellWidth: 25, textColor: accentColor },
        },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // Events Section (mating, pregnancy, birth, treatment, sale, death)
  if (type === 'full' || type === 'events') {
    const allEvents: { date: string; type: string; description: string; animalId: string; amount?: number }[] = [];

    for (const a of animals) {
      for (const m of a.matingHistory) {
        const mate = animals.find((am) => am.id === m.mateId);
        allEvents.push({
          date: m.date,
          type: 'Mating',
          description: `Mated with ${mate ? mate.animalId : m.mateId}`,
          animalId: a.animalId,
        });
      }
      for (const p of a.pregnancyHistory) {
        allEvents.push({
          date: p.startDate,
          type: 'Pregnancy',
          description: `Status: ${p.status.replace('_', ' ')}${p.expectedDeliveryDate ? ` | Expected: ${format(parse(p.expectedDeliveryDate, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}` : ''}`,
          animalId: a.animalId,
        });
      }
      for (const b of a.birthRecords) {
        allEvents.push({
          date: b.birthDate,
          type: 'Birth',
          description: `${b.offspringIds.length} offspring`,
          animalId: a.animalId,
        });
      }
      for (const t of a.treatmentHistory) {
        allEvents.push({
          date: t.date,
          type: 'Treatment',
          description: t.treatment || 'No treatment specified',
          animalId: a.animalId,
          amount: t.cost,
        });
      }
      for (const s of a.saleRecords) {
        allEvents.push({
          date: s.saleDate,
          type: 'Sale',
          description: s.buyer || 'No buyer',
          animalId: a.animalId,
          amount: s.price,
        });
      }
      for (const d of a.deathRecords) {
        allEvents.push({
          date: d.deathDate,
          type: 'Death',
          description: d.cause || 'Unknown',
          animalId: a.animalId,
        });
      }
    }

    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (allEvents.length > 0) {
      if (yPos > 240) { doc.addPage(); yPos = 20; }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Event Log', 14, yPos);
      yPos += 6;

      const eventsData = allEvents.map((e) => [
        format(parse(e.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy'),
        e.animalId,
        e.type,
        e.description,
        e.amount !== undefined ? formatCurrency(e.amount) : '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Animal', 'Event', 'Details', 'Amount']],
        body: eventsData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 22 },
          2: { cellWidth: 18 },
          3: { cellWidth: 60 },
          4: { cellWidth: 22, textColor: accentColor },
        },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // Financial Summary
  if (type === 'full' || type === 'financial') {
    if (yPos > 240) { doc.addPage(); yPos = 20; }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 14, yPos);
    yPos += 8;

    const capital = details.capitalInvestment || 0;
    const totalCosts = (details.totalCosts || 0) +
      animals.reduce((sum, a) => sum + a.treatmentHistory.reduce((s, r) => s + (r.cost || 0), 0), 0);
    const totalRevenue = animals.reduce((sum, a) => sum + a.saleRecords.reduce((s, r) => s + (r.price || 0), 0), 0);
    const netProfit = totalRevenue - totalCosts - capital;

    const financialData = [
      ['Capital Investment', formatCurrency(capital)],
      ['Project Costs', formatCurrency(details.totalCosts || 0)],
      ['Treatment Costs', formatCurrency(animals.reduce((sum, a) => sum + a.treatmentHistory.reduce((s, r) => s + (r.cost || 0), 0), 0))],
      ['Sales Revenue', formatCurrency(totalRevenue)],
      ['Net Profit', formatCurrency(netProfit)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Amount']],
      body: financialData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 60, textColor: accentColor },
      },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `AgroTensor | Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  const filename = `AgroTensor_Breeding_${project.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}
