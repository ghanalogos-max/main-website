function dimension(value: string | null): number | null {
  if (!value || value.trim().endsWith("%")) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Renders SVG source to a PNG whose longest side is `size` pixels. */
export async function svgToPng(svgText: string, size: number): Promise<Blob> {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const svg = doc.documentElement;
  const viewBox = svg
    .getAttribute("viewBox")
    ?.split(/[\s,]+/)
    .map(Number);

  const w = dimension(svg.getAttribute("width")) ?? viewBox?.[2] ?? size;
  const h = dimension(svg.getAttribute("height")) ?? viewBox?.[3] ?? size;
  const scale = size / Math.max(w, h);
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);

  if (!viewBox) svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));

  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    })
  );

  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not render SVG"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))),
        "image/png"
      )
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
