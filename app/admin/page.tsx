"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  LogOut,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Download,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Sparkles,
  IndianRupee,
  Droplets,
  Filter,
  Save,
  Trash2,
  PlusCircle,
  AlertCircle,
  ArrowLeft,
  Check,
  ShieldCheck,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  addDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type VolumeKey = "500ml" | "1L" | "5L";

type OrderStatus =
  | "Batch #42 Packing"
  | "Dispatched from Mill"
  | "Delivered"
  | "Cancelled";

interface OrderItem {
  productId?: string;
  name: string;
  volume: VolumeKey;
  label: string;
  quantity: number;
  unitPrice: number;
}

interface FirestoreOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  paymentMethod: "upi" | "card" | "whatsapp";
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
  hasFreeBrassPourer: boolean;
  status: OrderStatus;
  courierName?: string;
  trackingNumber?: string;
  adminNotes?: string;
  createdAt?: Timestamp | null;
}

const COURIER_PARTNERS = [
  "ST Courier (TN Express)",
  "Professional Couriers",
  "Delhivery Surface",
  "BlueDart Priority",
  "India Post Speed Post",
  "Direct Mill Van (Chennai)",
];

const STATUS_OPTIONS: OrderStatus[] = [
  "Batch #42 Packing",
  "Dispatched from Mill",
  "Delivered",
  "Cancelled",
];

// Default passcode (Override via NEXT_PUBLIC_ADMIN_PASSWORD in .env.local)
const ADMIN_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "4242";

// ============================================================================
// MAIN ADMIN DASHBOARD COMPONENT
// ============================================================================

