'use client';

import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, PenLine } from 'lucide-react';

export function PrescriptionSignaturePad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const signatureRef = useRef<SignatureCanvas>(null);
  return <div className="signature-panel"><div className="signature-panel__header"><div><div className="card__title">Signature électronique</div><p className="card__subtitle">Dessinez avec la souris ou votre doigt. La signature sera horodatée.</p></div><PenLine className="text-brand" size={18} /></div><div className="signature-canvas-wrap"><SignatureCanvas ref={signatureRef} penColor="#172b4d" canvasProps={{ className: 'signature-canvas', 'aria-label': 'Zone de signature électronique' }} /></div><div className="signature-panel__footer"><button className="btn btn-ghost" onClick={() => signatureRef.current?.clear()}><Eraser /> Effacer</button><button className="btn btn-primary" onClick={() => { const pad = signatureRef.current; if (pad && !pad.isEmpty()) onSave(pad.toDataURL('image/png')); }}>Valider la signature</button></div></div>;
}
