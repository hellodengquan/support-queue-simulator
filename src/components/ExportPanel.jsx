import { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const ExportPanel = ({ targetId, title }) => {
  const [isExporting, setIsExporting] = useState(false);

  const captureElement = async () => {
    const element = document.querySelector(targetId) || document.querySelector('.right-panel');
    if (!element) return null;

    const canvas = await html2canvas(element, {
      backgroundColor: '#f8f9fa',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return canvas;
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureElement();
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `客服排班模拟_${title || '结果'}_${new Date().toLocaleDateString()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('导出PNG失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureElement();
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, Math.max(pdfHeight, 297)],
      });

      pdf.setFontSize(16);
      pdf.text(title || '客服排班模拟结果', pdfWidth / 2, 15, { align: 'center' });

      pdf.setFontSize(10);
      pdf.text(`生成时间: ${new Date().toLocaleString()}`, pdfWidth / 2, 22, { align: 'center' });

      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 28, imgWidth, imgHeight);

      pdf.save(`客服排班模拟_${title || '结果'}_${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error('导出PDF失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-panel">
      <button
        className="btn-export btn-png"
        onClick={handleExportPNG}
        disabled={isExporting}
        title="导出为PNG图片"
      >
        {isExporting ? '导出中...' : '📷 导出PNG'}
      </button>
      <button
        className="btn-export btn-pdf"
        onClick={handleExportPDF}
        disabled={isExporting}
        title="导出为PDF文档"
      >
        {isExporting ? '导出中...' : '📄 导出PDF'}
      </button>
    </div>
  );
};

export default ExportPanel;
