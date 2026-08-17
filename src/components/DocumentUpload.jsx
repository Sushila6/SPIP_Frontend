import { useState, useEffect, useRef } from 'react'
import { api } from '../utils/api'
import styles from './DocumentUpload.module.css'

const DOC_TYPES = [
  { id: 'AADHAAR',       label: 'Aadhaar Card',    desc: 'Front and back of your Aadhaar card',          required: true,  icon: '🪪' },
  { id: 'PAN',           label: 'PAN Card',         desc: 'Your Permanent Account Number card',           required: true,  icon: '💳' },
  { id: 'INCOME_PROOF',  label: 'Income Proof',     desc: 'Salary slip, ITR, or Form 16',                 required: false, icon: '📄' },
  { id: 'ADDRESS_PROOF', label: 'Address Proof',    desc: 'Electricity bill, bank statement, or passport',required: false, icon: '🏠' },
  { id: 'BANK_STATEMENT',label: 'Bank Statement',   desc: 'Last 3 months bank statement',                 required: false, icon: '🏦' },
  { id: 'PHOTO',         label: 'Passport Photo',   desc: 'Recent colour passport-size photograph',       required: false, icon: '📸' },
]

const ACCEPTED = '.pdf,.jpg,.jpeg,.png'
const MAX_MB   = 5

