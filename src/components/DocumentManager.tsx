import React, { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { Document } from '../types';
import { Card } from './ui';
import { Upload, FileText, Trash2, Download, Loader2 } from 'lucide-react';

interface DocumentManagerProps {
  rentalId: number;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ rentalId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const data = await api.get(`/documents/rental/${rentalId}`);
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [rentalId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('rentalId', rentalId.toString());
    formData.append('type', 'autre');

    setUploading(true);
    try {
      await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bms_token')}`
        },
        body: formData
      });
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async (id: number, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bms_token')}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Documents liés</h3>
        <div className="relative">
          <input
            type="file"
            id="doc-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label
            htmlFor="doc-upload"
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold cursor-pointer hover:bg-blue-700 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            <span>{uploading ? 'Téléchargement...' : 'Ajouter un document'}</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : documents.length === 0 ? (
          <div className="col-span-full py-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">Aucun document pour cette location.</p>
          </div>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="p-4 flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">
                    {doc.type.toUpperCase()}
                  </p>
                  <p className="text-[10px] text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleDownload(doc.id, `doc_${doc.id}`)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
