import Location from '../models/Location.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCNfLqE611DdYlQ_FePbBmjU22G72QS-JA';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Comprehensive destination database with timings and details
const DESTINATION_DATABASE = {
  auroville: {
    name: 'Auroville',
    places: [
      {
        name: 'Matrimandir',
        timing: '9:00 AM – 5:00 PM',
        duration: '1-2 hours',
        highlight: 'Peaceful meditation dome with golden exterior',
        bestTime: 'morning'
      },
      {
        name: 'Auroville Visitor\'s Centre',
        timing: '10:00 AM – 6:00 PM',
        duration: '45 mins',
        highlight: 'Learn about the township\'s philosophy and vision',
        bestTime: 'morning'
      },
      {
        name: 'Solar Kitchen',
        timing: '12:30 PM – 3:00 PM',
        duration: '1 hour',
        highlight: 'Community lunch powered by solar energy',
        bestTime: 'afternoon'
      },
      {
        name: 'Savitri Bhavan',
        timing: '2:00 PM – 5:00 PM',
        duration: '1 hour',
        highlight: 'Cultural exhibits and art on spirituality',
        bestTime: 'afternoon'
      },
      {
        name: 'Auroville Beach',
        timing: 'Open all day',
        duration: '1-2 hours',
        highlight: 'Serene beach perfect for sunset walks',
        bestTime: 'evening'
      }
    ],
    distance: '~12 km from Pondicherry',
    cost: '₹150–₹200 by scooter',
    travelTime: '20-25 mins'
  },
  whitetown: {
    name: 'White Town',
    places: [
      {
        name: 'Café des Arts',
        timing: '8:00 AM – 10:00 PM',
        duration: '1 hour',
        highlight: 'Iconic French café with vintage charm',
        bestTime: 'morning'
      },
      {
        name: 'Notre Dame des Anges Church',
        timing: '9:00 AM – 6:00 PM',
        duration: '30 mins',
        highlight: 'Beautiful pastel-colored church near the sea',
        bestTime: 'morning'
      },
      {
        name: 'Rock Beach (Promenade)',
        timing: 'Open all day',
        duration: '1-2 hours',
        highlight: 'Iconic seaside promenade perfect for walks',
        bestTime: 'evening'
      },
      {
        name: 'Pondicherry Museum',
        timing: '10:00 AM – 5:00 PM (Closed Monday)',
        duration: '1 hour',
        highlight: 'Colonial artifacts and ancient sculptures',
        bestTime: 'afternoon'
      },
      {
        name: 'Le Café',
        timing: 'Open 24/7',
        duration: '1 hour',
        highlight: 'Coffee by the seaside with great ambiance',
        bestTime: 'evening'
      }
    ],
    distance: 'Within Pondicherry',
    cost: '₹50–₹100',
    travelTime: '10-15 mins between spots'
  },
  serenitybeach: {
    name: 'Serenity Beach',
    places: [
      {
        name: 'Serenity Beach',
        timing: 'Open all day',
        duration: '2-3 hours',
        highlight: 'Popular for surfing and sunrise views',
        bestTime: 'morning'
      },
      {
        name: 'Tanto Pizzeria',
        timing: '12:00 PM – 10:00 PM',
        duration: '1 hour',
        highlight: 'Italian food with beach views',
        bestTime: 'afternoon'
      },
      {
        name: 'Surguru Beach Café',
        timing: '8:00 AM – 9:00 PM',
        duration: '45 mins',
        highlight: 'Local South Indian breakfast by the beach',
        bestTime: 'morning'
      }
    ],
    distance: '~6 km from Pondicherry',
    cost: '₹90–₹120 by scooter',
    travelTime: '15 mins'
  },
  ooty: {
    name: 'Ooty',
    places: [
      {
        name: 'Botanical Gardens',
        timing: '7:00 AM – 6:30 PM',
        duration: '1-2 hours',
        highlight: 'Lush garden with exotic plants and flowers',
        bestTime: 'morning'
      },
      {
        name: 'Ooty Lake',
        timing: '8:00 AM – 6:00 PM',
        duration: '1 hour',
        highlight: 'Boating and scenic lakeside views',
        bestTime: 'morning'
      },
      {
        name: 'Doddabetta Peak',
        timing: '7:00 AM – 6:00 PM',
        duration: '1-2 hours',
        highlight: 'Highest peak in the Nilgiris with panoramic views',
        bestTime: 'afternoon'
      },
      {
        name: 'Tea Gardens & Factory',
        timing: '9:00 AM – 5:00 PM',
        duration: '1 hour',
        highlight: 'Learn tea-making process and taste fresh tea',
        bestTime: 'afternoon'
      },
      {
        name: 'Rose Garden',
        timing: '9:00 AM – 6:00 PM',
        duration: '45 mins',
        highlight: 'Thousands of rose varieties in terraced garden',
        bestTime: 'evening'
      }
    ],
    distance: '~280 km from Madurai',
    cost: '₹1200–₹1500 by car',
    travelTime: '5-6 hours'
  },
  kodaikanal: {
    name: 'Kodaikanal',
    places: [
      {
        name: 'Kodaikanal Lake',
        timing: '7:00 AM – 6:00 PM',
        duration: '1-2 hours',
        highlight: 'Star-shaped lake perfect for boating and cycling',
        bestTime: 'morning'
      },
      {
        name: 'Coaker\'s Walk',
        timing: '6:00 AM – 7:00 PM',
        duration: '45 mins',
        highlight: 'Scenic walkway with valley views',
        bestTime: 'morning'
      },
      {
        name: 'Bryant Park',
        timing: '8:00 AM – 6:30 PM',
        duration: '1 hour',
        highlight: 'Botanical garden with colorful flowers',
        bestTime: 'afternoon'
      },
      {
        name: 'Pillar Rocks',
        timing: '8:00 AM – 5:00 PM',
        duration: '1 hour',
        highlight: 'Three giant rock pillars standing 400 feet high',
        bestTime: 'afternoon'
      },
      {
        name: 'Silver Cascade Falls',
        timing: 'Open all day',
        duration: '30 mins',
        highlight: 'Beautiful waterfall on the way to Kodai',
        bestTime: 'any'
      }
    ],
    distance: '~120 km from Madurai',
    cost: '₹800–₹1000 by car',
    travelTime: '3 hours'
  }
};

