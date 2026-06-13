import { writeBatch, doc, collection, increment, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Magsusulat ng bagong order sa 'orders' collection at babawasan ang stock_quantity ng kaukulang produkto.
 * Gumagamit ng Firestore Batch Writes para masiguradong atomic ang transaksyon.
 *
 * @param {Object} orderData - Detalye ng order (store_id, items, subtotal, discount, total, cashier_id, cashier_name, payment_method, atbp.).
 * @returns {Promise<Object>} - Nilikhang order data kasama ang document ID nito.
 */
export const placeOrder = async (orderData) => {
  if (!orderData.store_id) {
    throw new Error("Store ID is required to place an order.");
  }
  if (!orderData.items || orderData.items.length === 0) {
    throw new Error("Cannot place an order with an empty cart.");
  }

  try {
    const batch = writeBatch(db);

    // 1. Gumawa ng bagong document reference sa 'orders' collection
    const ordersRef = collection(db, "orders");
    const newOrderDocRef = doc(ordersRef);
    const orderId = newOrderDocRef.id;

    const newOrder = {
      ...orderData,
      created_at: serverTimestamp(),
    };

    // 2. I-set ang bagong order document
    batch.set(newOrderDocRef, newOrder);

    // 3. I-update ang stock ng bawat item sa 'products' collection gamit ang atomic decrement
    orderData.items.forEach((item) => {
      if (!item.id) {
        throw new Error("Each order item must have a product ID.");
      }
      const productDocRef = doc(db, "products", item.id);
      // Babawasan ang 'stock' field base sa quantity ng binili
      batch.update(productDocRef, {
        stock: increment(-item.quantity),
      });
    });

    // 4. I-commit ang batch
    await batch.commit();

    return {
      id: orderId,
      ...newOrder,
    };
  } catch (error) {
    console.error("Error placing order and deducting stock:", error);
    throw error;
  }
};

/**
 * Kunin ang lahat ng orders para sa isang store, pinagsunod-sunod mula pinakabago.
 *
 * @param {string} storeId - Ang store_id ng aktibong tindahan.
 * @returns {Promise<Array>} - Listahan ng mga order documents.
 */
export const getOrdersByStore = async (storeId) => {
  if (!storeId) return [];

  try {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("store_id", "==", storeId)
    );
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Sort locally by created_at desc (newest first)
    orders.sort((a, b) => {
      const timeA = a.created_at?.toDate ? a.created_at.toDate().getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
      const timeB = b.created_at?.toDate ? b.created_at.toDate().getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
      return timeB - timeA;
    });

    return orders;
  } catch (error) {
    console.error("Error fetching orders by store:", error);
    throw error;
  }
};
