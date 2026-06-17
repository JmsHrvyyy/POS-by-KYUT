import { useState, useEffect } from "react";
import { Navbar } from "../shared/Navbar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { getProductsByStore, addProduct } from "../../services/productService";
import { getOrdersByStore } from "../../services/orderService";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const MOCK_STAFF = [
  {
    name: "Maria Clara",
    role: "Head Cashier",
    email: "maria@store.com",
    status: "Active",
  },
  {
    name: "Juan Dela Cruz",
    role: "Junior Cashier",
    email: "juan@store.com",
    status: "On Break",
  },
  {
    name: "Leonor Rivera",
    role: "Staff",
    email: "leonor@store.com",
    status: "Inactive",
  },
];

const isMockStore = (id) => id?.startsWith("store_00");

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { activeStoreId, activeStoreName, userRole } = useAuth();

  // Role authorization redirect: Staff is not allowed to access the admin dashboard
  useEffect(() => {
    if (userRole === "staff") {
      navigate("/cashier/pos", { replace: true });
    }
  }, [userRole, navigate]);

  // ── Tab Navigation ────────────────────────────────────────────
  // Tatlo na ang pagpipilian ngayon: "inventory", "products", o "staff"
  const [mainTab, setMainTab] = useState("inventory");
  const [subTab, setSubTab] = useState("inventory");

  // ── Inventory & Products State ────────────────────────────────
  const [products, setProducts] = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isAddProdOpen, setIsAddProdOpen] = useState(false);
  const [prodError, setProdError] = useState("");
  const [prodSuccess, setProdSuccess] = useState("");
  const [savingProd, setSavingProd] = useState(false);

  // Dynamic categories array
  const [existingCategories, setExistingCategories] = useState([]);

  // Base state para sa paglikha ng bagong produkto
  const [newProduct, setNewProduct] = useState({
    name: "",
    selling_price: "",
    cost_price: "",
    stock_quantity: "",
    category: "",
    barcode_sku: "",
    image_url: "",
  });

  const [imageFile, setImageFile] = useState(null);

  // ── MGA BAGONG STATES PARA SA EDIT, RESTOCK, AT REMOVE ─────────
  const [selectedProduct, setSelectedProduct] = useState(null); // Lalagyan ng data ng piniling produkto
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockAmount, setRestockAmount] = useState("");

  // ── Staff State ───────────────────────────────────────────────
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState("Cashier");
  const [savingStaff, setSavingStaff] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffSuccess, setStaffSuccess] = useState("");
  const [invitationInfo, setInvitationInfo] = useState(null);

  // ── Toast State ───────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch products mula sa service
  const fetchProducts = async () => {
    if (!activeStoreId) {
      setProducts([]);
      setLoadingProds(false);
      return;
    }
    try {
      setLoadingProds(true);
      const data = await getProductsByStore(activeStoreId);
      setProducts(data);
    } catch (err) {
      console.error("fetchProducts:", err);
      showToast("Hindi maikarga ang mga produkto.", "error");
    } finally {
      setLoadingProds(false);
    }
  };

  const fetchOrders = async () => {
    if (!activeStoreId) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }
    if (isMockStore(activeStoreId)) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }
    try {
      setLoadingOrders(true);
      const data = await getOrdersByStore(activeStoreId);
      setOrders(data);
    } catch (err) {
      console.error("fetchOrders:", err);
      showToast("Hindi maikarga ang mga orders.", "error");
    } finally {
      setLoadingOrders(false);
    }
  };

  const [storeName, setStoreName] = useState("Ikinakarga...");
  const [storeDetails, setStoreDetails] = useState({ name: "", industry: "", address: "", contact: "", currency: "PHP" });
  const [loadingStoreDetails, setLoadingStoreDetails] = useState(false);
  const [savingStoreDetails, setSavingStoreDetails] = useState(false);

  useEffect(() => {
    const fetchStoreName = async () => {
      if (!activeStoreId) {
        setStoreName("Walang Aktibong Tindahan");
        setStoreDetails({ name: "", industry: "", address: "", contact: "", currency: "PHP" });
        return;
      }
      if (isMockStore(activeStoreId)) {
        setStoreName("Demo Branch Store");
        setStoreDetails({ name: "Demo Branch Store", industry: "Retail", address: "", contact: "", currency: "PHP" });
        return;
      }
      try {
        setLoadingStoreDetails(true);
        // Hihilahin ang dokumento ng tindahan mula sa 'stores' collection
        const storeDocRef = doc(db, "stores", activeStoreId);
        const storeDocSnap = await getDoc(storeDocRef);

        if (storeDocSnap.exists()) {
          const data = storeDocSnap.data();
          setStoreName(data.name || "Tindahan (Walang Pangalan)");
          setStoreDetails({
            name: data.name || "",
            industry: data.industry || "",
            address: data.address || "",
            contact: data.contact || "",
            currency: data.currency || "PHP",
          });
        } else {
          setStoreName("Tindahan (Walang Pangalan)");
        }
      } catch (err) {
        console.error("Error fetching store name:", err);
        setStoreName("Error sa Pag-load");
      } finally {
        setLoadingStoreDetails(false);
      }
    };

    fetchStoreName();
  }, [activeStoreId]);

  const handleSaveStoreDetails = async (e) => {
    e?.preventDefault();
    if (!activeStoreId || isMockStore(activeStoreId)) {
      showToast("Hindi pwedeng i-save sa demo mode.", "error");
      return;
    }
    try {
      setSavingStoreDetails(true);
      const docRef = doc(db, "stores", activeStoreId);
      await updateDoc(docRef, {
        name: storeDetails.name,
        industry: storeDetails.industry,
        address: storeDetails.address,
        contact: storeDetails.contact,
        currency: storeDetails.currency,
        updated_at: serverTimestamp(),
      });
      setStoreName(storeDetails.name);
      showToast("Tindahan na-update nang matagumpay.");
    } catch (err) {
      console.error("Error saving store details:", err);
      showToast("Hindi na-save ang mga setting.", "error");
    } finally {
      setSavingStoreDetails(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [activeStoreId]);

  // Awtomatikong kalkulahin ang unique categories para sa datalist dropdown
  useEffect(() => {
    if (products && products.length > 0) {
      const cats = products
        .map((p) => p.category)
        .filter((cat) => cat && cat.trim() !== "");
      setExistingCategories([...new Set(cats)]);
    } else {
      setExistingCategories([]);
    }
  }, [products]);

  // Fetch staff list
  const fetchStaff = async () => {
    if (!activeStoreId) {
      setStaffList([]);
      setLoadingStaff(false);
      return;
    }
    if (isMockStore(activeStoreId)) {
      setStaffList(MOCK_STAFF);
      setLoadingStaff(false);
      return;
    }
    try {
      setLoadingStaff(true);
      const snap = await getDocs(
        query(
          collection(db, "store_staff"),
          where("store_id", "==", activeStoreId),
        ),
      );
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setStaffList(list);
    } catch (err) {
      console.error("fetchStaff:", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [activeStoreId]);

  // Limitahan ang laki ng file attachment
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setProdError(
          "Masyadong malaki ang imahe. Pumili ng file na mas mababa sa 2MB.",
        );
        return;
      }
      setImageFile(file);
      setProdError("");
    }
  };

  // Action: Add Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setProdError("");
    setProdSuccess("");

    if (!newProduct.name.trim()) {
      setProdError("Kinakailangan ang pangalan ng produkto.");
      return;
    }
    if (!newProduct.category.trim()) {
      setProdError("Mangyaring maglagay o pumili ng kategorya.");
      return;
    }

    const sellingPrice = parseFloat(newProduct.selling_price);
    const costPrice = parseFloat(newProduct.cost_price);
    const stockQty = parseInt(newProduct.stock_quantity, 10);

    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      setProdError("Maglagay ng valid na benta (selling price).");
      return;
    }
    if (isNaN(costPrice) || costPrice < 0) {
      setProdError("Maglagay ng valid na puhunan (cost price).");
      return;
    }
    if (isNaN(stockQty) || stockQty < 0) {
      setProdError("Maglagay ng valid na stock quantity.");
      return;
    }

    try {
      setSavingProd(true);
      let finalImageUrl = imageFile ? "pending_storage_upload_token" : "";

      const productPayload = {
        name: newProduct.name.trim(),
        selling_price: sellingPrice,
        cost_price: costPrice,
        stock_quantity: stockQty,
        category: newProduct.category.trim(),
        barcode_sku: newProduct.barcode_sku.trim() || "N/A",
        image_url: finalImageUrl,
      };

      const created = await addProduct(productPayload, activeStoreId);
      setProducts((prev) => [...prev, created]);
      showToast("Matagumpay na naidagdag ang produkto!");

      setNewProduct({
        name: "",
        selling_price: "",
        cost_price: "",
        stock_quantity: "",
        category: "",
        barcode_sku: "",
        image_url: "",
      });
      setImageFile(null);
      setIsAddProdOpen(false);
    } catch (err) {
      console.error(err);
      setProdError("May naganap na error sa pag-save.");
    } finally {
      setSavingProd(false);
    }
  };

  // LOHIKA: Mag-Restock ng Produkto (Idadagdag sa lumang stock)
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    const addedStock = parseInt(restockAmount, 10);
    if (isNaN(addedStock) || addedStock <= 0) {
      alert("Mangyaring maglagay ng bilang na mas mataas sa 0.");
      return;
    }

    try {
      setSavingProd(true);
      const newTotalStock = selectedProduct.stock_quantity + addedStock;

      // I-update sa Firestore cloud
      const docRef = doc(db, "products", selectedProduct.id);
      await updateDoc(docRef, { stock_quantity: newTotalStock });

      // I-update ang UI local state nang hindi na nagre-reload ang buong pahina
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, stock_quantity: newTotalStock }
            : p,
        ),
      );

      showToast(
        `Matagumpay na nadagdagan ng +${addedStock} stocks si ${selectedProduct.name}!`,
      );
      setIsRestockOpen(false);
      setRestockAmount("");
    } catch (err) {
      console.error(err);
      showToast("Hindi ma-save ang restock stock.", "error");
    } finally {
      setSavingProd(false);
    }
  };

  // LOHIKA: Pag-save ng In-edit na Detalye ng Produkto
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct.name.trim() || !selectedProduct.category.trim()) {
      alert("Huwag iwanang blanko ang pangalan at kategorya.");
      return;
    }

    try {
      setSavingProd(true);
      const docRef = doc(db, "products", selectedProduct.id);

      const updatedData = {
        name: selectedProduct.name.trim(),
        category: selectedProduct.category.trim(),
        barcode_sku: selectedProduct.barcode_sku.trim() || "N/A",
        cost_price: parseFloat(selectedProduct.cost_price) || 0,
        selling_price: parseFloat(selectedProduct.selling_price) || 0,
        stock_quantity: parseInt(selectedProduct.stock_quantity, 10) || 0,
      };

      await updateDoc(docRef, updatedData);

      // Sinkronisasyon sa local state UI
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? { ...p, ...updatedData } : p,
        ),
      );

      showToast("Na-update nang matagumpay ang mga detalye!");
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Nagka-error sa pag-edit.", "error");
    } finally {
      setSavingProd(false);
    }
  };

  // LOHIKA: Pagbura ng Produkto sa Firestore Database
  const handleDeleteProduct = async (product) => {
    const seguro = window.confirm(
      `Sigurado ka bang nais mong tuluyang burahin si "${product.name}" sa imbentaryo? Hindi na ito mababawi.`,
    );
    if (!seguro) return;

    try {
      const docRef = doc(db, "products", product.id);
      await deleteDoc(docRef);

      // Alisin sa screen filter array
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`Tinanggal na si ${product.name} sa system.`);
    } catch (err) {
      console.error(err);
      showToast("Hindi nabura ang produkto.", "error");
    }
  };

  // Add Staff Function
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setStaffError("");
    setStaffSuccess("");
    if (!staffEmail.trim()) {
      setStaffError("Kinakailangan ang email ng staff.");
      return;
    }
    if (isMockStore(activeStoreId)) {
      setStaffList((prev) => [
        ...prev,
        {
          name: staffEmail.split("@")[0].toUpperCase(),
          role: staffRole,
          email: staffEmail,
          status: "Active",
        },
      ]);
      showToast("Naidagdag ang staff (Mock Mode)!");
      setIsAddStaffOpen(false);

      const signupLink = `${window.location.origin}/signup`;
      setInvitationInfo({
        email: staffEmail.trim(),
        exists: false,
        subject: "Imbitasyon sa POS-by-KYUT (Demo)",
        body: `Kamusta!\n\nInaanyayahan ka naming maging staff para sa aming tindahan (Store ID: ${activeStoreId}).\n\nDahil wala ka pang account sa aming system, mangyaring gumawa muna ng account bilang Staff/Cashier gamit ang link na ito:\n${signupLink}\n\nGamitin ang email na ito sa pag-signup para ma-link ang iyong account sa aming tindahan.\n\nSalamat!`,
      });
      setStaffEmail("");
      return;
    }
    try {
      setSavingStaff(true);

      // Check duplicates by email
      const dupeSnap = await getDocs(
        query(
          collection(db, "store_staff"),
          where("store_id", "==", activeStoreId),
          where("email", "==", staffEmail.trim()),
        ),
      );
      if (!dupeSnap.empty) {
        setStaffError(
          "Ang staff na ito ay nakatalaga na rito (o may pending invite).",
        );
        return;
      }

      // Check if user account already exists in DB
      const userSnap = await getDocs(
        query(collection(db, "users"), where("email", "==", staffEmail.trim())),
      );

      let foundUser = null;
      userSnap.forEach((d) => {
        foundUser = { uid: d.id, ...d.data() };
      });

      let staffPayload = {};
      let signupInstructions = "";
      let emailSubject = "";
      let hasAccount = false;

      if (!foundUser) {
        // User does not exist - add as Pending
        staffPayload = {
          store_id: activeStoreId,
          cashier_id: "pending",
          name: staffEmail.split("@")[0],
          email: staffEmail.trim(),
          role: staffRole,
          status: "Pending",
          created_at: serverTimestamp(),
        };

        emailSubject = "Imbitasyon sa POS-by-KYUT";
        signupInstructions = `Kamusta!\n\nInaanyayahan ka naming maging staff para sa aming tindahan (Store ID: ${activeStoreId}).\n\nDahil wala ka pang account sa aming system, mangyaring gumawa muna ng account bilang Staff/Cashier gamit ang link na ito:\n${window.location.origin}/signup\n\nSiguraduhing gamitin ang email na ito sa pag-signup para ma-link ang iyong account sa aming tindahan.\n\nSalamat!`;
      } else {
        // User exists
        if (foundUser.global_role !== "staff") {
          setStaffError(
            "Ang account na ito ay rehistrado pero hindi Staff (Manager/Owner ito).",
          );
          return;
        }

        hasAccount = true;
        staffPayload = {
          store_id: activeStoreId,
          cashier_id: foundUser.uid,
          name: foundUser.name ?? staffEmail.split("@")[0],
          email: staffEmail.trim(),
          role: staffRole,
          status: "Active",
          created_at: serverTimestamp(),
        };

        emailSubject = "Itinalaga ka bilang Staff sa POS-by-KYUT";
        signupInstructions = `Kamusta!\n\nItinalaga ka na bilang staff para sa aming tindahan (Store ID: ${activeStoreId}).\n\nMangyaring mag-login sa iyong account dito para simulan ang paggamit ng POS:\n${window.location.origin}/login\n\nSalamat!`;
      }

      const docRef = await addDoc(collection(db, "store_staff"), staffPayload);

      setStaffList((prev) => [
        ...prev,
        {
          id: docRef.id,
          ...staffPayload,
        },
      ]);

      showToast(`Matagumpay na naidagdag si ${staffPayload.name}!`);
      setIsAddStaffOpen(false);

      // Display the instructions modal to copy / send email
      setInvitationInfo({
        email: staffEmail.trim(),
        exists: hasAccount,
        subject: emailSubject,
        body: signupInstructions,
      });

      setStaffEmail("");
    } catch (err) {
      console.error(err);
      setStaffError("May naganap na error habang nagdadagdag ng staff.");
    } finally {
      setSavingStaff(false);
    }
  };

  // Change Staff Role in Database or local mock state
  const handleUpdateStaffRole = async (staff, newRole) => {
    if (isMockStore(activeStoreId)) {
      setStaffList((prev) =>
        prev.map((s) =>
          s.email === staff.email ? { ...s, role: newRole } : s,
        ),
      );
      showToast(`Role ng staff na si ${staff.name} ay binago sa ${newRole}!`);
      return;
    }

    try {
      const docRef = doc(db, "store_staff", staff.id);
      await updateDoc(docRef, { role: newRole });
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, role: newRole } : s)),
      );
      showToast(`Role ng staff na si ${staff.name} ay binago sa ${newRole}!`);
    } catch (err) {
      console.error("handleUpdateStaffRole error:", err);
      showToast("Hindi ma-update ang role ng staff.", "error");
    }
  };

  const lowStockCount = products.filter((p) => p.stock_quantity <= 10).length;
  const activeStaffCount = staffList.filter(
    (s) => s.status === "Active",
  ).length;

  const stats = [
    {
      name: "Mga Produkto",
      value: `${products.length} items`,
      sub: `${lowStockCount} kailangang i-restock`,
      colorClass: "text-[#F97316] bg-[#F97316]/10",
    },
    {
      name: "Staff sa Branch",
      value: `${staffList.length} katao`,
      sub: `${activeStaffCount} aktibo ngayon`,
      colorClass: "text-[#57534E] bg-[#57534E]/10",
    },
    // Stats Card Configuration
    {
      name: "Pangalan ng Tindahan",
      value: storeName, // Ipapakita ang totoong pangalan ng branch o tindahan
      sub: isMockStore(activeStoreId)
        ? "Demo Mode"
        : `ID: ${activeStoreId?.slice(0, 6)}...`, // Itatago ang mahabang ID sa maliit na subtext sa ilalim
      colorClass: "text-[#064E3B] bg-[#064E3B]/10",
    },
  ];

  // ── NA-UPDATE NA TABS MENU (May gitnang Product Manager Tab) ──
  const innerTabs = [
    {
      key: "inventory",
      label: "Imbentaryo View",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
    {
      key: "products",
      label: "Pamahalaan / Actions",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    {
      key: "staff",
      label: "Staff",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#0C0A09]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#064E3B] tracking-tight">
              Admin Operations Dashboard
            </h1>
            <p className="text-sm text-[#57534E] mt-1">
              Kontrolado mo ang imbentaryo, pag-restock, at cashier access rito.
            </p>
          </div>
          {activeStoreId && (
            <div className="flex items-center gap-2 bg-[#064E3B]/10 text-[#064E3B] border border-[#064E3B]/20 px-4 py-2.5 rounded-xl text-xs font-sans font-bold self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B] animate-ping" />
              {storeName}{" "}
              {/* Ito na ang gagamit ng totoong pangalan ng store */}
            </div>
          )}
        </header>

        {/* Main Tabs Nav */}
        <div className="mb-6">
          <div className="flex gap-2">
            <button onClick={() => setMainTab("inventory")} className={`px-3 py-2 rounded-xl text-sm font-bold ${mainTab === "inventory" ? "bg-white text-[#064E3B] border border-[#064E3B]/10" : "text-[#57534E]"}`}>
              Inventory
            </button>
            <button onClick={() => setMainTab("analytics")} className={`px-3 py-2 rounded-xl text-sm font-bold ${mainTab === "analytics" ? "bg-white text-[#064E3B] border border-[#064E3B]/10" : "text-[#57534E]"}`}>
              Analytics
            </button>
            <button onClick={() => setMainTab("settings")} className={`px-3 py-2 rounded-xl text-sm font-bold ${mainTab === "settings" ? "bg-white text-[#064E3B] border border-[#064E3B]/10" : "text-[#57534E]"}`}>
              Settings
            </button>
          </div>
        </div>

        {mainTab === "analytics" && (
          <AnalyticsSection
            products={products}
            orders={orders}
            isMock={isMockStore(activeStoreId)}
            loading={loadingProds || loadingOrders}
          />
        )}

        {mainTab === "settings" && (
          <div className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm mb-8">
            <h3 className="text-lg font-bold text-[#064E3B]">Store Settings</h3>
            <p className="text-xs text-[#57534E] mb-4">I-update ang pangalan, industriya, address, contact at currency ng tindahan.</p>
            <form onSubmit={handleSaveStoreDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Pangalan ng Tindahan</label>
                <input className="w-full px-4 py-2 border rounded-xl text-sm" value={storeDetails.name} onChange={(e)=>setStoreDetails({...storeDetails,name:e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Industriya</label>
                <input className="w-full px-4 py-2 border rounded-xl text-sm" value={storeDetails.industry} onChange={(e)=>setStoreDetails({...storeDetails,industry:e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Address</label>
                <input className="w-full px-4 py-2 border rounded-xl text-sm" value={storeDetails.address} onChange={(e)=>setStoreDetails({...storeDetails,address:e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Contact</label>
                <input className="w-full px-4 py-2 border rounded-xl text-sm" value={storeDetails.contact} onChange={(e)=>setStoreDetails({...storeDetails,contact:e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Currency</label>
                <input className="w-full px-4 py-2 border rounded-xl text-sm" value={storeDetails.currency} onChange={(e)=>setStoreDetails({...storeDetails,currency:e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{ /* cancel */ }} className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-[#57534E]">Kanselahin</button>
                <button type="submit" disabled={savingStoreDetails} className="flex-1 py-2.5 bg-[#064E3B] text-white rounded-xl text-xs font-bold">{savingStoreDetails?"Ise-save...":"I-save"}</button>
              </div>
            </form>
          </div>
        )}

        {mainTab === "inventory" && (
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                {stat.name}
              </p>
              <h3 className="text-2xl font-extrabold text-[#0C0A09] mt-1">
                {stat.value}
              </h3>
              <span
                className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-2 ${stat.colorClass}`}
              >
                {stat.sub}
              </span>
            </div>
          ))}
        </div>
        )}

        {/* Dynamic Control Panel Grid */}
        <div className="bg-white rounded-2xl border border-[#57534E]/15 shadow-sm overflow-hidden">
          {/* Tabs Control Line */}
          <div className="flex border-b border-[#57534E]/10 bg-[#FAFAF9]/60 px-4 pt-3 gap-1">
            {innerTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSubTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 -mb-px cursor-pointer ${
                  subTab === tab.key
                    ? "border-[#064E3B] text-[#064E3B] bg-white"
                    : "border-transparent text-[#57534E]/70 hover:text-[#57534E]"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* VIEW TAB: Inventory Preview List */}
          {mainTab === "inventory" && subTab === "inventory" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#064E3B]">
                    Imbentaryo View
                  </h3>
                  <p className="text-xs text-[#57534E]">
                    Monitor ng kasalukuyang bilang ng paninda.
                  </p>
                </div>
                {activeStoreId && (
                  <button
                    onClick={() => setIsAddProdOpen(true)}
                    className="px-3.5 py-2 bg-[#064E3B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    + Bagong Produkto
                  </button>
                )}
              </div>

              {loadingProds ? (
                <div className="text-center py-10 text-xs">Ikinakarga...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#57534E]">
                  Walang produkto.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#57534E]/10 text-[#57534E] uppercase text-[10px]">
                        <th className="pb-3">Pangalan</th>
                        <th className="pb-3">Kategorya</th>
                        <th className="pb-3">Presyo</th>
                        <th className="pb-3 text-right">Dami ng Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#57534E]/5">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAFAF9]/50">
                          <td className="py-3.5 font-bold">{p.name}</td>
                          <td className="py-3.5 text-[#57534E]">
                            {p.category}
                          </td>
                          <td className="py-3.5 text-[#064E3B] font-extrabold">
                            ₱{p.selling_price?.toFixed(2)}
                          </td>
                          <td className="py-3.5 text-right font-bold">
                            {p.stock_quantity} units
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── BAGONG TAB VIEW: PRODUCTS MANAGEMENT ACTIONS (RESTOCK / EDIT / REMOVE) ── */}
          {mainTab === "inventory" && subTab === "products" && (
            <div className="p-6">
              <div>
                <h3 className="text-lg font-bold text-[#064E3B]">
                  Pamamahala at Pag-update
                </h3>
                <p className="text-xs text-[#57534E] mb-6">
                  Dito ka magre-restock, mag-e-edit ng detalye, o magbubura ng
                  aytem.
                </p>
              </div>

              {loadingProds ? (
                <div className="text-center py-10 text-xs">Ikinakarga...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#57534E]">
                  Walang produkto na pwedeng i-modify.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#57534E]/10 text-[#57534E] uppercase text-[10px] tracking-wider">
                        <th className="pb-3 font-bold">Produkto</th>
                        <th className="pb-3 font-bold">Puhunan / Benta</th>
                        <th className="pb-3 font-bold">Kasalukuyang Stock</th>
                        <th className="pb-3 font-bold text-center">
                          Mga Aksyon
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#57534E]/5">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAFAF9]/40">
                          <td className="py-4">
                            <p className="font-bold text-[#0C0A09]">{p.name}</p>
                            <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                              {p.barcode_sku}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="text-stone-500">
                              P: ₱{p.cost_price?.toFixed(2)}
                            </span>
                            <p className="text-[#064E3B] font-bold">
                              B: ₱{p.selling_price?.toFixed(2)}
                            </p>
                          </td>
                          <td className="py-4 font-mono font-bold">
                            {p.stock_quantity <= 10 ? (
                              <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-[11px]">
                                Mababa ({p.stock_quantity})
                              </span>
                            ) : (
                              <span className="text-[#57534E]">
                                {p.stock_quantity} units
                              </span>
                            )}
                          </td>
                          {/* Dito nakapaloob ang hiningi mong dynamic features (Restock, Edit, at Remove) */}
                          <td className="py-4 text-center">
                            <div className="inline-flex gap-2">
                              {/* 1. Restock Trigger */}
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setIsRestockOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] font-bold rounded-lg text-[11px] transition cursor-pointer"
                              >
                                Restock
                              </button>
                              {/* 2. Edit Details Trigger */}
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setIsEditOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-[11px] transition cursor-pointer"
                              >
                                Edit
                              </button>
                              {/* 3. Remove Button */}
                              <button
                                onClick={() => handleDeleteProduct(p)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] transition cursor-pointer"
                              >
                                Burahin
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* STAFF TAB VIEW */}
          {mainTab === "inventory" && subTab === "staff" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#064E3B]">
                    Mga Staff
                  </h3>
                  <p className="text-xs text-[#57534E]">
                    Cashiers na pwedeng pumasok sa branch na ito.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddStaffOpen(true)}
                  className="px-3.5 py-2 bg-[#064E3B] text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  + Bagong Staff
                </button>
              </div>
              {/* Staff Table Layout */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#57534E]/10 text-[#57534E] uppercase text-[10px]">
                      <th className="pb-3">Pangalan</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#57534E]/5">
                    {staffList.map((s, i) => (
                      <tr key={i}>
                        <td className="py-3.5 font-bold">{s.name}</td>
                        <td className="py-3.5 text-[#57534E] font-medium">
                          <select
                            value={s.role}
                            onChange={(e) =>
                              handleUpdateStaffRole(s, e.target.value)
                            }
                            className="bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-[#064E3B] cursor-pointer"
                          >
                            <option value="Cashier">Cashier</option>
                            <option value="Head Cashier">Head Cashier</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3.5 text-[#57534E] font-mono">
                          {s.email}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              s.status === "Active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {s.status || "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: MAGDAGDAG NG BAGONG PRODUKTO (Original) ── */}
      {isAddProdOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#57534E]/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#064E3B]">
                Magdagdag ng Produkto
              </h2>
              <button
                onClick={() => setIsAddProdOpen(false)}
                className="p-1.5 text-[#57534E] cursor-pointer"
              >
                ✕
              </button>
            </div>
            {prodError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs mb-4">
                {prodError}
              </div>
            )}
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  Pangalan ng Produkto
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-xl text-sm"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Kategorya
                  </label>
                  <input
                    type="text"
                    required
                    list="categories-list"
                    className="w-full px-4 py-2 border rounded-xl text-sm bg-white"
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, category: e.target.value })
                    }
                  />
                  <datalist id="categories-list">
                    {existingCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Barcode / SKU
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-xl text-sm"
                    value={newProduct.barcode_sku}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        barcode_sku: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Puhunan (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border rounded-xl text-sm"
                    value={newProduct.cost_price}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        cost_price: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Benta (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border rounded-xl text-sm"
                    value={newProduct.selling_price}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        selling_price: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Dami (Stock)
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border rounded-xl text-sm"
                    value={newProduct.stock_quantity}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        stock_quantity: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  Imahe ng Produkto (Attachment)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-xs"
                  onChange={handleFileChange}
                />
                {imageFile && (
                  <p className="text-xs text-emerald-700 mt-1">
                    ✓ Attached: {imageFile.name}
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddProdOpen(false)}
                  className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-[#57534E]"
                >
                  Kanselahin
                </button>
                <button
                  type="submit"
                  disabled={savingProd}
                  className="flex-1 py-2.5 bg-[#064E3B] text-white rounded-xl text-xs font-bold"
                >
                  {savingProd ? "Ipinapasok..." : "Likhain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL FOR RESTOCK ACTION ── */}
      {isRestockOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#57534E]/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-md font-bold text-[#064E3B]">
                Mag-restock ng Imbentaryo
              </h2>
              <button
                onClick={() => {
                  setIsRestockOpen(false);
                  setSelectedProduct(null);
                }}
                className="text-xs font-bold text-stone-400"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 mb-3">
              Produkto:{" "}
              <strong className="text-stone-900">{selectedProduct.name}</strong>
              <br />
              Kasalukuyang laman:{" "}
              <strong className="text-stone-900">
                {selectedProduct.stock_quantity} units
              </strong>
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-stone-500">
                  Ilang piraso ang idadagdag?
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Halimbawa: 50"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#064E3B] text-sm font-mono"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRestockOpen(false);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-[#57534E]"
                >
                  Kanselahin
                </button>
                <button
                  type="submit"
                  disabled={savingProd}
                  className="flex-1 py-2.5 bg-[#064E3B] text-white rounded-xl text-xs font-bold"
                >
                  {savingProd ? "Ina-update..." : "I-save Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL FOR EDIT ACTION ── */}
      {isEditOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[#064E3B]">
                I-edit ang Detalye ng Produkto
              </h2>
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedProduct(null);
                }}
                className="text-stone-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Pangalan ng Produkto
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-xl text-sm"
                  value={selectedProduct.name}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              {/* Category & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Kategorya
                  </label>
                  <input
                    type="text"
                    required
                    list="edit-categories"
                    className="w-full px-4 py-2 border rounded-xl text-sm bg-white"
                    value={selectedProduct.category}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        category: e.target.value,
                      })
                    }
                  />
                  <datalist id="edit-categories">
                    {existingCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Barcode / SKU
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-xl text-sm"
                    value={selectedProduct.barcode_sku}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        barcode_sku: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Price Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Puhunan (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border rounded-xl text-sm"
                    value={selectedProduct.cost_price}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        cost_price: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Benta (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border rounded-xl text-sm"
                    value={selectedProduct.selling_price}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        selling_price: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Dami (Stock Qty)
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border rounded-xl text-sm"
                    value={selectedProduct.stock_quantity}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        stock_quantity: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-[#57534E]"
                >
                  Kanselahin
                </button>
                <button
                  type="submit"
                  disabled={savingProd}
                  className="flex-1 py-2.5 bg-[#064E3B] text-white rounded-xl text-xs font-bold"
                >
                  {savingProd ? "Inililigtas..." : "I-save Pagbabago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF MODAL (Original) */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-[#57534E]/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#064E3B]">
                Magdagdag ng Staff
              </h2>
              <button
                onClick={() => setIsAddStaffOpen(false)}
                className="text-stone-400"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  Email ng Staff
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border rounded-xl text-sm"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Role</label>
                <select
                  className="w-full px-4 py-2 border rounded-xl text-sm bg-white"
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                >
                  <option value="Cashier">Cashier</option>
                  <option value="Head Cashier">Head Cashier</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-[#57534E]"
                >
                  Kanselahin
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#064E3B] text-white rounded-xl text-xs font-bold"
                >
                  Idagdag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: STAFF INVITATION INSTRUCTIONS ── */}
      {invitationInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#064E3B]">
                {invitationInfo.exists
                  ? "Itinalaga bilang Staff"
                  : "Imbitasyon sa Staff"}
              </h2>
              <button
                onClick={() => setInvitationInfo(null)}
                className="text-stone-400 font-bold hover:text-stone-600 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed">
                {invitationInfo.exists ? (
                  <>
                    Ang email na{" "}
                    <strong className="text-stone-900">
                      {invitationInfo.email}
                    </strong>{" "}
                    ay mayroon nang account. Maaari mo silang padalhan ng abiso
                    na mag-login sa kanilang account para magbukas ang POS.
                  </>
                ) : (
                  <>
                    Ang email na{" "}
                    <strong className="text-stone-900">
                      {invitationInfo.email}
                    </strong>{" "}
                    ay wala pang account. Mangyaring ipadala ang mga sumusunod
                    na tagubilin upang magrehistro sila bilang staff sa inyong
                    tindahan.
                  </>
                )}
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">
                  Mensahe / Tagubilin
                </label>
                <textarea
                  readOnly
                  rows="8"
                  value={invitationInfo.body}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-sans leading-relaxed focus:outline-none resize-none text-stone-700"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(invitationInfo.body);
                    showToast("Mensahe ay nakopya na sa clipboard!");
                  }}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition cursor-pointer text-center"
                >
                  Kopyahin ang Mensahe
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const subject = encodeURIComponent(invitationInfo.subject);
                    const body = encodeURIComponent(invitationInfo.body);
                    window.open(
                      `mailto:${invitationInfo.email}?subject=${subject}&body=${body}`,
                      "_blank",
                    );
                  }}
                  className="flex-1 py-2.5 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white rounded-xl text-xs font-bold transition cursor-pointer text-center"
                >
                  Ipadala via Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST SYSTEM (Original) */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold ${
            toast.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

// ─── I-PASTE ITO SA PINAKADULONG BAHAGI NG FILE (PAREHONG FILE) ───

const COLORS = ["#064E3B", "#047857", "#10B981", "#34D399", "#A7F3D0"];

const MOCK_SALES_DATA = [
  { date: "Mon", benta: 4200 },
  { date: "Tue", benta: 5100 },
  { date: "Wed", benta: 3800 },
  { date: "Thu", benta: 6200 },
  { date: "Fri", benta: 7500 },
  { date: "Sat", benta: 8900 },
  { date: "Sun", benta: 9400 },
];

const MOCK_TOP_PRODUCTS = [
  { name: "Coca-Cola 1.5L", sold: 120 },
  { name: "White Bread", sold: 85 },
  { name: "Instant Noodles", sold: 74 },
  { name: "Kape Barako", sold: 50 },
  { name: "Sardines", sold: 42 },
];

const MOCK_STOCK_DISTRIBUTION = [
  { name: "Soda", value: 40 },
  { name: "Bakery", value: 25 },
  { name: "Chips", value: 20 },
  { name: "Noodles", value: 15 },
  { name: "Coffee", value: 10 },
];

const AnalyticsSection = ({ products = [], orders = [], isMock = false, loading = false }) => {
  // 1. Loading state with premium shimmer animation
  if (loading) {
    return (
      <div className="space-y-6 my-6 animate-pulse">
        {/* Large chart skeleton */}
        <div className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm h-80 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-stone-200 rounded w-1/4"></div>
            <div className="h-3 bg-stone-100 rounded w-1/3"></div>
          </div>
          <div className="h-48 bg-stone-50 rounded-xl w-full flex items-center justify-center">
            <span className="text-xs text-stone-400 font-semibold animate-pulse">Inihahanda ang ulat ng benta...</span>
          </div>
        </div>
        {/* Two smaller charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm h-72 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-stone-200 rounded w-1/3"></div>
              <div className="h-3 bg-stone-100 rounded w-1/2"></div>
            </div>
            <div className="h-40 bg-stone-50 rounded-xl w-full flex items-center justify-center">
              <span className="text-xs text-stone-400 font-semibold">Inilalagay ang mga produkto...</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm h-72 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-stone-200 rounded w-1/3"></div>
              <div className="h-3 bg-stone-100 rounded w-1/2"></div>
            </div>
            <div className="h-40 bg-stone-50 rounded-xl w-full flex items-center justify-center">
              <span className="text-xs text-stone-400 font-semibold">Kinakalkula ang imbentaryo...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to extract date
  const getOrderDate = (order) => {
    if (order.created_at?.toDate) {
      return order.created_at.toDate();
    }
    if (order.created_at) {
      return new Date(order.created_at);
    }
    return null;
  };

  // Determine which data to use (mock fallback if isMock or database is completely empty)
  const isDatabaseEmpty = products.length === 0 && orders.length === 0;
  const useMock = isMock || isDatabaseEmpty;

  // 2. Data Calculation
  let salesData = MOCK_SALES_DATA;
  let topProducts = MOCK_TOP_PRODUCTS;
  let stockDistribution = MOCK_STOCK_DISTRIBUTION;

  if (!useMock) {
    // ── A. Compute Sales Performance (Last 7 Days ending today) ──
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        date: daysOfWeek[d.getDay()],
        dateStr: d.toDateString(),
        benta: 0,
      });
    }

    orders.forEach((order) => {
      const oDate = getOrderDate(order);
      if (!oDate) return;
      const oDateStr = oDate.toDateString();
      const matchedDay = last7Days.find((day) => day.dateStr === oDateStr);
      if (matchedDay) {
        matchedDay.benta += Number(order.total) || 0;
      }
    });
    salesData = last7Days.map(({ date, benta }) => ({ date, benta }));

    // ── B. Compute Top Products (by aggregated sold quantity) ──
    const productSoldCounts = {};
    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const name = item.name || "Unknown Product";
          const qty = Number(item.quantity) || 0;
          productSoldCounts[name] = (productSoldCounts[name] || 0) + qty;
        });
      }
    });

    const sortedProducts = Object.keys(productSoldCounts).map((name) => ({
      name,
      sold: productSoldCounts[name],
    }));
    sortedProducts.sort((a, b) => b.sold - a.sold);
    topProducts = sortedProducts.slice(0, 5);

    // ── C. Compute Stock Distribution by Category (percentages) ──
    const categoryStockSums = {};
    let totalStock = 0;
    products.forEach((p) => {
      const cat = p.category || "Iba pa";
      const stockVal = Number(p.stock_quantity) || 0;
      categoryStockSums[cat] = (categoryStockSums[cat] || 0) + stockVal;
      totalStock += stockVal;
    });

    let distributionArr = Object.keys(categoryStockSums).map((cat) => ({
      name: cat,
      value: categoryStockSums[cat],
    }));

    // If all stocks are 0, group by product counts instead so chart isn't empty
    if (totalStock === 0 && products.length > 0) {
      const categoryCounts = {};
      products.forEach((p) => {
        const cat = p.category || "Iba pa";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      distributionArr = Object.keys(categoryCounts).map((cat) => ({
        name: cat,
        value: categoryCounts[cat],
      }));
    }

    distributionArr.sort((a, b) => b.value - a.value);

    // Keep top 4 and bundle the rest to 'Iba pa'
    if (distributionArr.length > 5) {
      const top4 = distributionArr.slice(0, 4);
      const rest = distributionArr.slice(4);
      const restSum = rest.reduce((sum, item) => sum + item.value, 0);
      top4.push({ name: "Iba pa", value: restSum });
      distributionArr = top4;
    }

    // Convert values to percentage ratios
    const sumVal = distributionArr.reduce((sum, item) => sum + item.value, 0);
    stockDistribution = distributionArr
      .map((item) => ({
        name: item.name,
        value: sumVal > 0 ? Math.round((item.value / sumVal) * 100) : 0,
      }))
      .filter((item) => item.value > 0);
  }

  return (
    <div className="space-y-6 my-6">
      {/* CARD 1: Sales Analytics */}
      <div className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-extrabold text-[#064E3B] uppercase tracking-wider">
              Ulat ng Benta (Sales Performance)
            </h3>
            <p className="text-xs text-[#57534E]">
              {useMock
                ? "Visual na takbo ng kabuuang kita ngayong linggo (Demo Data)"
                : "Visual na takbo ng kabuuang kita ngayong linggo (Live Data)"}
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider ${
            useMock 
              ? "text-[#F97316] bg-amber-50 border border-amber-200"
              : "text-[#064E3B] bg-emerald-50 border border-emerald-200"
          }`}>
            {useMock ? "Demo" : "Live"}
          </span>
        </div>
        <div className="h-64 w-full">
          {salesData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#57534E]">
              Walang data ng benta sa kasalukuyan.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salesData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
                <XAxis
                  dataKey="date"
                  stroke="#57534E"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#57534E" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0C0A09",
                    borderRadius: "12px",
                    border: "none",
                  }}
                  labelStyle={{ color: "#FFF", fontWeight: "bold" }}
                  itemStyle={{ color: "#A7F3D0" }}
                />
                <Line
                  type="monotone"
                  dataKey="benta"
                  name="Kita (₱)"
                  stroke="#064E3B"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* LOWER GRID: Dalawang magkatabing Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 2: Top Products */}
        <div className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#064E3B] uppercase tracking-wider mb-1">
              Pinakamabentang Produkto
            </h3>
            <p className="text-xs text-[#57534E] mb-6">
              Top 5 items na may pinakamaraming quantity na naibenta
            </p>
          </div>
          <div className="h-56 w-full">
            {topProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#57534E]">
                Walang bentang produkto sa kasalukuyan.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F5F5F4"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#57534E"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#57534E"
                    fontSize={10}
                    tickLine={false}
                    width={85}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0C0A09",
                      borderRadius: "12px",
                      border: "none",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar
                    dataKey="sold"
                    name="Naibenta"
                    fill="#047857"
                    radius={[0, 6, 6, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CARD 3: Stock Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#064E3B] uppercase tracking-wider mb-1">
              Distribusyon ng Imbentaryo
            </h3>
            <p className="text-xs text-[#57534E] mb-4">
              Porsyento ng mga produkto sa loob ng bawat Kategorya
            </p>
          </div>
          <div className="h-56 w-full flex flex-col sm:flex-row items-center justify-center gap-2">
            {stockDistribution.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-[#57534E]">
                Walang mga kategorya o imbentaryo.
              </div>
            ) : (
              <>
                <div className="w-1/2 h-full min-h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {stockDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0C0A09",
                          borderRadius: "12px",
                          border: "none",
                        }}
                        itemStyle={{ color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1 w-full sm:w-1/2 px-2">
                  {stockDistribution.map((entry, index) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-md flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-bold text-[#57534E] truncate max-w-[80px]">
                          {entry.name}
                        </span>
                      </div>
                      <span className="font-mono font-extrabold text-[#0C0A09]">
                        {entry.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
