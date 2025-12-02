/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef } from 'react';
import logger from '../utils/logger';

// Hook para usar reCAPTCHA v3
export const useReCaptcha = (siteKey) => {
  const recaptchaRef = useRef(null);

  useEffect(() => {
    // Cargar script de reCAPTCHA si no está cargado
    if (!window.grecaptcha) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        window.grecaptcha.ready(() => {
          recaptchaRef.current = window.grecaptcha;
        });
      };
    } else {
      window.grecaptcha.ready(() => {
        recaptchaRef.current = window.grecaptcha;
      });
    }
  }, [siteKey]);

  const execute = async (action = 'submit') => {
    if (!recaptchaRef.current && window.grecaptcha) {
      recaptchaRef.current = window.grecaptcha;
    }

    if (!recaptchaRef.current) {
      logger.warn('reCAPTCHA no está listo');
      return null;
    }

    try {
      const token = await recaptchaRef.current.execute(siteKey, { action });
      return token;
    } catch (error) {
      logger.error('Error al ejecutar reCAPTCHA:', error);
      return null;
    }
  };

  return { execute };
};

// Componente wrapper para reCAPTCHA (opcional, para casos especiales)
const ReCaptcha = ({ siteKey, onVerify }) => {
  const { execute } = useReCaptcha(siteKey);

  useEffect(() => {
    if (onVerify) {
      execute('pageview').then((token) => {
        if (token && onVerify) {
          onVerify(token);
        }
      });
    }
  }, [execute, onVerify]);

  return null; // reCAPTCHA v3 es invisible
};

export default ReCaptcha;

