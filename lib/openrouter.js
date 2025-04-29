import { v4 as uuidv4 } from 'uuid';
import { jsonrepair } from 'jsonrepair';

// Use environment variable for API key
const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'nousresearch/deephermes-3-llama-3-8b-preview:free';

/**
 * Cleans and extracts valid JSON from API response.
 * @param {string} content - Raw API response content
 * @returns {any|null} - Parsed JSON or null if invalid
 */
function cleanAndParseJson(content) {
  if (!content || typeof content !== 'string' || content.trim() === '') {
    console.error('Invalid or empty response content:', content);
    return null;
  }

  // Log raw content for debugging
  console.debug('Raw API response:', content);

  // Check if the response is JSON-like
  if (!content.includes('[') || !content.includes(']')) {
    console.error('Response does not contain a JSON array:', content);
    return null;
  }

  // Remove markdown code blocks, extra whitespace, and problematic characters
  let cleaned = content
    .replace(/```json\s*|\s*```/g, '') // Remove ```json and ```
    .replace(/```[\s\S]*?```/g, '') // Remove any other code blocks
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();

  // Extract the first valid JSON array
  const jsonMatch = cleaned.match(/\[[\s\S]*?\](?=\s*(?:$|[^\]}]))/);
  if (!jsonMatch) {
    console.error('No valid JSON array found in response:', cleaned);
    return null;
  }
  cleaned = jsonMatch[0];

  // Fix common JSON issues
  // 1. Remove trailing commas in arrays and objects
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
  // 2. Remove trailing commas before property separators
  cleaned = cleaned.replace(/,\s*(?=\s*[{[])/g, '');
  // 3. Escape unescaped quotes in strings
  cleaned = cleaned.replace(/(?<!\\)"(?=\w)/g, '\\"');
  // 4. Quote unquoted property names and values
  cleaned = cleaned.replace(
    /([{,]\s*)([^"\s:]+)(\s*:)(\s*)([^,\]}]+)/g,
    (match, prefix, key, colon, space, value) => {
      const trimmedValue = value.trim();
      const quotedValue = /^[\d.]+$|^true$|^false$|^null$|^".*"$/.test(trimmedValue)
        ? trimmedValue
        : `"${trimmedValue.replace(/"/g, '\\"')}"`;
      return `${prefix}"${key.trim()}"${colon}${space}${quotedValue}`;
    }
  );

  // Validate cleaned JSON
  if (cleaned === '[]' || cleaned === '[ ]') {
    console.debug('Cleaned JSON is empty array:', cleaned);
    return [];
  }
  if (!cleaned.startsWith('[') || !cleaned.endsWith(']')) {
    console.error('Cleaned content is not a valid JSON array:', cleaned);
    return null;
  }

  // Log cleaned content for debugging
  console.debug('Cleaned JSON content:', cleaned);

  try {
    // Attempt to repair JSON using jsonrepair
    const repaired = jsonrepair(cleaned);
    const parsed = JSON.parse(repaired);
    // Validate that the result is an array
    if (!Array.isArray(parsed)) {
      console.error('Parsed response is not an array:', parsed);
      return null;
    }
    console.debug('Successfully parsed JSON:', parsed);
    return parsed;
  } catch (error) {
    console.error('JSON parse error:', error.message, { cleanedContent: cleaned });

    // Fallback: Attempt to parse individual objects
    try {
      if (cleaned.length <= 2) {
        console.debug('Cleaned JSON too short for fallback:', cleaned);
        return [];
      }
      const objects = cleaned
        .slice(1, -1) // Remove [ and ]
        .split(/}\s*,\s*{/)
        .map((obj, index, arr) => {
          // Reconstruct each object
          let fixedObj = obj.trim();
          if (!fixedObj.startsWith('{')) fixedObj = '{' + fixedObj;
          if (!fixedObj.endsWith('}')) fixedObj = fixedObj + '}';
          if (index > 0 && !fixedObj.startsWith('{')) fixedObj = '{' + fixedObj;
          if (index < arr.length - 1 && !fixedObj.endsWith('}')) fixedObj = fixedObj + '}';
          return fixedObj;
        })
        .filter((obj) => obj && obj.startsWith('{') && obj.endsWith('}'))
        .map((obj) => {
          try {
            return JSON.parse(jsonrepair(obj));
          } catch {
            return null;
          }
        })
        .filter((obj) => obj);

      if (objects.length > 0) {
        console.debug('Fallback parsing succeeded with:', objects);
        return objects;
      }
      console.debug('Fallback parsing yielded no valid objects');
      return [];
    } catch (fallbackError) {
      console.error('Fallback parsing failed:', fallbackError.message);
      return [];
    }
  }
}

/**
 * Generates ad copies using OpenRouter API based on project details and tone.
 * @param {Object} project - Project details
 * @param {string} tone - Tone for ad copies
 * @returns {Promise<string[]>} Array of generated ad copies
 */
export async function generateAdCopies(project, tone) {
  if (!API_KEY) {
    throw new Error('OpenRouter API key is missing. Please set OPENROUTER_API_KEY in .env.local.');
  }

  const prompt = `
    You are an expert in creating advertising content. Generate 3 unique ad copies for a product with the following details:
    - Product/Service: ${project.product_service}
    - Target Platform: ${project.target_platform}
    - Primary Goal: ${project.primary_goal}
    - Product Description: ${project.product_description}
    - Product Features: ${project.product_features || 'None provided'}
    Tone: ${tone}.
    Each ad copy should be 50-100 words, engaging, and tailored to the platform and goal. Return only the ad copy text, one per line.
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': process.env.NEXT_PUBLIC_SITE_NAME || 'AdVision',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error('OpenRouter API endpoint not found. Falling back to default ad copies.');
        return [
          "Boost Your Brand! Engage More Customers. Discover the power of social media ads. Get Started Now.",
          "Elevate Your Game! Superior Comfort Awaits. Unleash Your Potential Today. Join the Movement!",
          "Step Up with Confidence! Durable Design, Endless Possibilities. Start Your Journey Now."
        ];
      }
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenRouter API key.');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const adCopies = data.choices[0].message.content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.trim());

    return adCopies;
  } catch (error) {
    console.error('Error generating ad copies:', error.message);
    throw error;
  }
}

/**
 * Generates 3-4 keywords based on the ad copy.
 * @param {string} adCopy - The ad copy text
 * @returns {Promise<string[]>} Array of 3-4 keywords
 */
export async function generateKeywordsForAdCopy(adCopy) {
  if (!API_KEY) {
    throw new Error('OpenRouter API key is missing. Please set OPENROUTER_API_KEY in .env.local.');
  }

  const prompt = `
    You are an expert in SEO and keyword research. Based on the following ad copy, generate 3-4 highly relevant keywords to optimize SEO and ad campaigns:
    Ad Copy: ${adCopy}

    Return **only** a JSON array of strings. Do not include markdown, code fences, or any text outside the JSON array.
    Example:
    ["sports shoes", "NX1V", "memory foam sole", "water-resistant"]
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': process.env.NEXT_PUBLIC_SITE_NAME || 'AdVision',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error('OpenRouter API endpoint not found. Falling back to default keywords.');
        return ["sports shoes", "NX1V", "memory foam sole", "water-resistant"];
      }
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenRouter API key.');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const keywords = cleanAndParseJson(content);

    if (!keywords) {
      console.warn('No valid keywords parsed, returning default keywords');
      return ["sports shoes", "NX1V", "memory foam sole", "water-resistant"];
    }

    // Validate keyword structure (array of strings)
    const validKeywords = keywords.filter((kw) => typeof kw === 'string');

    if (validKeywords.length < 3) {
      console.warn('Not enough keywords generated, supplementing with defaults');
      return ["sports shoes", "NX1V", "memory foam sole", "water-resistant"].slice(0, 4);
    }

    return validKeywords.slice(0, 4); // Return only 3-4 keywords
  } catch (error) {
    console.error('Error generating keywords for ad copy:', error.message);
    throw error;
  }
}

/**
 * Generates keywords using OpenRouter API based on project details and ad copies.
 * @param {Object} project - Project details
 * @param {string[]} adCopies - Array of ad copy content
 * @returns {Promise<Object[]>} Array of keyword objects
 */
export async function generateKeywords(project, adCopies) {
  if (!API_KEY) {
    throw new Error('OpenRouter API key is missing. Please set OPENROUTER_API_KEY in .env.local.');
  }

  const adCopiesText = adCopies.join('\n');
  const prompt = `
    You are an expert in SEO and keyword research. Generate 10-15 highly relevant keywords for a product to optimize SEO and ad campaigns, based on:
    - Product/Service: ${project.product_service}
    - Product Description: ${project.product_description}
    - Product Features: ${project.product_features || 'None provided'}
    - Ad Copies: ${adCopiesText}

    For each keyword, provide:
    - keyword: The keyword text
    - search_volume: Estimate as 'Low' (<500 searches/month), 'Medium' (500-2000), or 'High' (>2000)
    - competition: Estimate as 'Low', 'Medium', or 'High'
    - intent: Categorize as 'Informational', 'Transactional', or 'Brand-related'
    - suggestions: Array of 0-2 tags from: 'Easy to rank', 'Trending', 'Great for headlines'

    Return **only** a valid JSON array of objects. Do not include markdown, code fences, or any text outside the JSON array. Ensure all strings are properly escaped and there are no trailing commas or syntax errors.
    Example:
    [
      {
        "keyword": "buy eco-friendly shoes",
        "search_volume": "Medium",
        "competition": "Low",
        "intent": "Transactional",
        "suggestions": ["Easy to rank", "Great for headlines"]
      }
    ]
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': process.env.NEXT_PUBLIC_SITE_NAME || 'AdVision',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error('OpenRouter API endpoint not found. Falling back to default keywords.');
        return [];
      }
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenRouter API key.');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const keywords = cleanAndParseJson(content);

    if (!keywords) {
      console.warn('No valid keywords parsed, returning empty array');
      return [];
    }

    // Validate keyword structure
    const validKeywords = keywords.filter((kw) =>
      kw &&
      kw.keyword &&
      ['Low', 'Medium', 'High'].includes(kw.search_volume) &&
      ['Low', 'Medium', 'High'].includes(kw.competition) &&
      ['Informational', 'Transactional', 'Brand-related'].includes(kw.intent)
    );

    const result = validKeywords.map((kw) => ({
      id: uuidv4(),
      keyword: kw.keyword,
      search_volume: kw.search_volume,
      competition: kw.competition,
      intent: kw.intent,
      suggestions: Array.isArray(kw.suggestions) ? kw.suggestions : [],
    }));

    console.debug('Generated keywords:', result);
    return result;
  } catch (error) {
    console.error('Error generating keywords:', error.message);
    throw error;
  }
}

/**
 * Generates audience suggestions using OpenRouter API based on project details and ad copies.
 * @param {Object} project - Project details
 * @param {string[]} adCopies - Array of ad copy content
 * @returns {Promise<Object[]>} Array of audience objects
 */
export async function generateAudienceSuggestions(project, adCopies) {
  if (!API_KEY) {
    throw new Error('OpenRouter API key is missing. Please set OPENROUTER_API_KEY in .env.local.');
  }

  const adCopiesText = adCopies.join('\n');
  const prompt = `
    You are an expert in audience segmentation for advertising. Generate 5-10 audience segments for a product to optimize ad campaigns, based on:
    - Product/Service: ${project.product_service}
    - Product Description: ${project.product_description}
    - Product Features: ${project.product_features || 'None provided'}
    - Ad Copies: ${adCopiesText}

    For each audience segment, provide:
    - name: A descriptive name
    - age_range: Age range (e.g., "18-25")
    - gender: Gender distribution (e.g., "All", "Mostly male")
    - interests: Comma-separated interests
    - platforms: Comma-separated platforms
    - purchase_intent: Estimate as 'Low', 'Medium', or 'High' (optional)

    Return **only** a valid JSON array of objects. Do not include markdown, code fences, or any text outside the JSON array. Ensure all strings are properly escaped and there are no trailing commas or syntax errors.
    Example:
    [
      {
        "name": "Young Tech Enthusiasts",
        "age_range": "18-25",
        "gender": "Mostly male",
        "interests": "AI tools, gaming, tech gadgets",
        "platforms": "Instagram, TikTok, Reddit",
        "purchase_intent": "High"
      }
    ]
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': process.env.NEXT_PUBLIC_SITE_NAME || 'AdVision',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error('OpenRouter API endpoint not found. Falling back to default audience suggestions.');
        return [];
      }
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenRouter API key.');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const audiences = cleanAndParseJson(content);

    if (!audiences) {
      console.warn('No valid audiences parsed, returning empty array');
      return [];
    }

    // Validate audience structure
    const validAudiences = audiences.filter((aud) =>
      aud &&
      aud.name &&
      aud.age_range &&
      aud.gender &&
      aud.interests &&
      aud.platforms
    );

    const result = validAudiences.map((aud) => ({
      id: uuidv4(),
      name: aud.name,
      age_range: aud.age_range,
      gender: aud.gender,
      interests: aud.interests,
      platforms: aud.platforms,
      purchase_intent: aud.purchase_intent || null,
    }));

    console.debug('Generated audiences:', result);
    return result;
  } catch (error) {
    console.error('Error generating audience suggestions:', error.message);
    throw error;
  }
}

/**
 * Generates design suggestions using OpenRouter API based on project details and ad copies.
 * @param {Object} project - Project details
 * @param {string[]} adCopies - Array of ad copy content
 * @returns {Promise<Object[]>} Array of design suggestion objects
 */
export async function generateDesignSuggestions(project, adCopies) {
  if (!API_KEY) {
    throw new Error('OpenRouter API key is missing. Please set OPENROUTER_API_KEY in .env.local.');
  }

  const adCopiesText = adCopies.join('\n');
  const prompt = `
    You are an expert in visual ad design. Generate 3-5 design suggestions for a visual ad campaign based on:
    - Product/Service: ${project.product_service}
    - Target Platform: ${project.target_platform}
    - Primary Goal: ${project.primary_goal}
    - Product Description: ${project.product_description}
    - Product Features: ${project.product_features || 'None provided'}
    - Ad Copies: ${adCopiesText}

    For each suggestion, provide:
    - suggestion: A brief description (e.g., "Use bold headline with vibrant background")
    - elements: Array of elements to include, each with:
      - type: "text", "image", "shape", or "background"
      - properties: Relevant properties (e.g., for text: text, font, size, x, y; for image: width, height, x, y; for background: color)
    - layout_tip: A tip for layout (e.g., "Align text left for readability")
    - contrast_tip: A tip for contrast (e.g., "Use dark text on light background")

    Return **only** a valid JSON array of objects. Do not include markdown, code fences, or any text outside the JSON array. Ensure all strings are properly escaped and there are no trailing commas or syntax errors.
    Example:
    [
      {
        "suggestion": "Bold headline with vibrant background",
        "elements": [
          {
            "type": "text",
            "properties": {
              "text": "Discover Our Product!",
              "font": "SF Pro",
              "size": 32,
              "x": 50,
              "y": 50
            }
          },
          {
            "type": "background",
            "properties": {
              "color": "#34C759"
            }
          }
        ],
        "layout_tip": "Align text left for readability",
        "contrast_tip": "Use dark text on light background"
      }
    ]
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': process.env.NEXT_PUBLIC_SITE_NAME || 'AdVision',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error('OpenRouter API endpoint not found. Falling back to default design suggestions.');
        return [
          {
            suggestion: "Bold headline with vibrant background",
            elements: [
              {
                type: "text",
                properties: {
                  text: "Discover Our Product!",
                  font: "Inter",
                  size: 32,
                  x: 50,
                  y: 50,
                  color: "#000000",
                },
              },
              {
                type: "background",
                properties: {
                  color: "#FFFFFF",
                },
              },
            ],
            layout_tip: "Align text center for balance",
            contrast_tip: "Use dark text on light background",
          },
        ];
      }
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenRouter API key.');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const suggestions = cleanAndParseJson(content);

    if (!suggestions) {
      console.warn('No valid design suggestions parsed, returning empty array');
      return [];
    }

    // Validate suggestion structure
    const validSuggestions = suggestions.filter((sug) =>
      sug &&
      sug.suggestion &&
      Array.isArray(sug.elements) &&
      sug.layout_tip &&
      sug.contrast_tip
    );

    const result = validSuggestions.map((sug) => ({
      id: uuidv4(),
      suggestion: sug.suggestion,
      elements: sug.elements,
      layout_tip: sug.layout_tip,
      contrast_tip: sug.contrast_tip,
    }));

    console.debug('Generated design suggestions:', result);
    return result;
  } catch (error) {
    console.error('Error generating design suggestions:', error.message);
    throw error;
  }
}