'use client';

import React, { useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

type Props = {
  onResult: (code: string) => void;
  onClose: () => void;
};

const BarcodeScanner: React.FC<Props> = ({ onResult, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      scannerRef.current.id,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText: string) => {
        scanner.clear().then(onClose);
        onResult(decodedText);
      },
      () => {
        // Puedes mostrar el error si lo deseas
      }
    );

    return () => {
      scanner.clear();
    };
  }, [onClose, onResult]);

  return (
    <div>
      <div id="qr-reader" ref={scannerRef} style={{ width: 300 }} />
      <button onClick={onClose} className="mt-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
        Cancelar
      </button>
    </div>
  );
};

export default BarcodeScanner;
