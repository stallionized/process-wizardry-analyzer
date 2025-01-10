import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Check if user exists
    const { data: existingUsers, error: searchError } = await supabaseClient.auth.admin.listUsers({
      filters: {
        email: email
      }
    })

    if (searchError) {
      console.error('Error searching for user:', searchError)
      return new Response(
        JSON.stringify({ error: searchError.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    if (existingUsers?.users?.length > 0) {
      const existingUser = existingUsers.users[0]
      console.log('Updating password for existing user:', existingUser.id)
      
      // Update password for existing user
      const { data: updateData, error: updateError } = await supabaseClient.auth.admin.updateUserById(
        existingUser.id,
        { password: password }
      )

      if (updateError) {
        console.error('Error updating user password:', updateError)
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      console.log('Password updated successfully')
      return new Response(
        JSON.stringify({ data: updateData, message: 'User password updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating new user with email:', email)
    // Create new user if they don't exist
    const { data, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log('User created successfully')
    return new Response(
      JSON.stringify({ data, message: 'User created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})