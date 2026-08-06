import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export const downloadCardPDF = async (card: any, eventLayout: any) => {
  if (!eventLayout || !eventLayout.has_layout) {
    toast.error("No layout template saved for this event yet.");
    return;
  }
  const layoutElements = (eventLayout.elements as any[]) || [];
  let width = 360, height = 210, isPortrait = false;
  if (eventLayout.card_orientation?.startsWith("custom_")) {
    const parts = eventLayout.card_orientation.split("_");
    width = Number(parts[1]) || 260;
    height = Number(parts[2]) || 360;
    isPortrait = height > width;
  } else {
    const CARD_SIZES: Record<string, { width: number; height: number }> = { landscape: { width: 360, height: 210 }, portrait: { width: 210, height: 360 }, square: { width: 260, height: 260 } };
    const orientation = (eventLayout.card_orientation ?? "landscape") as keyof typeof CARD_SIZES;
    width = CARD_SIZES[orientation].width;
    height = CARD_SIZES[orientation].height;
    isPortrait = orientation === "portrait" || orientation === "square";
  }

  const bgElem = layoutElements.find((e: any) => e.id === "system-bg-image");
  const bgImage = bgElem ? bgElem.imageUrl : null;
  const elements = layoutElements.filter((e: any) => e.id !== "system-bg-image");

  const pd = typeof card.participant_data === "string" ? JSON.parse(card.participant_data || "{}") : (card.participant_data || {});
  const renderedElements = elements.map((el: any) => {
    if (el.type === "text" && el.dataField) {
      let displayContent = "";
      if (el.dataField === "fullName") displayContent = `${pd?.firstName || ''} ${pd?.lastName || ''}`.trim();
      else if (el.dataField === "categoryName" && pd?.categoryName) displayContent = pd.categoryName;
      else if (el.dataField === "functionName" && pd?.functionName) displayContent = pd.functionName;
      else displayContent = pd?.[el.dataField] || el.content;
      return { ...el, content: displayContent };
    }
    if ((el.type === "photo" || el.type === "logo") && el.dataField) {
      return { ...el, imageUrl: pd?.[el.dataField] || el.imageUrl };
    }
    return el;
  });

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;z-index:-1;";
  const container = document.createElement("div");
  container.style.cssText = `width:${width}px;height:${height}px;background:${eventLayout.background_color || "#ffffff"};border-radius:12px;overflow:hidden;${bgImage ? `background-image:url('${bgImage}');background-size:cover;background-position:center;` : ""}`;
  wrapper.appendChild(container);

  renderedElements.sort((a: any, b: any) => a.layer - b.layer).forEach((el: any) => {
    const outerDiv = document.createElement("div");
    outerDiv.style.cssText = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;${el.rotation ? `transform:rotate(${el.rotation}deg);` : ""}box-sizing:border-box;`;
    const innerDiv = document.createElement("div");
    innerDiv.style.cssText = `width:100%;height:100%;box-sizing:border-box;`;

    if (el.type === "photo" || el.type === "logo") {
      innerDiv.style.cssText += `overflow:hidden;border-radius:${el.borderRadius ?? 0}px;`;
    }
    if (el.type === "text") {
      innerDiv.style.cssText += `font-size:${el.fontSize ?? 12}px;font-weight:${el.fontWeight ?? 400};font-family:${el.fontFamily ?? "sans-serif"};color:${el.color ?? "#f0f0fa"};display:flex;align-items:center;justify-content:${el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start"};text-align:${el.textAlign ?? "left"};line-height:1.2;`;
      innerDiv.textContent = el.content;
    } else if (el.type === "badge") {
      innerDiv.style.cssText += `background:${el.bgColor ?? "#7c5cfc"};border-radius:${el.borderRadius ?? 4}px;display:flex;align-items:center;justify-content:center;`;
      const span = document.createElement("span");
      span.style.cssText = `font-size:${el.fontSize ?? 9}px;font-weight:700;color:${el.color ?? "#fff"};line-height:1;display:inline-block;`;
      span.textContent = el.content;
      innerDiv.appendChild(span);
    } else if (el.type === "shape") {
      innerDiv.style.cssText += `background:${el.bgColor ?? "#7c5cfc"};border-radius:${el.borderRadius ?? 0}px;${el.borderWidth ? `border:${el.borderWidth}px solid ${el.borderColor ?? "#e53e5e"};` : "border:none;"}`;
    } else if (el.type === "divider") {
      innerDiv.style.cssText += `background:${el.bgColor ?? "rgba(255,255,255,0.1)"};`;
    } else if ((el.type === "photo" || el.type === "logo") && el.imageUrl) {
      const img = document.createElement("img");
      img.src = el.imageUrl;
      img.style.cssText = `width:100%;height:100%;object-fit:${el.type === "logo" ? "contain" : "cover"};${el.borderWidth ? `border:${el.borderWidth}px solid ${el.borderColor ?? "#e53e5e"};` : "border:none;"}display:block;border-radius:${el.borderRadius ?? 0}px;`;
      img.crossOrigin = "anonymous";
      innerDiv.appendChild(img);
    }
    outerDiv.appendChild(innerDiv);
    container.appendChild(outerDiv);
  });
  document.body.appendChild(wrapper);
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 200));
  
  try {
    const dataUrl = await toPng(container, { pixelRatio: 2, cacheBust: true, backgroundColor: eventLayout.background_color || "#ffffff" });
    const pdf = new jsPDF({ orientation: isPortrait ? "portrait" : "landscape", unit: "px", format: [width, height] });
    pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
    pdf.save(`${card.name.replace(/[^a-zA-Z0-9]/g, "_")}_card.pdf`);
    toast.success(`Downloaded PDF for ${card.name}`);
  } catch {
    toast.error("Failed to generate PDF");
  } finally {
    document.body.removeChild(wrapper);
  }
};
