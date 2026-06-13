import { collection, addDoc, updateDoc, doc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Magdaragdag ng bagong produkto sa 'products' collection.
 * Tinitiyak na may store_id na nakakabit sa produkto.
 * 
 * @param {Object} productData - Detalye ng produkto (name, price, stock, category, atbp.).
 * @param {string} storeId - Ang ID ng tindahan kung saan kabilang ang produkto.
 * @returns {Promise<Object>} - Nilikhang produkto kasama ang document ID nito.
 */
export const addProduct = async (productData, storeId) => {
  if (!storeId) {
    throw new Error("Store ID is required to add a product.");
  }
  if (!productData || !productData.name) {
    throw new Error("Product name is required.");
  }

  try {
    const productsRef = collection(db, "products");
    const newProduct = {
      ...productData,
      store_id: storeId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(productsRef, newProduct);
    return {
      id: docRef.id,
      ...newProduct,
    };
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

/**
 * Mag-a-update ng impormasyon ng umiiral na produkto sa 'products' collection.
 * 
 * @param {string} productId - Ang ID ng produkto na i-a-update.
 * @param {Object} productData - Ang mga bagong detalye na i-a-update sa produkto.
 * @returns {Promise<void>}
 */
export const updateProduct = async (productId, productData) => {
  if (!productId) {
    throw new Error("Product ID is required to update a product.");
  }

  try {
    const productDocRef = doc(db, "products", productId);
    const updateData = {
      ...productData,
      updated_at: serverTimestamp(),
    };

    await updateDoc(productDocRef, updateData);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

/**
 * Kukuha ng lahat ng mga produkto mula sa 'products' collection para sa isang partikular na tindahan.
 * 
 * @param {string} storeId - Ang ID ng tindahan.
 * @returns {Promise<Array>} - Listahan ng mga produkto na kabilang sa tindahan.
 */
export const getProductsByStore = async (storeId) => {
  if (!storeId) {
    throw new Error("Store ID is required to fetch products.");
  }

  try {
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("store_id", "==", storeId));
    const querySnapshot = await getDocs(q);

    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return products;
  } catch (error) {
    console.error("Error fetching products for store:", error);
    throw error;
  }
};
