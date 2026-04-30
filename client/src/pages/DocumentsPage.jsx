import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Download, Eye, ArrowLeft, X, Upload, Trash2, Loader } from 'lucide-react';
import { useLang } from '../LangContext.jsx';
import { useAdmin } from '../AdminContext.jsx';
import { authFetch } from '../api.js';
import './DocumentsPage.css';

const API = '';

function DocumentsPage() {
  const { category } = useParams();
  const { t } = useLang();
  const { isAdmin } = useAdmin();
  const [data, setData] = useState({ files: [], sections: [] });
  const [loading, setLoading] = useState(true);
  const [viewPdf, setViewPdf] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);
  const fileInputRef = useRef(null);

  const categoryTitles = {
    'calitatea-serviciilor': { ro: 'Calitatea serviciilor', ru: 'Качество услуг' },
    'certificate': { ro: 'Certificate', ru: 'Сертификаты' }
  };

  const lang = t('nav.home') === 'Acasa' ? 'ro' : 'ru';
  const title = categoryTitles[category]?.[lang] || category;

  const sectionTitles = {
    'starndarde-internationale': { ro: 'Starndarde Internaționale', ru: 'Международные стандарты' },
    'declaratie-de-politica': { ro: 'Declarație de Politică', ru: 'Декларация политики' },
    'quality-management-system': { ro: 'Quality Management System | Information Security Management System', ru: 'Система управления качеством | Система управления информационной безопасностью' }
  };

  const fetchDocs = () => {
    setLoading(true);
    fetch(`${API}/api/documents/${category}`)
      .then(r => r.json())
      .then(result => {
        if (Array.isArray(result)) {
          setData({ files: result, sections: [] });
        } else {
          setData(result);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, [category]);

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSectionTitle = (section) => {
    return sectionTitles[section.id]?.[lang] || section.title;
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const nonPdf = files.filter(f => f.type !== 'application/pdf');
    if (nonPdf.length) {
      setUploadStatus('Только PDF файлы');
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    try {
      const res = await authFetch(`/api/documents/${category}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadStatus(`Загружено: ${data.uploaded} файл(ов)`);
        fetchDocs();
      } else {
        setUploadStatus('Ошибка: ' + (data.error || 'неизвестная'));
      }
    } catch {
      setUploadStatus('Ошибка соединения');
    }

    setUploading(false);
    fileInputRef.current.value = '';
    setTimeout(() => setUploadStatus(null), 4000);
  };

  const handleDelete = async (filename) => {
    if (!confirm(`Удалить файл "${filename}" с сервера?`)) return;
    setDeletingFile(filename);
    try {
      const res = await authFetch(`/api/documents/${category}/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        fetchDocs();
      } else {
        alert('Ошибка удаления: ' + (result.error || 'неизвестная'));
      }
    } catch {
      alert('Ошибка соединения');
    }
    setDeletingFile(null);
  };

  const FileCard = ({ file, index }) => (
    <div className="docs-page__card" style={{ animationDelay: `${index * 0.08}s` }}>
      <div className="docs-page__card-icon">
        <FileText size={32} />
      </div>
      <div className="docs-page__card-info">
        <h3 className="docs-page__card-title">{file.title}</h3>
        <span className="docs-page__card-meta">PDF • {formatSize(file.size)}</span>
      </div>
      <div className="docs-page__card-actions">
        <button
          className="docs-page__btn docs-page__btn--view"
          onClick={() => setViewPdf(`${API}${file.url}`)}
        >
          <Eye size={16} />
          {lang === 'ro' ? 'Vizualizează' : 'Просмотр'}
        </button>
        <a href={`${API}${file.url}`} download className="docs-page__btn docs-page__btn--download">
          <Download size={16} />
          {lang === 'ro' ? 'Descarcă' : 'Скачать'}
        </a>
        {isAdmin && (
          <button
            className="docs-page__btn docs-page__btn--delete"
            onClick={() => handleDelete(file.name)}
            disabled={deletingFile === file.name}
          >
            {deletingFile === file.name
              ? <Loader size={16} className="docs-page__spin" />
              : <Trash2 size={16} />}
          </button>
        )}
      </div>
    </div>
  );

  const hasContent = data.files.length > 0 || data.sections.length > 0;

  return (
    <div className="docs-page">
      <section className="docs-page__hero">
        <div className="docs-page__glow" />
        <div className="container">
          <Link to="/" className="docs-page__back">
            <ArrowLeft size={18} />
            {t('nav.home')}
          </Link>
          <h1 className="section-title">{title}</h1>
          <p className="section-subtitle">
            {lang === 'ro' ? 'Documente disponibile pentru descărcare și vizualizare' : 'Документы доступные для скачивания и просмотра'}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">

          {isAdmin && (
            <div className="docs-page__admin-panel">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                style={{ display: 'none' }}
                onChange={handleUpload}
              />
              <button
                className="docs-page__btn docs-page__btn--upload"
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
              >
                {uploading
                  ? <><Loader size={16} className="docs-page__spin" /> Загрузка...</>
                  : <><Upload size={16} /> Загрузить PDF</>}
              </button>
              {uploadStatus && (
                <span className="docs-page__upload-status">{uploadStatus}</span>
              )}
            </div>
          )}

          {loading ? (
            <div className="docs-page__loading">
              {lang === 'ro' ? 'Se încarcă...' : 'Загрузка...'}
            </div>
          ) : !hasContent ? (
            <div className="docs-page__empty">
              <FileText size={48} />
              <p>{lang === 'ro' ? 'Momentan nu există documente în această secțiune.' : 'В данном разделе пока нет документов.'}</p>
            </div>
          ) : (
            <>
              {data.files.length > 0 && (
                <div className="docs-page__grid">
                  {data.files.map((file, i) => (
                    <FileCard key={file.name} file={file} index={i} />
                  ))}
                </div>
              )}
              {data.sections.map((section) => (
                <div key={section.id} className="docs-page__section">
                  <div className="docs-page__section-header">
                    <h2 className="docs-page__section-title">{getSectionTitle(section)}</h2>
                  </div>
                  <div className="docs-page__grid">
                    {section.files.map((file, i) => (
                      <FileCard key={file.name} file={file} index={i} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {viewPdf && (
        <div className="docs-page__overlay" onClick={() => setViewPdf(null)}>
          <div className="docs-page__viewer" onClick={e => e.stopPropagation()}>
            <div className="docs-page__viewer-header">
              <span>PDF</span>
              <div className="docs-page__viewer-actions">
                <a href={viewPdf} download className="docs-page__btn docs-page__btn--download">
                  <Download size={16} />
                  {lang === 'ro' ? 'Descarcă' : 'Скачать'}
                </a>
                <button className="docs-page__viewer-close" onClick={() => setViewPdf(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <iframe src={viewPdf} className="docs-page__viewer-frame" title="PDF Viewer" />
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentsPage;