/* ═══════════════════════════════════════════════════
   BUONO - WELCOME PAGE DATA
   Sri Lankan-specific dummy data
   Version: 1.0
   ═══════════════════════════════════════════════════ */

const WELCOME_DATA = {

  // ============ HERO SECTION ============
  hero: {
    welcomeText: "Welcome to",
    brandName: "Buono",
    tagline: "Cafe & Academy",
    subtitle: "Brewing Excellence Since 2024",
    description: "Sri Lanka's premier destination for specialty coffee and professional culinary education.",
    ctaPrimary: "Explore Menu",
    ctaSecondary: "Join Academy"
  },

  // ============ ABOUT SECTION ============
  about: {
    title: "Our Story",
    subtitle: "Crafting moments, brewing dreams",
    paragraph1: "Founded in 2024, Buono Cafe & Academy stands as Sri Lanka's most innovative culinary destination. We blend the rich tradition of Ceylon hospitality with international coffee expertise.",
    paragraph2: "From our flagship cafe in Colombo to our world-class academy, we're committed to elevating the coffee culture in Sri Lanka while nurturing the next generation of culinary professionals.",
    paragraph3: "Every cup tells a story. Every student becomes a chapter in our journey of excellence.",
    
    stats: [
      { number: 1000, suffix: "+", label: "Happy Customers", icon: "😊" },
      { number: 50, suffix: "+", label: "Coffee Varieties", icon: "☕" },
      { number: 100, suffix: "+", label: "Students Trained", icon: "🎓" },
      { number: 5, suffix: "★", label: "Star Rated", icon: "⭐" }
    ]
  },

  // ============ MENU HIGHLIGHTS ============
  menu: {
    title: "Menu Highlights",
    subtitle: "Discover our signature offerings",
    
    items: [
      {
        id: 1,
        name: "Ceylon Espresso",
        description: "Bold and rich single-origin Ceylon coffee, expertly roasted to perfection.",
        price: "LKR 450",
        category: "Coffee",
        icon: "☕",
        badge: "Bestseller",
        rating: 4.9
      },
      {
        id: 2,
        name: "Cinnamon Cappuccino",
        description: "Creamy cappuccino infused with authentic Ceylon cinnamon spice.",
        price: "LKR 550",
        category: "Coffee",
        icon: "🥤",
        badge: "Signature",
        rating: 4.8
      },
      {
        id: 3,
        name: "Buono Cold Brew",
        description: "Smooth 18-hour cold brewed coffee with a hint of caramel.",
        price: "LKR 650",
        category: "Cold Drinks",
        icon: "🧊",
        badge: "Popular",
        rating: 4.7
      },
      {
        id: 4,
        name: "Tropical Fruit Tart",
        description: "Buttery pastry topped with fresh mango, passion fruit, and pineapple.",
        price: "LKR 750",
        category: "Desserts",
        icon: "🥧",
        badge: "New",
        rating: 4.9
      },
      {
        id: 5,
        name: "Spicy Devilled Chicken",
        description: "Classic Sri Lankan devilled chicken served with butter rice.",
        price: "LKR 1,250",
        category: "Food",
        icon: "🍛",
        badge: "Chef's Pick",
        rating: 4.8
      },
      {
        id: 6,
        name: "Coconut Crunch Cake",
        description: "Moist coconut cake layered with caramelized coconut crunch.",
        price: "LKR 850",
        category: "Desserts",
        icon: "🍰",
        badge: "Trending",
        rating: 4.7
      }
    ]
  },

  // ============ ACADEMY COURSES ============
  academy: {
    title: "Academy Programs",
    subtitle: "Master the art of coffee and culinary excellence",
    
    courses: [
      {
        id: 1,
        name: "Barista Foundation",
        code: "BCA-W32",
        description: "Master the fundamentals of coffee brewing, espresso preparation, and milk steaming.",
        duration: "3 Months",
        level: "Beginner",
        fee: "LKR 65,000",
        icon: "☕",
        features: [
          "Hands-on espresso training",
          "Latte art techniques",
          "Coffee theory & origins",
          "Industry certification"
        ],
        badge: "Most Popular"
      },
      {
        id: 2,
        name: "SCA Foundation",
        code: "SCA-001",
        description: "Internationally recognized Specialty Coffee Association certification program.",
        duration: "4 Months",
        level: "Intermediate",
        fee: "LKR 95,000",
        icon: "🏆",
        features: [
          "SCA certification",
          "Cupping & sensory skills",
          "Roasting fundamentals",
          "Global recognition"
        ],
        badge: "Premium"
      },
      {
        id: 3,
        name: "Professional Bakery",
        code: "BAK-001",
        description: "Complete pastry and bakery course covering breads, cakes, and desserts.",
        duration: "6 Months",
        level: "All Levels",
        fee: "LKR 120,000",
        icon: "🥐",
        features: [
          "European pastry techniques",
          "Bread & viennoiserie",
          "Cake decoration",
          "Business essentials"
        ],
        badge: "New"
      },
      {
        id: 4,
        name: "Culinary Arts",
        code: "CUL-001",
        description: "Comprehensive culinary program covering international and local cuisines.",
        duration: "12 Months",
        level: "Advanced",
        fee: "LKR 250,000",
        icon: "👨‍🍳",
        features: [
          "International cuisines",
          "Sri Lankan specialties",
          "Kitchen management",
          "Internship included"
        ],
        badge: "Diploma"
      }
    ]
  },

  // ============ WHY CHOOSE US ============
  whyUs: {
    title: "Why Choose Buono?",
    subtitle: "Excellence in every detail",
    
    features: [
      {
        icon: "🏆",
        title: "Award-Winning Quality",
        description: "Recognized as Sri Lanka's top coffee academy with international accreditations."
      },
      {
        icon: "👨‍🏫",
        title: "Expert Instructors",
        description: "Learn from industry professionals with decades of global experience."
      },
      {
        icon: "🏢",
        title: "Modern Facilities",
        description: "State-of-the-art equipment and modern learning environment."
      },
      {
        icon: "📜",
        title: "Certified Programs",
        description: "Globally recognized certifications including SCA and international diplomas."
      }
    ]
  },

  // ============ TESTIMONIALS ============
  testimonials: {
    title: "What Our Family Says",
    subtitle: "Real stories from our customers and students",
    
    reviews: [
      {
        id: 1,
        name: "Nimal Perera",
        role: "Barista Graduate",
        avatar: "👨",
        rating: 5,
        text: "Buono Academy transformed my career! The hands-on training and expert guidance helped me secure a job at a top hotel within weeks of graduation."
      },
      {
        id: 2,
        name: "Sandya Fernando",
        role: "Regular Customer",
        avatar: "👩",
        rating: 5,
        text: "The best cafe in Colombo! Their Cinnamon Cappuccino is heavenly, and the staff always make you feel like family. Highly recommended!"
      },
      {
        id: 3,
        name: "Kasun Silva",
        role: "SCA Certified Student",
        avatar: "👨‍🎓",
        rating: 5,
        text: "The SCA Foundation course was world-class. The instructors are passionate and knowledgeable. Now I run my own specialty coffee shop!"
      },
      {
        id: 4,
        name: "Priyanka Jayasinghe",
        role: "Pastry Student",
        avatar: "👩‍🍳",
        rating: 5,
        text: "From zero baking experience to running my own bakery business in 8 months! Buono's bakery program is absolutely amazing."
      },
      {
        id: 5,
        name: "Roshan Bandara",
        role: "Coffee Enthusiast",
        avatar: "👨‍💼",
        rating: 5,
        text: "Every visit is a delightful experience. The atmosphere, the quality, the service - everything is top-notch. My favorite spot in the city!"
      }
    ]
  },

  // ============ CONTACT ============
  contact: {
    title: "Get In Touch",
    subtitle: "We'd love to hear from you",
    
    info: {
      address: "No. 42, Galle Road, Colombo 03, Sri Lanka",
      phone: "+94 11 234 5678",
      whatsapp: "+94 77 123 4567",
      email: "hello@buonosrilanka.lk",
      
      hours: [
        { day: "Monday - Friday", time: "7:00 AM - 10:00 PM" },
        { day: "Saturday", time: "8:00 AM - 11:00 PM" },
        { day: "Sunday", time: "8:00 AM - 9:00 PM" }
      ],
      
      socials: [
        { name: "Facebook", icon: "📘", url: "#" },
        { name: "Instagram", icon: "📷", url: "#" },
        { name: "WhatsApp", icon: "💬", url: "#" },
        { name: "YouTube", icon: "📺", url: "#" }
      ]
    }
  },

  // ============ FOOTER ============
  footer: {
    brand: "Buono",
    tagline: "Cafe & Academy",
    description: "Sri Lanka's premier destination for specialty coffee and culinary education.",
    
    quickLinks: [
      { name: "Home", href: "#home" },
      { name: "About", href: "#about" },
      { name: "Menu", href: "#menu" },
      { name: "Academy", href: "#academy" },
      { name: "Contact", href: "#contact" }
    ],
    
    services: [
      { name: "Cafe Services", href: "#" },
      { name: "Academy Courses", href: "#" },
      { name: "Catering", href: "#" },
      { name: "Private Events", href: "#" },
      { name: "Gift Cards", href: "#" }
    ],
    
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" }
    ],
    
    copyright: "© 2026 Buono Cafe & Academy. All rights reserved.",
    madeWith: "Made with ☕ in Sri Lanka"
  },

  // ============ NAVIGATION ============
  navigation: {
    logo: {
      icon: "☕",
      name: "Buono"
    },
    
    links: [
      { name: "Home", href: "#home" },
      { name: "About", href: "#about" },
      { name: "Menu", href: "#menu" },
      { name: "Academy", href: "#academy" },
      { name: "Contact", href: "#contact" }
    ],
    
    cta: {
      login: { text: "Login", href: "login.html" },
      signup: { text: "Sign Up", href: "signup.html" }
    }
  }

};

// Make available globally
window.WELCOME_DATA = WELCOME_DATA;

console.log('☕ [WELCOME] Data loaded:', Object.keys(WELCOME_DATA).length, 'sections');