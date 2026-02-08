'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setStatus('idle');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Upload failed');
            }

            setStatus('success');
            setMessage('File uploaded and added to AI knowledge base!');
            setFile(null);
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setMessage(error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1117] text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl shadow-xl">
                <h1 className="text-2xl font-bold mb-6 text-center">Admin Dashboard</h1>

                <form onSubmit={handleUpload} className="space-y-6">
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-colors hover:border-blue-500/50 cursor-pointer relative">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.txt,.md,.docx"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {file ? (
                            <FileText className="w-12 h-12 text-blue-400" />
                        ) : (
                            <Upload className="w-12 h-12 text-gray-500" />
                        )}
                        <p className="text-sm text-gray-400">
                            {file ? file.name : "Drag & drop or click to upload Resume/Projects"}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {uploading ? 'Uploading...' : 'Upload to Knowledge Base'}
                    </button>
                </form>

                {status === 'success' && (
                    <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3 text-green-400">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
