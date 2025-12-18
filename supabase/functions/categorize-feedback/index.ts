import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORIES = [
  'Financial Issue',
  'Wait Time',
  'Staff Experience',
  'Scheduling',
  'Communication',
  'Facility',
  'Other'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { responseId, feedbackText, score } = await req.json();
    
    if (!responseId || !feedbackText) {
      return new Response(
        JSON.stringify({ error: 'responseId and feedbackText are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scoreCategory = score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor';
    
    const systemPrompt = `You are a feedback categorization assistant for a healthcare/medical practice NPS survey system.
Your task is to categorize patient feedback into one or more predefined categories.

Available categories:
${CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Rules:
1. Analyze the feedback text and assign relevant categories
2. You can assign multiple categories if the feedback covers multiple topics
3. Use "Other" only if the feedback doesn't fit any specific category
4. Return ONLY a JSON array of category names that apply
5. If the feedback is very short or unclear, return ["Other"]

The patient gave a score of ${score}/10 (${scoreCategory}).`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Categorize this patient feedback:\n\n"${feedbackText}"` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required for AI features' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '["Other"]';
    
    // Parse the AI response - it should be a JSON array
    let categories: string[];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        categories = JSON.parse(jsonMatch[0]);
      } else {
        categories = ['Other'];
      }
    } catch {
      console.error('Failed to parse AI response:', content);
      categories = ['Other'];
    }

    // Filter to only valid categories
    categories = categories.filter(c => CATEGORIES.includes(c));
    if (categories.length === 0) {
      categories = ['Other'];
    }

    // Now save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get category IDs
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .from('feedback_categories')
      .select('id, name')
      .in('name', categories);

    if (categoryError) {
      console.error('Error fetching categories:', categoryError);
      throw categoryError;
    }

    // Delete existing AI-assigned categories for this response
    await supabaseAdmin
      .from('response_category_assignments')
      .delete()
      .eq('response_id', responseId)
      .eq('source', 'ai');

    // Insert new AI-assigned categories
    if (categoryData && categoryData.length > 0) {
      const assignments = categoryData.map(cat => ({
        response_id: responseId,
        category_id: cat.id,
        source: 'ai',
        assigned_by: null
      }));

      const { error: insertError } = await supabaseAdmin
        .from('response_category_assignments')
        .insert(assignments);

      if (insertError) {
        console.error('Error inserting category assignments:', insertError);
        throw insertError;
      }
    }

    console.log(`Categorized response ${responseId} with AI categories:`, categories);

    return new Response(
      JSON.stringify({ 
        success: true, 
        categories,
        categoryIds: categoryData?.map(c => c.id) || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in categorize-feedback function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