export default function ChettiyarAdminDashboard() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");

  // Firestore Orders State
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Filter & Search State
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [paymentFilter, setPaymentFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Local Editable Tracking & Status State per Order ID
  const [trackingEdits, setTrackingEdits] = useState<
    Record<
      string,
      {
        courierName: string;
        trackingNumber: string;
        status: OrderStatus;
      }
    >
  >({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check sessionStorage for existing login on client mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem("chettiyar_admin_auth");
    if (savedAuth === "authenticated") {
      setIsAuthenticated(true);
    }
  }, []);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Real-Time Firestore Listener (Only runs when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders: FirestoreOrder[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<FirestoreOrder, "id">;
          return {
            id: docSnap.id,
            ...data,
          };
        });

        setOrders(fetchedOrders);

        // Initialize tracking input state for any new orders
        setTrackingEdits((prev) => {
          const next = { ...prev };
          fetchedOrders.forEach((o) => {
            if (!next[o.id]) {
              next[o.id] = {
                courierName: o.courierName || COURIER_PARTNERS[0],
                trackingNumber: o.trackingNumber || "",
                status: o.status || "Batch #42 Packing",
              };
            }
          });
          return next;
        });

        setIsLoading(false);
        setFirestoreError(null);
      },
      (error) => {
        console.error("Firestore Admin Error:", error);
        setFirestoreError(
          "Unable to connect to Firestore. Verify your .env.local keys and Firestore security rules."
        );
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Handle Passcode Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.trim() === ADMIN_PASSCODE) {
      sessionStorage.setItem("chettiyar_admin_auth", "authenticated");
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Invalid Mill Master Passcode");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("chettiyar_admin_auth");
    setIsAuthenticated(false);
    setPasscodeInput("");
  };

  // Filtered Orders Memo
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;
      const matchesPayment =
        paymentFilter === "All" || order.paymentMethod === paymentFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        order.orderNumber?.toLowerCase().includes(q) ||
        order.customerName?.toLowerCase().includes(q) ||
        order.customerPhone?.toLowerCase().includes(q) ||
        order.customerCity?.toLowerCase().includes(q) ||
        (order.trackingNumber &&
          order.trackingNumber.toLowerCase().includes(q));

      return matchesStatus && matchesPayment && matchesSearch;
    });
  }, [orders, statusFilter, paymentFilter, searchQuery]);

  // Dashboard KPI Metrics
  const kpiMetrics = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== "Cancelled");
    const totalRevenue = activeOrders.reduce(
      (sum, o) => sum + (Number(o.grandTotal) || 0),
      0
    );
    const pendingPacking = orders.filter(
      (o) => o.status === "Batch #42 Packing"
    ).length;
    const dispatchedCount = orders.filter(
      (o) => o.status === "Dispatched from Mill" || o.status === "Delivered"
    ).length;
    const brassPourersCount = activeOrders.filter(
      (o) => o.hasFreeBrassPourer
    ).length;

    // Calculate total litres pressed across all non-cancelled orders
    let totalLitres = 0;
    activeOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const volMultiplier =
          item.volume === "500ml" ? 0.5 : item.volume === "1L" ? 1 : 5;
        totalLitres += volMultiplier * (item.quantity || 1);
      });
    });

    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingPacking,
      dispatchedCount,
      brassPourersCount,
      totalLitres,
    };
  }, [orders]);

  // Save Tracking Number, Courier & Status to Firestore
  const handleSaveOrderFulfillment = async (order: FirestoreOrder) => {
    const edit = trackingEdits[order.id];
    if (!edit) return;

    setSavingOrderId(order.id);
    try {
      // Automatically switch status to Dispatched if a tracking number was entered while still in Packing
      const nextStatus: OrderStatus =
        edit.trackingNumber.trim() !== "" &&
        edit.status === "Batch #42 Packing"
          ? "Dispatched from Mill"
          : edit.status;

      await updateDoc(doc(db, "orders", order.id), {
        courierName: edit.courierName,
        trackingNumber: edit.trackingNumber.trim().toUpperCase(),
        status: nextStatus,
      });

      setTrackingEdits((prev) => ({
        ...prev,
        [order.id]: {
          ...prev[order.id],
          status: nextStatus,
          trackingNumber: edit.trackingNumber.trim().toUpperCase(),
        },
      }));

      showToast(`Saved fulfillment details for #${order.orderNumber}`);
    } catch (error) {
      console.error("Failed to update order:", error);
      showToast("Error updating order in Firestore.");
    } finally {
      setSavingOrderId(null);
    }
  };

  // Delete an order from Firestore
  const handleDeleteOrder = async (order: FirestoreOrder) => {
    const confirmed = window.confirm(
      `Delete Order #${order.orderNumber} (${order.customerName}) permanently from Firestore?`
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "orders", order.id));
      showToast(`Deleted Order #${order.orderNumber}`);
    } catch (error) {
      console.error("Error deleting order:", error);
      showToast("Could not delete order.");
    }
  };

  // Seed a realistic test order into Firestore for immediate testing
  const handleSeedSampleOrder = async () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const samplePatrons = [
      {
        name: "Sivakumar Chettiyar",
        phone: "+91 98401 23456",
        city: "Karaikudi, TN - 630001",
      },
      {
        name: "Anitha Balasubramanian",
        phone: "+91 94432 88990",
        city: "Adyar, Chennai - 600020",
      },
      {
        name: "Raghavan Sundar",
        phone: "+91 97890 55443",
        city: "White Town, Puducherry - 605001",
      },
    ];
    const patron =
      samplePatrons[Math.floor(Math.random() * samplePatrons.length)];

    try {
      await addDoc(collection(db, "orders"), {
        orderNumber: `CCO-${randomNum}-TN`,
        customerName: patron.name,
        customerPhone: patron.phone,
        customerCity: patron.city,
        paymentMethod: "upi",
        items: [
          {
            productId: "karupatti-nallenai",
            name: "Karupatti Marachekku Nallenai",
            volume: "5L",
            label: "5L Heritage Tin",
            quantity: 1,
            unitPrice: 2190,
          },
          {
            productId: "pollachi-coconut",
            name: "Sulphur-Free White Copra Coconut Oil",
            volume: "1L",
            label: "1L Bottle",
            quantity: 2,
            unitPrice: 420,
          },
        ],
        subtotal: 3030,
        shippingFee: 0,
        grandTotal: 3030,
        hasFreeBrassPourer: true,
        status: "Batch #42 Packing",
        courierName: "ST Courier (TN Express)",
        trackingNumber: "",
        createdAt: serverTimestamp(),
      });

      showToast(`Seeded test order #CCO-${randomNum}-TN to Firestore!`);
    } catch (error) {
      console.error("Failed to seed test order:", error);
      showToast("Failed to seed order. Check Firebase config.");
    }
  };

  // Export Filtered Orders to RFC-Compliant CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      showToast("No orders match current filters to export.");
      return;
    }

    const headers = [
      "Order Number",
      "Timestamp (IST)",
      "Customer Name",
      "Phone",
      "Delivery City/Address",
      "Payment Method",
      "Fulfillment Status",
      "Courier Partner",
      "Tracking AWB Number",
      "Free Brass Pourer Included",
      "Ordered Vessels Summary",
      "Subtotal (INR)",
      "Shipping (INR)",
      "Grand Total (INR)",
    ];

    const escapeCSV = (val: string | number | boolean | undefined | null) => {
      const str = String(val ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = filteredOrders.map((order) => {
      const dateStr = order.createdAt?.toDate
        ? order.createdAt.toDate().toLocaleString("en-IN")
        : "Pending Timestamp";

      const itemsSummary = (order.items || [])
        .map(
          (i) => `${i.name} (${i.label}) x${i.quantity} [Rs.${i.unitPrice}]`
        )
        .join(" | ");

      const currentEdit = trackingEdits[order.id];

      return [
        escapeCSV(order.orderNumber),
        escapeCSV(dateStr),
        escapeCSV(order.customerName),
        escapeCSV(order.customerPhone),
        escapeCSV(order.customerCity),
        escapeCSV(order.paymentMethod?.toUpperCase()),
        escapeCSV(currentEdit?.status || order.status),
        escapeCSV(currentEdit?.courierName || order.courierName || "Unassigned"),
        escapeCSV(currentEdit?.trackingNumber || order.trackingNumber || "N/A"),
        escapeCSV(order.hasFreeBrassPourer ? "YES (1x Brass Pourer)" : "NO"),
        escapeCSV(itemsSummary),
        escapeCSV(order.subtotal),
        escapeCSV(order.shippingFee),
        escapeCSV(order.grandTotal),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Safe inside event handler in Next.js 16
    const exportDate = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Chettiyar_Chekku_Orders_${exportDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredOrders.length} orders to CSV!`);
  };

  // Generate Customer WhatsApp Dispatch Notification Link
  const getCustomerDispatchWhatsAppLink = (order: FirestoreOrder) => {
    const edit = trackingEdits[order.id];
    const courier = edit?.courierName || order.courierName || "Our Courier Partner";
    const awb = edit?.trackingNumber || order.trackingNumber || "Pending AWB";
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, "");
    const phoneWithCountry =
      cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = [
      `🙏 *Vanakkam ${order.customerName}!*`,
      `Your freshly pressed *Chettiyar Chekku Oil* order (*#${order.orderNumber}*) from Batch #42 has been dispatched from our Villupuram Sekku Mill.`,
      ``,
      `📦 *Courier Partner:* ${courier}`,
      `🚚 *Tracking / AWB No:* ${awb}`,
      order.hasFreeBrassPourer
        ? `🎁 *Bonus Included:* 1x Complimentary Kumbakonam Brass Oil Pourer`
        : null,
      ``,
      `Thank you for supporting authentic 14 RPM Vagai Wood Marachekku craft!`,
    ]
      .filter(Boolean)
      .join("\n");

    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(
      message
    )}`;
  };

  // ==========================================================================
  // VIEW 1: PASSWORD PROTECTION SCREEN
  // ==========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#1C110A] text-[#FAF6F0] flex flex-col justify-center items-center p-4 selection:bg-[#D97706]/30">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          .font-serif-heritage { font-family: 'Cormorant Garamond', Georgia, serif; }
          .font-sans-ui { font-family: 'Plus Jakarta Sans', sans-serif; }
        `}</style>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl bg-[#2A1810] border border-amber-500/30 p-8 shadow-2xl space-y-6 font-sans-ui"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-[#D97706]/15 border border-[#D97706] mx-auto flex items-center justify-center text-[#D97706]">
              <Lock className="w-6 h-6" />
            </div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#D97706]">
              VANNIYA CHETTIYAR HERITAGE MILL
            </span>
            <h1 className="font-serif-heritage text-3xl font-bold text-[#FAF6F0]">
              Mill Master Dispatch Ledger
            </h1>
            <p className="text-xs text-amber-100/70">
              Enter your authorized Mill Master PIN to manage Batch #42
              Firestore orders, AWB tracking, and CSV exports.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-200/80 mb-2">
                Admin Security Passcode
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter PIN "
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-[#1C110A] border border-amber-500/30 text-[#FAF6F0] text-sm tracking-widest focus:outline-none focus:border-[#D97706]"
              />
              {authError && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#D97706] hover:bg-[#B45309] text-[#1C110A] font-extrabold text-sm transition-colors shadow-lg"
            >
              Unlock Mill Dispatch Dashboard
            </button>
          </form>

          <div className="pt-4 border-t border-amber-500/15 flex items-center justify-between text-xs text-amber-200/60">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-[#D97706] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Storefront</span>
            </Link>
            
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW 2: AUTHENTICATED FIRESTORE ADMIN DASHBOARD
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#2A1810] font-sans-ui">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .font-serif-heritage { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-sans-ui { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#1C110A] text-[#FAF6F0] border-b border-amber-500/25 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-amber-300 transition-colors"
              title="Back to Storefront"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D97706]">
                  FIRESTORE LIVE LEDGER • BATCH #42
                </span>
              </div>
              <h1 className="font-serif-heritage text-2xl sm:text-3xl font-bold text-[#FAF6F0] leading-none mt-0.5">
                Chettiyar Chekku Mill — Admin Console
              </h1>
            </div>
          </div>

          {/* Action Buttons: Seed Test Order, Export CSV, Logout */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSeedSampleOrder}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Seed Test Order</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1F4E3D] hover:bg-[#16382C] text-[#FAF6F0] border border-emerald-400/30 text-xs font-bold transition-colors shadow"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Export CSV ({filteredOrders.length})</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-red-900/60 text-amber-100 text-xs font-semibold transition-colors"
              title="Lock Admin Dashboard"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-4 z-50 bg-[#1F4E3D] text-[#FAF6F0] px-4 py-3 rounded-xl shadow-2xl border border-emerald-400/30 flex items-center gap-2.5 text-xs sm:text-sm font-bold"
          >
            <Check className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Firestore Connection Error Banner if any */}
        {firestoreError && (
          <div className="p-4 rounded-2xl bg-red-950/10 border border-red-800/30 text-red-900 flex items-center gap-3 text-xs sm:text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0" />
            <span>{firestoreError}</span>
          </div>
        )}

        {/* ===================================================================
            KPI SUMMARY CARDS
           =================================================================== */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-[#F3ECE1] border border-[#2A1810]/10 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6E5648]">
              <span>Active Revenue</span>
              <IndianRupee className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="font-serif-heritage text-3xl font-bold text-[#2A1810]">
              ₹{kpiMetrics.totalRevenue.toLocaleString("en-IN")}
            </div>
            <span className="block text-[11px] text-[#1F4E3D] font-semibold">
              Across {kpiMetrics.totalOrders} recorded orders
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#F3ECE1] border border-[#2A1810]/10 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6E5648]">
              <span>Pending Packing</span>
              <Clock className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="font-serif-heritage text-3xl font-bold text-[#D97706]">
              {kpiMetrics.pendingPacking}
            </div>
            <span className="block text-[11px] text-[#6E5648]">
              Batch #42 awaiting AWB
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#F3ECE1] border border-[#2A1810]/10 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6E5648]">
              <span>Dispatched / Done</span>
              <Truck className="w-4 h-4 text-[#1F4E3D]" />
            </div>
            <div className="font-serif-heritage text-3xl font-bold text-[#1F4E3D]">
              {kpiMetrics.dispatchedCount}
            </div>
            <span className="block text-[11px] text-[#6E5648]">
              In transit or delivered
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#F3ECE1] border border-[#2A1810]/10 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6E5648]">
              <span>Oil Volume Sold</span>
              <Droplets className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="font-serif-heritage text-3xl font-bold text-[#2A1810]">
              {kpiMetrics.totalLitres} L
            </div>
            <span className="block text-[11px] text-[#6E5648]">
              14 RPM Vagai wood pressed
            </span>
          </div>

          <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl bg-[#1C110A] text-[#FAF6F0] border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-300">
              <span>Brass Pourers</span>
              <Sparkles className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="font-serif-heritage text-3xl font-bold text-[#D97706]">
              {kpiMetrics.brassPourersCount} Units
            </div>
            <span className="block text-[11px] text-amber-100/70">
              Pack with 5L Tin orders
            </span>
          </div>
        </section>

        {/* ===================================================================
            SEARCH & FILTER BAR
           =================================================================== */}
        <section className="p-5 rounded-3xl bg-[#F3ECE1] border border-[#2A1810]/12 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-[#6E5648] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Order #CCO, Patron Name, Phone, City, or AWB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#2A1810]/15 text-xs sm:text-sm focus:outline-none focus:border-[#D97706]"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="md:col-span-5 flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {["All", ...STATUS_OPTIONS].map((status) => {
                const active = statusFilter === status;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      active
                        ? "bg-[#1C110A] text-[#FAF6F0] shadow"
                        : "bg-[#FAF6F0] text-[#6E5648] hover:text-[#2A1810] border border-[#2A1810]/10"
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>

            {/* Payment Mode Select */}
            <div className="md:col-span-2">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#2A1810]/15 text-xs font-bold text-[#2A1810] focus:outline-none focus:border-[#D97706]"
              >
                <option value="All">All Payments</option>
                <option value="upi">UPI Instant</option>
                <option value="card">Card / NetBanking</option>
                <option value="whatsapp">WhatsApp Desk</option>
              </select>
            </div>
          </div>
        </section>

        {/* ===================================================================
            ORDERS FULFILLMENT LIST
           =================================================================== */}
        <section className="space-y-4">
          {isLoading ? (
            <div className="p-16 rounded-3xl bg-[#F3ECE1]/60 border border-[#2A1810]/10 text-center space-y-3">
              <RefreshCw className="w-7 h-7 text-[#D97706] animate-spin mx-auto" />
              <p className="font-serif-heritage text-2xl font-bold text-[#2A1810]">
                Syncing Mill Ledger from Firestore...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-16 rounded-3xl bg-[#F3ECE1]/60 border border-[#2A1810]/10 text-center space-y-4">
              <Package className="w-10 h-10 text-[#6E5648] mx-auto" />
              <div className="space-y-1">
                <h3 className="font-serif-heritage text-2xl font-bold text-[#2A1810]">
                  No Matching Orders Found
                </h3>
                <p className="text-xs text-[#6E5648] max-w-md mx-auto">
                  Click &ldquo;Seed Test Order&rdquo; in the top right bar to
                  populate a realistic 5L Heritage Tin order into Firestore right now.
                </p>
              </div>
              <button
                onClick={handleSeedSampleOrder}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D97706] text-white text-xs font-bold shadow"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Seed Sample Firestore Order</span>
              </button>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const edit = trackingEdits[order.id] || {
                courierName: order.courierName || COURIER_PARTNERS[0],
                trackingNumber: order.trackingNumber || "",
                status: order.status || "Batch #42 Packing",
              };

              const isSaving = savingOrderId === order.id;

              return (
                <motion.div
                  layout
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl bg-[#F3ECE1] border border-[#2A1810]/15 shadow-sm overflow-hidden"
                >
                  {/* Order Top Header Bar */}
                  <div className="bg-[#1C110A] text-[#FAF6F0] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-extrabold text-[#D97706] bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs text-amber-100/75">
                        {order.createdAt?.toDate
                          ? order.createdAt.toDate().toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Just now"}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-white/10 text-amber-200">
                        {order.paymentMethod}
                      </span>
                      {order.hasFreeBrassPourer && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1F4E3D] text-amber-300 border border-emerald-400/30">
                          <Sparkles className="w-3 h-3" />
                          Include Free Brass Pourer
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-serif-heritage text-2xl font-bold text-[#FAF6F0]">
                        ₹{Number(order.grandTotal || 0).toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() => handleDeleteOrder(order)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-900/50 text-amber-200/60 hover:text-red-200 transition-colors"
                        title="Delete Order from Firestore"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Order Body: Customer Info + Items + Tracking Manager */}
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Column 1: Patron Details (3 cols) */}
                    <div className="lg:col-span-3 space-y-2 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#6E5648] block">
                        Patron & Delivery Destination
                      </span>
                      <div className="font-serif-heritage text-xl font-bold text-[#2A1810]">
                        {order.customerName}
                      </div>
                      <div className="font-semibold text-[#2A1810]">
                        📞 {order.customerPhone}
                      </div>
                      <div className="text-[#6E5648] leading-relaxed">
                        📍 {order.customerCity}
                      </div>
                    </div>

                    {/* Column 2: Ordered Vessels Breakdown (4 cols) */}
                    <div className="lg:col-span-4 bg-[#FAF6F0] p-4 rounded-2xl border border-[#2A1810]/10 space-y-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#6E5648] block">
                        Ordered Marachekku Vessels ({order.items?.length || 0})
                      </span>
                      <div className="divide-y divide-[#2A1810]/10 text-xs">
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-bold text-[#2A1810]">
                                {item.name}
                              </span>
                              <span className="ml-1.5 px-2 py-0.5 rounded bg-[#F3ECE1] text-[#D97706] font-bold text-[10px]">
                                {item.label} × {item.quantity}
                              </span>
                            </div>
                            <span className="font-bold text-[#2A1810] shrink-0">
                              ₹
                              {(item.unitPrice * item.quantity).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Fulfillment, Courier & AWB Tracking Updater (5 cols) */}
                    <div className="lg:col-span-5 bg-[#FAF6F0] p-4 rounded-2xl border border-[#D97706]/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D97706]">
                          Mill Dispatch & Tracking Control
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            edit.status === "Dispatched from Mill" ||
                            edit.status === "Delivered"
                              ? "bg-[#1F4E3D] text-white"
                              : edit.status === "Cancelled"
                              ? "bg-red-900 text-white"
                              : "bg-[#D97706]/20 text-[#2A1810]"
                          }`}
                        >
                          {edit.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Status Dropdown */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#6E5648] mb-1">
                            Order Status
                          </label>
                          <select
                            value={edit.status}
                            onChange={(e) =>
                              setTrackingEdits((prev) => ({
                                ...prev,
                                [order.id]: {
                                  ...edit,
                                  status: e.target.value as OrderStatus,
                                },
                              }))
                            }
                            className="w-full px-3 py-2 rounded-xl bg-[#F3ECE1] border border-[#2A1810]/15 text-xs font-bold text-[#2A1810] focus:outline-none focus:border-[#D97706]"
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Courier Partner Dropdown */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#6E5648] mb-1">
                            Courier Partner
                          </label>
                          <select
                            value={edit.courierName}
                            onChange={(e) =>
                              setTrackingEdits((prev) => ({
                                ...prev,
                                [order.id]: {
                                  ...edit,
                                  courierName: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3 py-2 rounded-xl bg-[#F3ECE1] border border-[#2A1810]/15 text-xs font-bold text-[#2A1810] focus:outline-none focus:border-[#D97706]"
                          >
                            {COURIER_PARTNERS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Tracking Number (AWB) Input */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#6E5648] mb-1">
                          AWB / Consignment Tracking Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., ST78492011TN or DLV9920184"
                          value={edit.trackingNumber}
                          onChange={(e) =>
                            setTrackingEdits((prev) => ({
                              ...prev,
                              [order.id]: {
                                ...edit,
                                trackingNumber: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-[#F3ECE1] border border-[#2A1810]/15 text-xs font-mono font-bold text-[#2A1810] focus:outline-none focus:border-[#D97706]"
                        />
                      </div>

                      {/* Save to Firestore + WhatsApp Dispatch Alert Buttons */}
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleSaveOrderFulfillment(order)}
                          disabled={isSaving}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-[#1C110A] hover:bg-[#D97706] text-[#FAF6F0] hover:text-[#1C110A] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>
                            {isSaving
                              ? "Saving to Firestore..."
                              : "Update Tracking & Status"}
                          </span>
                        </button>

                        <a
                          href={getCustomerDispatchWhatsAppLink(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3.5 rounded-xl bg-[#1F4E3D] hover:bg-[#16382C] text-[#FAF6F0] text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                          title="Send WhatsApp Tracking Alert to Patron"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-amber-300" />
                          <span>WhatsApp AWB</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}