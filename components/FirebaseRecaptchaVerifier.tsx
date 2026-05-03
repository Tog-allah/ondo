/**
 * Silent/Invisible Firebase reCAPTCHA Verifier for Phone Auth.
 *
 * This component renders a HIDDEN WebView (0x0 pixels) that auto-solves
 * the reCAPTCHA challenge without any user interaction.
 *
 * Usage:
 *   <FirebaseRecaptchaVerifier ref={recaptchaRef} firebaseConfig={config} />
 *   // Then: await signInWithPhoneNumber(auth, phone, recaptchaRef.current)
 */
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecaptchaVerifierRef {
  /** Firebase ApplicationVerifier.type */
  type: 'recaptcha';
  /**
   * Triggers the reCAPTCHA challenge and resolves with the token.
   * Called internally by `signInWithPhoneNumber()`.
   */
  verify: () => Promise<string>;
}

interface Props {
  /** Firebase web config — must have apiKey & authDomain from a WEB app. */
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    [key: string]: any;
  };
  /** Called on error. */
  onError?: (error: any) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FirebaseRecaptchaVerifier = forwardRef<RecaptchaVerifierRef, Props>(
  ({ firebaseConfig, onError }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [ready, setReady] = useState(false);

    // Promise resolve/reject stored across the verify() ↔ onMessage boundary
    const resolveRef = useRef<((token: string) => void) | null>(null);
    const rejectRef = useRef<((err: Error) => void) | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Build the silent HTML page
    const html = buildSilentRecaptchaHtml(firebaseConfig);

    // -----------------------------------------------------------------------
    // Expose the ApplicationVerifier-compatible ref
    // -----------------------------------------------------------------------
    useImperativeHandle(ref, () => ({
      type: 'recaptcha' as const,
      // No-op reset — Firebase Web SDK calls this after signInWithPhoneNumber
      _reset: () => {},
      verify: () =>
        new Promise<string>((resolve, reject) => {
          resolveRef.current = resolve;
          rejectRef.current = reject;

          // Timeout after 30s
          timeoutRef.current = setTimeout(() => {
            reject(new Error('reCAPTCHA verification timed out (30s)'));
            resolveRef.current = null;
            rejectRef.current = null;
          }, 30000);

          // Tell the WebView to trigger verification
          webViewRef.current?.injectJavaScript(`
            (function(){
              if (window.__triggerVerify) {
                window.__triggerVerify();
              } else {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'error',
                  message: 'reCAPTCHA not ready yet'
                }));
              }
            })(); true;
          `);
        }),
    }));

    // -----------------------------------------------------------------------
    // Handle messages from the WebView
    // -----------------------------------------------------------------------
    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);

          switch (data.type) {
            case 'ready':
              // reCAPTCHA widget is rendered and ready
              setReady(true);
              break;

            case 'token':
              // Got the reCAPTCHA token — resolve the promise
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              resolveRef.current?.(data.token);
              resolveRef.current = null;
              rejectRef.current = null;
              break;

            case 'error':
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              const errorMsg = data.message ?? 'reCAPTCHA error';
              console.error('[reCAPTCHA]', errorMsg);
              rejectRef.current?.(new Error(errorMsg));
              resolveRef.current = null;
              rejectRef.current = null;
              onError?.(data);
              break;
          }
        } catch {
          // ignore malformed messages
        }
      },
      [onError],
    );

    // -----------------------------------------------------------------------
    // Render — completely hidden, no visual UI
    // -----------------------------------------------------------------------
    return (
      <View style={styles.hidden} pointerEvents="none">
        <WebView
          ref={webViewRef}
          javaScriptEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          source={{ html, baseUrl: `https://${firebaseConfig.authDomain}` }}
          onMessage={handleMessage}
          onError={(e) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            rejectRef.current?.(new Error(e.nativeEvent.description));
            resolveRef.current = null;
            rejectRef.current = null;
            onError?.(e.nativeEvent);
          }}
          style={styles.webview}
        />
      </View>
    );
  },
);

FirebaseRecaptchaVerifier.displayName = 'FirebaseRecaptchaVerifier';
export default FirebaseRecaptchaVerifier;

// ---------------------------------------------------------------------------
// HTML builder — fully silent invisible reCAPTCHA
// ---------------------------------------------------------------------------

function buildSilentRecaptchaHtml(
  config: { apiKey: string; authDomain: string; [k: string]: any },
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
    #recaptcha-container { position: absolute; top: -9999px; left: -9999px; }
  </style>
</head>
<body>
  <div id="recaptcha-container"></div>

  <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
  <script>
    var config = ${JSON.stringify(config)};

    function post(obj) {
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    }

    try {
      firebase.initializeApp(config);

      // Expose a trigger function for programmatic verification
      window.__triggerVerify = function() {
        try {
          // Create the verifier *on demand* to avoid early expiration
          var verifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            size: 'invisible',
            callback: function(token) {
              post({ type: 'token', token: token });
            },
            'expired-callback': function() {
              post({ type: 'error', message: 'reCAPTCHA token expired' });
            }
          });

          verifier.verify().catch(function(err) {
            // Only report actual errors, ignore expected DOM conflicts on rapid resets
            post({ type: 'error', message: 'verify() failed: ' + (err.message || err) });
          });
        } catch(err) {
          post({ type: 'error', message: 'verify() setup failed: ' + (err.message || err) });
        }
      };

      // Tell React Native we are ready to receive verifications
      post({ type: 'ready' });

    } catch(err) {
      post({ type: 'error', message: 'init failed: ' + (err.message || err) });
    }
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Styles — component is completely invisible (0x0)
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  hidden: {
    width: 0,
    height: 0,
    overflow: 'hidden',
    opacity: 0,
    position: 'absolute',
  },
  webview: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});
