import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';
import { AuthError } from '@supabase/supabase-js';

const Auth = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useSessionContext();
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Redirect to projects if session exists
  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setErrorMessage(""); // Clear any error messages on successful sign in
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Handle auth errors
  useEffect(() => {
    const handleAuthError = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setErrorMessage('Invalid email or password. Please check your credentials and try again.');
      }
    });

    return () => {
      handleAuthError.data.subscription.unsubscribe();
    };
  }, []);

  const handleAuthError = (error: AuthError) => {
    switch (error.message) {
      case 'Invalid login credentials':
        setErrorMessage('Invalid email or password. Please try again.');
        break;
      case 'Email not confirmed':
        setErrorMessage('Please verify your email address before signing in.');
        break;
      default:
        setErrorMessage('An error occurred during authentication. Please try again.');
    }
  };

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
            onAuthError={(error) => {
              handleAuthError(error);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;