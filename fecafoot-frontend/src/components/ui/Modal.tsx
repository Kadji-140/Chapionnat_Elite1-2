// src/components/ui/Modal.tsx
// Modal générique avec animation fade+scale, gestion clavier (Escape), backdrop

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Empêche la fermeture en cliquant sur le backdrop */
  preventClose?: boolean;
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  preventClose = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Gestion de la touche Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventClose) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    // Bloquer le scroll du body
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, preventClose]);

  // Focus trap — met le focus sur la modal à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => modalRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={!preventClose ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={`modal-box ${sizeMap[size]} w-full`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        {/* Header */}
        {(title || !preventClose) && (
          <div className="modal-header">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {subtitle}
                </p>
              )}
            </div>
            {!preventClose && (
              <button
                onClick={onClose}
                className="btn btn-icon btn-ghost"
                aria-label="Fermer la modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

// ── Dialog de confirmation ─────────────────────────────────────
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  confirmVariant = 'danger',
  isLoading = false,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>
          Annuler
        </button>
        <button
          className={`btn btn-${confirmVariant}`}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : null}
          {confirmLabel}
        </button>
      </>
    }
  >
    <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
      {message}
    </p>
  </Modal>
);