const SYSTEM_PROMPT = `
You are RideGo Assistant, a friendly and knowledgeable travel planner integrated inside the RideGo vehicle rental platform. Your job is to help users plan short itineraries, discover places near their destinations, and provide practical travel information.

🎯 Core Responsibilities:

1. **Destination Itinerary Planning:**
   - When users mention a place, provide a structured day itinerary with 3–5 spots
   - Include: opening/closing times, duration, and one-line highlights
   - Arrange logically: morning → noon → evening flow
   - Always format with numbered emojis (1️⃣, 2️⃣, etc.) for clarity

2. **Ride & Route Integration:**
   - Include distance from pickup location
   - Provide travel time estimates
   - Suggest vehicle type (scooter for short trips, car for long distances)
   - Give approximate ride costs

3. **Travel Guidance:**
   - Best visiting hours for each location
   - Local food recommendations when relevant
   - Practical tips (parking, entry fees, best times)
   - Weather considerations for hill stations

4. **Tone & Style:**
   - Warm, conversational, and helpful
   - Use emojis naturally (🌿 🌊 ☕ 🎨 etc.)
   - Keep responses concise but informative
   - Be honest if you don't have specific information

5. **Payment & Support:**
   - For penalty/payment queries: "You can pay your penalty in MyBookings → Pay Penalty"
   - Guide users to support@ridego.com for complex issues
   - Explain booking, cancellation, and refund policies clearly

6. **Format Guidelines:**
   - Use bullet points with emojis for lists
   - Bold key information (**place names**, **timings**)
   - Keep paragraphs short and scannable
   - End with helpful follow-up suggestions

Example Response Structure:
"Great choice! 🌿 [Destination] is [brief description].

Here's your one-day itinerary:

1️⃣ **[Place Name]** — [Timing] — [Duration]
[One-line highlight]

2️⃣ **[Place Name]** — [Timing] — [Duration]
[One-line highlight]

**Travel Info:**
📍 Distance: [X km from location]
🚗 Ride cost: [₹X–₹Y by vehicle]
⏱️ Travel time: [X mins/hours]

**Pro Tips:**
• [Helpful tip 1]
• [Helpful tip 2]

Need vehicle recommendations or want to book a ride?"

Always stay helpful, accurate, and travel-focused. If unsure about timings or details, say so naturally rather than guessing.
`;

