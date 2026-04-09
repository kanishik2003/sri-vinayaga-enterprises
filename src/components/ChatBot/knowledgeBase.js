// ============================================================
//  SVGE AI Chatbot Knowledge Base & Retrieval System (RAG)
//  ✅ Edit this file to update what the AI chatbot knows.
// ============================================================

const knowledgeBase = {

  company: {
    name: "SRI VINAYAGA ENTERPRISES",
    owner: "M.Appavu",
    experience: "10+ Years",
    location: "Flat No.:2/1G, PANANGADU, REDDIYUR, SALEM- PIN Code:636004",
    certifications: ["ISO 9001:2015", "CE Certified"],
    qualityProcess: "3-Step Digital Inspection AI + Manual Expert Verification",
    contact: "+91 7530017411",
    email: "appavum73@gmail.com",
    website: "www.svge.com"
  },

  products: [
    {
      name: "Black Galaxy",
      color: "Black with Gold Flecks",
      price: "₹180/sqft",
      size: "Slabs & Tiles",
      finish: "Polished",
      availability: "In Stock"
    },
    {
      name: "Tan Brown",
      color: "Dark Brown",
      price: "₹160/sqft",
      size: "Custom Slabs",
      finish: "Leather Finish",
      availability: "Pre-order"
    },
    {
      name: "Moon White",
      color: "Greyish White",
      price: "₹140/sqft",
      size: "Standard Tiles",
      finish: "Matte",
      availability: "In Stock"
    },
    {
      name: "Absolute Black",
      color: "Solid Black",
      price: "₹210/sqft",
      size: "Gang-saw Slabs",
      finish: "High Gloss",
      availability: "In Stock"
    }
  ],

  exports: {
    countries: ["USA", "UK", "UAE", "Germany", "Australia", "Canada"],
    minOrderQty: "1 Container (Approx 400-450 sqm)",
    deliveryTime: "4-6 weeks after order confirmation",
    paymentTerms: "30% advance, 70% before shipment"
  },

  services: [
    "Custom cutting and sizing",
    "Polishing and finishing",
    "Export documentation support",
    "Sample dispatch before bulk order"
  ]

};

/**
 * 🔍 Retrieval Engine: Searches for the most relevant products based on the user query.
 * This is the core of the Retrieval-Based AI Chatbot.
 */
export const searchProducts = (queryText, allProducts) => {
  if (!queryText || !allProducts || allProducts.length === 0) return [];

  const lowerQuery = queryText.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);

  // Score each product based on keyword matches
  const scoredProducts = allProducts.map(product => {
    let score = 0;
    const name = (product.graniteName || product.name || '').toLowerCase();
    const desc = (product.description || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();
    
    // Check for exact matches in name (highest priority)
    if (name.includes(lowerQuery)) score += 10;
    
    // Check for individual word matches
    queryWords.forEach(word => {
      if (name.includes(word)) score += 5;
      if (desc.includes(word)) score += 2;
      if (cat.includes(word)) score += 3;
    });

    // Bonus for color-related keywords if they match specs or description
    const colors = ['black', 'white', 'grey', 'brown', 'red', 'green', 'blue', 'gold', 'silver'];
    colors.forEach(color => {
      if (lowerQuery.includes(color) && (desc.includes(color) || name.includes(color))) {
        score += 4;
      }
    });

    return { ...product, searchScore: score };
  });

  // Sort by score and return top relevant products
  return scoredProducts
    .filter(p => p.searchScore > 0 || scoredProducts.length < 5) // Always return something if few products
    .sort((a, b) => b.searchScore - a.searchScore)
    .slice(0, 10); // Return top 10 most relevant
};

/**
 * 🛠️ Context Builder: Converts retrieved knowledge into a system prompt.
 */
export const buildSystemPrompt = (relevantProducts) => {
  // If no specific products are passed, it should still know about the general range
  const productList = relevantProducts && relevantProducts.length > 0
    ? relevantProducts.map(p =>
      `- ${p.graniteName || p.name}: ₹${p.price || 'TBD'}/${p.priceUnit || 'sqft'}, Category: ${p.category || 'N/A'}, Stock: ${p.stockQuantity || 'Available'}. ${p.description || ''}`
    ).join('\n')
    : "We have various premium granite solutions including Black Galaxy, Tan Brown, and Moon White. Please ask for specific details!";

  const serviceList = knowledgeBase.services.map(s => `- ${s}`).join('\n');

  return `
You are the official AI Granite Expert for ${knowledgeBase.company.name}.
Your job is to provide accurate, helpful, and professional advice about our granite products.

== CORE DIRECTIVES ==
1. Use the "RELEVANT PRODUCTS" section below as your primary source of truth for product inquiries.
2. If a product isn't in the list, state that we may have it or can source it, and suggest contacting us.
3. Keep responses concise and focused on the user's question.
4. If asked about prices, provide the exact price from the list if available.
5. FORMATTING: Do NOT use markdown bolding (like **name**) or bullet points with asterisks.
6. When listing products, use a simple numbered list format: 1. Name, 2. Name, etc.
7. CRITICAL: Every item in a list MUST be on its own NEW LINE. Do NOT group them into a paragraph.

== COMPANY INFO ==
- Name: ${knowledgeBase.company.name}
- Owner: ${knowledgeBase.company.owner}
- Location: ${knowledgeBase.company.location}
- Experience: ${knowledgeBase.company.experience}
- Contact: ${knowledgeBase.company.contact} | Email: ${knowledgeBase.company.email}

== RELEVANT PRODUCTS (MOST MATCHED) ==
${productList}

== EXPORT & SERVICES ==
- Exporting to: ${knowledgeBase.exports.countries.join(', ')}
- Min Order: ${knowledgeBase.exports.minOrderQty}
- Services: ${knowledgeBase.services.join(', ')}

== TONE ==
Professional, expert yet friendly, and business-focused.
`.trim();
};

export default knowledgeBase;
