import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'manager' o 'staff'
  const [loading, setLoading] = useState(true);

  // Helper Function para sa Sign Up (Backend Checklist #2)
  const signup = async (email, password, fullName, role) => {
    // 1. Gagawa ng user sa Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // 2. Magpapasok ng kaukulang data sa 'users' collection sa Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: fullName,
      email: email,
      global_role: role, // 'manager' o 'staff'
    });

    return user;
  };

  // Helper Function para sa Login (Backend Checklist #3)
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Helper Function para sa Logout
  const logout = () => {
    return signOut(auth);
  };

  // Session Observer para manatiling naka-login (Backend Checklist #3)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Kukunin ang role ng user mula sa Firestore kapag nag-login o nag-refresh
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().global_role);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
