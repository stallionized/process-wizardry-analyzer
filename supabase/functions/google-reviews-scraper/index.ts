import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const pythonCode = `
import sys
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from datetime import datetime
import time

def scrape_google_reviews(place_id):
    try:
        # Configure Chrome options for headless browsing
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        # Initialize the driver
        driver = webdriver.Chrome(options=options)
        
        # Construct the URL using place_id
        url = f"https://search.google.com/local/reviews?placeid={place_id}"
        driver.get(url)
        
        # Wait for reviews to load
        wait = WebDriverWait(driver, 10)
        reviews = []
        
        # Scroll to load more reviews (adjust the number based on needs)
        for _ in range(3):
            try:
                # Find all review elements
                review_elements = wait.until(EC.presence_of_all_elements_located(
                    (By.CSS_SELECTOR, 'div[data-review-id]')
                ))
                
                for element in review_elements:
                    try:
                        # Extract review data
                        text = element.find_element(By.CSS_SELECTOR, '.review-full-text').text
                        rating = len(element.find_elements(By.CSS_SELECTOR, 'span[aria-label*="stars"]'))
                        date_element = element.find_element(By.CSS_SELECTOR, 'span[class*="review-date"]')
                        date_str = date_element.text
                        
                        review = {
                            'text': text,
                            'rating': rating,
                            'date': date_str,
                        }
                        
                        if review not in reviews:  # Avoid duplicates
                            reviews.append(review)
                            
                    except Exception as e:
                        print(f"Error extracting review: {str(e)}", file=sys.stderr)
                        continue
                
                # Scroll to load more
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)  # Wait for new reviews to load
                
            except TimeoutException:
                break
                
        driver.quit()
        return json.dumps({'success': True, 'reviews': reviews})
        
    except Exception as e:
        return json.dumps({
            'success': False,
            'error': str(e)
        })

# Get place_id from command line arguments
if len(sys.argv) > 1:
    result = scrape_google_reviews(sys.argv[1])
    print(result)
else:
    print(json.dumps({
        'success': False,
        'error': 'No place_id provided'
    }))
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { placeId, projectId } = await req.json();
    
    if (!placeId || !projectId) {
      throw new Error('Place ID and Project ID are required');
    }

    console.log('Starting review scraping for place ID:', placeId);

    // Create a temporary Python file
    const tempFile = await Deno.makeTempFile({ suffix: '.py' });
    await Deno.writeTextFile(tempFile, pythonCode);

    // Run the Python script
    const command = new Deno.Command('python3', {
      args: [tempFile, placeId],
    });

    const { stdout, stderr } = await command.output();
    const output = new TextDecoder().decode(stdout);
    const errors = new TextDecoder().decode(stderr);

    if (errors) {
      console.error('Python script errors:', errors);
    }

    // Clean up the temporary file
    await Deno.remove(tempFile);

    // Parse the Python script output
    const result = JSON.parse(output);

    if (!result.success) {
      throw new Error(result.error || 'Failed to scrape reviews');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Transform and store the reviews
    const complaints = result.reviews.map((review: any) => ({
      project_id: projectId,
      complaint_text: review.text || '',
      source_url: `https://search.google.com/local/reviews?placeid=${placeId}`,
      theme: 'Google Review',
      trend: review.rating >= 4 ? 'Positive' : review.rating <= 2 ? 'Negative' : 'Neutral',
      created_at: new Date().toISOString() // You might want to parse review.date if available
    }));

    // Store reviews in the database
    const { error: insertError } = await supabase
      .from('complaints')
      .upsert(complaints);

    if (insertError) {
      console.error('Error storing reviews:', insertError);
      throw insertError;
    }

    console.log(`Successfully stored ${complaints.length} reviews`);
    
    return new Response(
      JSON.stringify({
        success: true,
        reviewsCount: complaints.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in google-reviews-scraper function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});