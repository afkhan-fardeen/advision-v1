'use client';

const API_KEY = process.env.OPENROUTER_API_KEY || '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'mistralai/mistral-small-3.1-24b-instruct:free';

// Original function remains unchanged
export async function generateDesignSuggestions(userInput, platform, primaryGoal) {
  if (!API_KEY) {
    throw new Error('OpenRouter API key is missing.');
  }

  if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
    throw new Error('Invalid user input: Input must be a non-empty string.');
  }

  const platformSpecifics = {
    Instagram: {
      format: 'Square or vertical images, Stories, Reels',
      bestPractices: 'Use 5-10 targeted hashtags, engaging captions, vibrant visuals.',
      hashtags: '#OutdoorAdventures #FitnessGear #RunningShoes #ActiveLife #ExploreMore #AdventureWear #NatureReady #GearUp #HealthyLiving',
      cta: 'Shop now and power your next adventure!',
    },
    Facebook: {
      format: 'Square images, carousel ads, videos',
      bestPractices: 'Include a call-to-action, optimize for mobile, use authentic storytelling.',
      hashtags: '#FitnessJourney #ShopNow #QualityGear #DiscoverMore #ActiveLifestyle',
      cta: 'Discover your perfect fit today!',
    },
    Twitter: {
      format: 'Images, short videos, GIFs',
      bestPractices: 'Use 1-2 hashtags, keep tweets concise, engage with replies.',
      hashtags: '#RunStrong #NewGear',
      cta: 'Grab yours now!',
    },
    LinkedIn: {
      format: 'Professional images, infographics',
      bestPractices: 'Focus on professional tone, share industry insights, post in groups.',
      hashtags: '#FitnessInnovation #ProfessionalGear #HealthAndWellness',
      cta: 'Learn more about our fitness solutions!',
    },
    'Google Ads': {
      format: 'Text ads, display banners, responsive ads',
      bestPractices: 'Use strong keywords, clear CTAs, optimize for conversions.',
      hashtags: '#ShopFitness #BestDeals #RunningGear #ActiveWear #FitnessEssentials',
      cta: 'Click to gear up now!',
    },
  };

  const goalSpecifics = {
    'Brand Awareness': 'Focus on bold visuals and memorable messaging to increase visibility.',
    Conversion: 'Emphasize strong CTAs and value propositions to drive purchases.',
    'Lead Generation': 'Include forms or incentives to capture user information.',
    Engagement: 'Create interactive content to encourage likes, comments, and shares.',
  };

  const platformInfo = platformSpecifics[platform] || platformSpecifics['Google Ads'];
  const goalInfo = goalSpecifics[primaryGoal] || goalSpecifics['Brand Awareness'];

  const prompt = `
    You are a creative design assistant specializing in social media and digital ads. Based on the following details, provide a concise, actionable ad design suggestion for the specified platform, tailored to the primary goal. The suggestion must be engaging, visually appealing, and formatted in markdown with specific sections, emojis, and proper spacing as shown below.

    **Details**:
    - Platform: ${platform}
    - Primary Goal: ${primaryGoal}
    - User Input: ${userInput}

    **Platform Guidelines**:
    - Preferred Format: ${platformInfo.format}
    - Best Practices: ${platformInfo.bestPractices}
    - Hashtags: ${platformInfo.hashtags}
    - CTA: ${platformInfo.cta}

    **Goal Guidance**:
    - ${goalInfo}

    Provide the suggestion in markdown format with the following structure, ensuring double blank lines between sections for spacing:
    ### Ad Design Suggestion

    🎨 **Color Scheme**  
    - [Color Name] ([Hex Code]): [Rationale for the color choice].  
    - [Color Name] ([Hex Code]): [Rationale].  
    - [Color Name] ([Hex Code]): [Rationale].

    ✍️ **Typography**  
    - **Headline Font**: [Font Name and Weight]  
      [Explanation of why it fits].  
    - **Body Font**: [Font Name and Weight]  
      [Explanation of why it fits].

    📐 **Layout Guidelines**  
    - [Format, e.g., Square Image Format (1:1)]  
    - **Upper Half**: [Description of content, e.g., image placement].  
    - **Lower Half**:  
      - Brand logo placement: [Placement, e.g., bottom left corner].  
      - Product Name: [Product Name from userInput] in [Headline Font].  
      - **Key Features**:  
        - [Feature 1]  
        - [Feature 2]  
        - [Feature 3]  
        (in [Body Font])  
      - **Caption**: [Short description or story aligning with goal].

    📸 **Visual Direction**  
    - **[Format, e.g., Square Ad Image]**:  
      [Description of imagery, e.g., high-resolution shot].  
    - **[Optional Format, e.g., ${platform} Reel or Banner]**:  
      [Description, e.g., short video with text overlays like "[Feature]"].

    💡 **Emotional Appeal**  
    - [Primary Emotion, e.g., Excitement & Trust]:  
      [How the ad evokes this].  
    - [Secondary Emotion, e.g., Connection]:  
      [How it resonates with the audience].

    📱 **${platform} Best Practices**  
    - **Hashtags (5–10)**: [List hashtags, e.g., ${platformInfo.hashtags}].  
    - **Call-to-Action (CTA)**: “[CTA, e.g., ${platformInfo.cta}]”.

    🎨 **Generate Your Ad Image**  
    Use one of the following AI tools with this prompt to bring the design to life:

    📌 **Prompt to Use**:  
    "Create a ${platform} ad with a ${platformInfo.format.split(',')[0].toLowerCase()}, using the color scheme, typography, layout, and visuals described above. Ensure the design aligns with ${primaryGoal.toLowerCase()} and feels ${goalInfo.toLowerCase().split('.')[0]}."

    🛠️ **AI Tools to Try**:  
    - [MidJourney](https://www.midjourney.com)  
    - [DALL·E 3 (OpenAI)](https://www.openai.com/dall-e)  
    - [Stable Diffusion](https://stablediffusionweb.com)  
    - [AdVision Image Generator](/image-generator) — Use AdVision’s in-app image tool for brand-specific results

    ⚠️ **Note**  
    AI-generated images may need polishing. For professional use:  
    - Refine using [Canva](https://www.canva.com), [Adobe Photoshop](https://www.adobe.com/products/photoshop.html), or [Figma](https://www.figma.com)  
    - Add overlays, icons, or CTA buttons for extra engagement

    Keep the suggestion concise (200-300 words).
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
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      return `
### Ad Design Suggestion

