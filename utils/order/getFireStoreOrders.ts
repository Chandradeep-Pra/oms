import { db } from "@/app/config/firebase";
import { OrderType } from "@/types/orderType";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

// 🔁 Get all orders for a user
export const getOrders = async (userId: string): Promise<OrderType[]> => {
  try {
    const ordersRef = collection(db, "users", userId, "orders");
    const snapshot = await getDocs(ordersRef);

    const orders: OrderType[] = snapshot.docs.map((doc) => ({
      ...(doc.data() as OrderType),
      id: doc.id, // Ensure Firestore doc ID is used as the order ID
    }));

    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

// ➕ Add a new order for a user
export const addOrder = async (
  userId: string,
  orderData: Omit<OrderType, "id">
): Promise<string> => {
  try {
    const ordersRef = collection(db, "users", userId, "orders");
    const newDocRef = await addDoc(ordersRef, {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Order added with ID:", newDocRef.id);
    return newDocRef.id;
  } catch (error: any) {
    console.error("🔥 Error adding order:", error.message, error.code, error);
    throw error;
  }
};

// 🔧 Update an existing order
export const updateOrderInFirestore = async (
  userId: string,
  orderId: string,
  updatedFields: Partial<OrderType>
) => {
  const orderRef = doc(db, "users", userId, "orders", orderId);
  try {
    await updateDoc(orderRef, {
      ...updatedFields,
      updatedAt: serverTimestamp(),
    });
    console.log("✅ Order updated in Firestore");
  } catch (error) {
    console.error("🔥 Error updating order in Firestore:", error);
    throw error;
  }
};
