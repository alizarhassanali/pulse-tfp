import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { responseId, eventId, feedbackText, score } = await req.json();
    
    if (!responseId || !eventId || !feedbackText) {
      return new Response(
        JSON.stringify({ error: 'responseId, eventId, and feedbackText are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch event-specific tags
    const { data: eventTags, error: tagsError } = await supabaseAdmin
      .from('event_feedback_tags')
      .select('id, name')
      .eq('event_id', eventId)
      .eq('archived', false);

    if (tagsError) {
      console.error('Error fetching event tags:', tagsError);
      throw tagsError;
    }

    // If no tags configured for this event, skip categorization
    if (!eventTags || eventTags.length === 0) {
      console.log(`No tags configured for event ${eventId}, skipping categorization`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No tags configured for this event',
          tags: [],
          tagIds: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tagNames = eventTags.map(t => t.name);
    const scoreCategory = score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor';
    
    const systemPrompt = `You are a feedback categorization assistant for a healthcare/medical practice NPS survey system.
Your task is to categorize patient feedback into one or more predefined tags.

Available tags for this event:
${tagNames.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Rules:
1. Analyze the feedback text and assign relevant tags from the list above
2. You can assign multiple tags if the feedback covers multiple topics
3. ONLY use tags from the provided list above - do not create new ones
4. Return ONLY a JSON array of tag names that apply
5. If no tags are relevant, return an empty array []

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
    const content = aiResult.choices?.[0]?.message?.content || '[]';
    
    // Parse the AI response - it should be a JSON array
    let selectedTagNames: string[];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        selectedTagNames = JSON.parse(jsonMatch[0]);
      } else {
        selectedTagNames = [];
      }
    } catch {
      console.error('Failed to parse AI response:', content);
      selectedTagNames = [];
    }

    // Filter to only valid tags for this event
    const validTagNames = selectedTagNames.filter(name => tagNames.includes(name));
    
    // Get tag IDs for the selected tags
    const selectedTagData = eventTags.filter(t => validTagNames.includes(t.name));

    // Delete existing AI-assigned tags for this response
    await supabaseAdmin
      .from('response_tag_assignments')
      .delete()
      .eq('response_id', responseId)
      .eq('source', 'ai');

    // Insert new AI-assigned tags
    if (selectedTagData.length > 0) {
      const assignments = selectedTagData.map(tag => ({
        response_id: responseId,
        tag_id: tag.id,
        source: 'ai',
        assigned_by: null
      }));

      const { error: insertError } = await supabaseAdmin
        .from('response_tag_assignments')
        .insert(assignments);

      if (insertError) {
        console.error('Error inserting tag assignments:', insertError);
        throw insertError;
      }
    }

    console.log(`Categorized response ${responseId} with AI tags:`, validTagNames);

    return new Response(
      JSON.stringify({ 
        success: true, 
        tags: validTagNames,
        tagIds: selectedTagData.map(t => t.id)
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
