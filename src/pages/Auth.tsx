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
  const [errorHandled, setErrorHandled] = useState(false);

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
        // Prevent multiple error handling
        if (errorHandled) return;
        
        // Get error details from URL if they exist
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
        // If no error parameters exist, don't process further
        if (!error && !errorDescription) {
          setErrorMessage("");
          return;
        }

        // Set flag to prevent multiple handling
        setErrorHandled(true);
        
        // Clear existing error message
        setErrorMessage("");
        
        // Add a longer delay before setting the error message
        setTimeout(() => {
          // Handle specific error cases
          switch (error) {
            case 'invalid_grant':
            case 'invalid_credentials':
              setErrorMessage('Invalid email or password. Please check your credentials and try again.');
              break;
            default:
              // Only set a generic error if we have an error description and it's not about the body stream
              if (errorDescription && !errorDescription.includes('body stream already read')) {
                setErrorMessage('An error occurred during sign in. Please try again.');
              }
              break;
          }
          
          // Reset the error handled flag after a delay
          setTimeout(() => {
            setErrorHandled(false);
          }, 1000);
        }, 500); // Increased from 100ms to 500ms
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, errorHandled]);

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