import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = 'ফিরে যান',
  className = ''
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      // If there's history, go back; otherwise go home
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`
        inline-flex items-center gap-2 py-2 px-3 -ml-3 text-gangchill-ink/80 hover:text-gangchill-blue
        font-semibold text-sm sm:text-base rounded-md hover:bg-black/5 transition-colors duration-150 active:scale-[0.98]
        ${className}
      `}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gangchill-blue" />
      <span>{label}</span>
    </button>
  );
};
