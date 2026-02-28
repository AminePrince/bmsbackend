import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from './ui';
import { X, Check } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onCancel: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Veuillez signer avant d'enregistrer.");
      return;
    }
    const signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (signatureData) {
      onSave(signatureData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-200 rounded-xl bg-white overflow-hidden">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            className: "w-full h-64 cursor-crosshair"
          }}
        />
      </div>
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={clear} className="text-gray-500">
          Effacer
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            <X size={18} className="mr-2" />
            Annuler
          </Button>
          <Button onClick={save}>
            <Check size={18} className="mr-2" />
            Enregistrer la signature
          </Button>
        </div>
      </div>
    </div>
  );
};
