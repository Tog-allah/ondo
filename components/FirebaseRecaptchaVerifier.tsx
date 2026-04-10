/**
 * Custom Firebase reCAPTCHA verifier for Phone Auth.
 *
 * Replaces the deprecated `expo-firebase-recaptcha` package which is
 * incompatible with Expo SDK 54+ (uses removed legacy module APIs).
 *
 * This component renders an invisible reCAPTCHA v2 inside a WebView and
 * exposes a ref that implements Firebase's `ApplicationVerifier` interface
 * so it can be passed directly to `PhoneAuthProvider.verifyPhoneNumber()`.
 */
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Modal, View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecaptchaVerifierRef {
  /** Firebase ApplicationVerifier.type */
  type: 'recaptcha';
  /**
   * Triggers the reCAPTCHA challenge and resolves with the token.
   * Called internally by `PhoneAuthProvider.verifyPhoneNumber()`.
   */
  verify: () => Promise<string>;
}

interface Props {
  /** Firebase web config (must include `apiKey` and `authDomain`). */
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    [key: string]: any;
  };
  /** If true, tries invisible reCAPTCHA first. Defaults to true. */
  invisible?: boolean;
  /** Called when the WebView page finishes loading. */
  onLoad?: () => void;
  /** Called on error. */
  onError?: (error: any) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FirebaseRecaptchaVerifier = forwardRef<RecaptchaVerifierRef, Props>(
  ({ firebaseConfig, invisible = true, onLoad, onError }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [visible, setVisible] = useState(false);

    // Promise resolve/reject stored across the verify() ↔ onMessage boundary
    const resolveRef = useRef<((token: string) => void) | null>(null);
    const rejectRef = useRef<((err: Error) => void) | null>(null);

    // -----------------------------------------------------------------------
    // Build the HTML that loads Firebase Auth + reCAPTCHA
    // -----------------------------------------------------------------------
    const html = buildRecaptchaHtml(firebaseConfig, invisible);

    // -----------------------------------------------------------------------
    // Expose the ApplicationVerifier‐compatible ref
    // -----------------------------------------------------------------------
    useImperativeHandle(ref, () => ({
      type: 'recaptcha' as const,
      verify: () =>
        new Promise<string>((resolve, reject) => {
          resolveRef.current = resolve;
          rejectRef.current = reject;
          setVisible(true); // open the modal → mount the WebView
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
            case 'load':
              onLoad?.();
              // Trigger the invisible verification immediately
              webViewRef.current?.injectJavaScript(`
                (function(){
                  window.dispatchEvent(new MessageEvent('message', {data:{verify:true}}));
                })(); true;
              `);
              break;

            case 'verify':
              resolveRef.current?.(data.token);
              resolveRef.current = null;
              rejectRef.current = null;
              setVisible(false);
              break;

            case 'error':
              rejectRef.current?.(new Error(data.message ?? 'reCAPTCHA error'));
              resolveRef.current = null;
              rejectRef.current = null;
              setVisible(false);
              onError?.(data);
              break;

            case 'cancel':
              rejectRef.current?.(new Error('reCAPTCHA cancelled'));
              resolveRef.current = null;
              rejectRef.current = null;
              setVisible(false);
              break;
          }
        } catch {
          // ignore malformed messages
        }
      },
      [onLoad, onError],
    );

    const handleCancel = () => {
      rejectRef.current?.(new Error('reCAPTCHA cancelled by user'));
      resolveRef.current = null;
      rejectRef.current = null;
      setVisible(false);
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Vérification de sécurité</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.webviewContainer}>
              <WebView
                ref={webViewRef}
                javaScriptEnabled
                originWhitelist={['*']}
                mixedContentMode="always"
                source={{ html, baseUrl: `https://${firebaseConfig.authDomain}` }}
                onMessage={handleMessage}
                onError={(e) => {
                  rejectRef.current?.(new Error(e.nativeEvent.description));
                  resolveRef.current = null;
                  rejectRef.current = null;
                  setVisible(false);
                  onError?.(e.nativeEvent);
                }}
                style={styles.webview}
              />
              <ActivityIndicator
                style={StyleSheet.absoluteFill}
                size="large"
                color="#009A44"
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

FirebaseRecaptchaVerifier.displayName = 'FirebaseRecaptchaVerifier';
export default FirebaseRecaptchaVerifier;

// ---------------------------------------------------------------------------
// HTML builder
// ---------------------------------------------------------------------------

function buildRecaptchaHtml(
  config: { apiKey: string; authDomain: string; [k: string]: any },
  invisible: boolean,
): string {
  const siteKey = config.apiKey; // Firebase uses the API key as site key for reCAPTCHA
  const size = invisible ? 'invisible' : 'normal';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body{display:flex;justify-content:center;align-items:center;
         min-height:100vh;margin:0;background:transparent;overflow:hidden}
    #recaptcha-container{transform:scale(0.95);transform-origin:center}
  </style>
</head>
<body>
  <div id="recaptcha-container"></div>
  <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-auth-compat.js"></script>
  <script>
    var config = ${JSON.stringify(config)};
    firebase.initializeApp(config);

    var sent = false;
    function post(obj){ window.ReactNativeWebView.postMessage(JSON.stringify(obj)); }

    try {
      var verifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: '${size}',
        callback: function(token) {
          if(!sent){ sent=true; post({type:'verify',token:token}); }
        },
        'expired-callback': function() {
          post({type:'error',message:'reCAPTCHA expired'});
        }
      });

      verifier.render().then(function() {
        post({type:'load'});
      });

      // Listen for programmatic verify trigger
      window.addEventListener('message', function(e) {
        if(e.data && e.data.verify) { verifier.verify(); }
      });
    } catch(err) {
      post({type:'error',message:err.message||'reCAPTCHA init failed'});
    }
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  closeBtn: {
    padding: 4,
  },
  closeTxt: {
    fontSize: 18,
    color: '#999',
  },
  webviewContainer: {
    height: 400,
    width: '100%',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
