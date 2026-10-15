"use client";


import React, {
  useState,
  useMemo,
  useEffect,
  useSyncExternalStore,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Sun,
  Droplets,
  Flame,
  Award,
  Check,
  Plus,
  Minus,
  Trash2,
  X,
  ArrowRight,
  MessageCircle,
  CreditCard,
  Clock,
  Thermometer,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Package,
  FileCheck,
  ChevronRight,
  Info,
  Play,
} from "lucide-react";


// ============================================================================
// TYPES & DATA MODELS
// ============================================================================

type VolumeKey = "500ml" | "1L" | "5L";

type CategoryFilter =
  | "All Oils"
  | "Everyday Cooking"
  | "Traditional Nallenai"
  | "Cold-Pressed Coconut"
  | "Deepawali / Family 5L Combos";

interface VolumeOption {
  key: VolumeKey;
  label: string;
  packaging: string;
  price: number;
  mrp: number;
  perLiterText: string;
  badge?: string;
}

interface Product {
  id: string;
  name: string;
  tamilName: string;
  subtitle: string;
  origin: string;
  bestFor: string[];
  smokePoint: string;
  extractionTemp: string;
  batchDaysAgo: number;
  batchCode: string;
  categories: CategoryFilter[];
  tintPrimary: string;
  tintSecondary: string;
  bottleAccent: string;
  aromaProfile: string;
  volumes: Record<VolumeKey, VolumeOption>;
}

interface CartItem {
  cartItemId: string;
  product: Product;
  volume: VolumeKey;
  quantity: number;
}

interface FirestoreOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  paymentMethod: "upi" | "card" | "whatsapp";
  items: {
    productId: string;
    name: string;
    volume: VolumeKey;
    label: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
  hasFreeBrassPourer: boolean;
  status: "Batch #42 Packing" | "Dispatched from Mill";
  createdAt?: Timestamp | null;
}

const generateOrderNumber = () =>
  `CCO-${Math.floor(10000 + Math.random() * 90000)}-TN`;
const subscribeToYear = () => () => {};
const getCurrentYear = () => new Date().getFullYear();
const getServerYear = () => 2026;

// ============================================================================
// CATALOG & HERITAGE CONTENT
// ============================================================================

const PRODUCTS: Product[] = [
  {
    id: "karupatti-nallenai",
    name: "Karupatti Marachekku Nallenai (Gingelly / Sesame Oil)",
    tamilName: "மரச்செக்கு நல்லெண்ணெய்",
    subtitle: "Bound with unrefined Udangudi Palm Jaggery inside aged Vagai wood",
    origin: "Villupuram Black & Red Sesame + Palm Jaggery",
    bestFor: ["Idli Podi", "Vatha Kuzhambu", "Oil Pulling", "Abhyanga Bath"],
    smokePoint: "177°C (Medium-High)",
    extractionTemp: "36.4°C (14 RPM)",
    batchDaysAgo: 3,
    batchCode: "BATCH #42-NL",
    categories: [
      "All Oils",
      "Everyday Cooking",
      "Traditional Nallenai",
      "Deepawali / Family 5L Combos",
    ],
    tintPrimary: "#B45309",
    tintSecondary: "#F59E0B",
    bottleAccent: "#78350F",
    aromaProfile: "Roasted nutty sesame with warm caramel-jaggery undertones",
    volumes: {
      "500ml": {
        key: "500ml",
        label: "500ml Glass",
        packaging: "Amber Apothecary Glass",
        price: 240,
        mrp: 260,
        perLiterText: "₹480 / L",
      },
      "1L": {
        key: "1L",
        label: "1L Bottle",
        packaging: "Food-GradeBPA-Free / Glass Neck",
        price: 460,
        mrp: 490,
        perLiterText: "₹460 / L",
      },
      "5L": {
        key: "5L",
        label: "5L Heritage Tin",
        packaging: "Traditional Tin + Brass Pourer",
        price: 2190,
        mrp: 2380,
        perLiterText: "₹438 / L",
        badge: "Save 8%",
      },
    },
  },
  {
    id: "vagai-groundnut",
    name: "Vagai Wood Groundnut Oil (Kadalai Ennai)",
    tamilName: "மரச்செக்கு கடலை எண்ணெய்",
    subtitle: "First-press rain-fed kernels with dense natural monounsaturated fats",
    origin: "Tiruvannamalai Rain-Fed Groundnuts",
    bestFor: [
      "High-Smoke-Point Deep Frying",
      "Poori",
      "Crispy Murukku",
      "Everyday Tadka",
    ],
    smokePoint: "195°C (High Fry)",
    extractionTemp: "37.8°C (14 RPM)",
    batchDaysAgo: 3,
    batchCode: "BATCH #42-KD",
    categories: [
      "All Oils",
      "Everyday Cooking",
      "Deepawali / Family 5L Combos",
    ],
    tintPrimary: "#D97706",
    tintSecondary: "#FBBF24",
    bottleAccent: "#92400E",
    aromaProfile: "Freshly shelled sweet peanut with a clean golden finish",
    volumes: {
      "500ml": {
        key: "500ml",
        label: "500ml Glass",
        packaging: "Amber Apothecary Glass",
        price: 190,
        mrp: 210,
        perLiterText: "₹380 / L",
      },
      "1L": {
        key: "1L",
        label: "1L Bottle",
        packaging: "Easy-Grip Kitchen Bottle",
        price: 360,
        mrp: 390,
        perLiterText: "₹360 / L",
      },
      "5L": {
        key: "5L",
        label: "5L Heritage Tin",
        packaging: "Traditional Tin + Brass Pourer",
        price: 1720,
        mrp: 1870,
        perLiterText: "₹344 / L",
        badge: "Save 8%",
      },
    },
  },
  {
    id: "pollachi-coconut",
    name: "Sulphur-Free White Copra Coconut Oil (Thengai Ennai)",
    tamilName: "மரச்செக்கு தேங்காய் எண்ணெய்",
    subtitle: "Terracotta courtyard sun-dried Pollachi copra—zero sulphur fumigation",
    origin: "Pollachi Sun-Dried Copra",
    bestFor: [
      "Kerala/Chettinad Roasts",
      "Baby Massage",
      "Hair & Skin Nourishment",
    ],
    smokePoint: "175°C (Medium)",
    extractionTemp: "35.2°C (14 RPM)",
    batchDaysAgo: 3,
    batchCode: "BATCH #42-TH",
    categories: [
      "All Oils",
      "Everyday Cooking",
      "Cold-Pressed Coconut",
      "Deepawali / Family 5L Combos",
    ],
    tintPrimary: "#0F766E",
    tintSecondary: "#FDE68A",
    bottleAccent: "#1F4E3D",
    aromaProfile: "Sweet sun-warmed white coconut meat with crystal clarity",
    volumes: {
      "500ml": {
        key: "500ml",
        label: "500ml Glass",
        packaging: "Wide-Mouth Glass Bottle",
        price: 220,
        mrp: 240,
        perLiterText: "₹440 / L",
      },
      "1L": {
        key: "1L",
        label: "1L Bottle",
        packaging: "Pure Culinary Bottle",
        price: 420,
        mrp: 450,
        perLiterText: "₹420 / L",
      },
      "5L": {
        key: "5L",
        label: "5L Heritage Tin",
        packaging: "Traditional Tin + Brass Pourer",
        price: 1990,
        mrp: 2165,
        perLiterText: "₹398 / L",
        badge: "Save 8%",
      },
    },
  },
  {
    id: "iluppai-deepam",
    name: "Traditional Iluppai & Deepam Lamp Oil",
    tamilName: "பஞ்ச தீப எண்ணெய்",
    subtitle: "Sacred 5-oil Shastra ratio for a steady, soot-free golden Agni",
    origin: "Mahua (Iluppai), Castor, Neem, Coconut & Sesame Blend",
    bestFor: [
      "Sacred Temple & Home Puja Lamps",
      "Soot-free steady golden flame",
      "Karthigai Deepam",
    ],
    smokePoint: "210°C (Long Burn)",
    extractionTemp: "38.0°C (15 RPM)",
    batchDaysAgo: 3,
    batchCode: "BATCH #42-DP",
    categories: ["All Oils", "Deepawali / Family 5L Combos"],
    tintPrimary: "#9A3412",
    tintSecondary: "#F97316",
    bottleAccent: "#7C2D12",
    aromaProfile: "Earthy Mahua flower & subtle neem-sesame temple sanctum aura",
    volumes: {
      "500ml": {
        key: "500ml",
        label: "500ml Glass",
        packaging: "Puja Spout Bottle",
        price: 180,
        mrp: 195,
        perLiterText: "₹360 / L",
      },
      "1L": {
        key: "1L",
        label: "1L Bottle",
        packaging: "Sanctum Pour Bottle",
        price: 340,
        mrp: 370,
        perLiterText: "₹340 / L",
      },
      "5L": {
        key: "5L",
        label: "5L Heritage Tin",
        packaging: "5L Temple Can + Brass Pourer",
        price: 1600,
        mrp: 1740,
        perLiterText: "₹320 / L",
        badge: "Save 8%",
      },
    },
  },
];