export const chatController = async (req, res) => {
  console.log('📨 Chatbot request received:', {
    message: req.body.message?.substring(0, 50) + '...',
    hasHistory: req.body.conversationHistory?.length > 0
  });

  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      console.error('❌ No message provided');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Detect query types
    const isLocationQuery = detectLocationQuery(message);
    const isAdventureQuery = message.toLowerCase().includes('adventure');
    const isItineraryQuery = detectItineraryQuery(message);
    
    console.log('🔍 Detected query type:', { isLocationQuery, isAdventureQuery, isItineraryQuery });

    let contextData = '';

    // Check for pre-defined itineraries
    if (isItineraryQuery) {
      const itinerary = findMatchingItinerary(message);
      if (itinerary) {
        contextData += '\n\n📍 Pre-loaded Itinerary Data:\n';
        contextData += formatItineraryContext(itinerary);
        contextData += '\n\nUse this exact information to create a beautiful, formatted response.';
      }
    }

    // Location database search
    if (isLocationQuery && !contextData) {
      const locationInfo = await searchLocations(message);
      if (locationInfo.length > 0) {
        contextData = '\n\n📍 RideGo Location Data:\n';
        locationInfo.forEach((loc, index) => {
          contextData += `${index + 1}. ${loc.name} in ${loc.city}${loc.state ? ', ' + loc.state : ''}`;
          if (loc.subCities && loc.subCities.length > 0) {
            contextData += ` - Areas: ${loc.subCities.join(', ')}`;
          }
          contextData += '\n';
        });
        contextData += '\nSuggest best vehicles and travel ideas for these areas.';
      }
    }

    // Adventure context
    if (isAdventureQuery) {
      contextData += `
      ⚡ Adventure Mode Context:
      - Suggest vehicles like Royal Enfield Himalayan, Mahindra Thar, or Jeep Compass
      - Mention short-term adventure rental options and approximate budgets
      - Focus on off-road, mountain, or scenic route experiences
      - Include insurance and flexible pickup/drop information
      `;
    }

    // Build conversation history
    const conversationContents = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // API request to Gemini
    const requestBody = {
      contents: [
        ...conversationContents,
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT + contextData + '\n\nUser: ' + message }]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 800,
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API Error:', errorData);
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply) {
      res.json({
        reply,
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new Error('Invalid Gemini response format');
    }

  } catch (error) {
    console.error('❌ Chatbot error:', error.message);
    const fallbackReply = getFallbackResponse(req.body.message);
    res.json({
      reply: fallbackReply,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
};

function detectLocationQuery(message) {
  const locationKeywords = [
    'visit', 'travel', 'trip', 'itinerary', 'tour', 'place', 'city', 'destination',
    'explore', 'plan', 'day', 'weekend'
  ];
  const lower = message.toLowerCase();
  return locationKeywords.some(k => lower.includes(k));
}

function detectItineraryQuery(message) {
  const itineraryKeywords = ['itinerary', 'plan', 'explore', 'visit', 'trip', 'day'];
  const lower = message.toLowerCase();
  return itineraryKeywords.some(k => lower.includes(k));
}

function findMatchingItinerary(message) {
  const lower = message.toLowerCase();
  
  if (lower.includes('auroville')) return DESTINATION_DATABASE.auroville;
  if (lower.includes('white town') || lower.includes('whitetown')) return DESTINATION_DATABASE.whitetown;
  if (lower.includes('serenity beach') || lower.includes('serenity')) return DESTINATION_DATABASE.serenitybeach;
  if (lower.includes('ooty')) return DESTINATION_DATABASE.ooty;
  if (lower.includes('kodaikanal') || lower.includes('kodai')) return DESTINATION_DATABASE.kodaikanal;
  
  return null;
}

function formatItineraryContext(itinerary) {
  let context = `Destination: ${itinerary.name}\n`;
  context += `Distance: ${itinerary.distance}\n`;
  context += `Estimated Cost: ${itinerary.cost}\n`;
  context += `Travel Time: ${itinerary.travelTime}\n\n`;
  context += 'Places to Visit:\n';
  
  itinerary.places.forEach((place, index) => {
    context += `${index + 1}. ${place.name}\n`;
    context += `   Timing: ${place.timing}\n`;
    context += `   Duration: ${place.duration}\n`;
    context += `   Highlight: ${place.highlight}\n`;
    context += `   Best Time: ${place.bestTime}\n\n`;
  });
  
  return context;
}

async function searchLocations(message) {
  try {
    const regexPattern = message.split(/\s+/).join('|');
    return await Location.find({
      $or: [
        { name: { $regex: regexPattern, $options: 'i' } },
        { city: { $regex: regexPattern, $options: 'i' } },
        { state: { $regex: regexPattern, $options: 'i' } },
        { subCities: { $elemMatch: { $regex: regexPattern, $options: 'i' } } }
      ]
    }).limit(5);
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

function getFallbackResponse(message) {
  const lower = message.toLowerCase();
  
  // Itinerary-specific fallbacks
  if (lower.includes('auroville')) {
    return `Great choice! 🌿 Auroville is a serene township focused on peace and sustainability.

Here's your one-day itinerary:

1️⃣ **Matrimandir** — 9:00 AM to 5:00 PM — 1-2 hours
Peaceful meditation dome with golden exterior

2️⃣ **Auroville Visitor's Centre** — 10:00 AM to 6:00 PM — 45 mins
Learn about the township's philosophy and vision

3️⃣ **Solar Kitchen** — 12:30 PM to 3:00 PM — 1 hour
Community lunch powered by solar energy

4️⃣ **Savitri Bhavan** — 2:00 PM to 5:00 PM — 1 hour
Cultural exhibits and art on spirituality

5️⃣ **Auroville Beach** — Open all day — 1-2 hours
Serene beach perfect for sunset walks 🌊

**Travel Info:**
📍 Distance: ~12 km from Pondicherry
🛵 Ride cost: ₹150–₹200 by scooter
⏱️ Travel time: 20-25 mins

Need a vehicle for your trip?`;
  }
  
  if (lower.includes('white town') || lower.includes('whitetown')) {
    return `White Town is full of colonial charm! 💛

Here's your day plan:

1️⃣ **Café des Arts** — 8:00 AM to 10:00 PM
Iconic French café to start your morning ☕

2️⃣ **Notre Dame des Anges Church** — 9:00 AM to 6:00 PM
Beautiful pastel-colored church near the sea 🕍

3️⃣ **Rock Beach (Promenade)** — Open all day
Iconic seaside promenade perfect for walks 🌊

4️⃣ **Pondicherry Museum** — 10:00 AM to 5:00 PM
Colonial artifacts and ancient sculptures 🎨

5️⃣ **Le Café** — Open 24/7
Coffee by the seaside with great ambiance

**Travel Info:**
📍 Within Pondicherry
🛵 Between spots: ₹50–₹100, 10-15 mins

Want to book a scooter for your White Town tour?`;
  }
  
  if (lower.includes('serenity beach') || lower.includes('serenity')) {
    return `That's a lovely coastal stretch! 🌴

**Serenity Beach** is about 6 km north of Pondicherry — roughly a 15-minute ride (₹90–₹120).

**Plan:**
• 🌅 Early morning (6–10 AM) is best for surfing
• ☕ **Surguru Beach Café** — Local South Indian breakfast
• 🍕 **Tanto Pizzeria** — Italian lunch with beach views

The beach is open all day. Perfect for a relaxed morning!

Need a scooter to get there?`;
  }
  
  if (lower.includes('adventure')) {
    return `🔥 Adventure awaits! Try our off-road fleet:

🏍️ **Royal Enfield Himalayan** — Perfect for mountain trails
🚙 **Mahindra Thar** — Rugged 4x4 for tough terrains
🚗 **Jeep Compass** — Comfortable yet adventurous

**RideGo Adventure Perks:**
✅ Full insurance coverage
✅ Flexible pickup/drop locations
✅ 24/7 roadside assistance
✅ Weekend packages available

Where's your next adventure taking you?`;
  }
  
  if (lower.includes('book')) {
    return `To book a vehicle with RideGo:

1️⃣ Go to **Vehicles** section
2️⃣ Choose your preferred vehicle
3️⃣ Select pickup/drop dates
4️⃣ Pay securely via Razorpay

Need help finding vehicles near your location?`;
  }
  
  if (lower.includes('cancel') || lower.includes('refund')) {
    return `You can cancel your booking from **MyBookings** in your dashboard.

📋 **Cancellation Policy:**
• Before trip start: Eligible for refund
• Refund amount depends on cancellation timing
• Processed within 5-7 business days

Need help with a specific booking?`;
  }
  
  if (lower.includes('penalty') || lower.includes('fine') || lower.includes('payment')) {
    return `I understand payment concerns can be stressful. 💙

You can pay any pending penalty at:
**MyBookings → Pay Penalty**

For payment issues or disputes, contact:
📧 support@ridego.com
📞 RideGo Support Team

We're here to help!`;
  }
  
  // Default fallback
  return `👋 Hi! I'm RideGo Assistant — your travel planning companion.

I can help you with:
• 🗺️ Day itineraries for popular destinations
• 🚘 Vehicle rentals & recommendations
• 💰 Pricing, bookings & cancellations
• 🏔️ Adventure ride suggestions
• 📍 Route planning & travel tips

Where would you like to explore today?`;
}