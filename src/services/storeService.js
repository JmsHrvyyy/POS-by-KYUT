import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Kukuha ng mga tindahan (stores) mula sa Firestore kung saan ang owner_id ay
 * katumbas ng UID ng kasalukuyang naka-login na Manager.
 * 
 * @param {string} managerUid - Ang UID ng naka-login na Manager/Owner.
 * @returns {Promise<Array>} - Listahan ng mga tindahan.
 */
export const getStoresByManager = async (managerUid) => {
  if (!managerUid) {
    throw new Error("Manager UID is required to fetch stores.");
  }
  
  try {
    const storesRef = collection(db, "stores");
    const q = query(storesRef, where("owner_id", "==", managerUid));
    const querySnapshot = await getDocs(q);
    
    const stores = [];
    querySnapshot.forEach((doc) => {
      stores.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return stores;
  } catch (error) {
    console.error("Error fetching stores for manager:", error);
    throw error;
  }
};

/**
 * Hihilahin ang lahat ng store_id mula sa store_staff collection kung saan
 * ang cashier_id ay katumbas ng UID ng kasalukuyang naka-login na Staff.
 * 
 * @param {string} staffUid - Ang UID ng naka-login na Staff/Cashier.
 * @returns {Promise<Array<string>>} - Listahan ng mga store_id.
 */
export const getAssignedStoreIds = async (staffUid, staffEmail = "") => {
  if (!staffUid) {
    throw new Error("Staff UID is required to fetch assigned stores.");
  }

  try {
    const storeStaffRef = collection(db, "store_staff");
    const storeIds = [];

    if (staffEmail) {
      const qEmail = query(storeStaffRef, where("email", "==", staffEmail.trim()));
      const querySnapshot = await getDocs(qEmail);

      for (const d of querySnapshot.docs) {
        const data = d.data();
        // Kung pending o iba ang cashier_id, i-link ito sa bagong UID
        if (data.cashier_id !== staffUid) {
          const docRef = doc(db, "store_staff", d.id);
          await updateDoc(docRef, {
            cashier_id: staffUid,
            status: "Active"
          });
        }
        if (data.store_id) {
          storeIds.push(data.store_id);
        }
      }
    }

    // Kung walang nahanap gamit ang email, fallback sa paghahanap gamit ang cashier_id
    if (storeIds.length === 0) {
      const qUid = query(storeStaffRef, where("cashier_id", "==", staffUid));
      const querySnapshot = await getDocs(qUid);
      querySnapshot.forEach((d) => {
        const data = d.data();
        if (data.store_id) {
          storeIds.push(data.store_id);
        }
      });
    }

    return storeIds;
  } catch (error) {
    console.error("Error fetching assigned stores for staff:", error);
    throw error;
  }
};

/**
 * Gagawa ng bagong tindahan (store) sa 'stores' collection
 * at awtomatikong isasama ang owner_id ng gumawa.
 * 
 * @param {Object} storeData - Ang detalye ng tindahan (hal. name, address, atbp.).
 * @param {string} ownerId - Ang UID ng kasalukuyang naka-login na Manager/Owner.
 * @returns {Promise<Object>} - Ang nilikhang store data kasama ang document ID nito.
 */
export const createStore = async (storeData, ownerId) => {
  if (!ownerId) {
    throw new Error("Owner ID is required to create a store.");
  }
  if (!storeData || !storeData.name) {
    throw new Error("Store name is required.");
  }

  try {
    const storesRef = collection(db, "stores");
    const newStoreData = {
      ...storeData,
      owner_id: ownerId,
      created_at: serverTimestamp(),
    };

    const docRef = await addDoc(storesRef, newStoreData);
    return {
      id: docRef.id,
      ...newStoreData,
    };
  } catch (error) {
    console.error("Error creating store:", error);
    throw error;
  }
};

/**
 * Updates an existing store in the 'stores' collection.
 * 
 * @param {string} storeId - The store ID to update.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Promise<void>}
 */
export const updateStore = async (storeId, updatedFields) => {
  if (!storeId) {
    throw new Error("Store ID is required to update a store.");
  }
  try {
    const storeDocRef = doc(db, "stores", storeId);
    await updateDoc(storeDocRef, {
      ...updatedFields,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating store details:", error);
    throw error;
  }
};