const PROCESS_STEPS = [
  {
    stepNumber: "01",
    tamilTag: "விதைத் தேர்வு • SEED CURATION",
    title: "Native Seed Curation",
    subtitle: "Sun-drying rain-fed sesame, Tiruvannamalai groundnuts, and Pollachi copra on terracotta courtyards.",
    description:
      "We source directly from dryland farming collectives in Villupuram, Tiruvannamalai, and Pollachi. Every sack of seed is winnowed by hand and spread across breathable red-oxide terracotta courtyards for 3 days of solar curing—eliminating fungal moisture without industrial hot-air kilns.",
    metrics: [
      { label: "Seed Moisture", value: "< 6.2% Natural" },
      { label: "Sourcing", value: "Single-Origin Tamil Nadu" },
      { label: "Fumigation", value: "0% Sulphur / Phosphine" },
    ],
    highlight: "Rain-fed native heirloom varieties contain up to 34% higher sesamol and natural tocopherols than hybrid irrigated crops.",
  },
  {
    stepNumber: "02",
    tamilTag: "வாகை மரச்செக்கு • WOODEN EXTRACTION",
    title: "Vagai Wood & Karupatti Crushing",
    subtitle: "Slow 14–16 RPM extraction inside the seasoned Albizia lebbeck wooden mortar.",
    description:
      "Inside our carved Vagai wood Ural (mortar) and Ulakkai (pestle), seeds are gently bruised at 14 RPM. For our flagship Nallenai, chunks of raw Udangudi Karupatti (palm jaggery) are added mid-crush to bind residual moisture, prevent heat friction, and infuse a mellow, unmistakable aroma.",
    metrics: [
      { label: "Pestle Speed", value: "14–16 RPM Slow Rhythm" },
      { label: "Peak Oil Temp", value: "36.4°C (Cold-Pressed)" },
      { label: "Binding Agent", value: "Unrefined Palm Jaggery" },
    ],
    highlight: "Unlike steel expellers that scorch seeds at 110°C+, Vagai wood absorbs kinetic friction—keeping healthy HDL-supporting fats intact.",
  },
  {
    stepNumber: "03",
    tamilTag: "சூரியத் தெளிவு • SOLAR CLARIFICATION",
    title: "48-Hour Sunlight Sedimentation",
    subtitle: "Zero high-pressure chemical filtration; natural plant fibers settle by gravity under warm sunlight.",
    description:
      "Freshly pressed oil emerges thick and cloudy with micro-seed meal. Instead of forcing it through synthetic bleaching earth or high-pressure filter presses, we rest the oil in food-grade stainless steel & earthen vats under direct courtyard sunlight for 48 hours, allowing gravity to clarify the golden nectar.",
    metrics: [
      { label: "Settling Time", value: "48 Hours Unhurried" },
      { label: "Filtration", value: "Unbleached Kora Cotton" },
      { label: "Chemical Agents", value: "Zero Caustic Soda" },
    ],
    highlight: "Gravity sedimentation preserves suspended plant sterols and natural Vitamin E that industrial micro-filtration strips away.",
  },
  {
    stepNumber: "04",
    tamilTag: "புதிய அடைப்பு • ARTISANAL BOTTLING",
    title: "Small-Batch Tin & Glass Bottling",
    subtitle: "Packed fresh with batch-date stamping and nitrogen-free heritage sealing.",
    description:
      "Only the top 85% of settled golden oil is decanted into UV-protective amber glass bottles and lacquered food-grade 5L heritage tins. Every vessel is stamped with its exact crushing date, seed origin village, and master miller inspection seal within 72 hours of pressing.",
    metrics: [
      { label: "Current Batch", value: "Batch #42 (3 Days Old)" },
      { label: "Shelf Life", value: "9 Months Naturally" },
      { label: "Adulteration Test", value: "NABL Certified 0% Argemone" },
    ],
    highlight: "No synthetic TBHQ preservatives or anti-foaming silicones—just living oil straight from our Chekku to your kitchen.",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Extraction Temperature",
    subtitle: "Thermal impact on delicate lipid bonds",
    chettiyar: "Below 40°C (14 RPM Vagai Wood Mortar)",
    supermarket: "200°C to 240°C (High-Speed Steel Expeller & Deodorizer)",
  },
  {
    feature: "Chemical Solvents",
    subtitle: "Agents used to extract every drop of oil",
    chettiyar: "None — 100% Mechanical Wood Pressing",
    supermarket: "Petroleum Hexane, Caustic Soda & Phosphoric Acid",
  },
  {
    feature: "Clarification Method",
    subtitle: "How sediments and cloudiness are handled",
    chettiyar: "48-Hr Sunlight Gravity Settling & Unbleached Cotton",
    supermarket: "Acid Degumming & Synthetic Bleaching Earth Clay",
  },
  {
    feature: "Nutrient Retention",
    subtitle: "Bioavailable antioxidants & vitamins",
    chettiyar: "100% Natural Vitamin E, Sesamol & Phytosterols",
    supermarket: "Stripped During Refining (Synthetically Fortified Later)",
  },
  {
    feature: "Aroma & Viscosity",
    subtitle: "Sensory & culinary character in cooking",
    chettiyar: "Rich, Nutty, Dense — Requires 30% Less Oil Per Dish",
    supermarket: "Odorless, Bleached, Watery & Chemically Neutralized",
  },
];

// ============================================================================
// CUSTOM HERITAGE SVG ILLUSTRATIONS
// ============================================================================

const MarachekkuEmblemSVG: React.FC<{ className?: string }> = ({
  className = "w-10 h-10",
}) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle
      cx="32"
      cy="32"
      r="30"
      stroke="#D97706"
      strokeWidth="1.5"
      strokeDasharray="3 3"
    />
    <circle cx="32" cy="32" r="26" stroke="#D97706" strokeWidth="1" opacity="0.4" />
    {/* Traditional Ulakkai (Pestle) */}
    <path
      d="M36 10L29 31H35L42 12C42.5 10.5 41 9 39.5 9C38 9 36.5 9.5 36 10Z"
      fill="#D97706"
    />
    {/* Wooden Lever Arm */}
    <path
      d="M16 26L48 22"
      stroke="#92400E"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Ural (Wooden Mortar Base) */}
    <path
      d="M20 30H44L41 48C40.5 50.5 38.5 52 36 52H28C25.5 52 23.5 50.5 23 48L20 30Z"
      fill="#2A1810"
      stroke="#D97706"
      strokeWidth="1.8"
    />
    {/* carved rings on mortar */}
    <path d="M21.5 36H42.5" stroke="#D97706" strokeWidth="1.2" opacity="0.7" />
    <path d="M22.5 42H41.5" stroke="#D97706" strokeWidth="1.2" opacity="0.7" />
    {/* Golden Oil Drop */}
    <path
      d="M32 45C32 45 29 48.5 29 50.5C29 52.1569 30.3431 53.5 32 53.5C33.6569 53.5 35 52.1569 35 50.5C35 48.5 32 45 32 45Z"
      fill="#F59E0B"
    />
  </svg>
);

