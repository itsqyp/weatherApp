import { CheckCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SuccessModalProps {
  message: string;
  onClose: () => void;
}

function SuccessModal({ message, onClose }: SuccessModalProps) {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsExiting(true);
    }, 2000);
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
      role="status"
      onAnimationEnd={() => {
        if (isExiting) {
          onClose();
        }
      }}
      className={isExiting ? "success-exit" : "success-enter"}
    >
      {" "}
      <div className="success-content">
        {" "}
        <CheckCircle
          size={20}
          strokeWidth={2}
          className="success-icon"
          aria-hidden="true"
        />
        <p className="success-message">{message}</p>
        <button
          type="button"
          onClick={handleClose}
          className="success-close"
          aria-label="Close success message"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export default SuccessModal;
