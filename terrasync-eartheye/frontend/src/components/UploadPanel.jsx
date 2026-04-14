import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

const UploadPanel = ({ onUpload }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      {!preview ? (
        <form 
          className={`upload-panel ${isDragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
          <UploadCloud size={64} className="upload-icon" />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Drag & Drop Image Here</h3>
          <p style={{ color: 'var(--text-muted)' }}>Supports JPG, PNG, TIFF formats</p>
          <button type="button" className="upload-btn">Browse Files</button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid var(--glass-border)' }}>
            <img src={preview} alt="Upload preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="upload-btn" style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }} onClick={() => setPreview(null)}>
              Cancel
            </button>
            <button className="upload-btn" onClick={handleSubmit}>
              Analyze Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPanel;