const ProductVesselSVG: React.FC<{
  product: Product;
  volume: VolumeKey;
}> = ({ product, volume }) => {
  const isTin = volume === "5L";
  const isHalfLiter = volume === "500ml";

  return (
    <svg
      viewBox="0 0 240 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-xl select-none"
    >
      <defs>
        <radialGradient id={`glow-${product.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={product.tintSecondary} stopOpacity="0.38" />
          <stop offset="100%" stopColor={product.tintPrimary} stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`liquid-${product.id}`}
          x1="60"
          y1="60"
          x2="180"
          y2="230"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={product.tintSecondary} />
          <stop offset="55%" stopColor={product.tintPrimary} />
          <stop offset="100%" stopColor={product.bottleAccent} />
        </linearGradient>
        <linearGradient id="tin-gold" x1="50" y1="50" x2="190" y2="230" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="35%" stopColor="#D97706" />
          <stop offset="75%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
      </defs>

      {/* Sunburst Halo */}
      <circle cx="120" cy="135" r="95" fill={`url(#glow-${product.id})`} />
      <circle
        cx="120"
        cy="135"
        r="78"
        stroke={product.tintPrimary}
        strokeOpacity="0.18"
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      {isTin ? (
        /* 5L HERITAGE TIN ILLUSTRATION */
        <g>
          {/* Top Handle & Brass Spout Cap */}
          <path
            d="M98 46C98 38 142 38 142 46"
            stroke="#92400E"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect x="142" y="42" width="20" height="12" rx="3" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
          {/* Tin Body */}
          <rect
            x="58"
            y="54"
            width="124"
            height="174"
            rx="10"
            fill="url(#tin-gold)"
            stroke="#78350F"
            strokeWidth="2"
          />
          {/* Embossed Tin Ribs */}
          <line x1="60" y1="74" x2="180" y2="74" stroke="#FEF3C7" strokeOpacity="0.4" strokeWidth="1.5" />
          <line x1="60" y1="206" x2="180" y2="206" stroke="#FEF3C7" strokeOpacity="0.4" strokeWidth="1.5" />
          {/* Heritage Cream Label on Tin */}
          <rect
            x="70"
            y="84"
            width="100"
            height="112"
            rx="4"
            fill="#FAF6F0"
            stroke="#D97706"
            strokeWidth="1.5"
          />
          <rect
            x="74"
            y="88"
            width="92"
            height="104"
            rx="2"
            stroke="#2A1810"
            strokeOpacity="0.2"
            strokeWidth="0.8"
          />
          <text
            x="120"
            y="106"
            textAnchor="middle"
            fill="#92400E"
            fontSize="7"
            fontWeight="bold"
            letterSpacing="1.5"
          >
            CHETTIYAR CHEKKU
          </text>
          <text
            x="120"
            y="124"
            textAnchor="middle"
            fill="#2A1810"
            fontSize="9"
            fontWeight="bold"
          >
            {product.tamilName}
          </text>
          <circle cx="120" cy="146" r="14" fill={product.tintPrimary} fillOpacity="0.15" stroke={product.tintPrimary} strokeWidth="1.2" />
          <path
            d="M120 137C120 137 114 144 114 148C114 151.3 116.7 154 120 154C123.3 154 126 151.3 126 148C126 144 120 137 120 137Z"
            fill={product.tintPrimary}
          />
          <rect x="88" y="168" width="64" height="16" rx="8" fill="#1C110A" />
          <text
            x="120"
            y="179"
            textAnchor="middle"
            fill="#FBBF24"
            fontSize="8"
            fontWeight="bold"
          >
            5 LITRE TIN
          </text>
        </g>
      ) : (
        /* ARTISANAL GLASS BOTTLE ILLUSTRATION (500ml / 1L) */
        <g transform={isHalfLiter ? "scale(0.92) translate(10, 14)" : ""}>
          {/* Cork & Wax Seal Top */}
          <rect x="105" y="26" width="30" height="14" rx="3" fill="#92400E" />
          <rect x="102" y="36" width="36" height="18" rx="3" fill="#1C110A" />
          <line x1="102" y1="45" x2="138" y2="45" stroke="#D97706" strokeWidth="1.5" />
          {/* Neck */}
          <path
            d="M104 54H136L142 82H98L104 54Z"
            fill={`url(#liquid-${product.id})`}
            stroke="#78350F"
            strokeWidth="1.5"
          />
          {/* Glass Handle Loop for Apothecary Authenticity */}
          <path
            d="M138 62C154 62 158 84 148 94"
            stroke="#D97706"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Bottle Body */}
          <path
            d="M98 82H142C160 92 168 108 168 128V212C168 222 160 230 150 230H90C80 230 72 222 72 212V128C72 108 80 92 98 82Z"
            fill={`url(#liquid-${product.id})`}
            stroke="#78350F"
            strokeWidth="2"
          />
          {/* Internal Liquid Highlight */}
          <path
            d="M82 115C82 103 88 95 96 90"
            stroke="#FEF3C7"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M80 130V205"
            stroke="#FEF3C7"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.45"
          />
          {/* Textured Deckle-Edge Heritage Label */}
          <rect
            x="80"
            y="112"
            width="80"
            height="92"
            rx="4"
            fill="#FAF6F0"
            stroke="#D97706"
            strokeWidth="1.5"
          />
          <rect
            x="84"
            y="116"
            width="72"
            height="84"
            rx="2"
            stroke="#2A1810"
            strokeOpacity="0.2"
            strokeWidth="0.8"
          />
          <text
            x="120"
            y="131"
            textAnchor="middle"
            fill="#92400E"
            fontSize="6.5"
            fontWeight="bold"
            letterSpacing="1.2"
          >
            14 RPM VAGAI WOOD
          </text>
          <text
            x="120"
            y="147"
            textAnchor="middle"
            fill="#2A1810"
            fontSize="8"
            fontWeight="bold"
          >
            {product.tamilName}
          </text>
          <line x1="96" y1="155" x2="144" y2="155" stroke="#D97706" strokeWidth="0.8" />
          <text
            x="120"
            y="167"
            textAnchor="middle"
            fill="#6E5648"
            fontSize="6.5"
            fontWeight="600"
          >
            SUN-CLARIFIED • PURE
          </text>
          <rect x="95" y="176" width="50" height="16" rx="8" fill="#1F4E3D" />
          <text
            x="120"
            y="187"
            textAnchor="middle"
            fill="#FAF6F0"
            fontSize="8"
            fontWeight="bold"
          >
            {volume === "500ml" ? "500 ML" : "1 LITRE"}
          </text>
        </g>
      )}
    </svg>
  );
};


// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ChettiyarChekkuOilStore() {
  
  // Selected category filter
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("All Oils");

  const currentYear = useSyncExternalStore(
    subscribeToYear,
    getCurrentYear,
    getServerYear
  );
  // Per-product selected volume state
  const [selectedVolumes, setSelectedVolumes] = useState<
    Record<string, VolumeKey>
  >({
    "karupatti-nallenai": "1L",
    "vagai-groundnut": "1L",
    "pollachi-coconut": "1L",
    "iluppai-deepam": "1L",
  });

  // Active Step in 4-Step Marachekku Process
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  // Hero Batch Inspector Active Hotspot
  const [activeInspectorNote, setActiveInspectorNote] = useState<number>(0);

  // Cart State (Pre-populated with 1L Karupatti Nallenai so users can test immediately)
  const [cart, setCart] = useState<CartItem[]>([
    {
      cartItemId: "karupatti-nallenai-1L",
      product: PRODUCTS[0],
      volume: "1L",
      quantity: 1,
    },
  ]);

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Instant Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] =
    useState<boolean>(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerCity, setCustomerCity] = useState<string>("Chennai, TN");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState<boolean>(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [lastOrderNumber, setLastOrderNumber] = useState<string>("");
  const [lastOrderTotal, setLastOrderTotal] = useState<number>(0);

  // Process Video / Live Telemetry Modal
  const [isProcessModalOpen, setIsProcessModalOpen] = useState<boolean>(false);

  // Real-time listener for the "orders" collection in Firestore
  useEffect(() => {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const fetched: FirestoreOrder[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<FirestoreOrder, "id">),
        }));
        setOrders(fetched);
      },
      (error) => {
        console.error("Firestore listener error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Save a new order to Firestore
  const saveOrderToFirestore = async (
    method: "upi" | "card" | "whatsapp"
  ): Promise<string | null> => {
    if (cart.length === 0) return null;
    setIsSubmittingOrder(true);

    const generatedOrderNumber = generateOrderNumber();
    const orderTotal = cartMetrics.grandTotal;

    try {
      await addDoc(collection(db, "orders"), {
        orderNumber: generatedOrderNumber,
        customerName: customerName.trim() || "WhatsApp Patron",
        customerPhone: customerPhone.trim() || "Via WhatsApp",
        customerCity: customerCity.trim() || "Tamil Nadu",
        paymentMethod: method,
        items: cart.map((item) => ({
          productId: item.product.id,
          name: item.product.name.split(" (")[0],
          volume: item.volume,
          label: item.product.volumes[item.volume].label,
          quantity: item.quantity,
          unitPrice: item.product.volumes[item.volume].price,
        })),
        subtotal: cartMetrics.subtotal,
        shippingFee: cartMetrics.shippingFee,
        grandTotal: orderTotal,
        hasFreeBrassPourer: cartMetrics.hasFiveLiterTin,
        status: "Batch #42 Packing",
        createdAt: serverTimestamp(),
      });

      setLastOrderNumber(generatedOrderNumber);
      setLastOrderTotal(orderTotal);
      return generatedOrderNumber;
    } catch (error) {
      console.error("Error saving order to Firestore:", error);
      triggerToast("Could not save order to Firestore. Check Firebase config.");
      return null;
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Toggle order dispatch status in Firestore
  const toggleOrderStatus = async (
    orderId: string,
    currentStatus: FirestoreOrder["status"]
  ) => {
    const nextStatus =
      currentStatus === "Batch #42 Packing"
        ? "Dispatched from Mill"
        : "Batch #42 Packing";
    try {
      await updateDoc(doc(db, "orders", orderId), { status: nextStatus });
      triggerToast(`Order status updated to: ${nextStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      triggerToast("Could not update the order status.");
    }
  };

  // Automatically switch product cards to 5L when "Deepawali / Family 5L Combos" tab is clicked
  const handleCategoryChange = (category: CategoryFilter) => {
    setSelectedCategory(category);
    if (category === "Deepawali / Family 5L Combos") {
      setSelectedVolumes({
        "karupatti-nallenai": "5L",
        "vagai-groundnut": "5L",
        "pollachi-coconut": "5L",
        "iluppai-deepam": "5L",
      });
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All Oils") return PRODUCTS;
    return PRODUCTS.filter((p) => p.categories.includes(selectedCategory));
  }, [selectedCategory]);

  // Cart summary calculations
  const cartMetrics = useMemo(() => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce(
      (sum, item) =>
        sum + item.product.volumes[item.volume].price * item.quantity,
      0
    );
    const mrpTotal = cart.reduce(
      (sum, item) =>
        sum + item.product.volumes[item.volume].mrp * item.quantity,
      0
    );
    const totalSavings = mrpTotal - subtotal;
    const hasFiveLiterTin = cart.some((item) => item.volume === "5L");
    const freeShippingThreshold = 999;
    const isFreeShipping = subtotal >= freeShippingThreshold || subtotal === 0;
    const shippingFee = isFreeShipping ? 0 : 60;
    const amountForFreeShipping = Math.max(
      0,
      freeShippingThreshold - subtotal
    );
    const shippingProgress = Math.min(
      100,
      Math.round((subtotal / freeShippingThreshold) * 100)
    );
    const grandTotal = subtotal + shippingFee;

    return {
      totalItems,
      subtotal,
      totalSavings,
      hasFiveLiterTin,
      isFreeShipping,
      shippingFee,
      amountForFreeShipping,
      shippingProgress,
      grandTotal,
    };
  }, [cart]);

  // Trigger temporary toast banner
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Add item to cart
  const handleAddToCart = (product: Product, volumeOverride?: VolumeKey) => {
    const chosenVolume =
      volumeOverride || selectedVolumes[product.id] || "1L";
    const cartItemId = `${product.id}-${chosenVolume}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.cartItemId === cartItemId
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      return [
        ...prev,
        {
          cartItemId,
          product,
          volume: chosenVolume,
          quantity: 1,
        },
      ];
    });

    setJustAddedKey(cartItemId);
    setTimeout(() => setJustAddedKey(null), 1300);

    const volSpec = product.volumes[chosenVolume];
    triggerToast(
      `Added ${product.name.split(" (")[0]} (${volSpec.label}) — ₹${volSpec.price.toLocaleString("en-IN")}`
    );
  };

  // Update cart item quantity
  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove item from cart
  const removeCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  // Generate pre-filled WhatsApp Order string
  const generateWhatsAppOrderLink = () => {
    const lines = [
      "🙏 *Vanakkam Chettiyar Chekku Oil!*",
      "I would like to place a fresh Marachekku order from Batch #42:",
      "",
      ...cart.map((item, idx) => {
        const v = item.product.volumes[item.volume];
        return `${idx + 1}. *${item.product.name.split(" (")[0]}* (${v.label}) × ${item.quantity} = ₹${(v.price * item.quantity).toLocaleString("en-IN")}`;
      }),
    ];

    if (cartMetrics.hasFiveLiterTin) {
      lines.push(
        "🎁 *Complimentary Gift:* 1x Handcrafted Kumbakonam Brass Oil Pourer (FREE with 5L Tin)"
      );
    }

    lines.push(
      "",
      `*Subtotal:* ₹${cartMetrics.subtotal.toLocaleString("en-IN")}`,
      `*Shipping:* ${cartMetrics.isFreeShipping ? "FREE" : `₹${cartMetrics.shippingFee}`}`,
      `*Total Payable:* ₹${cartMetrics.grandTotal.toLocaleString("en-IN")}`,
      "",
      "Please share the UPI / dispatch confirmation link."
    );

    const encoded = encodeURIComponent(lines.join("\n"));
    return `https://wa.me/918220913943?text=${encoded}`;
  };

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#2A1810] font-sans selection:bg-[#D97706]/20 selection:text-[#1C110A]">
      {/* Load Heritage Editorial Serif & Clean Sans Typography */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .font-serif-heritage {
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .font-sans-ui {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>

      {/* =====================================================================
          1. TOP ANNOUNCEMENT BAR & STICKY GLASSMORPHIC NAVBAR
         ===================================================================== */}
      <div className="bg-[#1C110A] text-[#FAF6F0] border-b border-amber-500/20 text-xs sm:text-sm py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
          <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            Freshly Crushed Batch #42 Now Shipping
          </span>
          <span className="hidden md:inline text-amber-500/40">|</span>
          <span className="text-amber-100/90 font-medium">
            Free Brass Oil Pourer on 5L Tin Orders
          </span>
          <span className="hidden md:inline text-amber-500/40">|</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-amber-300/90">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" />
            100% Vagai Wood Marachekku
          </span>
        </div>
      </div>

      {/* Sticky Glassmorphic Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF6F0]/85 backdrop-blur-md border-b border-[#2A1810]/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex min-w-0 items-center gap-2 sm:gap-3 text-left group focus:outline-none"
          >
            <div className="shrink-0 p-1 sm:p-1.5 rounded-full bg-[#F3ECE1] border border-[#D97706]/30 group-hover:border-[#D97706] transition-colors">
              <MarachekkuEmblemSVG className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="min-w-0">
              <span className="block whitespace-nowrap font-serif-heritage text-xl sm:text-3xl font-bold tracking-tight text-[#2A1810] leading-none">
                Chettiyar Chekku
              </span>
              <span className="hidden lg:block text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] text-[#6E5648] mt-1 uppercase">
                EST. TRADITION • VANNIYA CHETTIYAR HERITAGE
              </span>
              <span className="block lg:hidden text-[9px] font-semibold tracking-[0.12em] text-[#6E5648] mt-1 uppercase">
                VAGAI WOOD PRESSED
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#2A1810]/85">
            <button
              onClick={() => scrollToSection("our-story")}
              className="hover:text-[#D97706] transition-colors"
            >
              Our Story
            </button>
            <button
              onClick={() => scrollToSection("marachekku-process")}
              className="hover:text-[#D97706] transition-colors"
            >
              The Marachekku Process
            </button>
            <button
              onClick={() => scrollToSection("shop-oils")}
              className="hover:text-[#D97706] transition-colors"
            >
              Shop Oils
            </button>
            <button
              onClick={() => scrollToSection("purity-test")}
              className="hover:text-[#D97706] transition-colors"
            >
              Purity Test
            </button>
            <button
              onClick={() => {
                handleCategoryChange("Deepawali / Family 5L Combos");
                scrollToSection("shop-oils");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3ECE1] text-[#2A1810] hover:bg-[#D97706]/15 hover:text-[#D97706] border border-[#D97706]/30 transition-all text-xs font-semibold"
            >
              <Package className="w-3.5 h-3.5 text-[#D97706]" />
              Bulk/Family Tins
            </button>
          </nav>

          {/* Interactive Cart Button */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <button
              onClick={() => setIsOrdersModalOpen(true)}
              aria-label={`View orders (${orders.length})`}
              className="inline-flex items-center gap-2 px-2 sm:px-3.5 py-2.5 rounded-full bg-[#F3ECE1] hover:bg-[#D97706]/15 text-[#2A1810] border border-[#D97706]/30 text-xs font-bold transition-all"
            >
              <Package className="w-4 h-4 text-[#D97706]" />
              <span className="hidden lg:inline">Orders ({orders.length})</span>
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 sm:gap-3 bg-[#1C110A] hover:bg-[#2A1810] text-[#FAF6F0] px-3 sm:px-4 py-2.5 rounded-full shadow-md hover:shadow-lg border border-amber-500/30 transition-all group"
              aria-label="Open shopping cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-[#D97706] group-hover:scale-110 transition-transform" />
                {cartMetrics.totalItems > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-[#D97706] text-[#1C110A] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartMetrics.totalItems}
                  </span>
                )}
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <span className="block text-[10px] uppercase tracking-wider text-amber-200/70">
                  {cartMetrics.totalItems}{" "}
                  {cartMetrics.totalItems === 1 ? "Vessel" : "Vessels"}
                </span>
                <span className="block text-xs sm:text-sm font-bold text-[#FAF6F0]">
                  ₹{cartMetrics.subtotal.toLocaleString("en-IN")}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-4 right-4 sm:left-auto z-50 bg-[#1F4E3D] text-[#FAF6F0] px-4 py-3 rounded-xl shadow-2xl border border-emerald-400/30 flex items-center gap-3 sm:max-w-sm"
          >
            <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-xs sm:text-sm font-medium flex-1">
              {toastMessage}
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="text-xs font-bold underline text-amber-300 hover:text-white shrink-0"
            >
              View Cart
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          2. HERO SECTION (SPLIT EDITORIAL LAYOUT)
         ===================================================================== */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:py-20 border-b border-[#2A1810]/10">
        {/* Subtle Decorative Radial Background */}
        <div
          className="pointer-events-none absolute -top-40 right-0 w-[550px] h-[550px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #D97706 0%, rgba(250,246,240,0) 70%)",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* LEFT COLUMN: Editorial Copy & Trust Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6"
            >
              {/* Cultural Pill Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#F3ECE1] border border-[#D97706]/35 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#2A1810]">
                  மரச்செக்கு பாரம்பரியம் • 100% VAGAI WOOD PRESSED
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-serif-heritage text-4xl sm:text-6xl lg:text-[64px] font-bold text-[#2A1810] leading-[1.06] tracking-tight">
                Pressed in Aged Vagai Wood.{" "}
                <span className="italic font-normal text-[#D97706]">
                  Clarified by the Sun.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-[#6E5648] leading-relaxed max-w-2xl">
                For generations, the Vanniya Chettiyar community guarded the
                sacred rhythm of the Marachekku. We crush native sun-dried seeds
                at 14 RPM with palm jaggery—never exceeding 40°C—so every drop
                retains its living aroma and heart-healthy antioxidants.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => scrollToSection("shop-oils")}
                  className="inline-flex items-center gap-3 px-7 py-4 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-sm sm:text-base shadow-lg shadow-[#D97706]/25 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Shop Fresh Batch</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsProcessModalOpen(true)}
                  className="inline-flex items-center gap-3 px-6 py-4 rounded-full bg-[#F3ECE1] hover:bg-[#2A1810] text-[#2A1810] hover:text-[#FAF6F0] font-semibold text-sm sm:text-base border border-[#2A1810]/15 transition-all group"
                >
                  <span className="w-7 h-7 rounded-full bg-[#D97706]/20 group-hover:bg-[#D97706] flex items-center justify-center transition-colors">
                    <Play className="w-3.5 h-3.5 text-[#D97706] group-hover:text-[#1C110A] fill-current ml-0.5" />
                  </span>
                  <span>Watch the 14 RPM Process</span>
                </button>
              </div>

              {/* Trust Metrics Row */}
              <div className="pt-6 border-t border-[#2A1810]/10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    {
                      icon: Gauge,
                      title: "14 RPM Slow Crush",
                      sub: "Traditional wooden mortar",
                    },
                    {
                      icon: Thermometer,
                      title: "< 40°C Ambient Temp",
                      sub: "Zero thermal oxidation",
                    },
                    {
                      icon: Sun,
                      title: "48-Hr Sun Settled",
                      sub: "Natural gravity clarity",
                    },
                    {
                      icon: ShieldCheck,
                      title: "0% Hexane or Argemone",
                      sub: "NABL lab verified",
                    },
                  ].map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#F3ECE1]/80 border border-[#2A1810]/8 flex flex-col gap-1"
                      >
                        <div className="flex items-center gap-1.5 text-[#D97706]">
                          <IconComponent className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-bold text-[#2A1810]">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#6E5648]">
                          {item.sub}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: Interactive "Live Batch Inspector" Visual Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-3xl bg-gradient-to-b from-[#F3ECE1] via-[#FAF6F0] to-[#F3ECE1] p-4 sm:p-7 border border-[#D97706]/30 shadow-2xl">
                {/* Inspector Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4 border-b border-[#2A1810]/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1F4E3D] animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F4E3D]">
                      Live Batch Inspector • #42-NL
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#1F4E3D] text-[#FAF6F0]">
                    100% Pure • Lab Tested
                  </span>
                </div>

                {/* Central Visual Showcase with Floating Glassmorphic Badges */}
                <div className="relative flex flex-col items-stretch gap-3 sm:h-88 sm:flex-row sm:items-center sm:justify-center sm:gap-0">
                  {/* Main Bottle/Tin SVG */}
                  <div className="w-52 h-56 sm:w-64 sm:h-72 shrink-0 self-center">
                    <ProductVesselSVG
                      product={PRODUCTS[0]}
                      volume={
                        activeInspectorNote === 2 ? "5L" : "1L"
                      }
                    />
                  </div>

                  {/* Floating Badge 1: Karupatti */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setActiveInspectorNote(0)}
                    className={`relative w-full sm:absolute sm:top-2 sm:-left-3 sm:max-w-[215px] text-left p-3 rounded-2xl backdrop-blur-md border transition-all shadow-lg ${
                      activeInspectorNote === 0
                        ? "bg-[#1C110A]/90 text-[#FAF6F0] border-[#D97706]"
                        : "bg-[#FAF6F0]/85 text-[#2A1810] border-[#2A1810]/15"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D97706]">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Sweetener & Binder</span>
                    </div>
                    <p className="text-xs font-semibold mt-0.5 leading-snug">
                      Bound with Pure Karupatti (Palm Jaggery)
                    </p>
                  </motion.button>

                  {/* Floating Badge 2: Harvest Origin */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setActiveInspectorNote(1)}
                    className={`relative w-full sm:absolute sm:top-1/2 sm:-translate-y-1/2 sm:-right-3 sm:max-w-[210px] text-left p-3 rounded-2xl backdrop-blur-md border transition-all shadow-lg ${
                      activeInspectorNote === 1
                        ? "bg-[#1C110A]/90 text-[#FAF6F0] border-[#D97706]"
                        : "bg-[#FAF6F0]/85 text-[#2A1810] border-[#2A1810]/15"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D97706]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>Single-Origin Seed</span>
                    </div>
                    <p className="text-xs font-semibold mt-0.5 leading-snug">
                      Harvest Origin: Villupuram Black Sesame
                    </p>
                  </motion.button>

                  {/* Floating Badge 3: Wood Used */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setActiveInspectorNote(2)}
                    className={`relative w-full sm:absolute sm:bottom-2 sm:left-0 sm:max-w-[235px] text-left p-3 rounded-2xl backdrop-blur-md border transition-all shadow-lg ${
                      activeInspectorNote === 2
                        ? "bg-[#1C110A]/90 text-[#FAF6F0] border-[#D97706]"
                        : "bg-[#FAF6F0]/85 text-[#2A1810] border-[#2A1810]/15"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D97706]">
                      <Award className="w-3.5 h-3.5 shrink-0" />
                      <span>Thermal Insulation</span>
                    </div>
                    <p className="text-xs font-semibold mt-0.5 leading-snug">
                      Wood Used: Aged Vagai (Albizia lebbeck)
                    </p>
                  </motion.button>
                </div>

                {/* Interactive Telemetry Readout Footer */}
                <div className="mt-4 pt-4 border-t border-[#2A1810]/10 bg-[#FAF6F0] rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-[#6E5648] mb-2">
                    <span className="font-semibold text-[#2A1810]">
                      {activeInspectorNote === 0 &&
                        "Why Udangudi Karupatti?"}
                      {activeInspectorNote === 1 &&
                        "Villupuram Rain-Fed Black Sesame"}
                      {activeInspectorNote === 2 &&
                        "Seasoned Vagai (Albizia lebbeck) Mortar"}
                    </span>
                    <span className="text-[11px] text-[#D97706] font-bold">
                      Click badges to inspect
                    </span>
                  </div>
                  <p className="text-xs text-[#6E5648] leading-relaxed">
                    {activeInspectorNote === 0 &&
                      "Unrefined palm jaggery absorbs trace seed moisture during crushing, eliminating bitterness and locking in natural sesamol antioxidants."}
                    {activeInspectorNote === 1 &&
                      "Grown in mineral-rich red loam soils around Gingee & Villupuram, sun-cured on terracotta floors for maximum oil density."}
                    {activeInspectorNote === 2 &&
                      "Hardwood Vagai timber never conducts heat—keeping Batch #42 at a cool 36.4°C throughout its 45-minute crush cycle."}
                  </p>

                  {/* Quick Add from Inspector */}
                  <div className="mt-3 pt-3 border-t border-[#2A1810]/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-[#6E5648] block">
                        Flagship Karupatti Nallenai (1L)
                      </span>
                      <span className="text-sm font-bold text-[#2A1810]">
                        ₹460{" "}
                        <span className="text-xs font-normal line-through text-[#6E5648]">
                          ₹490
                        </span>
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddToCart(PRODUCTS[0], "1L")}
                      className="w-full sm:w-auto justify-center px-4 py-2 rounded-full bg-[#1C110A] hover:bg-[#D97706] text-[#FAF6F0] hover:text-[#1C110A] text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add 1L to Cart
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. "THE VANNIYA CHETTIYAR STORY" (EDITORIAL HERITAGE SECTION)
         ===================================================================== */}
      <section
        id="our-story"
        className="bg-[#1C110A] text-[#FAF6F0] py-20 lg:py-28 border-b border-amber-500/20 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#D97706] px-3.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10">
              வன்னிய செட்டியார் மரபு • GENERATIONAL LINEAGE
            </span>
            <h2 className="font-serif-heritage text-3xl sm:text-5xl font-bold text-[#FAF6F0] leading-tight">
              The Vanniya Chettiyar Craft of Sacred Oil Pressing
            </h2>
            <p className="text-amber-100/75 text-base sm:text-lg leading-relaxed">
              Long before industrial refineries flooded Indian kitchens with
              bleached, solvent-extracted oils, the temple towns of Tamil Nadu
              relied on the quiet, rhythmic turning of the wooden Sekku.
            </p>
          </div>

          {/* Three Narrative Heritage Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-[#2A1810]/70 border border-amber-500/20 p-7 sm:p-8 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest uppercase text-[#D97706]">
                    01 • LINEAGE & GUILD
                  </span>
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#D97706]">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-serif-heritage text-2xl sm:text-3xl font-bold text-[#FAF6F0]">
                  The Guardians of the Sekku
                </h3>
                <p className="text-sm sm:text-base text-amber-100/75 leading-relaxed">
                  Across Tamil Nadu’s temple towns, the Vanniya Chettiyar
                  lineage mastered the delicate equilibrium of seed moisture,
                  timber density, and pestle weight. Knowing the exact sound of
                  the wooden <em>ulakkai</em> told our forebears when the oil was
                  ready to release—an acoustic intuition passed down from father
                  to son.
                </p>
              </div>
              <div className="pt-4 border-t border-amber-500/20 flex items-center justify-between text-xs text-amber-300/80">
                <span>Acoustic & Tactile Mastery</span>
                <span className="font-serif-heritage italic text-sm">
                  செக்கு ஓசை
                </span>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-[#2A1810]/70 border border-amber-500/20 p-7 sm:p-8 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest uppercase text-[#D97706]">
                    02 • THERMAL SANCTITY
                  </span>
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#D97706]">
                    <Thermometer className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-serif-heritage text-2xl sm:text-3xl font-bold text-[#FAF6F0]">
                  Why Vagai Wood Matters
                </h3>
                <p className="text-sm sm:text-base text-amber-100/75 leading-relaxed">
                  Commercial metal expellers generate extreme friction, heating
                  oil above 100°C and destroying fragile Vitamin E, phytosterols,
                  and natural enzymes. Our seasoned Vagai wood (
                  <em>Albizia lebbeck</em>) <em>ural</em> and <em>ulakkai</em>{" "}
                  act as natural thermal insulators—keeping extraction strictly
                  below 40°C.
                </p>
              </div>
              <div className="pt-4 border-t border-amber-500/20 flex items-center justify-between text-xs text-amber-300/80">
                <span>Zero Metal Friction Heat</span>
                <span className="font-serif-heritage italic text-sm">
                  வாகை மரம்
                </span>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-[#2A1810]/70 border border-amber-500/20 p-7 sm:p-8 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest uppercase text-[#D97706]">
                    03 • ALCHEMY OF JAGGERY
                  </span>
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#D97706]">
                    <Droplets className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-serif-heritage text-2xl sm:text-3xl font-bold text-[#FAF6F0]">
                  The Karupatti Secret
                </h3>
                <p className="text-sm sm:text-base text-amber-100/75 leading-relaxed">
                  True Chettiyar Nallenai is never pressed from sesame alone.
                  Adding unrefined palm jaggery (<em>Karupatti</em>) during
                  crushing naturally binds trace water molecules, bonds the oil
                  cake (<em>Punnaku</em>), removes natural seed bitterness, and
                  imparts a signature earthy sweetness that elevates raw
                  consumption.
                </p>
              </div>
              <div className="pt-4 border-t border-amber-500/20 flex items-center justify-between text-xs text-amber-300/80">
                <span>Udangudi Palm Jaggery</span>
                <span className="font-serif-heritage italic text-sm">
                  கருப்பட்டி மணம்
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. INTERACTIVE "4-STEP MARACHEKKU PROCESS" STEPPER
         ===================================================================== */}
      <section
        id="marachekku-process"
        className="py-20 lg:py-24 bg-[#F3ECE1] border-b border-[#2A1810]/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D97706]">
                FROM COURTYARD TO KITCHEN • UNHURRIED CRAFT
              </span>
              <h2 className="font-serif-heritage text-3xl sm:text-5xl font-bold text-[#2A1810] mt-2">
                The 4-Step Marachekku Process
              </h2>
            </div>
            <p className="text-sm sm:text-base text-[#6E5648] max-w-md">
              Click through each stage of our 72-hour production cycle to see
              how we preserve living nutrients without chemicals or high heat.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {PROCESS_STEPS.map((step, index) => {
              const isActive = activeStepIndex === index;
              return (
                <button
                  key={step.stepNumber}
                  onClick={() => setActiveStepIndex(index)}
                  className={`text-left p-4 sm:p-5 rounded-2xl border transition-all ${
                    isActive
                      ? "bg-[#1C110A] text-[#FAF6F0] border-[#D97706] shadow-lg"
                      : "bg-[#FAF6F0] text-[#2A1810] border-[#2A1810]/10 hover:border-[#D97706]/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-bold tracking-widest ${
                        isActive ? "text-[#D97706]" : "text-[#6E5648]"
                      }`}
                    >
                      STEP {step.stepNumber}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive ? "bg-[#D97706]" : "bg-[#2A1810]/20"
                      }`}
                    />
                  </div>
                  <div className="font-serif-heritage text-lg sm:text-xl font-bold leading-snug">
                    {step.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Detail Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStepIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl bg-[#FAF6F0] border border-[#D97706]/30 p-6 sm:p-10 shadow-xl"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Narrative */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3ECE1] text-[#D97706] text-xs font-bold tracking-wider">
                    <span>{PROCESS_STEPS[activeStepIndex].tamilTag}</span>
                  </div>

                  <h3 className="font-serif-heritage text-3xl sm:text-4xl font-bold text-[#2A1810]">
                    Step {PROCESS_STEPS[activeStepIndex].stepNumber}:{" "}
                    {PROCESS_STEPS[activeStepIndex].title}
                  </h3>

                  <p className="text-base sm:text-lg font-medium text-[#2A1810]/90">
                    {PROCESS_STEPS[activeStepIndex].subtitle}
                  </p>

                  <p className="text-sm sm:text-base text-[#6E5648] leading-relaxed">
                    {PROCESS_STEPS[activeStepIndex].description}
                  </p>

                  {/* Key Highlight Box */}
                  <div className="p-4 rounded-2xl bg-[#1F4E3D]/10 border border-[#1F4E3D]/25 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#1F4E3D] shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm font-medium text-[#1F4E3D]">
                      {PROCESS_STEPS[activeStepIndex].highlight}
                    </p>
                  </div>
                </div>

                {/* Right Telemetry & Step Controls */}
                <div className="lg:col-span-5 bg-[#F3ECE1] rounded-2xl p-6 border border-[#2A1810]/10 space-y-5">
                  <div className="flex items-center justify-between border-b border-[#2A1810]/10 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6E5648]">
                      Stage Telemetry & Standards
                    </span>
                    <span className="text-xs font-bold text-[#1F4E3D] bg-[#1F4E3D]/10 px-2.5 py-0.5 rounded-full">
                      Verified Protocol
                    </span>
                  </div>

                  <div className="space-y-3">
                    {PROCESS_STEPS[activeStepIndex].metrics.map((m, i) => (
                      <div
                        key={i}
                        className="bg-[#FAF6F0] p-3.5 rounded-xl border border-[#2A1810]/8 flex items-center justify-between"
                      >
                        <span className="text-xs font-medium text-[#6E5648]">
                          {m.label}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-[#2A1810]">
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Next / Prev Step Navigation */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() =>
                        setActiveStepIndex((prev) =>
                          prev === 0 ? PROCESS_STEPS.length - 1 : prev - 1
                        )
                      }
                      className="text-xs font-bold text-[#6E5648] hover:text-[#2A1810] transition-colors"
                    >
                      ← Previous Stage
                    </button>
                    <button
                      onClick={() =>
                        setActiveStepIndex(
                          (prev) => (prev + 1) % PROCESS_STEPS.length
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D97706] hover:text-[#B45309] transition-colors"
                    >
                      <span>
                        Next: Step{" "}
                        {
                          PROCESS_STEPS[
                            (activeStepIndex + 1) % PROCESS_STEPS.length
                          ].stepNumber
                        }
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* =====================================================================
          5. INTERACTIVE D2C PRODUCT SHOWCASE (WITH VOLUME & PACKAGING SWITCHER)
         ===================================================================== */}
      <section id="shop-oils" className="py-20 lg:py-24 bg-[#FAF6F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#1F4E3D] bg-[#1F4E3D]/10 px-3.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              FRESH BATCH #42 • CRUSHED 3 DAYS AGO
            </span>
            <h2 className="font-serif-heritage text-4xl sm:text-5xl font-bold text-[#2A1810]">
              Sacred Marachekku Oils
            </h2>
            <p className="text-sm sm:text-base text-[#6E5648]">
              Select your preferred vessel size below. Every{" "}
              <strong className="text-[#2A1810]">5L Heritage Tin</strong>{" "}
              includes an 8% family savings and a complimentary handcrafted
              Kumbakonam Brass Oil Pourer.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
            {(
              [
                "All Oils",
                "Everyday Cooking",
                "Traditional Nallenai",
                "Cold-Pressed Coconut",
                "Deepawali / Family 5L Combos",
              ] as CategoryFilter[]
            ).map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-[#1C110A] text-[#FAF6F0] shadow-md border border-[#D97706]"
                      : "bg-[#F3ECE1] text-[#6E5648] hover:text-[#2A1810] border border-transparent"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => {
                const activeVolKey = selectedVolumes[product.id] || "1L";
                const activeVol = product.volumes[activeVolKey];
                const isAdded =
                  justAddedKey === `${product.id}-${activeVolKey}`;

                return (
                  <motion.div
                    layout
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35 }}
                    className="rounded-3xl bg-[#F3ECE1]/75 border border-[#2A1810]/12 hover:border-[#D97706]/60 transition-all overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl"
                  >
                    <div>
                      {/* Top Visual & Telemetry Banner */}
                      <div className="relative bg-gradient-to-b from-[#F3ECE1] to-[#FAF6F0] p-6 pt-5 border-b border-[#2A1810]/8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F4E3D] text-[#FAF6F0] text-[11px] font-bold">
                            <Clock className="w-3 h-3 text-amber-300" />
                            Fresh Batch: Crushed {product.batchDaysAgo} days ago
                          </span>
                          <span className="text-[11px] font-bold text-[#6E5648] bg-[#FAF6F0] px-2.5 py-1 rounded-full border border-[#2A1810]/10">
                            {product.batchCode}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center mt-2">
                          {/* SVG Vessel Preview */}
                          <div className="sm:col-span-5 h-52 flex items-center justify-center">
                            <ProductVesselSVG
                              product={product}
                              volume={activeVolKey}
                            />
                          </div>

                          {/* Product Title & Origin */}
                          <div className="sm:col-span-7 space-y-2.5 text-left">
                            <div className="text-xs font-bold text-[#D97706] tracking-wide">
                              {product.tamilName}
                            </div>
                            <h3 className="font-serif-heritage text-2xl sm:text-3xl font-bold text-[#2A1810] leading-tight">
                              {product.name}
                            </h3>
                            <p className="text-xs text-[#6E5648] leading-relaxed">
                              {product.subtitle}
                            </p>

                            {/* Origin Pill */}
                            <div className="pt-1 flex items-center gap-1.5 text-xs font-semibold text-[#2A1810]">
                              <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                              <span>Origin: {product.origin}</span>
                            </div>

                            {/* Smoke Point & Extraction Specs */}
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <div className="bg-[#FAF6F0] px-3 py-2 rounded-xl border border-[#2A1810]/8">
                                <span className="block text-[10px] uppercase tracking-wider text-[#6E5648]">
                                  Extraction Temp
                                </span>
                                <span className="text-xs font-bold text-[#1F4E3D]">
                                  {product.extractionTemp}
                                </span>
                              </div>
                              <div className="bg-[#FAF6F0] px-3 py-2 rounded-xl border border-[#2A1810]/8">
                                <span className="block text-[10px] uppercase tracking-wider text-[#6E5648]">
                                  Smoke Point
                                </span>
                                <span className="text-xs font-bold text-[#2A1810]">
                                  {product.smokePoint}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Culinary / Ritual Best For Tags */}
                      <div className="px-6 py-4 border-b border-[#2A1810]/8 bg-[#FAF6F0]/60">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6E5648] mb-2">
                          Ideal Culinary & Wellness Uses:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {product.bestFor.map((use) => (
                            <span
                              key={use}
                              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#F3ECE1] text-[#2A1810] border border-[#2A1810]/10"
                            >
                              {use}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Volume & Packaging Switcher + Price & Add CTA */}
                    <div className="p-6 bg-[#FAF6F0] space-y-5">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-[#2A1810] uppercase tracking-wider">
                            Select Volume & Vessel:
                          </span>
                          <span className="text-[#6E5648] font-medium">
                            {activeVol.packaging}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          {(["500ml", "1L", "5L"] as VolumeKey[]).map(
                            (volKey) => {
                              const option = product.volumes[volKey];
                              const isSelected = activeVolKey === volKey;
                              return (
                                <button
                                  key={volKey}
                                  type="button"
                                  onClick={() =>
                                    setSelectedVolumes((prev) => ({
                                      ...prev,
                                      [product.id]: volKey,
                                    }))
                                  }
                                  className={`relative p-2.5 rounded-xl border text-left transition-all ${
                                    isSelected
                                      ? "bg-[#1C110A] text-[#FAF6F0] border-[#D97706] shadow-md"
                                      : "bg-[#F3ECE1]/70 text-[#2A1810] border-[#2A1810]/12 hover:border-[#D97706]"
                                  }`}
                                >
                                  {option.badge && (
                                    <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-[#D97706] text-[#1C110A] text-[10px] font-extrabold uppercase tracking-tight shadow">
                                      {option.badge}
                                    </span>
                                  )}
                                  <div className="text-xs font-bold">
                                    {option.label}
                                  </div>
                                  <div
                                    className={`text-sm font-extrabold mt-0.5 ${
                                      isSelected
                                        ? "text-[#D97706]"
                                        : "text-[#2A1810]"
                                    }`}
                                  >
                                    ₹{option.price.toLocaleString("en-IN")}
                                  </div>
                                  <div
                                    className={`text-[10px] ${
                                      isSelected
                                        ? "text-amber-100/70"
                                        : "text-[#6E5648]"
                                    }`}
                                  >
                                    {option.perLiterText}
                                  </div>
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* Price Display & Add to Cart Button */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-t border-[#2A1810]/10">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-serif-heritage text-3xl font-bold text-[#2A1810]">
                              ₹{activeVol.price.toLocaleString("en-IN")}
                            </span>
                            <span className="text-xs text-[#6E5648] line-through">
                              ₹{activeVol.mrp.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <span className="block text-[11px] text-[#1F4E3D] font-semibold">
                            {activeVolKey === "5L"
                              ? "Includes Free Brass Oil Pourer + Free Delivery"
                              : "Incl. of all taxes • Freshly sealed"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleAddToCart(product, activeVolKey)
                          }
                          className={`w-full sm:w-auto justify-center px-6 py-3.5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md ${
                            isAdded
                              ? "bg-[#1F4E3D] text-white"
                              : "bg-[#D97706] hover:bg-[#B45309] text-white"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Added to Vessel</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-4 h-4" />
                              <span>Add {activeVol.label}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. INTERACTIVE COMPARISON MATRIX: CHETTIYAR MARACHEKKU VS REFINED OIL
         ===================================================================== */}
      <section
        id="purity-test"
        className="py-20 lg:py-24 bg-[#F3ECE1] border-t border-b border-[#2A1810]/10"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1F4E3D]">
              RADICAL TRANSPARENCY • KNOW YOUR COOKING OIL
            </span>
            <h2 className="font-serif-heritage text-3xl sm:text-5xl font-bold text-[#2A1810]">
              Chettiyar Marachekku vs. Supermarket Refined Oil
            </h2>
            <p className="text-sm sm:text-base text-[#6E5648]">
              So-called &ldquo;heart-light&rdquo; refined oils undergo 6 stages
              of industrial chemical processing. See how our unhurried Vagai
              wood extraction compares.
            </p>
          </div>

          {/* High-Contrast Comparison Table */}
          <div className="rounded-3xl overflow-hidden border border-[#2A1810]/15 bg-[#FAF6F0] shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 bg-[#1C110A] text-[#FAF6F0] p-5 sm:p-6 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <div className="md:col-span-4 text-amber-200/80">
                Purity & Craft Parameter
              </div>
              <div className="md:col-span-4 text-[#D97706] flex items-center gap-2 mt-2 md:mt-0">
                <ShieldCheck className="w-4 h-4" />
                <span>Chettiyar Vagai Marachekku</span>
              </div>
              <div className="md:col-span-4 text-amber-100/60 mt-2 md:mt-0">
                Supermarket Refined Oil
              </div>
            </div>

            <div className="divide-y divide-[#2A1810]/10">
              {COMPARISON_ROWS.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 p-5 sm:p-6 gap-4 items-center hover:bg-[#F3ECE1]/50 transition-colors"
                >
                  {/* Parameter Name */}
                  <div className="md:col-span-4">
                    <div className="font-serif-heritage text-xl font-bold text-[#2A1810]">
                      {row.feature}
                    </div>
                    <div className="text-xs text-[#6E5648] mt-0.5">
                      {row.subtitle}
                    </div>
                  </div>

                  {/* Chettiyar Column */}
                  <div className="md:col-span-4 bg-[#1F4E3D]/10 border border-[#1F4E3D]/25 rounded-2xl p-3.5 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1F4E3D] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-bold text-[#1F4E3D]">
                      {row.chettiyar}
                    </span>
                  </div>

                  {/* Supermarket Column */}
                  <div className="md:col-span-4 bg-red-950/5 border border-red-900/15 rounded-2xl p-3.5 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-medium text-[#6E5648]">
                      {row.supermarket}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Purity Guarantee Bar */}
            <div className="bg-[#1C110A] text-[#FAF6F0] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1F4E3D] flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#FAF6F0]">
                    Every Batch Comes With a QR-Linked NABL Lab Certificate
                  </div>
                  <div className="text-xs text-amber-200/70">
                    Tested for Free Fatty Acid (FFA &lt; 1.2%), Peroxide Value,
                    and zero mineral or argemone oil adulteration.
                  </div>
                </div>
              </div>
              <button
                onClick={() => scrollToSection("shop-oils")}
                className="px-5 py-2.5 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold whitespace-nowrap transition-colors"
              >
                Switch Your Kitchen Today
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FOOTER
         ===================================================================== */}
      <footer className="bg-[#1C110A] text-[#FAF6F0] py-16 border-t border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-amber-500/15">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <MarachekkuEmblemSVG className="w-10 h-10" />
                <div>
                  <span className="block font-serif-heritage text-2xl font-bold text-[#FAF6F0]">
                    Chettiyar Chekku Oil
                  </span>
                  <span className="block text-[10px] tracking-[0.2em] text-[#D97706] uppercase">
                    Vanniya Chettiyar Marachekku Guild
                  </span>
                </div>
              </div>
              <p className="text-sm text-amber-100/70 max-w-sm leading-relaxed">
                Crushed slowly at 14 RPM in seasoned Vagai wood mortars across
                Villupuram & Tiruvannamalai. Clarified under the Tamil Nadu sun
                and bottled without a drop of chemical solvent.
              </p>
              <div className="text-xs text-amber-300/80 font-medium">
                FSSAI Lic. No: 12423002004218 • NABL Certified Batch #42
              </div>
            </div>

            <div className="md:col-span-3 space-y-3 text-sm">
              <div className="text-xs font-bold uppercase tracking-widest text-[#D97706]">
                Sacred Oils
              </div>
              <ul className="space-y-2 text-amber-100/75">
                <li>Karupatti Marachekku Nallenai</li>
                <li>Vagai Wood Groundnut Oil</li>
                <li>Pollachi White Copra Coconut Oil</li>
                <li>Iluppai & Pancha Deepam Oil</li>
                <li>5L Heritage Family Tin Combos</li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3 text-sm">
              <div className="text-xs font-bold uppercase tracking-widest text-[#D97706]">
                Direct Mill Dispatch
              </div>
              <p className="text-amber-100/75 text-xs leading-relaxed">
                No. 42, Big Bazaar Street, Heritage Sekku Courtyard,
                Villupuram &amp; Chennai Dispatch Hub, Tamil Nadu – 605602.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-[#D97706] hover:text-[#1C110A] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Direct WhatsApp Mill Desk: +91 82209 13943</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-amber-100/50 gap-4">
            <span>
              © {currentYear} Chettiyar Chekku Oil. Preserving the
              Vanniya Chettiyar Marachekku Craft.
            </span>
            <span>
              14 RPM Cold-Pressed • Zero Hexane • 100% Vagai Wood
            </span>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          7. SLIDE-OVER CART DRAWER & HYBRID WHATSAPP / INSTANT CHECKOUT
         ===================================================================== */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-50 bg-[#1C110A]/60 backdrop-blur-sm"
            />

            {/* Slide-Over Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#FAF6F0] text-[#2A1810] shadow-2xl border-l border-[#2A1810]/15 flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div>
                <div className="p-5 bg-[#1C110A] text-[#FAF6F0] flex items-center justify-between border-b border-amber-500/20">
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-5 h-5 text-[#D97706]" />
                    <div>
                      <h3 className="font-serif-heritage text-xl font-bold leading-none">
                        Your Oil Pantry
                      </h3>
                      <span className="text-[11px] text-amber-200/75">
                        Fresh Batch #42 • Direct Mill Dispatch
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF6F0] transition-colors"
                    aria-label="Close cart drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Free Shipping Progress Bar (Free above ₹999) */}
                <div className="px-5 py-3.5 bg-[#F3ECE1] border-b border-[#2A1810]/10">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    {cartMetrics.isFreeShipping ? (
                      <span className="text-[#1F4E3D] flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        Unlocked FREE Insulated Doorstep Delivery!
                      </span>
                    ) : (
                      <span className="text-[#2A1810]">
                        Add{" "}
                        <strong className="text-[#D97706]">
                          ₹{cartMetrics.amountForFreeShipping}
                        </strong>{" "}
                        more for{" "}
                        <strong className="text-[#1F4E3D]">
                          FREE Shipping
                        </strong>{" "}
                        (above ₹999)
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-[#6E5648]">
                      {cartMetrics.shippingProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#2A1810]/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D97706] to-[#1F4E3D] transition-all duration-500"
                      style={{ width: `${cartMetrics.shippingProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-[#F3ECE1] mx-auto flex items-center justify-center text-[#6E5648]">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <div className="font-serif-heritage text-2xl font-bold text-[#2A1810]">
                      Your pantry vessel is empty
                    </div>
                    <p className="text-xs text-[#6E5648] max-w-xs mx-auto">
                      Explore our freshly crushed Batch #42 Nallenai, Groundnut,
                      Coconut, and Sacred Deepam oils.
                    </p>
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        scrollToSection("shop-oils");
                      }}
                      className="px-5 py-2.5 rounded-full bg-[#D97706] text-white text-xs font-bold"
                    >
                      Browse Fresh Batch #42
                    </button>
                  </div>
                ) : (
                  <>
                    {cart.map((item) => {
                      const volSpec = item.product.volumes[item.volume];
                      return (
                        <div
                          key={item.cartItemId}
                          className="p-4 rounded-2xl bg-[#F3ECE1]/80 border border-[#2A1810]/10 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#1C110A] text-[#D97706]">
                                {volSpec.label}
                              </span>
                              {item.volume === "5L" && (
                                <span className="text-[10px] font-bold text-[#1F4E3D] bg-[#1F4E3D]/10 px-2 py-0.5 rounded">
                                  Save 8%
                                </span>
                              )}
                            </div>
                            <h4 className="font-serif-heritage text-lg font-bold text-[#2A1810] leading-snug">
                              {item.product.name.split(" (")[0]}
                            </h4>
                            <div className="text-xs text-[#6E5648]">
                              ₹{volSpec.price.toLocaleString("en-IN")} ×{" "}
                              {item.quantity} ={" "}
                              <strong className="text-[#2A1810]">
                                ₹
                                {(
                                  volSpec.price * item.quantity
                                ).toLocaleString("en-IN")}
                              </strong>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1.5 bg-[#FAF6F0] px-2 py-1 rounded-full border border-[#2A1810]/15">
                            <button
                              onClick={() =>
                                updateCartQuantity(item.cartItemId, -1)
                              }
                              className="p-1 text-[#6E5648] hover:text-[#2A1810]"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateCartQuantity(item.cartItemId, 1)
                              }
                              className="p-1 text-[#6E5648] hover:text-[#2A1810]"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeCartItem(item.cartItemId)}
                            className="p-1.5 text-[#6E5648] hover:text-red-700 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Complimentary Brass Pourer Reward Card if 5L Tin is in Cart */}
                    {cartMetrics.hasFiveLiterTin ? (
                      <div className="p-3.5 rounded-2xl bg-[#1F4E3D]/10 border border-[#1F4E3D]/30 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-5 h-5 text-[#1F4E3D] shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-[#1F4E3D]">
                              Complimentary Kumbakonam Brass Oil Pourer
                            </div>
                            <div className="text-[11px] text-[#6E5648]">
                              Automatically included with your 5L Heritage Tin
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-[#1F4E3D]">
                          FREE
                        </span>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-[#D97706]/30 flex items-center justify-between gap-3">
                        <div className="text-xs text-[#2A1810]">
                          <strong>Tip:</strong> Upgrade any oil to a{" "}
                          <strong>5L Heritage Tin</strong> to unlock 8% savings
                          + a <strong>FREE Brass Oil Pourer</strong>.
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Cart Footer & Dual Checkout Flows */}
              {cart.length > 0 && (
                <div className="p-5 bg-[#F3ECE1] border-t border-[#2A1810]/15 space-y-4">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#6E5648]">
                      <span>Subtotal ({cartMetrics.totalItems} vessels)</span>
                      <span>
                        ₹{cartMetrics.subtotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#6E5648]">
                      <span>Insulated Mill Shipping</span>
                      <span className="font-bold text-[#1F4E3D]">
                        {cartMetrics.isFreeShipping
                          ? "FREE"
                          : `₹${cartMetrics.shippingFee}`}
                      </span>
                    </div>
                    {cartMetrics.totalSavings > 0 && (
                      <div className="flex justify-between text-[#1F4E3D] font-semibold">
                        <span>Total Heritage Savings</span>
                        <span>
                          -₹{cartMetrics.totalSavings.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-[#2A1810]/10 flex justify-between items-baseline text-base font-bold text-[#2A1810]">
                      <span>Total Payable</span>
                      <span className="font-serif-heritage text-2xl">
                        ₹{cartMetrics.grandTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Two Checkout Actions */}
                  <div className="space-y-2.5">
                    <button
                      onClick={() => {
                        setCheckoutSuccess(false);
                        setIsCheckoutModalOpen(true);
                      }}
                      className="w-full py-3.5 px-5 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        Proceed to Instant Checkout • ₹
                        {cartMetrics.grandTotal.toLocaleString("en-IN")}
                      </span>
                    </button>

                    <a
                      href={generateWhatsAppOrderLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-5 rounded-full bg-[#1F4E3D] hover:bg-[#16382C] text-[#FAF6F0] font-bold text-xs sm:text-sm shadow flex items-center justify-center gap-2 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Order via WhatsApp (Instant Family/Bulk Desk)</span>
                    </a>
                  </div>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* =====================================================================
          SIMULATED RAZORPAY / INSTANT PAY MODAL
         ===================================================================== */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C110A]/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto rounded-3xl bg-[#FAF6F0] text-[#2A1810] border border-[#D97706]/40 shadow-2xl"
            >
              {/* Header */}
              <div className="bg-[#1C110A] text-[#FAF6F0] p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MarachekkuEmblemSVG className="w-8 h-8" />
                  <div>
                    <div className="text-xs uppercase tracking-widest text-[#D97706] font-bold">
                      Chettiyar Chekku Express Pay
                    </div>
                    <div className="font-serif-heritage text-lg font-bold">
                      Batch #42 Direct Dispatch Checkout
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {checkoutSuccess ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#1F4E3D] text-white mx-auto flex items-center justify-center">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="font-serif-heritage text-3xl font-bold text-[#2A1810]">
                    Mikkaandri! Order Confirmed
                  </h4>
                  <p className="text-sm text-[#6E5648] max-w-md mx-auto">
                    Your fresh Marachekku order from{" "}
                    <strong>Batch #42</strong> is queued for tin/amber glass
                    sealing and will dispatch within 24 hours.
                  </p>
                  <div className="p-4 rounded-2xl bg-[#F3ECE1] text-xs text-left space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#6E5648]">Order Reference:</span>
                      <span className="font-bold">#{lastOrderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6E5648]">Amount Paid:</span>
                      <span className="font-bold text-[#1F4E3D]">
                        ₹{lastOrderTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6E5648]">Recipient:</span>
                      <span className="font-bold">
                        {customerName || "Valued Patron"} ({customerCity})
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsCheckoutModalOpen(false);
                      setIsCartOpen(false);
                    }}
                    className="w-full py-3.5 rounded-full bg-[#1C110A] text-[#FAF6F0] text-xs font-bold"
                  >
                    Return to Store
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const orderNum = await saveOrderToFirestore(paymentMethod);
                    if (orderNum) {
                      setCheckoutSuccess(true);
                      setCart([]);
                    }
                  }}
                  className="p-6 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#2A1810] mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Meenakshi Sundaram"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3ECE1] border border-[#2A1810]/15 text-xs focus:outline-none focus:border-[#D97706]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2A1810] mb-1">
                        WhatsApp / Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 82209 13943"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3ECE1] border border-[#2A1810]/15 text-xs focus:outline-none focus:border-[#D97706]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2A1810] mb-1">
                      Delivery Address & Pin Code
                    </label>
                    <input
                      type="text"
                      required
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3ECE1] border border-[#2A1810]/15 text-xs focus:outline-none focus:border-[#D97706]"
                    />
                  </div>

                  {/* Payment Selector */}
                  <div>
                    <span className="block text-xs font-bold text-[#2A1810] mb-2">
                      Select Instant Payment Mode
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("upi")}
                        className={`p-3 rounded-xl border text-left text-xs font-bold ${
                          paymentMethod === "upi"
                            ? "bg-[#1C110A] text-[#FAF6F0] border-[#D97706]"
                            : "bg-[#F3ECE1] text-[#2A1810] border-transparent"
                        }`}
                      >
                        GPay / PhonePe / Instant UPI
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`p-3 rounded-xl border text-left text-xs font-bold ${
                          paymentMethod === "card"
                            ? "bg-[#1C110A] text-[#FAF6F0] border-[#D97706]"
                            : "bg-[#F3ECE1] text-[#2A1810] border-transparent"
                        }`}
                      >
                        Credit / Debit Card / NetBanking
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F3ECE1] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#6E5648]">
                      Total Payable ({cartMetrics.totalItems} vessels)
                    </span>
                    <span className="font-serif-heritage text-2xl font-bold text-[#2A1810]">
                      ₹{cartMetrics.grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full py-3.5 rounded-full bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 text-white font-bold text-sm shadow-lg transition-colors"
                  >
                    {isSubmittingOrder
                      ? "Recording Order in Mill Ledger..."
                      : `Pay ₹${cartMetrics.grandTotal.toLocaleString("en-IN")} & Confirm Batch #42 Order`}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          LIVE FIRESTORE MILL ORDERS MODAL
         ===================================================================== */}
      <AnimatePresence>
        {isOrdersModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C110A]/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl max-h-[calc(100dvh-2rem)] rounded-3xl bg-[#FAF6F0] text-[#2A1810] border border-[#D97706]/40 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-[#1C110A] text-[#FAF6F0] p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-[#D97706]" />
                  <div>
                    <div className="text-xs uppercase tracking-widest text-[#D97706] font-bold">
                      Live Firestore Ledger
                    </div>
                    <h3 className="font-serif-heritage text-xl font-bold">
                      Mill Orders ({orders.length})
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setIsOrdersModalOpen(false)}
                  aria-label="Close mill orders"
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
                {orders.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[#6E5648]">
                    No orders have been recorded yet.
                  </div>
                ) : (
                  orders.map((order) => (
                    <article
                      key={order.id}
                      className="rounded-2xl border border-[#2A1810]/10 bg-white/70 p-4 sm:p-5 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-[#2A1810]">
                            {order.orderNumber}
                          </h4>
                          <p className="mt-1 text-xs text-[#6E5648]">
                            {order.createdAt
                              ? order.createdAt.toDate().toLocaleString("en-IN")
                              : "Order time pending"}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <p className="font-serif-heritage text-xl font-bold">
                            ₹{order.grandTotal.toLocaleString("en-IN")}
                          </p>
                          <p className="text-xs text-[#6E5648] capitalize">
                            {order.paymentMethod}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#6E5648]">
                        <p>
                          <span className="font-bold text-[#2A1810]">
                            Customer:
                          </span>{" "}
                          {order.customerName}
                        </p>
                        <p>
                          <span className="font-bold text-[#2A1810]">
                            Phone:
                          </span>{" "}
                          {order.customerPhone}
                        </p>
                        <p>
                          <span className="font-bold text-[#2A1810]">
                            Delivery:
                          </span>{" "}
                          {order.customerCity}
                        </p>
                        {order.hasFreeBrassPourer && (
                          <p className="font-bold text-[#1F4E3D]">
                            Includes free brass pourer
                          </p>
                        )}
                      </div>

                      <ul className="border-y border-[#2A1810]/10 py-3 space-y-1.5 text-xs">
                        {order.items.map((item, index) => (
                          <li
                            key={`${order.id}-${item.productId}-${item.volume}-${index}`}
                            className="flex justify-between gap-3"
                          >
                            <span>
                              {item.name} ({item.label}) × {item.quantity}
                            </span>
                            <span className="shrink-0 font-semibold">
                              ₹
                              {(item.unitPrice * item.quantity).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <span
                          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold ${
                            order.status === "Dispatched from Mill"
                              ? "bg-[#1F4E3D]/10 text-[#1F4E3D]"
                              : "bg-[#D97706]/10 text-[#92400E]"
                          }`}
                        >
                          {order.status}
                        </span>
                        <button
                          onClick={() =>
                            void toggleOrderStatus(order.id, order.status)
                          }
                          className="rounded-full border border-[#D97706]/40 px-4 py-2 text-xs font-bold text-[#2A1810] hover:bg-[#D97706]/10 transition-colors"
                        >
                          {order.status === "Batch #42 Packing"
                            ? "Mark as Dispatched"
                            : "Return to Packing"}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          14 RPM LIVE MARACHEKKU PROCESS INSPECTOR MODAL
         ===================================================================== */}
      <AnimatePresence>
        {isProcessModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C110A]/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto rounded-3xl bg-[#1C110A] text-[#FAF6F0] border border-amber-500/30 p-5 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#D97706]">
                    LIVE MILL TELEMETRY • VILLUPURAM SEKSHALA
                  </span>
                  <h3 className="font-serif-heritage text-2xl sm:text-3xl font-bold mt-1">
                    Inside the 14 RPM Vagai Wood Mortar
                  </h3>
                </div>
                <button
                  onClick={() => setIsProcessModalOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#2A1810]/80 p-5 rounded-2xl border border-amber-500/20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 4.2,
                    ease: "linear",
                  }}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-[#D97706] flex items-center justify-center shrink-0"
                >
                  <MarachekkuEmblemSVG className="w-16 h-16" />
                </motion.div>
                <div className="space-y-2 text-xs sm:text-sm text-amber-100/85">
                  <div className="font-bold text-[#D97706]">
                    Why 14 Revolutions Per Minute?
                  </div>
                  <p className="leading-relaxed">
                    At 14 RPM, the heavy Vagai wood pestle mimics the gentle
                    rhythm of traditional bullock-driven Chekkus. Seeds are
                    folded and pressed rather than sheared—keeping oil
                    temperature at <strong>36.4°C</strong> and preserving
                    natural sesamol, phytosterols, and aroma.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsProcessModalOpen(false);
                    scrollToSection("marachekku-process");
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#D97706] text-[#1C110A] text-xs font-bold"
                >
                  Explore Full 4-Step Process
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}