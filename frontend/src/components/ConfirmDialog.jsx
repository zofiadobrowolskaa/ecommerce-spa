import React, { useState, useCallback } from 'react';
import '../styles/components/_confirmDialog.scss';

let dialogState = {
  isOpen: false,
  title: '',
  message: '',
  onConfirm: null,
  onCancel: null,
};

// list of subscribed listeners to re-render components on state change
let listeners = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// custom hook to subscribe to dialog state changes
export const useConfirmDialog = () => {
  const [state, setState] = useState(dialogState);

  const subscribe = useCallback(() => {
    const listener = () => setState({ ...dialogState });
    listeners.push(listener);
    // unsubscribe function to remove listener
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  React.useEffect(subscribe, [subscribe]);

  return state;
};

// API to show the confirmation dialog and await user's response
export const confirmDialog = {
  show: (title, message) => {
    return new Promise((resolve) => {
      dialogState = {
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          dialogState.isOpen = false;
          notifyListeners();
          resolve(true); // resolve promise when confirmed
        },
        onCancel: () => {
          dialogState.isOpen = false;
          notifyListeners();
          resolve(false); // resolve promise when cancelled
        },
      };
      notifyListeners(); // trigger re-render for all subscribers
    });
  },
};

const ConfirmDialog = () => {
  const state = useConfirmDialog();

  if (!state.isOpen) return null;

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <h2>{state.title}</h2>
        <p>{state.message}</p>
        <div className="dialog-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={state.onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-confirm"
            onClick={state.onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
