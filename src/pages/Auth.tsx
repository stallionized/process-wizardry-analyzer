import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useSessionContext();
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setErrorMessage("");
        navigate('/');
      } else if (event === 'SIGNED_OUT') {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const error = urlParams.get('error');
          const errorDescription = urlParams.get('error_description');

          if (!error && !errorDescription) {
            return;
          }

          // Try to parse the error description as JSON
          let parsedError = null;
          try {
            if (errorDescription) {
              parsedError = JSON.parse(errorDescription);
            }
          } catch {
            // If parsing fails, use the original error description
            parsedError = null;
          }

          // Check for invalid credentials or authentication errors
          if (error === 'invalid_grant' || 
              (parsedError && typeof parsedError === 'object' && 
               (parsedError.code === 'invalid_credentials' || 
                parsedError.message?.includes('Invalid login credentials'))) ||
              (errorDescription && (
                errorDescription.includes('status 400') ||
                errorDescription.includes('failed to call url') ||
                errorDescription.includes('invalid_credentials') ||
                errorDescription.includes('Invalid login credentials')
              ))) {
            setErrorMessage('Invalid email or password. Please check your credentials and try again.');
          } else if (errorDescription && !errorDescription.includes('body stream already read')) {
            setErrorMessage('An error occurred during sign in. Please try again.');
          }
        } catch (error) {
          console.error('Error handling authentication:', error);
          setErrorMessage('An error occurred during sign in. Please try again.');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-12">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome to ProcessAI</h1>
          <p className="text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="animate-in fade-in-50">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="border rounded-lg p-6 bg-card">
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#10B981',
                    brandAccent: '#059669',
                  },
                },
              },
            }}
            providers={[]}
            redirectTo={window.location.origin}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;