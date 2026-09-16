const fs = require('fs');
const file = 'c:/Users/srira/ChitFunds/src/screens/FundCalculationsScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const handleDownloadReceipt = async \(\) => \{[\s\S]*?\};\s*$/m;

const newFn = `const bg      = isDarkMode ? '#080E1A' : '#F0F4FA';
  const cardBg  = isDarkMode ? '#0F1829' : '#FFFFFF';
  const borderC = isDarkMode ? '#1E293B' : '#CBD5E1';
  const textC   = isDarkMode ? '#E2E8F0' : '#0F172A';
  const mutC    = isDarkMode ? '#64748B' : '#64748B';

  // ── PDF Download ────────────────────────────────────────────────────────────
  const handleDownloadReceipt = async () => {
    if (!showPreview) {
      setShowPreview(true);
      return;
    }
    try {
      const base64Img = await captureRef(scrollViewRef, { format: 'jpg', quality: 1, result: 'base64' });
      const pdfDoc = await PDFDocument.create();
      const jpgImage = await pdfDoc.embedJpg(base64Img);
      const { width, height } = jpgImage.scale(1);
      
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(jpgImage, { x: 0, y: 0, width, height });
      
      const pdfBytesBase64 = await pdfDoc.saveAsBase64();
      await Share.open({
        url: 'data:application/pdf;base64,' + pdfBytesBase64,
        type: 'application/pdf',
        filename: 'DefaulterList'
      });
    } catch (error: any) {
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) return;
      Alert.alert('Download Failed', 'Could not generate PDF.\\n\\n' + error?.message);
    }
  };`;

content = content.replace(regex, newFn);
fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched FundCalculationsScreen.tsx');
