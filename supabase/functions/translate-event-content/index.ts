// Edge function: translate event content fields via Lovable AI Gateway
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { sourceLang, targetLang, fields } = body as {
      sourceLang: string;
      targetLang: string;
      fields: Record<string, string>;
    };

    if (!sourceLang || !targetLang || !fields || typeof fields !== 'object') {
      return new Response(JSON.stringify({ error: 'sourceLang, targetLang, and fields are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter out empty fields — nothing to translate
    const nonEmpty: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v === 'string' && v.trim().length > 0) nonEmpty[k] = v;
    }

    if (Object.keys(nonEmpty).length === 0) {
      return new Response(JSON.stringify({ translations: {} }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (sourceLang === targetLang) {
      return new Response(JSON.stringify({ translations: nonEmpty }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sourceName = LANGUAGE_NAMES[sourceLang] || sourceLang;
    const targetName = LANGUAGE_NAMES[targetLang] || targetLang;

    const systemPrompt = `You are a professional translator for patient-experience survey content for fertility clinics.

Translate values from ${sourceName} to ${targetName}.

CRITICAL RULES:
1. Preserve all placeholders EXACTLY as written, including: {first_name}, {brand_name}, {location_name}, {google_review_link}, [Brand], and any other text wrapped in {} or [].
2. Preserve line breaks (\\n) and overall formatting.
3. Keep tone warm, professional, and patient-friendly.
4. Do NOT translate brand names or proper nouns inside placeholders.
5. Return ONLY translated values via the provided tool — no commentary.`;

    const userPrompt = `Translate the values of this JSON object from ${sourceName} to ${targetName}. Keep the same keys.\n\n${JSON.stringify(nonEmpty, null, 2)}`;

    // Use tool calling for structured output
    const properties: Record<string, { type: string; description: string }> = {};
    for (const k of Object.keys(nonEmpty)) {
      properties[k] = { type: 'string', description: `Translation of "${k}"` };
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_translations',
              description: 'Return the translated string values for each input key.',
              parameters: {
                type: 'object',
                properties,
                required: Object.keys(nonEmpty),
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'return_translations' } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const text = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, text);
      return new Response(JSON.stringify({ error: 'Translation service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiResponse.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error('No tool call in response', JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: 'No translation returned' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let translated: Record<string, string> = {};
    try {
      translated = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error('Failed to parse translation arguments', toolCall.function.arguments);
      return new Response(JSON.stringify({ error: 'Invalid translation response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ translations: translated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('translate-event-content error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