export default function DocumentUpload({ plotId, plotNumber, onComplete }) {
  const [uploaded,   setUploaded]   = useState([])
  const [uploading,  setUploading]  = useState({})
  const [deleting,   setDeleting]   = useState({})  // { fileName: true }
  const [confirmDel, setConfirmDel] = useState(null) // fileName to confirm
  const [errors,     setErrors]     = useState({})
  const [success,    setSuccess]    = useState({})
  const [loading,    setLoading]    = useState(true)
  const fileRefs = useRef({})

  useEffect(() => { loadDocs() }, [plotId])

  async function loadDocs() {
    setLoading(true)
    try {
      const docs = await api(`/documents/my/${plotId}`)
      setUploaded(docs || [])
    } catch {
      setUploaded([])
    } finally {
      setLoading(false)
    }
  }

  function getUploadedForType(typeId) {
    return uploaded.filter(d => d.docType === typeId)
  }

  function clearMessages(typeId) {
    setErrors(e  => ({ ...e, [typeId]: '' }))
    setSuccess(s => ({ ...s, [typeId]: '' }))
  }

  /* ── Upload ── */
  async function handleFileSelect(typeId, file) {
    if (!file) return
    clearMessages(typeId)

    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      setErrors(e => ({ ...e, [typeId]: 'Only PDF, JPG, and PNG files are allowed.' }))
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrors(e => ({ ...e, [typeId]: `File must be under ${MAX_MB} MB.` }))
      return
    }

    setUploading(u => ({ ...u, [typeId]: true }))

    const formData = new FormData()
    formData.append('file',    file)
    formData.append('docType', typeId)
    formData.append('plotId',  String(plotId))

    try {
      await api('/documents/upload', { method: 'POST', body: formData })
      setSuccess(s => ({ ...s, [typeId]: 'Uploaded successfully.' }))
      await loadDocs()
      if (fileRefs.current[typeId]) fileRefs.current[typeId].value = ''
    } catch (err) {
      setErrors(e => ({ ...e, [typeId]: err.message }))
    } finally {
      setUploading(u => ({ ...u, [typeId]: false }))
    }
  }

  /* ── Delete ── */
  async function handleDelete(fileName) {
    setDeleting(d => ({ ...d, [fileName]: true }))
    setConfirmDel(null)
    try {
      await api(
        `/documents/delete?plotId=${encodeURIComponent(plotId)}&fileName=${encodeURIComponent(fileName)}`,
        { method: 'DELETE' }
      )
      await loadDocs()
    } catch (err) {
      // Show error on the card whose type matches this file
      const docTypeId = uploaded.find(d => d.fileName === fileName)?.docType
      if (docTypeId) setErrors(e => ({ ...e, [docTypeId]: err.message }))
    } finally {
      setDeleting(d => ({ ...d, [fileName]: false }))
    }
  }

  const requiredDocs    = DOC_TYPES.filter(d => d.required)
  const optionalDocs    = DOC_TYPES.filter(d => !d.required)
  const uploadedTypeIds = [...new Set(uploaded.map(d => d.docType))]
  const requiredDone    = requiredDocs.filter(d => uploadedTypeIds.includes(d.id)).length
  const allRequiredDone = requiredDone === requiredDocs.length

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className="section-label">KYC Documents</p>
          <h2 className={styles.title}>Upload required documents</h2>
          <p className={styles.sub}>
            For Plot <strong>{plotNumber}</strong> — upload your KYC documents to complete the booking
            process. Files are securely stored and only visible to the SmartPlot team.
          </p>
        </div>

        <div className={styles.progress}>
          <div className={styles.progressNumbers}>
            <span className={styles.progressCount}>{requiredDone} / {requiredDocs.length}</span>
            <span className={styles.progressLabel}>Required docs uploaded</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${requiredDocs.length > 0 ? (requiredDone / requiredDocs.length) * 100 : 0}%`,
                background: allRequiredDone ? 'var(--success)' : 'var(--forest)',
              }}
            />
          </div>
          {allRequiredDone && (
            <p className={styles.allDoneNote}>✓ All required documents uploaded</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingRow}><div className={styles.spinner} /></div>
      ) : (
        <>
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Required documents</p>
            <div className={styles.docGrid}>
              {requiredDocs.map(doc => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  uploaded={getUploadedForType(doc.id)}
                  uploading={uploading[doc.id]}
                  deleting={deleting}
                  confirmDel={confirmDel}
                  error={errors[doc.id]}
                  successMsg={success[doc.id]}
                  fileRef={el => fileRefs.current[doc.id] = el}
                  onFileSelect={file => handleFileSelect(doc.id, file)}
                  onDeleteRequest={fileName => setConfirmDel(fileName)}
                  onDeleteConfirm={handleDelete}
                  onDeleteCancel={() => setConfirmDel(null)}
                />
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionLabel}>Optional documents</p>
            <p className={styles.optionalNote}>
              These are not mandatory but help speed up the verification process.
            </p>
            <div className={styles.docGrid}>
              {optionalDocs.map(doc => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  uploaded={getUploadedForType(doc.id)}
                  uploading={uploading[doc.id]}
                  deleting={deleting}
                  confirmDel={confirmDel}
                  error={errors[doc.id]}
                  successMsg={success[doc.id]}
                  fileRef={el => fileRefs.current[doc.id] = el}
                  onFileSelect={file => handleFileSelect(doc.id, file)}
                  onDeleteRequest={fileName => setConfirmDel(fileName)}
                  onDeleteConfirm={handleDelete}
                  onDeleteCancel={() => setConfirmDel(null)}
                />
              ))}
            </div>
          </div>

          <div className={styles.infoBox}>
            <div className={styles.infoRow}>
              <span className={styles.infoIcon}>🔒</span>
              <span>Documents are encrypted and stored securely. Only the SmartPlot team can access them.</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoIcon}>📋</span>
              <span>Accepted formats: PDF, JPG, PNG — max {MAX_MB} MB per file.</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoIcon}>🗑️</span>
              <span>You can delete and re-upload any document at any time before submission.</span>
            </div>
          </div>

          {onComplete && (
            <div className={styles.actions}>
              <button
                className={`btn-primary ${!allRequiredDone ? styles.btnDisabled : ''}`}
                disabled={!allRequiredDone}
                onClick={onComplete}
              >
                {allRequiredDone
                  ? 'Submit Documents'
                  : `Upload ${requiredDocs.length - requiredDone} more required document${requiredDocs.length - requiredDone !== 1 ? 's' : ''}`}
              </button>
              <p className={styles.submitNote}>
                {allRequiredDone
                  ? 'All required documents are ready. Click to notify the SmartPlot team.'
                  : 'Complete required documents to proceed.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Individual document card ── */
function DocCard({
  doc, uploaded, uploading, deleting, confirmDel,
  error, successMsg, fileRef,
  onFileSelect, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
}) {
  const hasUploads = uploaded.length > 0

  return (
    <div className={`${styles.docCard} ${hasUploads ? styles.docCardDone : ''}`}>
      {/* Top row */}
      <div className={styles.docTop}>
        <div className={styles.docIcon}>{doc.icon}</div>
        <div className={styles.docInfo}>
          <div className={styles.docTitleRow}>
            <p className={styles.docLabel}>{doc.label}</p>
            {doc.required
              ? <span className={styles.requiredPill}>Required</span>
              : <span className={styles.optionalPill}>Optional</span>
            }
          </div>
          <p className={styles.docDesc}>{doc.desc}</p>
        </div>
        {hasUploads && <div className={styles.doneCheck}>✓</div>}
      </div>

      {/* Uploaded files */}
      {hasUploads && (
        <div className={styles.uploadedList}>
          {uploaded.map((f, i) => {
            const isDeleting   = deleting[f.fileName]
            const isConfirming = confirmDel === f.fileName
            return (
              <div key={i} className={styles.uploadedFile}>
                <span className={styles.fileIcon}>{getFileIcon(f.fileName)}</span>
                <span className={styles.fileName} title={f.fileName}>{f.fileName}</span>
                {f.fileSize && <span className={styles.fileSize}>{f.fileSize}</span>}

                <div className={styles.fileActions}>
                  {/* View link */}
                  <a
                    href={f.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.viewLink}
                  >
                    View
                  </a>

                  {/* Delete flow */}
                  {!isConfirming && !isDeleting && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => onDeleteRequest(f.fileName)}
                      title="Delete this document"
                      type="button"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  )}

                  {/* Confirm delete */}
                  {isConfirming && (
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmText}>Delete this file?</span>
                      <button
                        className={styles.confirmYes}
                        onClick={() => onDeleteConfirm(f.fileName)}
                        type="button"
                      >
                        Yes, delete
                      </button>
                      <button
                        className={styles.confirmNo}
                        onClick={onDeleteCancel}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Deleting spinner */}
                  {isDeleting && (
                    <span className={styles.deletingState}>
                      <span className={styles.uploadSpinner} />
                      Deleting…
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload area */}
      <div className={styles.uploadArea}>
        <label className={`${styles.uploadLabel} ${uploading ? styles.uploadLabelDisabled : ''}`}>
          <input
            type="file"
            accept={ACCEPTED}
            ref={fileRef}
            disabled={uploading}
            onChange={e => onFileSelect(e.target.files?.[0])}
            className={styles.fileInput}
          />
          {uploading ? (
            <span className={styles.uploadingState}>
              <span className={styles.uploadSpinner} />
              Uploading…
            </span>
          ) : (
            <span className={styles.uploadState}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              {hasUploads ? 'Replace / add file' : 'Choose file'}
            </span>
          )}
        </label>
      </div>

      {error      && <p className={styles.errorMsg}>{error}</p>}
      {successMsg && <p className={styles.successMsg}>✓ {successMsg}</p>}
    </div>
  )
}

function getFileIcon(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📕'
  if (['jpg', 'jpeg', 'png'].includes(ext)) return '🖼️'
  return '📎'
}