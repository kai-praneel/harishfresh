import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const downloadInvoicePdf = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    // Temporarily make the element visible for html2canvas
    const originalDisplay = element.style.display;
    const isHidden = element.classList.contains('hidden');
    if (isHidden) {
      element.classList.remove('hidden');
      element.style.display = 'block';
    }

    // Generate canvas with higher scale for better resolution
    const canvas = await html2canvas(element, { 
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    // Restore original visibility
    if (isHidden) {
      element.classList.add('hidden');
      element.style.display = originalDisplay;
    }
    
    const imgData = canvas.toDataURL("image/png");
    
    // A4 dimensions: 210 x 297 mm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    // Calculate height to maintain aspect ratio
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (err) {
    console.error("Failed to generate PDF", err);
  }
};
