import React, { useId, useState } from 'react';
import confetti from 'canvas-confetti';
import { useAppStore } from '@/app/store';
import { CaptchaWidget } from './CaptchaWidget';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateForm(email: string, password: string) {
  const errors: { email?: string; password?: string } = {};

  if (!email.trim()) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Enter an email address like name@company.com.';
  }

  if (!password) {
    errors.password = 'Enter your password.';
  } else if (password.length < 8) {
    errors.password = 'Passwords are at least 8 characters.';
  }

  return errors;
}

export const LoginForm: React.FC = () => {
  const id = useId();
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: true,
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [status, setStatus] = useState<{ state: 'idle' | 'loading' | 'done' | 'info'; message: string }>({
    state: 'idle',
    message: '',
  });

  const { setIsSuccess, setCameraFocusTarget } = useAppStore();

  const handleChange = (field: 'email' | 'password' | 'remember') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const next = { ...form, [field]: val };
    setForm(next);

    if (touched[field as 'email' | 'password']) {
      setErrors(validateForm(next.email, next.password));
    }
  };

  const handleBlur = (field: 'email' | 'password') => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateForm(form.email, form.password));
  };

  const handleKeyModifier = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(Boolean(e.getModifierState?.('CapsLock')));
  };

  const handleCaptchaChange = (verified: boolean) => {
    setIsCaptchaVerified(verified);
    if (verified) {
      setCaptchaError(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(form.email, form.password);
    setErrors(errs);
    setTouched({ email: true, password: true });

    if (!isCaptchaVerified) {
      setCaptchaError(true);
    }

    const errKeys = Object.keys(errs) as (keyof typeof errs)[];
    if (errKeys.length > 0) {
      document.getElementById(`${id}-${errKeys[0]}`)?.focus();
      return;
    }

    if (!isCaptchaVerified) {
      document.getElementById(`${id}-captcha`)?.focus();
      return;
    }

    setStatus({ state: 'loading', message: '' });
    setCameraFocusTarget('success');

    await new Promise((r) => setTimeout(r, 1200));

    setStatus({
      state: 'done',
      message: 'Signed in. Connect your authentication service to continue.',
    });
    setIsSuccess(true);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6, x: 0.2 },
      colors: ['#2f5d46', '#8cc7a5', '#eef0e9', '#1d2a22'],
    });
  };

  const handleProviderClick = (provider: string) => () => {
    setStatus({
      state: 'info',
      message: `${provider} sign-in needs to be connected to your identity provider.`,
    });
  };

  const emailInvalid = touched.email && Boolean(errors.email);
  const passwordInvalid = touched.password && Boolean(errors.password);
  const isLoading = status.state === 'loading';
  const isDone = status.state === 'done';

  return (
    <div className="login-form-module__PK4fKq__wrap">
      {/* SSO & Passkey Providers */}
      <div className="login-form-module__PK4fKq__alt">
        <button
          type="button"
          className="login-form-module__PK4fKq__passkey"
          onClick={handleProviderClick('Passkey')}
        >
          <span className="login-form-module__PK4fKq__icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M3 19.5c.6-3.3 3-5.5 6-5.5 1.3 0 2.5.4 3.4 1.1" />
              <circle cx="17.5" cy="13.5" r="2.5" />
              <path d="M17.5 16v4.5l1.3-1-1.3-1" />
            </svg>
          </span>
          Sign in with a passkey
        </button>

        <div className="login-form-module__PK4fKq__sso">
          <button
            type="button"
            className="login-form-module__PK4fKq__provider"
            onClick={handleProviderClick('Google')}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="login-form-module__PK4fKq__brandMark"
            >
              <path
                fill="#4285F4"
                d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
              />
              <path
                fill="#FBBC05"
                d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z"
              />
              <path
                fill="#EA4335"
                d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9Z"
              />
            </svg>
            Google
          </button>

          <button
            type="button"
            className="login-form-module__PK4fKq__provider"
            onClick={handleProviderClick('Microsoft')}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="login-form-module__PK4fKq__brandMark"
            >
              <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
              <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
              <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
              <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
            </svg>
            Microsoft
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="login-form-module__PK4fKq__divider" role="separator">
        <span>or use your email</span>
      </div>

      {/* Form */}
      <form className="login-form-module__PK4fKq__form" onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div className="login-form-module__PK4fKq__field">
          <label htmlFor={`${id}-email`}>Email</label>
          <div className="login-form-module__PK4fKq__control">
            <span className="login-form-module__PK4fKq__lead">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </span>
            <input
              id={`${id}-email`}
              type="email"
              name="email"
              autoComplete="username webauthn"
              inputMode="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              aria-invalid={emailInvalid}
              aria-describedby={emailInvalid ? `${id}-email-error` : undefined}
              onFocus={() => setCameraFocusTarget('email')}
            />
          </div>
          {emailInvalid && (
            <p id={`${id}-email-error`} className="login-form-module__PK4fKq__error">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5.5M12 16.5v.01" />
              </svg>
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="login-form-module__PK4fKq__field">
          <div className="login-form-module__PK4fKq__labelRow">
            <label htmlFor={`${id}-password`}>Password</label>
            <a href="#forgot" className="login-form-module__PK4fKq__link">
              Forgot password?
            </a>
          </div>
          <div className="login-form-module__PK4fKq__control">
            <span className="login-form-module__PK4fKq__lead">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
                <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
              </svg>
            </span>
            <input
              id={`${id}-password`}
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange('password')}
              onBlur={(e) => {
                handleBlur('password')();
                setCapsLock(false);
              }}
              onKeyUp={handleKeyModifier}
              onKeyDown={handleKeyModifier}
              aria-invalid={passwordInvalid}
              aria-describedby={
                [passwordInvalid && `${id}-password-error`, capsLock && `${id}-caps`]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              onFocus={() => setCameraFocusTarget('password')}
            />
            <button
              type="button"
              className="login-form-module__PK4fKq__reveal"
              onClick={() => setShowPassword((p) => !p)}
              aria-pressed={showPassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {showPassword ? (
                  <>
                    <path d="M3 3l18 18" />
                    <path d="M10.6 5.6A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.7M6.6 6.7C3.9 8.4 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.1-1" />
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  </>
                ) : (
                  <>
                    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
          {capsLock && (
            <p id={`${id}-caps`} className="login-form-module__PK4fKq__hint">
              Caps Lock is on.
            </p>
          )}
          {passwordInvalid && (
            <p id={`${id}-password-error`} className="login-form-module__PK4fKq__error">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5.5M12 16.5v.01" />
              </svg>
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Checkbox */}
        <label className="login-form-module__PK4fKq__check">
          <input
            type="checkbox"
            checked={form.remember}
            onChange={handleChange('remember')}
          />
          <span className="login-form-module__PK4fKq__box" aria-hidden="true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
          <span>Keep me signed in on this device</span>
        </label>

        {/* reCAPTCHA "I'm not a robot" Widget */}
        <div className="login-form-module__PK4fKq__field">
          <CaptchaWidget
            id={`${id}-captcha`}
            verified={isCaptchaVerified}
            onChange={handleCaptchaChange}
            hasError={captchaError}
          />
          {captchaError && (
            <p id={`${id}-captcha-error`} className="recaptcha-error-text" role="alert">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" strokeWidth="2" />
                <path d="M12 7.5v5.5M12 16.5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Please verify that you are not a robot.</span>
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="login-form-module__PK4fKq__submit"
          disabled={isLoading}
          aria-busy={isLoading}
          data-state={status.state}
        >
          {isLoading ? (
            <>
              <span className="login-form-module__PK4fKq__spinner" aria-hidden="true" />
              Signing in…
            </>
          ) : isDone ? (
            <>
              <span className="login-form-module__PK4fKq__icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
              </span>
              Signed in
            </>
          ) : (
            <>
              Sign in
              <span className="login-form-module__PK4fKq__icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </>
          )}
        </button>

        {/* Status */}
        <p
          className="login-form-module__PK4fKq__status"
          role="status"
          aria-live="polite"
          data-state={status.state}
        >
          {status.message}
        </p>
      </form>
    </div>
  );
};
