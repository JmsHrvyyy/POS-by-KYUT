/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Html5Qrcode } from "html5-qrcode";
import { Navbar } from "../shared/Navbar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
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
import { updateStore } from "../../services/storeService";
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
  const { t, language, setLanguage } = useLanguage();

  // Role authorization redirect: Staff is not allowed to access the admin dashboard
  useEffect(() => {
    if (userRole === "staff") {
      navigate("/cashier/pos", { replace: true });
    }
  }, [userRole, navigate]);

  // Track if this is the initial mount for page-level loading
  const [isPageReady, setIsPageReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // ── Tab Navigation ────────────────────────────────────────────
  // Main tabs: "inventory", "analytics", "settings"
  const [activeMainTab, setActiveMainTab] = useState("inventory");

  // Inventory Sub-Tabs: "inventory" (view), "products" (manage), "staff" (staff)
  const [activeTab, setActiveTab] = useState("inventory");

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

  // Barcode Scanner states and handler
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState("add"); // "add" or "edit"

  const handleScanSuccess = (decodedText) => {
    if (scannerTarget === "add") {
      setNewProduct((prev) => ({
        ...prev,
        barcode_sku: decodedText,
      }));
      showToast(
        language === "fil"
          ? `Na-scan ang barcode at nailagay sa form: "${decodedText}"`
          : `Scanned barcode and filled into form: "${decodedText}"`
      );
    } else if (scannerTarget === "edit" && selectedProduct) {
      setSelectedProduct((prev) => ({
        ...prev,
        barcode_sku: decodedText,
      }));
      showToast(
        language === "fil"
          ? `Na-scan ang barcode at nailagay sa form: "${decodedText}"`
          : `Scanned barcode and filled into form: "${decodedText}"`
      );
    }
  };
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
  const [staffMenuOpen, setStaffMenuOpen] = useState(null);

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
      showToast(t("errorLoadProducts"), "error");
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
      showToast(t("errorLoadOrders"), "error");
    } finally {
      setLoadingOrders(false);
    }
  };

  const [storeDetails, setStoreDetails] = useState({
    name: "Ikinakarga...",
    industry_type: "Retail",
    address: "",
    contact: "",
    currency: "₱",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const fetchStoreDetails = async () => {
      if (!activeStoreId) {
        setStoreDetails({
          name: "Walang Aktibong Tindahan",
          industry_type: "Retail",
          address: "",
          contact: "",
          currency: "₱",
        });
        return;
      }
      if (isMockStore(activeStoreId)) {
        setStoreDetails({
          name: "Demo Branch Store",
          industry_type: "Retail",
          address: "123 Demo St, Manila",
          contact: "demo@store.com",
          currency: "₱",
        });
        return;
      }
      try {
        const storeDocRef = doc(db, "stores", activeStoreId);
        const storeDocSnap = await getDoc(storeDocRef);

        if (storeDocSnap.exists()) {
          const data = storeDocSnap.data();
          setStoreDetails({
            name: data.name || t("storeNoName"),
            industry_type: data.industry_type || "Retail",
            address: data.address || "",
            contact: data.contact || "",
            currency: data.currency || "₱",
          });
        } else {
          setStoreDetails({
            name: "Tindahan (Walang Pangalan)",
            industry_type: "Retail",
            address: "",
            contact: "",
            currency: "₱",
          });
        }
      } catch (err) {
        console.error("Error fetching store details:", err);
        setStoreDetails({
          name: t("errorLoadStore"),
          industry_type: "Retail",
          address: "",
          contact: "",
          currency: "₱",
        });
      }
    };

    fetchStoreDetails();
  }, [activeStoreId]);

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
          t("imageTooLarge"),
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
      setProdError(t("productNameRequired"));
      return;
    }
    if (!newProduct.category.trim()) {
      setProdError(t("categoryRequired"));
      return;
    }

    const sellingPrice = parseFloat(newProduct.selling_price);
    const costPrice = parseFloat(newProduct.cost_price);
    const stockQty = parseInt(newProduct.stock_quantity, 10);

    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      setProdError(t("invalidSellingPrice"));
      return;
    }
    if (isNaN(costPrice) || costPrice < 0) {
      setProdError(t("invalidCostPrice"));
      return;
    }
    if (sellingPrice < costPrice) {
      setProdError(t("sellingPriceLessThanCost"));
      return;
    }
    if (isNaN(stockQty) || stockQty < 0) {
      setProdError(t("invalidStockQty"));
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
      showToast(t("successAddProduct"));

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
      setProdError(t("errorAddProduct"));
    } finally {
      setSavingProd(false);
    }
  };

  // LOHIKA: Mag-Restock ng Produkto (Idadagdag sa lumang stock)
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    const addedStock = parseInt(restockAmount, 10);
    if (isNaN(addedStock) || addedStock <= 0) {
      alert(t("invalidRestockAmount"));
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
        t("successRestock", { count: addedStock, name: selectedProduct.name })
      );
      setIsRestockOpen(false);
      setRestockAmount("");
    } catch (err) {
      console.error(err);
      showToast(t("errorRestock"), "error");
    } finally {
      setSavingProd(false);
    }
  };

  // LOHIKA: Pag-save ng In-edit na Detalye ng Produkto
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct.name.trim() || !selectedProduct.category.trim()) {
      alert(t("invalidEditProductBlank"));
      return;
    }
    const costPrice = parseFloat(selectedProduct.cost_price) || 0;
    const sellingPrice = parseFloat(selectedProduct.selling_price) || 0;
    if (sellingPrice < costPrice) {
      alert(t("sellingPriceLessThanCost"));
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

      showToast(t("successEditProduct"));
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
      showToast(t("errorEditProduct"), "error");
    } finally {
      setSavingProd(false);
    }
  };

  // LOHIKA: Pagbura ng Produkto sa Firestore Database
  const handleDeleteProduct = async (product) => {
    const seguro = window.confirm(
      t("confirmDeleteProductFully", { name: product.name })
    );
    if (!seguro) return;

    try {
      const docRef = doc(db, "products", product.id);
      await deleteDoc(docRef);

      // Alisin sa screen filter array
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast(t("successDeleteProductMsg", { name: product.name }));
    } catch (err) {
      console.error(err);
      showToast(t("errorDeleteProductMsg"), "error");
    }
  };

  // Add Staff Function
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setStaffError("");
    setStaffSuccess("");
    if (!staffEmail.trim()) {
      setStaffError(t("staffEmailRequired"));
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
      showToast(t("successAddStaffMock"));
      setIsAddStaffOpen(false);

      const signupLink = `${window.location.origin}/signup`;
      setInvitationInfo({
        email: staffEmail.trim(),
        exists: false,
        subject: language === "fil" ? "Imbitasyon sa POS-by-KYUT (Demo)" : "Invitation to POS-by-KYUT (Demo)",
        body: language === "fil"
          ? `Kamusta!\n\nInaanyayahan ka naming maging staff para sa aming tindahan (Store ID: ${activeStoreId}).\n\nDahil wala ka pang account sa aming system, mangyaring gumawa muna ng account bilang Staff/Cashier gamit ang link na ito:\n${signupLink}\n\nGamitin ang email na ito sa pag-signup para ma-link ang iyong account sa aming tindahan.\n\nSalamat!`
          : `Hello!\n\nYou are invited to be a staff member for our store (Store ID: ${activeStoreId}).\n\nSince you do not have an account in our system yet, please create a Staff/Cashier account using this link:\n${signupLink}\n\nMake sure to use this email to sign up to link your account to our store.\n\nThank you!`,
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
          t("errorStaffAssigned")
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

        emailSubject = language === "fil" ? "Imbitasyon sa POS-by-KYUT" : "Invitation to POS-by-KYUT";
        signupInstructions = language === "fil"
          ? `Kamusta!\n\nInaanyayahan ka naming maging staff para sa aming tindahan (Store ID: ${activeStoreId}).\n\nDahil wala ka pang account sa aming system, mangyaring gumawa muna ng account bilang Staff/Cashier gamit ang link na ito:\n${window.location.origin}/signup\n\nSiguraduhing gamitin ang email na ito sa pag-signup para ma-link ang iyong account sa aming tindahan.\n\nSalamat!`
          : `Hello!\n\nYou are invited to be a staff member for our store (Store ID: ${activeStoreId}).\n\nSince you do not have an account in our system yet, please create a Staff/Cashier account using this link:\n${window.location.origin}/signup\n\nMake sure to use this email to sign up to link your account to our store.\n\nThank you!`;
      } else {
        // User exists
        if (foundUser.global_role !== "staff") {
          setStaffError(
            t("errorStaffRoleNotStaff")
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

        emailSubject = language === "fil" ? "Itinalaga ka bilang Staff sa POS-by-KYUT" : "You have been assigned as Staff in POS-by-KYUT";
        signupInstructions = language === "fil"
          ? `Kamusta!\n\nItinalaga ka na bilang staff para sa aming tindahan (Store ID: ${activeStoreId}).\n\nMangyaring mag-login sa iyong account dito para simulan ang paggamit ng POS:\n${window.location.origin}/login\n\nSalamat!`
          : `Hello!\n\nYou have been assigned as staff for our store (Store ID: ${activeStoreId}).\n\nPlease log in to your account here to start using the POS:\n${window.location.origin}/login\n\nThank you!`;
      }

      const docRef = await addDoc(collection(db, "store_staff"), staffPayload);

      setStaffList((prev) => [
        ...prev,
        {
          id: docRef.id,
          ...staffPayload,
        },
      ]);

      showToast(language === "fil" ? `Matagumpay na naidagdag si ${staffPayload.name}!` : `Staff member ${staffPayload.name} added successfully!`);
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
      setStaffError(t("errorAddStaff"));
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
      showToast(t("successUpdateStaffRoleMsg", { name: staff.name, role: newRole }));
      return;
    }

    try {
      const docRef = doc(db, "store_staff", staff.id);
      await updateDoc(docRef, { role: newRole });
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, role: newRole } : s)),
      );
      showToast(t("successUpdateStaffRoleMsg", { name: staff.name, role: newRole }));
    } catch (err) {
      console.error("handleUpdateStaffRole error:", err);
      showToast(t("errorUpdateRole"), "error");
    }
  };

  const handleRemoveStaff = async (staff) => {
    const seguro = window.confirm(
      t("confirmRemoveStaffMsg", { name: staff.name })
    );
    if (!seguro) return;

    try {
      if (isMockStore(activeStoreId)) {
        setStaffList((prev) => prev.filter((s) => s.id !== staff.id));
        showToast(t("successRemoveStaffMsg", { name: staff.name }));
        setStaffMenuOpen(null);
        return;
      }

      const docRef = doc(db, "store_staff", staff.id);
      await deleteDoc(docRef);
      setStaffList((prev) => prev.filter((s) => s.id !== staff.id));
      showToast(t("successRemoveStaffMsg", { name: staff.name }));
      setStaffMenuOpen(null);
    } catch (err) {
      console.error("handleRemoveStaff:", err);
      showToast(t("errorRemoveStaff"), "error");
    }
  };

  const lowStockCount = products.filter((p) => p.stock_quantity <= 10).length;
  const activeStaffCount = staffList.filter(
    (s) => s.status === "Active",
  ).length;

  const stats = [
    {
      name: t("productsStat"),
      value: language === "fil" ? `${products.length} aytem` : `${products.length} items`,
      sub: t("needRestock", { count: lowStockCount }),
      colorClass: "text-[#F97316] bg-[#F97316]/10",
    },
    {
      name: t("staffInBranch"),
      value: t("peopleCount", { count: staffList.length }),
      sub: t("activeNow", { count: activeStaffCount }),
      colorClass: "text-[#57534E] bg-[#57534E]/10",
    },
    // Stats Card Configuration
    {
      name: t("storeNameLabel"),
      value: storeDetails.name, // Ipapakita ang totoong pangalan ng branch o tindahan
      sub: isMockStore(activeStoreId)
        ? "Demo Mode"
        : `ID: ${activeStoreId?.slice(0, 6)}...`, // Itatago ang mahabang ID sa maliit na subtext sa ilalim
      colorClass: "text-[#064E3B] bg-[#064E3B]/10",
    },
  ];

  const handleUpdateStoreSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      if (isMockStore(activeStoreId)) {
        showToast(t("successSaveSettings") + " (Demo Mode)!");
      } else {
        await updateStore(activeStoreId, {
          name: storeDetails.name,
          industry_type: storeDetails.industry_type,
          address: storeDetails.address,
          contact: storeDetails.contact || "",
          currency: storeDetails.currency || "₱",
        });
        showToast(t("successSaveSettings"));
      }
    } catch (err) {
      console.error("Error updating store settings:", err);
      showToast(t("errorSaveSettings"), "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const mainTabs = [
    {
      key: "inventory",
      label: t("inventory"),
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
      key: "analytics",
      label: t("analytics"),
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      key: "settings",
      label: t("settings"),
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  // ── NA-UPDATE NA TABS MENU (May gitnang Product Manager Tab) ──
  const tabs = [
    {
      key: "inventory",
      label: t("inventoryView"),
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
      label: t("manageAndUpdate"),
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
      label: t("staffTitle"),
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

      {!isPageReady && (
        <div className="fixed inset-0 top-16 bg-[#FAFAF9] z-40 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-[#064E3B] mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xs text-[#57534E]">{t("loadingText")}</p>
          </div>
        </div>
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-opacity duration-300 ${!isPageReady ? 'opacity-0' : 'opacity-100'}`}>
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#064E3B] tracking-tight">
              Admin Operations Dashboard
            </h1>
            <p className="text-sm text-[#57534E] mt-1">
              {language === "fil"
                ? "Kontrolado mo ang imbentaryo, pag-restock, at cashier access rito."
                : "Control your store's inventory, restock items, and cashier access here."}
            </p>
          </div>
          {activeStoreId && (
            <div className="flex items-center gap-2 bg-[#064E3B]/10 text-[#064E3B] border border-[#064E3B]/20 px-4 py-2.5 rounded-xl text-xs font-sans font-bold self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B] animate-ping" />
              {storeDetails.name}{" "}
            </div>
          )}
        </header>

        {/* Main Tab Level Navigation */}
        <div className="flex border-b border-[#57534E]/10 bg-[#FAFAF9]/60 px-4 pt-3 gap-1 mb-8 overflow-x-auto overflow-y-hidden scrollbar-none">
          {mainTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveMainTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 -mb-px cursor-pointer ${
                activeMainTab === tab.key
                  ? "border-[#064E3B] text-[#064E3B] bg-white"
                  : "border-transparent text-[#57534E]/70 hover:text-[#57534E]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. Inventory Main Tab */}
        {activeMainTab === "inventory" && (
          <>
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

            {/* Dynamic Control Panel Grid */}
            <div className="bg-white rounded-2xl border border-[#57534E]/15 shadow-sm overflow-hidden">
              {/* Tabs Control Line */}
              <div className="flex border-b border-[#57534E]/10 bg-[#FAFAF9]/60 px-4 pt-3 gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 -mb-px cursor-pointer ${
                      activeTab === tab.key
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
              {activeTab === "inventory" && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#064E3B]">
                        {t("inventoryView")}
                      </h3>
                      <p className="text-xs text-[#57534E]">
                        {t("inventoryViewDesc")}
                      </p>
                    </div>
                    {activeStoreId && (
                      <button
                        onClick={() => setIsAddProdOpen(true)}
                        className="px-3.5 py-2 bg-[#064E3B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        {t("newProductButton")}
                      </button>
                    )}
                  </div>

                  {loadingProds ? (
                    <div className="text-center py-10 text-xs">{t("loadingText")}</div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[#57534E]">
                      {t("noProductsText")}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#57534E]/10 text-[#57534E] uppercase text-[10px]">
                            <th className="pb-3">{t("nameColumn")}</th>
                            <th className="pb-3">{t("categoryColumn")}</th>
                            <th className="pb-3">{t("priceColumn")}</th>
                            <th className="pb-3 text-right">{t("stockQtyColumn")}</th>
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
                                {storeDetails.currency || "₱"}{p.selling_price?.toFixed(2)}
                              </td>
                              <td className="py-3.5 text-right font-bold">
                                {p.stock_quantity} {t("units")}
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
              {activeTab === "products" && (
                <div className="p-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#064E3B]">
                      {t("manageAndUpdate")}
                    </h3>
                    <p className="text-xs text-[#57534E] mb-6">
                      {t("manageAndUpdateDesc")}
                    </p>
                  </div>

                  {loadingProds ? (
                    <div className="text-center py-10 text-xs">{t("loadingText")}</div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[#57534E]">
                      {t("noProductsToModify")}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#57534E]/10 text-[#57534E] uppercase text-[10px] tracking-wider">
                            <th className="pb-3 font-bold">{t("productColumn")}</th>
                            <th className="pb-3 font-bold">{t("costSellingColumn")}</th>
                            <th className="pb-3 font-bold">{t("currentStockColumn")}</th>
                            <th className="pb-3 font-bold text-center">
                              {t("actionsColumn")}
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
                                  P: {storeDetails.currency || "₱"}{p.cost_price?.toFixed(2)}
                                </span>
                                <p className="text-[#064E3B] font-bold">
                                  B: {storeDetails.currency || "₱"}{p.selling_price?.toFixed(2)}
                                </p>
                              </td>
                              <td className="py-4 font-mono font-bold">
                                {p.stock_quantity <= 10 ? (
                                  <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-[11px]">
                                    {t("lowStockLabel", { stock: p.stock_quantity })}
                                  </span>
                                ) : (
                                  <span className="text-[#57534E]">
                                    {p.stock_quantity} {t("units")}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 text-center">
                                <div className="inline-flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedProduct(p);
                                      setIsRestockOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] font-bold rounded-lg text-[11px] transition cursor-pointer"
                                  >
                                    {t("restockButton")}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedProduct(p);
                                      setIsEditOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-[11px] transition cursor-pointer"
                                  >
                                    {t("editButton")}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p)}
                                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] transition cursor-pointer"
                                  >
                                    {t("deleteButton")}
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
              {activeTab === "staff" && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#064E3B]">
                        {t("staffTitle")}
                      </h3>
                      <p className="text-xs text-[#57534E]">
                        {t("staffDesc")}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddStaffOpen(true)}
                      className="px-3.5 py-2 bg-[#064E3B] text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      {t("newStaffButton")}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#57534E]/10 text-[#57534E] uppercase text-[10px]">
                          <th className="pb-3">{t("nameColumn")}</th>
                          <th className="pb-3">{t("roleColumn")}</th>
                          <th className="pb-3">{t("emailColumn")}</th>
                          <th className="pb-3">{t("statusColumn")}</th>
                          <th className="pb-3 text-center">{t("actionColumn")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#57534E]/5">
                        {staffList.map((s, i) => (
                          <tr key={i} className="hover:bg-[#FAFAF9]/40 relative">
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
                            <td className="py-3.5 text-center relative">
                              <div className="inline-block">
                                <button
                                  onClick={() => setStaffMenuOpen(staffMenuOpen === i ? null : i)}
                                  className="p-1.5 hover:bg-stone-100 rounded-lg transition cursor-pointer text-[#57534E]"
                                  title="More options"
                                >
                                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.5 1.5H9.5V3.5H10.5V1.5ZM10.5 8.5H9.5V10.5H10.5V8.5ZM10.5 15.5H9.5V17.5H10.5V15.5Z" />
                                  </svg>
                                </button>
                                {staffMenuOpen === i && (
                                  <div className="absolute right-0 mt-1 w-32 bg-white border border-stone-200 rounded-lg shadow-lg z-10">
                                    <button
                                      onClick={() => handleRemoveStaff(s)}
                                      className="w-full text-left px-4 py-2 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-lg transition"
                                    >
                                      {t("removeButton")}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* 2. Analytics Main Tab */}
        {activeMainTab === "analytics" && (
          <AnalyticsSection
            products={products}
            orders={orders}
            isMock={isMockStore(activeStoreId)}
            loading={loadingProds || loadingOrders}
            currency={storeDetails.currency || "₱"}
            storeName={storeDetails.name}
            storeDetails={storeDetails}
          />
        )}

        {/* 3. Settings Main Tab */}
        {activeMainTab === "settings" && (
          <div className="bg-white rounded-2xl border border-[#57534E]/15 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto animate-fadeIn">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile Card Side */}
              <div className="w-full md:w-1/3 bg-gradient-to-br from-[#064E3B] to-[#047857] p-6 rounded-2xl text-white flex flex-col justify-between shadow-md">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                    {t("storeProfileTitle")}
                  </span>
                  <h3 className="text-xl font-extrabold mt-3 break-words">
                    {storeDetails.name}
                  </h3>
                  <p className="text-xs text-white/80 font-medium mt-1">
                    {storeDetails.industry_type}
                  </p>
                </div>
                <div className="mt-8 space-y-3.5">
                  <div className="flex items-center gap-2 text-xs">
                    <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="truncate">{storeDetails.address || "Walang address"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{storeDetails.contact || "Walang contact number"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white/75 bg-white/20 px-2 py-0.5 rounded text-[10px]">
                      Currency
                    </span>
                    <span>{storeDetails.currency}</span>
                  </div>
                </div>
              </div>

              {/* Form Side */}
              <form onSubmit={handleUpdateStoreSettings} className="flex-1 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#064E3B]">{t("manageStoreTitle")}</h3>
                  <p className="text-xs text-[#57534E]">
                    {t("manageStoreDesc")}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#57534E] mb-1.5 uppercase tracking-wider">
                      {t("storeNameLabel")}
                    </label>
                    <input
                      type="text"
                      required
                      value={storeDetails.name}
                      onChange={(e) => setStoreDetails({ ...storeDetails, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl focus:outline-none focus:border-[#064E3B] text-sm bg-[#FAFAF9]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#57534E] mb-1.5 uppercase tracking-wider">
                      {t("industryTypeLabel")}
                    </label>
                    <select
                      value={storeDetails.industry_type}
                      onChange={(e) => setStoreDetails({ ...storeDetails, industry_type: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl bg-white focus:outline-none focus:border-[#064E3B] text-sm bg-[#FAFAF9]"
                    >
                      <option value="Retail">Retail</option>
                      <option value="Food">Food / Cafe</option>
                      <option value="Services">Services</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#57534E] mb-1.5 uppercase tracking-wider">
                    {t("locationAddressLabel")}
                  </label>
                  <input
                    type="text"
                    required
                    value={storeDetails.address}
                    onChange={(e) => setStoreDetails({ ...storeDetails, address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl focus:outline-none focus:border-[#064E3B] text-sm bg-[#FAFAF9]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#57534E] mb-1.5 uppercase tracking-wider">
                      {t("phoneLabel")}
                    </label>
                    <input
                      type="text"
                      placeholder="Hal. 09123456789 o contact@store.com"
                      value={storeDetails.contact}
                      onChange={(e) => setStoreDetails({ ...storeDetails, contact: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl focus:outline-none focus:border-[#064E3B] text-sm bg-[#FAFAF9]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#57534E] mb-1.5 uppercase tracking-wider">
                      {t("currencyLabel")}
                    </label>
                    <select
                      value={storeDetails.currency}
                      onChange={(e) => setStoreDetails({ ...storeDetails, currency: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl bg-white focus:outline-none focus:border-[#064E3B] text-sm bg-[#FAFAF9]"
                    >
                      <option value="₱">PHP (₱) - Philippine Peso</option>
                      <option value="$">USD ($) - US Dollar</option>
                      <option value="€">EUR (€) - Euro</option>
                      <option value="¥">JPY/CNY (¥) - Yen/Yuan</option>
                      <option value="£">GBP (£) - Pound Sterling</option>
                    </select>
                  </div>
                </div>

                {/* Global Language Option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#57534E] mb-1.5 uppercase tracking-wider">
                      {t("languageLabel")}
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl bg-white focus:outline-none focus:border-[#064E3B] text-sm bg-[#FAFAF9]"
                    >
                      <option value="fil">{t("filipinoOption")}</option>
                      <option value="en">{t("englishOption")}</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#57534E]/10 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-3 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow cursor-pointer disabled:opacity-75"
                  >
                    {savingSettings ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t("savingChangesButton")}</span>
                      </>
                    ) : (
                      <span>{t("saveChangesButton")}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: MAGDAGDAG NG BAGONG PRODUKTO (Original) ── */}
      {isAddProdOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#57534E]/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#064E3B]">
                {t("addProductTitle")}
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
                  {t("productNameLabel")}
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
              <div>
                <label className="block text-xs font-bold mb-1">
                  {t("categoryLabel")}
                </label>
                <input
                  type="text"
                  required
                  list="categories-list"
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl text-sm bg-white"
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
                  {t("barcodeLabel")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    value={newProduct.barcode_sku}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        barcode_sku: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setScannerTarget("add");
                      setIsScannerOpen(true);
                    }}
                    className="px-3.5 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer text-[#064E3B] transition"
                    title="Scan barcode with camera"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-16v.01M4 12h2m0 0h2v-4m0 8h-2v4m14-8h-2V8m0 4h2v4" />
                    </svg>
                    {t("scanLabel")}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    {t("costPriceLabel")} ({storeDetails.currency || "₱"})
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
                    {t("sellingPriceLabel")} ({storeDetails.currency || "₱"})
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
                    {t("stockQtyLabel")}
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
                  {t("productImageLabel")}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-xs"
                  onChange={handleFileChange}
                />
                {imageFile && (
                  <p className="text-xs text-emerald-700 mt-1">
                    {t("attachedFile")} {imageFile.name}
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddProdOpen(false)}
                  className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-[#57534E]"
                >
                  {t("cancelButton")}
                </button>
                <button
                  type="submit"
                  disabled={savingProd}
                  className="flex-1 py-2.5 bg-[#064E3B] text-white rounded-xl text-xs font-bold"
                >
                  {savingProd ? t("creatingProductButton") : t("createProductButton")}
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
                {t("restockTitle")}
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
              {language === "fil" ? "Produkto:" : "Product:"}{" "}
              <strong className="text-stone-900">{selectedProduct.name}</strong>
              <br />
              {t("currentQuantityLabel")}{" "}
              <strong className="text-stone-900">
                {selectedProduct.stock_quantity} {t("units")}
              </strong>
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-stone-500">
                  {t("addAmountLabel")}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder={t("restockPlaceholder")}
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
                  {t("cancelButton")}
                </button>
                <button
                  type="submit"
                  disabled={savingProd}
                  className="flex-1 py-2.5 bg-[#064E3B] text-white rounded-xl text-xs font-bold"
                >
                  {savingProd ? t("updatingButton") : t("saveStockButton")}
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
                {t("editProductTitle")}
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
                  {t("productNameLabel")}
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

              {/* Category */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  {t("categoryLabel")}
                </label>
                <input
                  type="text"
                  required
                  list="edit-categories"
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl text-sm bg-white"
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

              {/* Barcode / SKU */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  {t("barcodeLabel")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    value={selectedProduct.barcode_sku}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        barcode_sku: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setScannerTarget("edit");
                      setIsScannerOpen(true);
                    }}
                    className="px-3.5 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer text-[#064E3B] transition"
                    title="Scan barcode with camera"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-16v.01M4 12h2m0 0h2v-4m0 8h-2v4m14-8h-2V8m0 4h2v4" />
                    </svg>
                    {t("scanLabel")}
                  </button>
                </div>
              </div>

              {/* Price Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    {t("costPriceLabel")} ({storeDetails.currency || "₱"})
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
                    {t("sellingPriceLabel")} ({storeDetails.currency || "₱"})
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
                    {t("stockQtyLabel")}
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
                  {t("cancelButton")}
                </button>
                <button
                  type="submit"
                  disabled={savingProd}
                  className="flex-1 py-2.5 bg-[#064E3B] text-white rounded-xl text-xs font-bold"
                >
                  {savingProd ? t("savingChangesButton") : t("saveChangesButton")}
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
                {t("addStaffTitle")}
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
                  {language === "fil" ? "Email ng Staff" : "Staff Email"}
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
                <label className="block text-xs font-bold mb-1">{t("roleColumn")}</label>
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
                  {t("cancelButton")}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#064E3B] text-white rounded-xl text-xs font-bold"
                >
                  {language === "fil" ? "Idagdag" : "Add"}
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
                  ? t("assignedAsStaffTitle")
                  : t("staffInvitationTitle")}
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
                  language === "fil" ? (
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
                      The email{" "}
                      <strong className="text-stone-900">
                        {invitationInfo.email}
                      </strong>{" "}
                      already has an account. You can send them a notification
                      to log in to their account to open the POS.
                    </>
                  )
                ) : (
                  language === "fil" ? (
                    <>
                      Ang email na{" "}
                      <strong className="text-stone-900">
                        {invitationInfo.email}
                      </strong>{" "}
                      ay wala pang account. Mangyaring ipadala ang mga sumusunod
                      na tagubilin upang magrehistro sila bilang staff sa inyong
                      tindahan.
                    </>
                  ) : (
                    <>
                      The email{" "}
                      <strong className="text-stone-900">
                        {invitationInfo.email}
                      </strong>{" "}
                      does not have an account yet. Please send the following
                      instructions for them to register as staff in your store.
                    </>
                  )
                )}
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">
                  {t("messageInstructionsLabel")}
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
                    showToast(t("messageCopied"));
                  }}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition cursor-pointer text-center"
                >
                  {t("copyMessageButton")}
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
                  {t("sendViaEmailButton")}
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

      {/* BARCODE SCANNER MODAL */}
      {isScannerOpen && (
        <AdminBarcodeScannerModal
          language={language}
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
};

// ─── I-PASTE ITO SA PINAKADULONG BAHAGI NG FILE (PAREHONG FILE) ───

const COLORS = ["#064E3B", "#047857", "#10B981", "#34D399", "#A7F3D0"];

const MOCK_SALES_DATA = [
  { date: "Mon", benta: 4200, kita: 1260 },
  { date: "Tue", benta: 5100, kita: 1530 },
  { date: "Wed", benta: 3800, kita: 1140 },
  { date: "Thu", benta: 6200, kita: 1860 },
  { date: "Fri", benta: 7500, kita: 2250 },
  { date: "Sat", benta: 8900, kita: 2670 },
  { date: "Sun", benta: 9400, kita: 2820 },
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

const AnalyticsSection = ({ products = [], orders = [], isMock = false, loading = false, currency = "₱", storeName = "Tindahan", storeDetails = {} }) => {
  const { t, language } = useLanguage();
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
            <span className="text-xs text-stone-400 font-semibold animate-pulse">
              {language === "fil" ? "Inihahanda ang ulat ng benta..." : "Preparing sales report..."}
            </span>
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
              <span className="text-xs text-stone-400 font-semibold">
                {language === "fil" ? "Inilalagay ang mga produkto..." : "Loading products..."}
              </span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm h-72 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-stone-200 rounded w-1/3"></div>
              <div className="h-3 bg-stone-100 rounded w-1/2"></div>
            </div>
            <div className="h-40 bg-stone-50 rounded-xl w-full flex items-center justify-center">
              <span className="text-xs text-stone-400 font-semibold">
                {language === "fil" ? "Kinakalkula ang imbentaryo..." : "Calculating inventory..."}
              </span>
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

  const handleExportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Sheet 1: Store Profile
      const storeRows = [
        ["ULAT SA OPERASYON / OPERATIONS REPORT"],
        [],
        ["Pangalan ng Tindahan (Store Name)", storeName],
        ["Uri ng Industriya (Industry)", storeDetails.industry_type || "Retail"],
        ["Lokasyon / Address", storeDetails.address || "N/A"],
        ["Numero ng Telepono (Contact)", storeDetails.contact || "N/A"],
        ["Simbolo ng Currency", currency],
        ["Database Mode", isMock ? "Demo (Mock) Mode" : "Live Database (Firestore)"],
        ["Petsa ng Pag-export (Export Date)", new Date().toLocaleString()],
        [],
        ["POS by KYUT - All Rights Reserved"]
      ];
      const wsStore = XLSX.utils.aoa_to_sheet(storeRows);
      wsStore["!cols"] = [{ wch: 35 }, { wch: 45 }];
      wsStore["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
      XLSX.utils.book_append_sheet(wb, wsStore, language === "fil" ? "Impormasyon ng Tindahan" : "Store Information");

      // 2. Sheet 2: Inventory Sheet
      const inventoryRows = [
        ["ULAT NG IMBENTARYO / INVENTORY REPORT"],
        [],
        [
          language === "fil" ? "Pangalan ng Produkto" : "Product Name",
          language === "fil" ? "Kategorya" : "Category",
          "Barcode / SKU",
          language === "fil" ? "Dami ng Stock" : "Stock Quantity",
          language === "fil" ? "Puhunan (Unit Cost)" : "Unit Cost Price",
          language === "fil" ? "Benta (Unit Price)" : "Unit Selling Price",
          language === "fil" ? "Kabuuang Puhunan (Total Cost)" : "Total Cost Value",
          language === "fil" ? "Kalkuladong Benta (Total Selling)" : "Total Selling Value"
        ]
      ];

      let totalStockUnits = 0;
      let totalCostValue = 0;
      let totalSellingValue = 0;

      products.forEach((p) => {
        const stock = Number(p.stock_quantity) || 0;
        const cost = Number(p.cost_price) || 0;
        const selling = Number(p.selling_price) || 0;
        const itemTotalCost = stock * cost;
        const itemTotalSelling = stock * selling;

        totalStockUnits += stock;
        totalCostValue += itemTotalCost;
        totalSellingValue += itemTotalSelling;

        inventoryRows.push([
          p.name || "N/A",
          p.category || "N/A",
          p.barcode_sku || "N/A",
          stock,
          cost,
          selling,
          Number(itemTotalCost.toFixed(2)),
          Number(itemTotalSelling.toFixed(2))
        ]);
      });

      inventoryRows.push([]);
      inventoryRows.push([
        language === "fil" ? "KABUUAN (TOTALS)" : "TOTALS",
        "",
        "",
        totalStockUnits,
        "",
        "",
        Number(totalCostValue.toFixed(2)),
        Number(totalSellingValue.toFixed(2))
      ]);

      const wsInventory = XLSX.utils.aoa_to_sheet(inventoryRows);
      wsInventory["!cols"] = [
        { wch: 30 }, // Name
        { wch: 15 }, // Category
        { wch: 18 }, // Barcode
        { wch: 15 }, // Stock Qty
        { wch: 18 }, // Unit Cost
        { wch: 18 }, // Unit Selling
        { wch: 22 }, // Total Cost
        { wch: 22 }  // Total Selling
      ];
      wsInventory["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
      XLSX.utils.book_append_sheet(wb, wsInventory, language === "fil" ? "Imbentaryo" : "Inventory");

      // 3. Sheet 3: Transactions Sheet
      const productCostMap = {};
      const productPriceMap = {};
      products.forEach((p) => {
        if (p.name) {
          productCostMap[p.name] = Number(p.cost_price) || 0;
          productPriceMap[p.name] = Number(p.selling_price) || 0;
        }
      });

      const ordersByDate = {};
      orders.forEach((order) => {
        const dateObj = getOrderDate(order);
        if (!dateObj) return;
        const dateStr = dateObj.toISOString().split("T")[0];
        if (!ordersByDate[dateStr]) {
          ordersByDate[dateStr] = [];
        }
        ordersByDate[dateStr].push(order);
      });

      const sortedDates = Object.keys(ordersByDate).sort().reverse();
      const transactionRows = [
        ["ULAT NG MGA TRANSAKSYON / TRANSACTION REPORT"],
        [],
      ];

      let grandTotalRevenue = 0;
      let grandTotalProfit = 0;

      sortedDates.forEach((dateStr) => {
        transactionRows.push([`Petsa / Date: ${dateStr}`]);
        transactionRows.push([
          "ID ng Order (Order ID)",
          language === "fil" ? "Oras" : "Time",
          language === "fil" ? "Pangalan ng Aytem" : "Item Name",
          language === "fil" ? "Dami" : "Quantity",
          language === "fil" ? "Puhunan (Unit Cost)" : "Unit Cost",
          language === "fil" ? "Benta (Unit Price)" : "Unit Price",
          language === "fil" ? "Kabuuang Benta" : "Total Revenue",
          language === "fil" ? "Kita (Profit)" : "Net Profit"
        ]);

        let dateRevenue = 0;
        let dateProfit = 0;

        ordersByDate[dateStr].forEach((order) => {
          let orderRevenue = 0;
          let orderCost = 0;

          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              const qty = Number(item.quantity) || 0;
              const price = Number(item.price) || productPriceMap[item.name] || 0;
              const cost = productCostMap[item.name] || 0;
              orderCost += cost * qty;
              orderRevenue += price * qty;
            });
          }

          const profitMargin = orderRevenue > 0 ? (orderRevenue - orderCost) / orderRevenue : 0;
          const totalActual = Number(order.total) || 0;
          const totalProfit = totalActual * profitMargin;

          dateRevenue += totalActual;
          dateProfit += totalProfit;

          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item, idx) => {
              const qty = Number(item.quantity) || 0;
              const selling = Number(item.price) || productPriceMap[item.name] || 0;
              const cost = productCostMap[item.name] || 0;
              const itemRevenue = qty * selling;
              const itemProfit = orderRevenue > 0 ? itemRevenue * (totalProfit / orderRevenue) : 0;

              const dateObj = getOrderDate(order);
              const timeStr = dateObj ? dateObj.toTimeString().split(" ")[0].substring(0, 5) : "N/A";

              transactionRows.push([
                idx === 0 ? order.id : "",
                idx === 0 ? timeStr : "",
                item.name || "N/A",
                qty,
                cost,
                selling,
                Number(itemRevenue.toFixed(2)),
                Number(itemProfit.toFixed(2))
              ]);
            });
          }
        });

        grandTotalRevenue += dateRevenue;
        grandTotalProfit += dateProfit;

        transactionRows.push([
          language === "fil" ? "KABUUAN SA PETSANG ITO" : "SUBTOTAL FOR DATE",
          "",
          "",
          "",
          "",
          "",
          Number(dateRevenue.toFixed(2)),
          Number(dateProfit.toFixed(2))
        ]);
        transactionRows.push([]);
      });

      transactionRows.push([
        language === "fil" ? "KABUUANG BENTA (GRAND REVENUE)" : "GRAND TOTAL REVENUE",
        "",
        "",
        "",
        "",
        "",
        Number(grandTotalRevenue.toFixed(2))
      ]);
      transactionRows.push([
        language === "fil" ? "KABUUANG KITA (GRAND PROFIT)" : "GRAND TOTAL NET PROFIT",
        "",
        "",
        "",
        "",
        "",
        "",
        Number(grandTotalProfit.toFixed(2))
      ]);

      const wsTransactions = XLSX.utils.aoa_to_sheet(transactionRows);
      wsTransactions["!cols"] = [
        { wch: 22 }, // Order ID
        { wch: 10 }, // Time
        { wch: 30 }, // Item Name
        { wch: 10 }, // Qty
        { wch: 15 }, // Unit Cost
        { wch: 15 }, // Unit Price
        { wch: 18 }, // Total Revenue
        { wch: 18 }  // Net Profit
      ];
      wsTransactions["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
      XLSX.utils.book_append_sheet(wb, wsTransactions, language === "fil" ? "Transaksyon" : "Transactions");

      const safeStoreName = storeName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      XLSX.writeFile(wb, `${safeStoreName}_operations_report.xlsx`);
    } catch (err) {
      console.error("Failed to export excel:", err);
      alert(language === "fil" ? "Hindi ma-export ang Excel report." : "Failed to export Excel report.");
    }
  };

  // Determine which data to use (mock fallback if isMock or database is completely empty)
  const isDatabaseEmpty = products.length === 0 && orders.length === 0;
  const useMock = isMock || isDatabaseEmpty;

  // 2. Data Calculation
  let salesData = MOCK_SALES_DATA;
  let topProducts;
  let stockDistribution = MOCK_STOCK_DISTRIBUTION;

  if (useMock) {
    const mockPrices = {
      "Coca-Cola 1.5L": 120,
      "White Bread": 85,
      "Instant Noodles": 25,
      "Kape Barako": 150,
      "Sardines": 35,
    };
    topProducts = MOCK_TOP_PRODUCTS.map((p) => ({
      ...p,
      name: `${p.name} (${currency}${mockPrices[p.name]?.toFixed(2) || "50.00"})`,
    }));
  } else {
    // Create lookup maps for products cost and selling prices
    const productCostMap = {};
    const productPriceMap = {};
    products.forEach((p) => {
      if (p.name) {
        productCostMap[p.name] = Number(p.cost_price) || 0;
        productPriceMap[p.name] = Number(p.selling_price) || 0;
      }
    });

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
        kita: 0,
      });
    }

    orders.forEach((order) => {
      const oDate = getOrderDate(order);
      if (!oDate) return;
      const oDateStr = oDate.toDateString();
      const matchedDay = last7Days.find((day) => day.dateStr === oDateStr);
      if (matchedDay) {
        matchedDay.benta += Number(order.total) || 0;

        // Calculate cost & profit of items in this order
        let orderCost = 0;
        let orderRevenue = 0;
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.price) || productPriceMap[item.name] || 0;
            const cost = productCostMap[item.name] || 0;
            orderCost += cost * qty;
            orderRevenue += price * qty;
          });
        }
        const profitMargin = orderRevenue > 0 ? (orderRevenue - orderCost) / orderRevenue : 0;
        const orderProfit = (Number(order.total) || 0) * profitMargin;
        matchedDay.kita += orderProfit > 0 ? orderProfit : 0;
      }
    });
    salesData = last7Days.map(({ date, benta, kita }) => ({
      date,
      benta,
      kita: Math.round(kita * 100) / 100,
    }));

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

    const sortedProducts = Object.keys(productSoldCounts).map((name) => {
      const productObj = products.find((p) => p.name === name);
      const priceStr = productObj
        ? ` (${currency}${Number(productObj.selling_price).toFixed(2)})`
        : "";
      return {
        name: name + priceStr,
        sold: productSoldCounts[name],
      };
    });
    sortedProducts.sort((a, b) => b.sold - a.sold);
    topProducts = sortedProducts.slice(0, 5);

    // ── C. Compute Stock Distribution by Category (percentages) ──
    const categoryStockSums = {};
    let totalStock = 0;
    products.forEach((p) => {
      const cat = p.category || t("otherCategory");
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
        const cat = p.category || t("otherCategory");
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
      top4.push({ name: t("otherCategory"), value: restSum });
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
      {/* Excel Export Button Bar */}
      <div className="flex justify-end bg-white p-4 rounded-2xl border border-[#57534E]/15 shadow-sm items-center">
        <button
          onClick={handleExportToExcel}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#064E3B] text-white rounded-xl text-xs font-bold hover:bg-[#047857] shadow-sm transition-all cursor-pointer"
        >
          <svg
            className="h-4.5 w-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {t("exportExcelReport")}
        </button>
      </div>

      {/* CARD 1: Sales Analytics */}
      <div className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-extrabold text-[#064E3B] uppercase tracking-wider">
              {t("salesPerformanceReport")}
            </h3>
            <p className="text-xs text-[#57534E]">
              {useMock
                ? t("weeklyProfitTrendDemo")
                : t("weeklyProfitTrendLive")}
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
              {t("noSalesData")}
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
                  name={`${t("revenueLabel")} (${currency})`}
                  stroke="#064E3B"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="kita"
                  name={`${t("netProfitLabel")} (${currency})`}
                  stroke="#10B981"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
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
              {t("topSellingProducts")}
            </h3>
            <p className="text-xs text-[#57534E] mb-6">
              {t("topProductsSub")}
            </p>
          </div>
          <div className="h-56 w-full">
            {topProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#57534E]">
                {t("noProductsSold")}
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
                    name={t("qtySoldLabel")}
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
              {t("inventoryDistribution")}
            </h3>
            <p className="text-xs text-[#57534E] mb-4">
              {t("inventoryDistSub")}
            </p>
          </div>
          <div className="h-56 w-full flex flex-col sm:flex-row items-center justify-center gap-2">
            {stockDistribution.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-[#57534E]">
                {t("noCategoriesInventory")}
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

// ─── CAMERA BARCODE SCANNER COMPONENT FOR ADMIN FORMS ───
const AdminBarcodeScannerModal = ({ onScanSuccess, onClose, language = "fil" }) => {
  const [scannerError, setScannerError] = useState("");
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isHttpsOrLocalhost] = useState(() => {
    return (
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  });

  const playBeep = () => {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitch beep
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (err) {
      console.error("Audio beep failed:", err);
    }
  };

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("admin-barcode-scanner-viewport");
    let isMounted = true;

    const startScanner = async () => {
      try {
        setScannerError("");
        // Wait for element to render in DOM
        await new Promise((resolve) => setTimeout(resolve, 350));
        if (!isMounted) return;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (width, height) => {
              const boxWidth = Math.min(width * 0.85, 280);
              const boxHeight = Math.min(height * 0.35, 100);
              return {
                x: (width - boxWidth) / 2,
                y: (height - boxHeight) / 2,
                width: boxWidth,
                height: boxHeight,
              };
            },
            aspectRatio: 1.333333,
          },
          (decodedText) => {
            playBeep();
            onScanSuccess(decodedText);
            onClose();
          },
          () => {
            // Frame analysis fail (silent)
          }
        );
      } catch (err) {
        console.error("Camera scan start error:", err);
        if (isMounted) {
          const errMsg = err?.message || String(err);
          if (errMsg.includes("Permission") || errMsg.includes("NotAllowedError")) {
            setHasCameraPermission(false);
          } else {
            setScannerError(
              language === "fil"
                ? "Hindi masimulan ang camera scanner."
                : "Failed to initialize camera scanner."
            );
          }
        }
      }
    };

    if (isHttpsOrLocalhost) {
      startScanner();
    }

    return () => {
      isMounted = false;
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch((err) => console.error("Error stopping scanner:", err));
      }
    };
  }, [isHttpsOrLocalhost, language]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1C1917] rounded-2xl max-w-sm w-full p-5 border border-stone-200 dark:border-stone-800 shadow-2xl relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-sm text-[#064E3B] dark:text-emerald-400 uppercase tracking-wider">
            {language === "fil" ? "I-scan ang Barcode" : "Scan Barcode"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-black aspect-square w-full flex items-center justify-center overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
          <div id="admin-barcode-scanner-viewport" className="w-full h-full"></div>

          {/* Scanner boundary overlay helper */}
          {hasCameraPermission && isHttpsOrLocalhost && !scannerError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="relative w-[240px] h-[90px] border-2 border-dashed border-[#064E3B] dark:border-emerald-500 bg-transparent rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex items-center justify-center">
                <div className="absolute left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-bounce"></div>
                <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-4 border-l-4 border-emerald-500 rounded-tl-sm"></div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-4 border-r-4 border-emerald-500 rounded-tr-sm"></div>
                <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-4 border-l-4 border-emerald-500 rounded-bl-sm"></div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-4 border-r-4 border-emerald-500 rounded-br-sm"></div>
              </div>
            </div>
          )}

          {/* Secure context check */}
          {!isHttpsOrLocalhost && (
            <div className="absolute inset-0 bg-stone-900/95 p-5 flex flex-col items-center justify-center text-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-amber-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0-8v6m0 5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Secure Origin Required</h4>
              <p className="text-[10px] text-stone-300 mt-2 max-w-[200px] leading-relaxed">
                {language === "fil"
                  ? "Ang scanner ay gumagana lamang sa HTTPS o localhost."
                  : "The scanner requires HTTPS or localhost connection."}
              </p>
            </div>
          )}

          {/* Camera Permission check */}
          {!hasCameraPermission && isHttpsOrLocalhost && (
            <div className="absolute inset-0 bg-stone-900/95 p-5 flex flex-col items-center justify-center text-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-rose-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Blocked Camera</h4>
              <p className="text-[10px] text-stone-300 mt-2 max-w-[200px] leading-relaxed">
                {language === "fil"
                  ? "Paki-usap, payagan ang camera access sa iyong browser para makapag-scan."
                  : "Please enable camera permission in your browser to scan."}
              </p>
            </div>
          )}

          {/* Initialization Error check */}
          {scannerError && hasCameraPermission && isHttpsOrLocalhost && (
            <div className="absolute inset-0 bg-stone-900/95 p-5 flex flex-col items-center justify-center text-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-rose-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Scanner Error</h4>
              <p className="text-[10px] text-stone-300 mt-2 max-w-[200px] leading-relaxed">{scannerError}</p>
            </div>
          )}
        </div>

        <p className="text-[10px] text-stone-500 dark:text-stone-400 text-center mt-3 font-semibold">
          {language === "fil"
            ? "Igitna ang linear barcode sa loob ng guhit para mag-scan."
            : "Center the linear barcode inside the target box to scan."}
        </p>
      </div>
    </div>
  );
};
