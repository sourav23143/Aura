import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "My Account": "My Account",
      "Organization Profile": "Organization Profile",
      "Order History": "Order History",
      "Saved Quotes": "Saved Quotes",
      "Settings": "Settings",
      "Institution Name": "Institution Name",
      "Account Type": "Account Type",
      "Primary Contact": "Primary Contact",
      "Contact Email": "Contact Email",
      "Start Shopping": "Start Shopping",
      "Account Settings": "Account Settings",
      "Security": "Security",
      "Notifications": "Notifications",
      "Language Preference": "Language Preference",
      "Save Settings": "Save Settings",
      "Sign Out": "Sign Out",
      "Search by keyword": "Search by keyword, SKU, or category...",
      "Search": "Search",
      "All Categories": "All Categories",
      "Smart Classrooms": "Smart Classrooms",
      "Robotics & STEM": "Robotics & STEM",
      "Digital Content": "Digital Content",
      "School Software": "School Software",
      "Clearance Deals": "Clearance Deals",
      "Cart": "Cart",
      "Planner": "Planner",
      "Support": "Support",
      "No past orders found": "No past orders found for this institution.",
      "No saved quotes yet": "No saved quotes yet."
    }
  },
  hi: {
    translation: {
      "My Account": "मेरा खाता",
      "Organization Profile": "संगठन प्रोफ़ाइल",
      "Order History": "आदेश इतिहास",
      "Saved Quotes": "सहेजे गए उद्धरण",
      "Settings": "सेटिंग्स",
      "Institution Name": "संस्था का नाम",
      "Account Type": "खाता प्रकार",
      "Primary Contact": "प्राथमिक संपर्क",
      "Contact Email": "संपर्क ईमेल",
      "Start Shopping": "खरीदारी शुरू करें",
      "Account Settings": "खाता सेटिंग्स",
      "Security": "सुरक्षा",
      "Notifications": "सूचनाएं",
      "Language Preference": "भाषा प्राथमिकता",
      "Save Settings": "सेटिंग्स सहेजें",
      "Sign Out": "साइन आउट",
      "Search by keyword": "कीवर्ड, SKU, या श्रेणी से खोजें...",
      "Search": "खोजें",
      "All Categories": "सभी श्रेणियां",
      "Smart Classrooms": "स्मार्ट क्लासरूम",
      "Robotics & STEM": "रोबोटिक्स और स्टेम",
      "Digital Content": "डिजिटल सामग्री",
      "School Software": "स्कूल सॉफ्टवेयर",
      "Clearance Deals": "निकासी सौदे",
      "Cart": "कार्ट",
      "Planner": "प्लानर",
      "Support": "सहायता",
      "No past orders found": "इस संस्था के लिए कोई पिछला आदेश नहीं मिला।",
      "No saved quotes yet": "अभी तक कोई सहेजा गया उद्धरण नहीं।"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