🎨 **Color Scheme**  
- Bright Blue (#0096FF): Energizing and dynamic, evokes a sense of movement and athleticism.  
- White (#FFFFFF): Clean and minimalist, enhances readability and focus on the product.  
- Dark Gray (#333333): Provides contrast, ensuring text stands out and is easy to read.

✍️ **Typography**  
- **Headline Font**: Montserrat Bold  
  Clean and modern, fitting for a sports brand and easy to read.  
- **Body Font**: Roboto Regular  
  Simple and professional, ensuring key features are clearly communicated.

📐 **Layout Guidelines**  
- ${platformInfo.format.split(',')[0]}  
- **Upper Half**: High-resolution image of a fitness enthusiast wearing the product during a run or workout.  
- **Lower Half**:  
  - Brand logo placement: Bottom left corner.  
  - Product Name: [Product Name] in Montserrat Bold.  
  - **Key Features**:  
    - High Quality  
    - Durable  
    - User-Friendly  
    (in Roboto Regular)  
  - **Caption**: A short story highlighting the product’s value and appeal.

📸 **Visual Direction**  
- **${platformInfo.format.split(',')[0]}**:  
  High-resolution shot of an athlete in motion, showcasing the product in action.  
- **${platform} ${platform === 'Google Ads' ? 'Banner' : 'Reel'} (Optional)**:  
  Short, fast-paced video featuring the product in use, with text overlays like “Durable” and “High Quality”.

💡 **Emotional Appeal**  
- **Excitement & Trust**:  
  Vibrant imagery and dynamic motion evoke a sense of adventure and reliability.  
- **Connection**:  
  Resonates with fitness enthusiasts through relatable, active scenarios.

📱 **${platform} Best Practices**  
- **Hashtags (5–10)**: ${platformInfo.hashtags}  
- **Call-to-Action (CTA)**: “${platformInfo.cta}”

🎨 **Generate Your Ad Image**  
Use one of the following AI tools with this prompt to bring the design to life:

📌 **Prompt to Use**:  
"Create a ${platform} ad with a ${platformInfo.format.split(',')[0].toLowerCase()}, using bright blue (#0096FF), white (#FFFFFF), and dark gray (#333333) for an energetic, modern feel. The top half features a high-quality image of a fitness enthusiast using the product. The bottom half includes the product name in Montserrat Bold, and features like 'High Quality', 'Durable', and 'User-Friendly' in Roboto Regular. Ensure a clean design that grabs attention and aligns with ${primaryGoal.toLowerCase()}."

🛠️ **AI Tools to Try**:  
- [MidJourney](https://www.midjourney.com)  
- [DALL·E 3 (OpenAI)](https://www.openai.com/dall-e)  
- [Stable Diffusion](https://stablediffusionweb.com)  
- [AdVision Image Generator](/image-generator) — Use AdVision’s in-app image tool for brand-specific results

⚠️ **Note**  
AI-generated images may need polishing. For professional use:  
- Refine using [Canva](https://www.canva.com), [Adobe Photoshop](https://www.adobe.com/products/photoshop.html), or [Figma](https://www.figma.com)  
- Add overlays, icons, or CTA buttons for extra engagement
      `;
    }

    const data = await response.json();
    const suggestion = data.choices[0].message.content.trim();

    return `
${suggestion}

🎨 **Generate Your Ad Image**  
Use one of the following AI tools with this prompt to bring the design to life:

📌 **Prompt to Use**:  
"Create a ${platform} ad with a ${platformInfo.format.split(',')[0].toLowerCase()}, using the color scheme, typography, layout, and visuals described above. Ensure the design aligns with ${primaryGoal.toLowerCase()} and feels ${goalInfo.toLowerCase().split('.')[0]}."

🛠️ **AI Tools to Try**:  
- [MidJourney](https://www.midjourney.com)  
- [DALL·E 3 (OpenAI)](https://www.openai.com/dall-e)  
- [Stable Diffusion](https://stablediffusionweb.com)  
- [AdVision Image Generator](/image-generator) — Use AdVision’s in-app image tool for brand-specific results

⚠️ **Note**  
AI-generated images may need polishing. For professional use:  
- Refine using [Canva](https://www.canva.com), [Adobe Photoshop](https://www.adobe.com/products/photoshop.html), or [Figma](https://www.figma.com)  
- Add overlays, icons, or CTA buttons for extra engagement
    `;
  } catch (error) {
    console.error('Error generating suggestion:', error.message);
    return `
### Ad Design Suggestion

🎨 **Color Scheme**  
- Bright Blue (#0096FF): Energizing and dynamic, evokes a sense of movement and athleticism.  
- White (#FFFFFF): Clean and minimalist, enhances readability and focus on the product.  
- Dark Gray (#333333): Provides contrast, ensuring text stands out and is easy to read.

✍️ **Typography**  
- **Headline Font**: Montserrat Bold  
  Clean and modern, fitting for a sports brand and easy to read.  
- **Body Font**: Roboto Regular  
  Simple and professional, ensuring key features are clearly communicated.

📐 **Layout Guidelines**  
- ${platformInfo.format.split(',')[0]}  
- **Upper Half**: High-resolution image of a fitness enthusiast wearing the product during a run or workout.  
- **Lower Half**:  
  - Brand logo placement: Bottom left corner.  
  - Product Name: [Product Name] in Montserrat Bold.  
  - **Key Features**:  
    - High Quality  
    - Durable  
    - User-Friendly  
    (in Roboto Regular)  
  - **Caption**: A short story highlighting the product’s value and appeal.

📸 **Visual Direction**  
- **${platformInfo.format.split(',')[0]}**:  
  High-resolution shot of an athlete in motion, showcasing the product in action.  
- **${platform} ${platform === 'Google Ads' ? 'Banner' : 'Reel'} (Optional)**:  
  Short, fast-paced video featuring the product in use, with text overlays like “Durable” and “High Quality”.

💡 **Emotional Appeal**  
- **Excitement & Trust**:  
  Vibrant imagery and dynamic motion evoke a sense of adventure and reliability.  
- **Connection**:  
  Resonates with fitness enthusiasts through relatable, active scenarios.

📱 **${platform} Best Practices**  
- **Hashtags (5–10)**: ${platformInfo.hashtags}  
- **Call-to-Action (CTA)**: “${platformInfo.cta}”

🎨 **Generate Your Ad Image**  
Use one of the following AI tools with this prompt to bring the design to life:

📌 **Prompt to Use**:  
"Create a ${platform} ad with a ${platformInfo.format.split(',')[0].toLowerCase()}, using bright blue (#0096FF), white (#FFFFFF), and dark gray (#333333) for an energetic, modern feel. The top half features a high-quality image of a fitness enthusiast using the product. The bottom half includes the product name in Montserrat Bold, and features like 'High Quality', 'Durable', and 'User-Friendly' in Roboto Regular. Ensure a clean design that grabs attention and aligns with ${primaryGoal.toLowerCase()}."

🛠️ **AI Tools to Try**:  
- [MidJourney](https://www.midjourney.com)  
- [DALL·E 3 (OpenAI)](https://www.openai.com/dall-e)  
- [Stable Diffusion](https://stablediffusionweb.com)  
- [AdVision Image Generator](/image-generator) — Use AdVision’s in-app image tool for brand-specific results

⚠️ **Note**  
AI-generated images may need polishing. For professional use:  
- Refine using [Canva](https://www.canva.com), [Adobe Photoshop](https://www.adobe.com/products/photoshop.html), or [Figma](https://www.figma.com)  
- Add overlays, icons, or CTA buttons for extra engagement
    `;
  }
}

// Updated function to handle conversational chat
export async function startConversation(userMessage, conversationHistory = []) {
  if (!API_KEY) {
    throw new Error('OpenRouter API key is missing.');
  }

  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    throw new Error('Invalid user input: Input must be a non-empty string.');
  }

  // Enhanced conversational prompt to prevent ad design generation
  const conversationalPrompt = `
    You are a friendly and versatile AI assistant with expertise in social media and digital ads, but you are now in a general conversation mode. You have previously provided an ad design suggestion to the user. Your task is to respond to the user's current message in a conversational, engaging, and concise manner without generating another ad design suggestion unless explicitly requested (e.g., the user says "generate another ad" or "create a new design").

    **Instructions**:
    - Respond naturally to the user's message, whether it's related to ads, marketing, or any other topic.
    - If the user asks about ads or design (e.g., "What’s a good color for Instagram?"), provide helpful insights or suggestions without generating a full ad design template.
    - For unrelated topics (e.g., "What’s your favorite color?"), engage in a friendly, relevant conversation.
    - Use the conversation history for context, but do not repeat it unless directly relevant to the response.
    - Keep responses concise (100-150 words) and in plain text, avoiding markdown unless the user requests it.
    - Avoid any phrases or structures that could trigger ad design generation, such as "Ad Design Suggestion" or markdown headers.

    **User Message**: ${userMessage}

    **Conversation History** (for context, do not include in response):
    ${conversationHistory.map((msg, index) => `Message ${index + 1}: ${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
  `;

  try {
    // Prepare the messages array with system prompt and conversation history
    const messages = [
      { role: 'system', content: conversationalPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

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
        messages: messages,
        temperature: 0.7,
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      return 'Sorry, something went wrong. Please try again!';
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content.trim();

    return assistantResponse;
  } catch (error) {
    console.error('Error in conversation:', error.message);
    return 'Oops, an error occurred. Please try again later.';
  }
}