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
    let subscription: { unsubscribe: () => void } | null = null;

    const setupAuthListener = () => {
      console.log('Setting up auth listener...');
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in successfully');
          setErrorMessage("");
          navigate('/');
        } else if (event === 'SIGNED_OUT') {
          console.log('Processing sign out or error state');
          
          // Prevent multiple error handling
          if (errorHandled) {
            console.log('Error already being handled, skipping');
            return;
          }
          
          // Get error details from URL if they exist
          const params = new URLSearchParams(window.location.search);
          const error = params.get('error');
          const errorDescription = params.get('error_description');
          
          // If no error parameters exist, don't process further
          if (!error && !errorDescription) {
            console.log('No error parameters found');
            setErrorMessage("");
            return;
          }

          console.log('Error detected:', error, errorDescription);
          
          // Set flag to prevent multiple handling
          setErrorHandled(true);
          
          // Clear existing error message and unsubscribe from listener
          setErrorMessage("");
          if (subscription) {
            console.log('Unsubscribing from current listener');
            subscription.unsubscribe();
            subscription = null;
          }
          
          // Add a longer delay before setting the error message
          console.log('Setting up error message with delay');
          setTimeout(() => {
            console.log('Processing error after delay');
            // Handle specific error cases
            switch (error) {
              case 'invalid_grant':
              case 'invalid_credentials':
                setErrorMessage('Invalid email or password. Please check your credentials and try again.');
                break;
              default:
                if (errorDescription) {
                  setErrorMessage('An error occurred during sign in. Please try again.');
                }
                break;
            }
            
            // Reset the error handled flag and resubscribe after a longer delay
            setTimeout(() => {
              console.log('Resetting error state and resubscribing');
              setErrorHandled(false);
              
              // Resubscribe to the auth listener
              if (!subscription) {
                console.log('Reestablishing auth listener');
                subscription = setupAuthListener();
              }
            }, 2000); // Increased to 2 seconds
          }, 1000); // Increased to 1 second
        }
      });

      return data.subscription;
    };

    // Initial subscription
    subscription = setupAuthListener();

    // Cleanup
    return () => {
      if (subscription) {
        console.log('Cleaning up auth listener');
        subscription.unsubscribe();
      }
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