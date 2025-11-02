"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createPortal } from 'react-dom';

interface ModalContextType {
  data: Record<string, any>;
  isOpen: Record<string, boolean>;
  canClose: Record<string, boolean>;
  setCanClose: (modalId: string, canClose: boolean) => void;
  setOpen: (
    modal: React.ReactNode,
    fetchdata?: () => Promise<any>,
    modalId?: string
  ) => void;
  setClose: (modalId?: string) => void;
}

export const ModalContext = createContext<ModalContextType>({
  data: {},
  isOpen: {},
  canClose: {},
  setOpen: () => {},
  setClose: () => {},
  setCanClose: () => {},
});

interface ModalProviderProps {
  children: React.ReactNode;
}

const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<Record<string, any>>({});
  const [modals, setModals] = useState<Record<string, React.ReactNode>>({});
  const [canClose, setCanCloseState] = useState<Record<string, boolean>>({});
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

  const setOpen = async (
    modal: React.ReactNode,
    fetchdata?: () => Promise<any>,
    modalId: string = "default"
  ) => {
    if (fetchdata) {
      const fetchedData = await fetchdata();
      setData((prev) => ({ ...prev, [modalId]: fetchedData || null }));
    }
    setIsOpen((prev) => ({ ...prev, [modalId]: true }));
    setModals((prev) => ({ ...prev, [modalId]: modal }));
    // Only update canClose if needed.
    setCanCloseState((prev) =>
      prev[modalId] === true ? prev : { ...prev, [modalId]: true }
    );
  };

  const setClose = (modalId: string = "default") => {
    if (canClose[modalId] !== false) {
      setIsOpen((prev) => ({ ...prev, [modalId]: false }));
      setData((prev) => ({ ...prev, [modalId]: null }));
      setModals((prev) => {
        const newState = { ...prev };
        delete newState[modalId];
        return newState;
      });
      setCanCloseState((prev) => {
        const newState = { ...prev };
        delete newState[modalId];
        return newState;
      });
    }
  };

  const setCanClose = (modalId: string, value: boolean) => {
    setCanCloseState((prev) => {
      // Only update if the value changes
      if (prev[modalId] === value) return prev;
      return { ...prev, [modalId]: value };
    });
  };

  // Create a top-level modal root element and attach it to document.body.
  // We do this on the client only so SSR is unaffected.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let root = document.getElementById('up-modal-root');
    let created = false;
    if (!root) {
      root = document.createElement('div');
      root.setAttribute('id', 'up-modal-root');
      // Keep it at the end of body so it's outside app containers that might
      // create containing blocks (transforms/filters).
      document.body.appendChild(root);
      created = true;
    }
    setModalRoot(root as HTMLElement);
    return () => {
      if (created && root && root.parentNode) root.parentNode.removeChild(root);
    };
  }, []);

  return (
    <ModalContext.Provider
      value={{ data, isOpen, canClose, setOpen, setClose, setCanClose }}
    >
      {children}
      {/* Render modals into a top-level portal so fixed positioning is
          always relative to the viewport (avoids issues when page
          containers create stacking/containing contexts). */}
      {typeof window !== 'undefined' && modalRoot ? createPortal(
        Object.entries(modals).map(
          ([id, modal]) => isOpen[id] && <React.Fragment key={id}>{modal}</React.Fragment>
        ), modalRoot
      ) : (
        // fallback: render inline during SSR (should be rare)
        Object.entries(modals).map(
          ([id, modal]) => isOpen[id] && <React.Fragment key={id}>{modal}</React.Fragment>
        )
      )}
    </ModalContext.Provider>
  );
};

export default ModalProvider;

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
