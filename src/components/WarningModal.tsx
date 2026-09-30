import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface WarningModalProps {
  message: string;
  onClose: () => void;
}

function WarningModal({ message, onClose }: WarningModalProps) {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsExiting(true);
    }, 5000);
  };

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (!isExiting) {
      startTimer();
    }
  };

  const handleClose = () => {
    setIsExiting(true);
  };

  useEffect(() => {
    startTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div
      role="alert"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onAnimationEnd={() => {
        if (isExiting) {
          onClose();
        }
      }}
      className={isExiting ? "warning-exit" : "warning-enter"}
    >
      <div className="warning-content">
        <AlertTriangle
          size={20}
          strokeWidth={2}
          className="warning-icon"
          aria-hidden="true"
        />

        <p className="warning-message">{message}</p>

        <button
          type="button"
          onClick={handleClose}
          className="warning-close"
          aria-label="Close warning"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export default WarningModal;
