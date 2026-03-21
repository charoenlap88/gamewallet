import { Box } from '@mui/material';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

type Props = {
  onCredential: (idToken: string) => void;
};

/** แสดงเมื่อตั้ง VITE_GOOGLE_CLIENT_ID แล้ว และอยู่ภายใต้ GoogleOAuthProvider */
export function GoogleSignInButton({ onCredential }: Props) {
  if (!CLIENT_ID) return null;

  const handle = (res: CredentialResponse) => {
    if (res.credential) onCredential(res.credential);
  };

  return (
    <Box display="flex" justifyContent="center" width="100%">
      <GoogleLogin
        onSuccess={handle}
        onError={() => {
          /* toast จาก parent ได้ */
        }}
        useOneTap={false}
        theme="outline"
        size="large"
        width="320"
        text="continue_with"
        shape="rectangular"
      />
    </Box>
  );
}

export function isGoogleAuthConfigured(): boolean {
  return !!CLIENT_ID;
}
