import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as base64js from 'base64-js';
import { FundGroup, MemberCalculation } from '../types';

export const generatePDFBase64 = async (
  report: { group: FundGroup, lastBidAmount: number, nonPricedMembers: MemberCalculation[], pricedMembers: MemberCalculation[] }
): Promise<string> => {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4
  
  const font = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontB = await pdfDoc.embedFont(StandardFonts.CourierBold);

  let y = 800;
  
  const drawText = (t: string, x: number, py: number, f=font, size=9) => {
    page.drawText(t, { x, y: py, size, font: f, color: rgb(0,0,0) });
  };

  const checkPage = () => {
    if (y < 50) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = 800;
    }
  };

  // Header
  drawText('Shriram Chits', 20, y, fontB, 10);
  drawText('https://tnreport.shriramchitapp.in/ChittnReports...', 300, y, font, 9);
  y -= 30;
  
  drawText('HOME   MASTER   REPORT   QUERY   LOGOUT', 180, y, fontB);
  y -= 15;
  drawText('USER : QUERYALL   NAME : K01975 [KAMATCHI V]', 170, y, fontB);
  y -= 15;
  drawText(`BRANCH : 4550 [GOBICHETTIPALAYAM]   DATE : ${new Date().toLocaleDateString('en-IN')}`, 130, y, fontB);
  y -= 25;
  
  drawText('DEFAULTER LIST', 240, y, fontB, 14);
  page.drawLine({ start: { x: 240, y: y - 2 }, end: { x: 360, y: y - 2 }, thickness: 1 });
  y -= 30;

  // Group Details
  const latestAuction = [...report.group.auctions].sort((a, b) => b.monthNumber - a.monthNumber)[0];
  const lastPrizedTicket = latestAuction ? report.group.members.indexOf(latestAuction.winnerMemberId) + 1 : '—';
  const auctionNumber = report.group.auctions.length;
  const fmt = (d: string | undefined) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  drawText('GROUP DETAILS', 20, y, fontB);
  y -= 15;
  drawText(`BRANCH CODE : 4550                BRANCH NAME : GOBICHETTIPALAYAM`, 20, y);
  y -= 15;
  drawText(`GROUP CODE : ${report.group.id.substring(0, 15)}      LAST PRIZED TKT : ${lastPrizedTicket}`, 20, y);
  y -= 15;
  drawText(`CHIT VALUE : ${report.group.totalValue}            PRIZED BID AMT : ${report.lastBidAmount || 0}`, 20, y);
  y -= 15;
  drawText(`AUCTION DATE : ${fmt(report.group.startDate)}        LAST AUCTION DATE : ${fmt(latestAuction?.date ?? report.group.startDate)}`, 20, y);
  y -= 15;
  drawText(`AUCTION TIME : 16:00              AUCTION NUMBER : ${auctionNumber}`, 20, y);
  y -= 30;

  const cols = [20, 50, 160, 240, 310, 360, 420, 500]; // X coordinates for columns
  const renderRow = (m: any, isBold=false) => {
    checkPage();
    const f = isBold ? fontB : font;
    drawText(m.ticketNo.toString(), cols[0], y, f);
    drawText(m.memberObj?.name?.substring(0,18) || '', cols[1], y, f);
    drawText(m.memberObj?.phone || '', cols[2], y, f);
    drawText(m.agentName || '', cols[3], y, f);
    drawText(m.installmentsPaid?.toString() || '0', cols[4], y, f);
    drawText(m.totalInstallmentsDue?.toString() || '0', cols[5], y, f);
    drawText(m.arrearsDue?.toFixed(2) || '0.00', cols[6], y, f);
    drawText(m.currentMonthDue?.toFixed(2) || '0.00', cols[7], y, f);
    y -= 15;
  };

  const renderHeaders = (title: string) => {
    checkPage();
    drawText(title, 20, y, fontB, 11);
    y -= 15;
    drawText('TKT', cols[0], y, fontB);
    drawText('NAME', cols[1], y, fontB);
    drawText('PHONE NO', cols[2], y, fontB);
    drawText('AGENT', cols[3], y, fontB);
    drawText('PAID', cols[4], y, fontB);
    drawText('DUE', cols[5], y, fontB);
    drawText('ARREARS', cols[6], y, fontB);
    drawText('CURRENT', cols[7], y, fontB);
    y -= 10;
    page.drawLine({ start: { x: 20, y }, end: { x: 570, y }, thickness: 1 });
    y -= 15;
  };

  // Non Prized
  renderHeaders('NON PRIZED');
  if (report.nonPricedMembers.length === 0) {
    drawText('THERE IS NO NON PRIZED', 200, y);
    y -= 20;
  } else {
    report.nonPricedMembers.forEach(m => renderRow(m));
    y -= 10;
  }

  // Prized
  renderHeaders('PRIZED');
  if (report.pricedMembers.length === 0) {
    drawText('NO AUCTIONS HELD YET', 200, y);
    y -= 20;
  } else {
    report.pricedMembers.forEach(m => renderRow(m));
  }

  page.drawLine({ start: { x: 20, y }, end: { x: 570, y }, thickness: 1 });
  y -= 15;
  
  const allM = [...report.nonPricedMembers, ...report.pricedMembers];
  drawText('TOTAL', cols[5], y, fontB);
  drawText(allM.reduce((s, m) => s + m.arrearsDue, 0).toFixed(2), cols[6], y, fontB);
  drawText(allM.reduce((s, m) => s + m.currentMonthDue, 0).toFixed(2), cols[7], y, fontB);

  const pdfBytes = await pdfDoc.save();
  return base64js.fromByteArray(pdfBytes);
};
