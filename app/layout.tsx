import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://chettiyarchekku.in";

export const viewport: Viewport = {
  themeColor: "#1C110A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Chettiyar Chekku Oil | 100% Vagai Wood Pressed Marachekku Oils (மரச்செக்கு எண்ணெய்)",
    template: "%s | Chettiyar Chekku Oil",
  },
  description:
    "Authentic Vanniya Chettiyar heritage cold-pressed oils crushed at 14 RPM in aged Vagai wood with palm jaggery (Karupatti). Shop 100% pure Marachekku Nallenai, Groundnut Oil, Pollachi Coconut Oil & Deepam Oil. Free delivery across Tamil Nadu.",
  keywords: [
    "Chettiyar Chekku Oil",
    "Marachekku oil online",
    "Vagai wood pressed oil",
    "Karupatti Nallenai",
    "மரச்செக்கு நல்லெண்ணெய்",
    "மரச்செக்கு கடலை எண்ணெய்",
    "மரச்செக்கு தேங்காய் எண்ணெய்",
    "Cold pressed sesame oil Tamil Nadu",
    "Villupuram gingelly oil",
    "Tiruvannamalai groundnut oil",
    "Pollachi white copra coconut oil",
    "Pancha Deepam lamp oil",
    "Wood pressed oil Chennai",
    "Unrefined cooking oil India",
  ],
  authors: [{ name: "Chettiyar Chekku Oil Guild" }],
  creator: "Chettiyar Chekku Oil",
  publisher: "Chettiyar Chekku Oil",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "Chettiyar Chekku Oil",
    title:
      "Chettiyar Chekku Oil — Pressed in Aged Vagai Wood. Clarified by the Sun.",
    description:
      "Crushed at 14 RPM below 40°C with Udangudi Palm Jaggery. Zero Hexane, 48-Hr Sun Clarified Nallenai, Groundnut & Coconut Oils. Order Fresh Batch #42.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chettiyar Chekku Oil | 100% Vagai Wood Marachekku",
    description:
      "Authentic Vanniya Chettiyar cold-pressed Nallenai, Groundnut & Coconut oils crushed at 14 RPM with palm jaggery.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Food & Groceries",
};

// JSON-LD Structured Data for Google Product Rich Snippets & Local D2C Brand
const jsonLdSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OnlineStore",
      "@id": `${SITE_URL}/#organization`,
      name: "Chettiyar Chekku Oil",
      alternateName: "செட்டியார் மரச்செக்கு எண்ணெய்",
      url: SITE_URL,
      description:
        "Traditional Vanniya Chettiyar 14 RPM Vagai wood cold-pressed (Marachekku) cooking and sacred oils.",
      telephone: "+91-98400-42042",
      priceRange: "₹180 - ₹2190",
      address: {
        "@type": "PostalAddress",
        streetAddress: "No. 42, Big Bazaar Street, Heritage Sekku Courtyard",
        addressLocality: "Villupuram & Chennai",
        addressRegion: "TN",
        postalCode: "605602",
        addressCountry: "IN",
      },
      sameAs: ["https://wa.me/919840042042"],
    },
    {
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "Product",
            name: "Karupatti Marachekku Nallenai (Gingelly / Sesame Oil)",
            description:
              "14 RPM Vagai wood cold-pressed Villupuram black sesame oil bound with unrefined Udangudi palm jaggery.",
            brand: { "@type": "Brand", name: "Chettiyar Chekku Oil" },
            sku: "CCO-NL-42",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "INR",
              lowPrice: "240",
              highPrice: "2190",
              offerCount: "3",
              availability: "https://schema.org/InStock",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "342",
            },
          },
        },
        {
          "@type": "ListItem",
          position: 2,
          item: {
            "@type": "Product",
            name: "Vagai Wood Groundnut Oil (Kadalai Ennai)",
            description:
              "First-press Tiruvannamalai rain-fed groundnut oil extracted below 40°C in a wooden Marachekku.",
            brand: { "@type": "Brand", name: "Chettiyar Chekku Oil" },
            sku: "CCO-KD-42",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "INR",
              lowPrice: "190",
              highPrice: "1720",
              offerCount: "3",
              availability: "https://schema.org/InStock",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "289",
            },
          },
        },
        {
          "@type": "ListItem",
          position: 3,
          item: {
            "@type": "Product",
            name: "Sulphur-Free White Copra Coconut Oil (Thengai Ennai)",
            description:
              "Terracotta courtyard sun-dried Pollachi white copra coconut oil with zero sulphur fumigation.",
            brand: { "@type": "Brand", name: "Chettiyar Chekku Oil" },
            sku: "CCO-TH-42",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "INR",
              lowPrice: "220",
              highPrice: "1990",
              offerCount: "3",
              availability: "https://schema.org/InStock",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              reviewCount: "215",
            },
          },
        },
        {
          "@type": "ListItem",
          position: 4,
          item: {
            "@type": "Product",
            name: "Traditional Iluppai & Pancha Deepam Lamp Oil",
            description:
              "Sacred 5-oil Shastra ratio of Mahua (Iluppai), Castor, Neem, Coconut & Sesame for soot-free temple & home lamps.",
            brand: { "@type": "Brand", name: "Chettiyar Chekku Oil" },
            sku: "CCO-DP-42",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "INR",
              lowPrice: "180",
              highPrice: "1600",
              offerCount: "3",
              availability: "https://schema.org/InStock",
            },
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
      <body className="antialiased bg-[#FAF6F0] text-[#2A1810]">
        {children}
      </body>
    </html>
  );
}