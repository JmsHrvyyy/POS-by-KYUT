/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const translations = {
  en: {
    // Shared / Navbar
    stores: "Stores",
    adminView: "Admin View",
    posScreen: "POS Screen",
    transactions: "Transactions",
    logout: "Logout",
    activeStore: "Active Store",

    // StoreSelector
    selectStore: "Select a Store",
    chooseStoreDescManager: "Open or create a business unit to manage sales and inventory.",
    chooseStoreDescStaff: "Open a store where you are assigned as a cashier.",
    searchStorePlaceholder: "Search store...",
    all: "All",
    noStoreAssignedTitle: "No Store Assigned Yet",
    noStoreAssignedDesc: "You are not assigned to any manager or store yet. Please contact your Manager to assign your email to their store.",
    refreshPageButton: "Refresh Page",
    addStoreTitle: "Add Store",
    addStoreDesc: "Register a new branch for the POS",
    openStoreButton: "Open Store",
    activeOpenButton: "✓ Currently Active",
    noStoresFoundTitle: "No Stores Found",
    noStoresFoundDesc: "Try changing your keyword or category.",
    activeSession: "Active session:",
    openPOSButton: "Open POS →",
    adminViewButton: "Admin View →",
    newStoreTitle: "New Store",
    storeNameLabel: "Store Name",
    industryTypeLabel: "Industry Type",
    locationAddressLabel: "Location / Address",
    cancelButton: "Cancel",
    createButton: "Create",
    creatingButton: "Creating...",
    confirmLeaveStore: "Are you sure you want to leave \"{storeName}\"? You will no longer have access to this store.",
    successCreateStore: "Store created successfully!",
    errorCreateStore: "Failed to create store.",
    leftStoreMessage: "You have left \"{storeName}\"",
    errorLeaveStore: "Failed to leave the store.",

    // CustomerDisplay
    welcomeGreeting: "Welcome!",
    supportMessage: "Thank you for supporting our store. We are happy to serve you.",
    welcomeCustomer: "Welcome Customer!",
    readyToProcess: "Ready to process your purchases. Your order details will automatically appear here.",
    purchaseDetails: "Purchase Details",
    cartListDesc: "This is the list of items in your cart",
    itemsCount: "items",
    eachPrice: "each",
    totalAmountLabel: "Total Amount:",

    // CashierPOS
    productCatalog: "Product Catalog",
    selectProductDesc: "Select a product to add to the current cart",
    searchProductPlaceholder: "Search product by name or category...",
    allCategories: "All Categories",
    loadingProducts: "Loading products...",
    noProductsTitle: "No Products in This Store",
    noProductsDesc: "There are no products in this store yet. Go to the Admin Dashboard to add products.",
    currentCartTitle: "Current Cart",
    cartDesc: "List of items to purchase",
    discountLabel: "Discount",
    clearCartButton: "Clear Cart",
    checkoutButton: "Checkout",
    processingButton: "Processing...",
    emptyCartTitle: "Cart is Empty",
    emptyCartDesc: "Select products on the left to start checkout",
    addProductTitle: "Add Product",
    categoryLabel: "Category",
    barcodeLabel: "Barcode / SKU",
    costPriceLabel: "Cost Price",
    sellingPriceLabel: "Selling Price",
    stockQtyLabel: "Stock Qty",
    productImageLabel: "Product Image",
    attachedFile: "✓ Attached:",
    createProductButton: "Create",
    creatingProductButton: "Creating...",
    thankYouMessage: "Thank you very much!",
    scanForDigitalReceipt: "Scan for digital receipt",
    printReceiptButton: "Print Receipt",
    closeButton: "Close",
    checkoutSuccess: "Checkout Successful! Order ID:",
    checkoutError: "Failed to process checkout. Try again.",
    addProdToCartFirst: "Please add a product to the cart first.",
    scannerTooltip: "Scan product barcode",
    cleanCartSuccess: "Cleared the cart.",
    limitedStockMsg: "Limited stock: Only up to {stock} units of {productName} available.",
    outOfStockMsg: "Sorry, no stock remaining for {productName}.",
    addedToCartMsg: "Added {productName} to cart.",

    // AdminDashboard
    inventory: "Inventory",
    analytics: "Analytics",
    settings: "Settings",
    inventoryView: "Inventory View",
    inventoryViewDesc: "Monitor current stock levels.",
    newProductButton: "+ New Product",
    nameColumn: "Name",
    categoryColumn: "Category",
    priceColumn: "Price",
    stockQtyColumn: "Stock Qty",
    units: "units",
    loadingText: "Loading...",
    noProductsText: "No products.",
    manageAndUpdate: "Manage & Update",
    manageAndUpdateDesc: "Restock, edit details, or delete items here.",
    noProductsToModify: "No products to modify.",
    productColumn: "Product",
    costSellingColumn: "Cost / Selling",
    currentStockColumn: "Current Stock",
    actionsColumn: "Actions",
    restockButton: "Restock",
    editButton: "Edit",
    deleteButton: "Delete",
    lowStockLabel: "Low ({stock})",
    staffTitle: "Staff List",
    staffDesc: "Cashiers allowed to log into this branch.",
    newStaffButton: "+ New Staff",
    roleColumn: "Role",
    emailColumn: "Email",
    statusColumn: "Status",
    actionColumn: "Action",
    removeButton: "Remove",
    storeProfileTitle: "Store Profile",
    manageStoreTitle: "Manage Store",
    manageStoreDesc: "Update key store details shown on POS and digital receipts.",
    phoneLabel: "Phone Number / Contact",
    currencyLabel: "Currency Symbol",
    saveChangesButton: "Save Changes",
    savingChangesButton: "Saving...",
    languageLabel: "Wika / Language",
    selectLanguagePlaceholder: "Select Language",
    englishOption: "English",
    filipinoOption: "Filipino (Tagalog)",
    successSaveSettings: "Store settings updated successfully!",
    errorSaveSettings: "Failed to save store settings.",
    restockTitle: "Restock Inventory",
    currentQuantityLabel: "Current stock:",
    addAmountLabel: "How many units to add?",
    restockPlaceholder: "Example: 50",
    saveStockButton: "Save Stock",
    updatingButton: "Updating...",
    editProductTitle: "Edit Product Details",
    successUpdateProduct: "Product updated successfully!",
    errorUpdateProduct: "Failed to update product.",
    confirmDeleteProduct: "Are you sure you want to delete \"{name}\"?",
    successDeleteProduct: "Product deleted successfully!",
    errorDeleteProduct: "Failed to delete product.",
    addStaffTitle: "Add New Staff",
    headCashierOption: "Head Cashier",
    cashierOption: "Cashier",
    successAddStaff: "Staff added successfully!",
    errorAddStaff: "Failed to add staff.",
    confirmRemoveStaff: "Are you sure you want to remove staff member \"{name}\"?",
    successRemoveStaff: "Staff member removed successfully!",
    errorRemoveStaff: "Failed to remove staff.",
    successUpdateRole: "Staff role updated successfully!",
    errorUpdateRole: "Failed to update staff role.",
  },
  fil: {
    // Shared / Navbar
    stores: "Mga Tindahan",
    adminView: "Admin View",
    posScreen: "POS Screen",
    transactions: "Transaksyon",
    logout: "Logout",
    activeStore: "Aktibo",

    // StoreSelector
    selectStore: "Pumili ng Tindahan",
    chooseStoreDescManager: "Magbukas o gumawa ng business unit para pamahalaan ang mga benta at imbentaryo.",
    chooseStoreDescStaff: "Magbukas ng tindahan kung saan ka nakatalaga bilang cashier.",
    searchStorePlaceholder: "Maghanap ng tindahan...",
    all: "Lahat",
    noStoreAssignedTitle: "Wala pang Nakatalagang Tindahan",
    noStoreAssignedDesc: "Wala ka pang nakatalagang manager o tindahan sa iyong account. Mangyaring makipag-ugnayan sa iyong Manager upang maitalaga ang iyong email sa kanilang tindahan.",
    refreshPageButton: "I-refresh ang Pahina",
    addStoreTitle: "Magdagdag ng Tindahan",
    addStoreDesc: "Magtala ng bagong branch para sa POS",
    openStoreButton: "Buksan ang Tindahan",
    activeOpenButton: "✓ Aktibong Bukas",
    noStoresFoundTitle: "Walang Tindahan na Nahanap",
    noStoresFoundDesc: "Subukang baguhin ang iyong keyword o kategorya.",
    activeSession: "Aktibong session:",
    openPOSButton: "Buksan ang POS →",
    adminViewButton: "Admin View →",
    newStoreTitle: "Bagong Tindahan",
    storeNameLabel: "Pangalan ng Tindahan",
    industryTypeLabel: "Uri ng Industriya",
    locationAddressLabel: "Lokasyon / Address",
    cancelButton: "Kanselahin",
    createButton: "Likhain",
    creatingButton: "Naililikha...",
    confirmLeaveStore: "Sigurado ka bang nais mong umalis sa \"{storeName}\"? Hindi mo na makaka-access ang tindahang ito pagkatapos.",
    successCreateStore: "Matagumpay na nailikha ang bagong tindahan!",
    errorCreateStore: "May naganap na error habang gumagawa ng tindahan.",
    leftStoreMessage: "Umalis ka na sa \"{storeName}\"",
    errorLeaveStore: "Hindi ka makapag-alis mula sa tindahan.",

    // CustomerDisplay
    welcomeGreeting: "Mabuhay!",
    supportMessage: "Salamat sa inyong pagtangkilik sa aming tindahan. Paglingkuran po namin kayo ng buong KYUT.",
    welcomeCustomer: "Welcome Customer!",
    readyToProcess: "Handang mag-proseso ng iyong mga bibilhin. Awtomatikong lalabas dito ang iyong order details.",
    purchaseDetails: "Detalye ng Pagbili",
    cartListDesc: "Ito ang listahan ng mga nakalagay sa iyong cart",
    itemsCount: "items",
    eachPrice: "bawat isa",
    totalAmountLabel: "Kabuuang Halaga:",

    // CashierPOS
    productCatalog: "Katalogo ng Produkto",
    selectProductDesc: "Pumili ng produkto para idagdag sa kasalukuyang cart",
    searchProductPlaceholder: "Maghanap ng produkto ayon sa pangalan o kategorya...",
    allCategories: "Lahat ng Kategorya",
    loadingProducts: "Kinukuha ang mga produkto...",
    noProductsTitle: "Walang Produkto sa Tindahang Ito",
    noProductsDesc: "Wala pang paninda ang tindahang ito sa database. Pumunta sa Admin Dashboard upang magdagdag ng produkto.",
    currentCartTitle: "Kasalukuyang Cart",
    cartDesc: "Listahan ng mga bibilhing aytem",
    discountLabel: "Selyo / Discount",
    clearCartButton: "Linisin ang Cart",
    checkoutButton: "I-proseso ang Bayad",
    processingButton: "Pinoproseso...",
    emptyCartTitle: "Walang laman ang cart",
    emptyCartDesc: "Pumili ng produkto sa kaliwa upang magsimula",
    addProductTitle: "Magdagdag ng Produkto",
    categoryLabel: "Kategorya",
    barcodeLabel: "Barcode / SKU",
    costPriceLabel: "Puhunan",
    sellingPriceLabel: "Benta",
    stockQtyLabel: "Dami (Stock)",
    productImageLabel: "Imahe ng Produkto (Attachment)",
    attachedFile: "✓ Attached:",
    createProductButton: "Likhain",
    creatingProductButton: "Ipinapasok...",
    thankYouMessage: "Maraming salamat po!",
    scanForDigitalReceipt: "I-scan para sa digital receipt",
    printReceiptButton: "I-print ang Resibo",
    closeButton: "Isara",
    checkoutSuccess: "Matagumpay ang Checkout! Order ID:",
    checkoutError: "Hindi ma-proseso ang checkout. Subukan muli.",
    addProdToCartFirst: "Mangyaring magdagdag muna ng produkto sa cart.",
    scannerTooltip: "I-scan ang Barcode ng Produkto",
    cleanCartSuccess: "Linisin ang cart.",
    limitedStockMsg: "Limitadong stock: Hanggang {stock} units lamang ng {productName} ang magagamit.",
    outOfStockMsg: "Paumanhin, walang natitirang stock para sa {productName}.",
    addedToCartMsg: "Idinagdag ang {productName} sa cart.",

    // AdminDashboard
    inventory: "Imbentaryo",
    analytics: "Analitiko",
    settings: "Settings",
    inventoryView: "Imbentaryo View",
    inventoryViewDesc: "Monitor ng kasalukuyang bilang ng paninda.",
    newProductButton: "+ Bagong Produkto",
    nameColumn: "Pangalan",
    categoryColumn: "Kategorya",
    priceColumn: "Presyo",
    stockQtyColumn: "Dami ng Stock",
    units: "units",
    loadingText: "Ikinakarga...",
    noProductsText: "Walang produkto.",
    manageAndUpdate: "Pamamahala at Pag-update",
    manageAndUpdateDesc: "Dito ka magre-restock, mag-e-edit ng detalye, o magbubura ng aytem.",
    noProductsToModify: "Walang produkto na pwedeng i-modify.",
    productColumn: "Produkto",
    costSellingColumn: "Puhunan / Benta",
    currentStockColumn: "Kasalukuyang Stock",
    actionsColumn: "Mga Aksyon",
    restockButton: "Restock",
    editButton: "Edit",
    deleteButton: "Burahin",
    lowStockLabel: "Mababa ({stock})",
    staffTitle: "Mga Staff",
    staffDesc: "Cashiers na pwedeng pumasok sa branch na ito.",
    newStaffButton: "+ Bagong Staff",
    roleColumn: "Role",
    emailColumn: "Email",
    statusColumn: "Status",
    actionColumn: "Aksyon",
    removeButton: "Tanggalin",
    storeProfileTitle: "Store Profile",
    manageStoreTitle: "Pamahalaan ang Tindahan",
    manageStoreDesc: "I-update ang mga pangunahing detalye ng iyong tindahan na makikita sa POS at sa mga digital receipt.",
    phoneLabel: "Numero ng Telepono / Contact",
    currencyLabel: "Simbolo ng Currency",
    saveChangesButton: "I-save ang Pagbabago",
    savingChangesButton: "Inililigtas...",
    languageLabel: "Wika / Language",
    selectLanguagePlaceholder: "Pumili ng Wika",
    englishOption: "English",
    filipinoOption: "Filipino (Tagalog)",
    successSaveSettings: "Matagumpay na na-update ang store settings!",
    errorSaveSettings: "Hindi ma-save ang settings ng tindahan.",
    restockTitle: "Mag-restock ng Imbentaryo",
    currentQuantityLabel: "Kasalukuyang laman:",
    addAmountLabel: "Ilang piraso ang idadagdag?",
    restockPlaceholder: "Halimbawa: 50",
    saveStockButton: "I-save Stock",
    updatingButton: "Ina-update...",
    editProductTitle: "I-edit ang Detalye ng Produkto",
    successUpdateProduct: "Matagumpay na na-update ang produkto!",
    errorUpdateProduct: "Hindi ma-save ang produkto.",
    confirmDeleteProduct: "Sigurado ka bang nais mong burahin ang \"{name}\"?",
    successDeleteProduct: "Matagumpay na nabura ang produkto!",
    errorDeleteProduct: "Hindi mabura ang produkto.",
    addStaffTitle: "Magdagdag ng Staff",
    headCashierOption: "Head Cashier",
    cashierOption: "Cashier",
    successAddStaff: "Matagumpay na naidagdag ang staff!",
    errorAddStaff: "Hindi maidagdag ang staff.",
    confirmRemoveStaff: "Sigurado ka bang nais mong tanggalin si \"{name}\" sa staff?",
    successRemoveStaff: "Matagumpay na natanggal ang staff!",
    errorRemoveStaff: "Hindi matanggal ang staff.",
    successUpdateRole: "Matagumpay na na-update ang role ng staff!",
    errorUpdateRole: "Hindi ma-update ang role ng staff.",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("app_language") || "fil";
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
    try {
      const bc = new BroadcastChannel("app_language_channel");
      bc.postMessage({ type: "UPDATE_LANGUAGE", language: lang });
      bc.close();
    } catch (e) {
      console.error("Broadcast failed:", e);
    }
  };

  useEffect(() => {
    try {
      const bc = new BroadcastChannel("app_language_channel");
      bc.onmessage = (event) => {
        if (event.data?.type === "UPDATE_LANGUAGE") {
          setLanguageState(event.data.language);
        }
      };
      return () => bc.close();
    } catch (e) {
      console.error("Broadcast listen failed:", e);
    }
  }, []);

  const t = (key, params = {}) => {
    let str = translations[language]?.[key] || translations["fil"]?.[key] || key;
    // Simple placeholder replacement, e.g. {storeName} or {stock}
    Object.keys(params).forEach((paramKey) => {
      str = str.replace(`{${paramKey}}`, params[paramKey]);
    });
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
