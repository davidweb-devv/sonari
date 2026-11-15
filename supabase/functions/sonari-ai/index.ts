import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, catalog, recentPlayed } = await req.json()
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openAiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured in Supabase secrets.')
    }

    // Construct system instructions and provide catalog data
    const systemPrompt = `
      You are Sonari AI, an elite music curator and intelligent DJ companion.
      You are given a catalog of available songs and the user's recent listening history.
      Your task is to respond to the user's prompt with:
      1. A conversational, engaging curator message (max 2 sentences).
      2. An array of song IDs from the provided catalog that best match the user's request or mood.
      
      Respond strictly in JSON format:
      {
        "message": "Your curator response here",
        "songIds": [1, 5, 8]
      }
    `.trim()

    const userMessage = `User Prompt: "${prompt || 'Autonomous DJ Mode: Continue cadence based on history'}". Recent History: ${JSON.stringify(recentPlayed)}. Available Catalog: ${JSON.stringify(catalog)}`.trim()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})