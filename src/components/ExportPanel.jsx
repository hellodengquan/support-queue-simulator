import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const PRINT_DPI = 300;
const SCREEN_PPI = 96;
const DPR_SCALE = Math.max(window.devicePixelRatio || 1, 2);
const PRINT_SCALE = PRINT_DPI / SCREEN_PPI;

const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const saveBlob = (blob, filename) => {
  if (isIOS()) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
    };
    reader.readAsDataURL(blob);
    return;
  }

  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(blob, filename);
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

const canvasToBlob = (canvas, type = 'image/png', quality = 0.95) => {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob(resolve, type, quality);
    } else {
      const dataUrl = canvas.toDataURL(type, quality);
      const byteString = atob(dataUrl.split(',')[1]);
      const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const buffer = new ArrayBuffer(byteString.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < byteString.length; i++) {
        view[i] = byteString.charCodeAt(i);
      }
      resolve(new Blob([buffer], { type: mimeString }));
    }
  });
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MAX_COMPARE_SCENARIOS = 3;

const ExportPanel = ({
  targetId,
  title,
  disabled = false,
  selectedScenariosCount = 0,
  onBeforePrintCapture,
  onAfterPrintCapture,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const exportInProgressRef = useRef(false);

  useEffect(() => {
    return () => {
      exportInProgressRef.current = false;
      if (onAfterPrintCapture) onAfterPrintCapture();
    };
  }, [onAfterPrintCapture]);

  const getFilename = (ext) => {
    const safeTitle = (title || '模拟结果').replace(/[\\/:*?"<>|]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    return `客服排班模拟_${safeTitle}_${dateStr}.${ext}`;
  };

  const captureElement = async (forPrint = false) => {
    const element =
      document.querySelector(targetId) || document.querySelector('.right-panel');
    if (!element) return null;

    const scenarioCount = Math.max(1, selectedScenariosCount + 1);
    let scale;
    if (forPrint) {
      if (scenarioCount <= 2) {
        scale = PRINT_SCALE;
      } else if (scenarioCount <= 4) {
        scale = 2.5;
      } else {
        scale = 2;
      }
    } else {
      scale = Math.max(DPR_SCALE, 2);
    }

    setProgress(5);
    setProgressText('准备导出区域...');
    await sleep(30);

    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const originalScrollY = window.scrollY;

    try {
      if (rect.height > windowHeight * 0.9) {
        window.scrollTo({
          top: rect.top + originalScrollY - 20,
          behavior: 'auto',
        });
        await sleep(100);
      }

      setProgress(12);
      setProgressText('调整图表为打印模式...');
      await sleep(30);

      if (forPrint && onBeforePrintCapture) {
        onBeforePrintCapture();
        await sleep(300);
      }

      const updatedRect = element.getBoundingClientRect();
      const estimatedPixels = updatedRect.width * updatedRect.height * scale * scale;
      const estimatedMB = (estimatedPixels * 4) / (1024 * 1024);

      setProgress(18);
      if (estimatedMB > 40) {
        setProgressText(`画布较大 (≈${estimatedMB.toFixed(0)}MB)，请稍候...`);
      } else {
        setProgressText('渲染高清画布...');
      }
      await sleep(30);

      const canvas = await html2canvas(element, {
        backgroundColor: forPrint ? '#ffffff' : '#f8f9fa',
        scale,
        useCORS: true,
        logging: false,
        allowTaint: true,
        letterRendering: forPrint,
        imageTimeout: 15000,
        ignoreElements: (el) => {
          return el.classList && el.classList.contains('export-ignore');
        },
      });

      setProgress(55);
      setProgressText('优化图像质量...');
      await sleep(30);

      if (forPrint) {
        optimizeForPrint(canvas);
      }

      setProgress(65);
      setProgressText('编码输出...');
      await sleep(20);

      window.scrollTo({ top: originalScrollY, behavior: 'auto' });
      return canvas;
    } catch (err) {
      window.scrollTo({ top: originalScrollY, behavior: 'auto' });
      if (onAfterPrintCapture) onAfterPrintCapture();
      throw err;
    }
  };

  const optimizeForPrint = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      const contrast = 1.2;
      const intercept = 128 * (1 - contrast);
      const adjusted = Math.min(255, Math.max(0, gray * contrast + intercept));

      data[i] = adjusted;
      data[i + 1] = adjusted;
      data[i + 2] = adjusted;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleExportPNG = async () => {
    if (isExporting || disabled) return;

    if (selectedScenariosCount > MAX_COMPARE_SCENARIOS) {
      const confirmed = window.confirm(
        `已选择 ${selectedScenariosCount} 个对比场景，建议不超过 ${MAX_COMPARE_SCENARIOS} 个以保证导出质量。是否继续？`
      );
      if (!confirmed) return;
    }

    setIsExporting(true);
    exportInProgressRef.current = true;

    try {
      const canvas = await captureElement(false);
      if (!canvas || !exportInProgressRef.current) return;

      setProgress(80);
      setProgressText('生成PNG文件...');
      await sleep(20);

      const blob = await canvasToBlob(canvas, 'image/png', 1.0);
      if (!exportInProgressRef.current) return;

      saveBlob(blob, getFilename('png'));

      setProgress(100);
      setProgressText('导出成功！');
      await sleep(500);
    } catch (error) {
      console.error('导出PNG失败:', error);
      alert(
        isMobile()
          ? '导出失败，请截屏保存或尝试使用桌面浏览器'
          : '导出失败，请重试'
      );
    } finally {
      setIsExporting(false);
      setProgress(0);
      setProgressText('');
      exportInProgressRef.current = false;
      if (onAfterPrintCapture) onAfterPrintCapture();
    }
  };

  const handleExportPDF = async () => {
    if (isExporting || disabled) return;

    if (selectedScenariosCount > MAX_COMPARE_SCENARIOS) {
      const confirmed = window.confirm(
        `已选择 ${selectedScenariosCount} 个对比场景，PDF导出建议不超过 ${MAX_COMPARE_SCENARIOS} 个以避免内存溢出。是否继续？`
      );
      if (!confirmed) return;
    }

    setIsExporting(true);
    exportInProgressRef.current = true;

    try {
      const canvas = await captureElement(true);
      if (!canvas || !exportInProgressRef.current) return;

      setProgress(70);
      setProgressText('生成PDF文档...');
      await sleep(30);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      if (!exportInProgressRef.current) return;

      const pdfWidth = 210;
      const pdfHeight = 297;

      const orientation =
        canvas.width > canvas.height ? 'landscape' : 'portrait';
      const pageW = orientation === 'landscape' ? pdfHeight : pdfWidth;
      const pageH = orientation === 'landscape' ? pdfWidth : pdfHeight;

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageW, pageH, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(20, 20, 20);
      pdf.text(title || '客服排班模拟结果', pageW / 2, 14, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`生成时间: ${new Date().toLocaleString()}`, pageW / 2, 22, {
        align: 'center',
      });

      setProgress(85);
      setProgressText('嵌入图表...');
      await sleep(20);

      const margin = 15;
      const headerBottom = 30;
      const availableW = pageW - margin * 2;
      const availableH = pageH - headerBottom - margin;
      const imgRatio = canvas.height / canvas.width;
      const pageRatio = availableH / availableW;

      let drawW, drawH;
      if (imgRatio > pageRatio) {
        drawH = availableH;
        drawW = drawH / imgRatio;
      } else {
        drawW = availableW;
        drawH = drawW * imgRatio;
      }

      const drawX = (pageW - drawW) / 2;
      const drawY = headerBottom + (availableH - drawH) / 2;

      pdf.addImage(imgData, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');

      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        '客服排班模拟器 | 决策会专用导出',
        pageW / 2,
        pageH - 8,
        { align: 'center' }
      );

      setProgress(95);
      setProgressText('保存PDF文件...');
      await sleep(20);

      if (!exportInProgressRef.current) return;

      if (isMobile()) {
        const blob = pdf.output('blob');
        saveBlob(blob, getFilename('pdf'));
      } else {
        pdf.save(getFilename('pdf'));
      }

      setProgress(100);
      setProgressText('导出成功！');
      await sleep(500);
    } catch (error) {
      console.error('导出PDF失败:', error);
      alert(
        isMobile()
          ? 'PDF导出在移动端可能受限，建议使用PNG导出或桌面浏览器'
          : '导出失败，请重试'
      );
    } finally {
      setIsExporting(false);
      setProgress(0);
      setProgressText('');
      exportInProgressRef.current = false;
      if (onAfterPrintCapture) onAfterPrintCapture();
    }
  };

  const btnDisabled = disabled || isExporting;

  return (
    <div className="export-panel">
      {isExporting && progress > 0 && (
        <div className="export-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">{progressText}</span>
        </div>
      )}
      <button
        className={`btn-export btn-png ${btnDisabled ? 'is-disabled' : ''}`}
        onClick={handleExportPNG}
        disabled={btnDisabled}
        title="导出为高清PNG图片（适合屏幕展示）"
        aria-label="导出PNG"
        aria-busy={isExporting}
      >
        {isExporting ? (
          <>
            <span className="spinner" />
            <span>导出中 {progress}%</span>
          </>
        ) : (
          <>
            <span>📷</span>
            <span>导出PNG</span>
          </>
        )}
      </button>
      <button
        className={`btn-export btn-pdf ${btnDisabled ? 'is-disabled' : ''}`}
        onClick={handleExportPDF}
        disabled={btnDisabled}
        title="导出为A4打印级PDF（适合会议打印）"
        aria-label="导出PDF"
        aria-busy={isExporting}
      >
        {isExporting ? (
          <>
            <span className="spinner" />
            <span>导出中 {progress}%</span>
          </>
        ) : (
          <>
            <span>📄</span>
            <span>导出PDF</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ExportPanel;
