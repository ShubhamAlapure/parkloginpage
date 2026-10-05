import React from 'react';
import { LoginForm } from './LoginForm';

export const AuthPanel: React.FC = () => {
  return (
    <main id="auth-card" className="page-module___8aEwW__card">
      <a className="page-module___8aEwW__brand" aria-label="Client portal home" href="/">
        <span className="page-module___8aEwW__mark" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3c4.5 2.3 7 5.8 7 10a7 7 0 0 1-14 0c0-4.2 2.5-7.7 7-10Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M12 21V10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
        Client portal
      </a>

      <div className="page-module___8aEwW__content">
        <h1 className="page-module___8aEwW__heading">Welcome back</h1>
        <p className="page-module___8aEwW__lede">
          Sign in to see your account, documents and messages.
        </p>

        <LoginForm />
      </div>

      <footer className="page-module___8aEwW__footer">
        <span>
          New here? <a href="#contact">Request access</a>
        </span>
        <nav aria-label="Help and legal">
          <a href="#help">Help</a>
          <a href="#privacy">Privacy</a>
        </nav>
      </footer>
    </main>
  );
};
