'use client';

import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Camera, Copy, QrCode, ScanLine } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export function TraceabilityCode({ value, showBarcode = true }: { value: string; showBarcode?: boolean }) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);
  useEffect(() => { if (qrRef.current) void QRCode.toCanvas(qrRef.current, value, { margin: 1, width: 104, color: { dark: '#172b4d', light: '#ffffff' } }); if (barcodeRef.current && showBarcode) JsBarcode(barcodeRef.current, value, { format: 'CODE128', height: 30, width: 1.5, displayValue: false, margin: 0, lineColor: '#172b4d' }); }, [showBarcode, value]);
  return <div className="traceability-code"><canvas ref={qrRef} aria-label={`QR code ${value}`} />{showBarcode && <svg ref={barcodeRef} aria-label={`Code-barres ${value}`} />}</div>;
}

export function QrScanner({ onDetected }: { onDetected: (value: string) => void }) {
  const [running, setRunning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  async function toggle() { if (running) { await scannerRef.current?.stop(); setRunning(false); return; } const scanner = new Html5Qrcode('mediflow-qr-reader'); scannerRef.current = scanner; await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 220 }, onDetected, () => undefined); setRunning(true); }
  return <div className="scanner-panel"><div className="scanner-panel__header"><div><div className="card__title">Scanner un code</div><p className="card__subtitle">QR de traçabilité ou étiquette inventaire</p></div><QrCode className="text-brand" size={18} /></div><div id="mediflow-qr-reader" className="scanner-reader" /><button className="btn btn-secondary" onClick={() => void toggle()}>{running ? <ScanLine /> : <Camera />}{running ? 'Arrêter le scanner' : 'Activer la caméra'}</button><button className="btn btn-ghost ml-1" onClick={() => navigator.clipboard?.writeText('Scanner prêt')}><Copy /> Copier</button></div>;
}
