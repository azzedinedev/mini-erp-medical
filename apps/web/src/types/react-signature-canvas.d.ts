declare module 'react-signature-canvas' {
  import * as React from 'react';
  export interface SignatureCanvasProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
    penColor?: string;
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    backgroundColor?: string;
    clearOnResize?: boolean;
  }
  export default class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    toDataURL(type?: string, encoderOptions?: number): string;
    getCanvas(): HTMLCanvasElement;
  }
}
