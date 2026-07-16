import { CONFIG } from '../config';
import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const { user } = useAuth();

  const addToCart = (item) => {
    // Track interaction for collaborative filtering
    if (user && item.id) {
      fetch('CONFIG.API_URL/api/recommend/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: user.email,
          product_id: item.id,
          interaction_type: 'CART'
        })
      }).catch(e => console.error(e));
    }

    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      const maxQty = item.inventory_qty !== undefined ? item.inventory_qty : 10;
      if (existing) {
        if (existing.quantity >= maxQty) {
          alert(`Cannot add more. Only ${maxQty} items left in stock.`);
          return prev;
        }
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (maxQty <= 0) {
        alert("This item is out of stock.");
        return prev;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id, newQty) => {
    setCartItems(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      const maxQty = item.inventory_qty !== undefined ? item.inventory_qty : 10;
      if (newQty > maxQty) {
        alert(`Only ${maxQty} items left in stock.`);
        return prev;
      }
      if (newQty <= 0) {
        return prev.filter(i => i.id !== id);
      }
      return prev.map(i => i.id === id ? { ...i, quantity: newQty } : i);
    });
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((total, item) => total + (item.price_usd * item.quantity), 0);
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
