import React, { useState } from 'react';

interface CaptchaWidgetProps {
  id?: string;
  verified: boolean;
  onChange: (verified: boolean) => void;
  hasError?: boolean;
}

export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({
  id = 'captcha-checkbox',
  verified,
  onChange,
  hasError = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    if (verified || isLoading) return;

    setIsLoading(true);
    // Simulate captcha verification delay
    setTimeout(() => {
      setIsLoading(false);
      onChange(true);
    }, 700);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`recaptcha-widget-container ${hasError ? 'recaptcha-error' : ''} ${
        verified ? 'recaptcha-verified' : ''
      }`}
    >
      <div className="recaptcha-left">
        <button
          type="button"
          id={id}
          className="recaptcha-checkbox-btn"
          role="checkbox"
          aria-checked={verified}
          aria-label="I'm not a robot"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        >
          <span className="recaptcha-checkbox-box">
            {isLoading ? (
              <span className="recaptcha-spinner" aria-hidden="true" />
            ) : verified ? (
              <svg
                className="recaptcha-checkmark"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0F9D58"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : null}
          </span>
          <span className="recaptcha-label">I'm not a robot</span>
        </button>
      </div>

      <div className="recaptcha-right" aria-hidden="true">
        <div className="recaptcha-logo-wrap">
          <svg
            className="recaptcha-logo-icon"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top Blue Arc */}
            <path
              d="M24 6c7.5 0 13.9 4.7 16.5 11.5l-4.7 1.9C33.8 14.2 29.3 10.5 24 10.5c-5.4 0-10.1 3.8-12 9.2l4.2 1.1-8.4 7.4-5.3-11.1 4.2 1.1C9.2 11.1 16 6 24 6z"
              fill="#4285F4"
            />
            {/* Bottom Gray Arc */}
            <path
              d="M24 42c-7.5 0-13.9-4.7-16.5-11.5l4.7-1.9c2 5.2 6.5 8.9 11.8 8.9 5.4 0 10.1-3.8 12-9.2l-4.2-1.1 8.4-7.4 5.3 11.1-4.2-1.1C38.8 36.9 32 42 24 42z"
              fill="#9AA0A6"
            />
          </svg>
        </div>
        <span className="recaptcha-brand-text">reCAPTCHA</span>
        <div className="recaptcha-links">
          <a
            href="https://www.google.com/intl/en/policies/privacy/"
            target="_blank"
            rel="noreferrer"
            tabIndex={-1}
          >
            Privacy
          </a>
          <span className="recaptcha-links-dot">-</span>
          <a
            href="https://www.google.com/intl/en/policies/terms/"
            target="_blank"
            rel="noreferrer"
            tabIndex={-1}
          >
            Terms
          </a>
        </div>
      </div>
    </div>
  );
};
