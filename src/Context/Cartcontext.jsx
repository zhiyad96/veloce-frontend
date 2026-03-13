

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../service/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Authcontext } from './Authcontext';

export const Cartcontext = createContext();

function Cartprovider({ children }) {
  const [cart, setCart] = useState([]);
  const { user,loading } = useContext(Authcontext);
  const [cartlength, setCartLength] = useState(0);
  
  const navigate = useNavigate();

  // ------------------------------------------renderpage-----------------------------------
  useEffect(() => {
    if (loading) return;

    if (user?.id) {
      fetchCart();
    } else {
      setCart([]);
      setCartLength(0);
    }
  }, [user]);

  // ---------------- Add to cart ----------------
  const addtocart = async (product) => {

    
    if (!user?.id) {
      toast.error("Please log in to add items to cart");
      navigate("/login");
      return;
    }

    try {
      await api.post(`carts/`, {
        product: product.id,
        quantity: 1
      });
      toast.success("added to cart");
      fetchCart();
    } catch (err) {
      console.log(err.message);
      toast.error("Failed to update cart");
    }
  };





  const fetchCart = async () => {
  try {
    const res = await api.get("carts/");

    setCart(res.data?.items || []);
    setCartLength(res.data?.items?.length || 0);

  } catch (err) {
    console.log(err);
  }
};

  // ---------------- Quantity ----------------
  const updateQty = async (cartid, delta) => {
    const item = cart.find(i => i.id === cartid);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);

    try {
      await api.put(`cartitem/${cartid}/`, {
        quantity: newQty
      });
      toast.success("Quantity updated");
      fetchCart()
    } catch (err) {
      console.log(err.message);
      toast.error("Failed to update quantity");
    }
  };

  const increaseQty = (cartid) => updateQty(cartid, 1);
  const decreaseQty = (cartid) => updateQty(cartid, -1);

  // ---------------- Remove from cart ----------------
  const removecart = async (cartid) => {
    if (!user?.id) return;

    try {
      await api.delete(`cartitem/${cartid}/`);
      fetchCart();
      toast.success("Item removed from cart");
    } catch (err) {
      console.log(err.message);
      toast.error("Failed to remove item");
    }
  };





  const handleCheckout = async (total, addressId) => {

  if (!addressId) {
    toast.error("Please select a shipping address");
    return;
  }

  try {

    const res = await api.post("payment/", {
      amount: total
    });

    const order = res.data.order;
    const key = res.data.razorpay_key;

    const options = {
      key: key,
      amount: order.amount,
      currency: "INR",
      name: "Veloce Garage",
      description: "Order Payment",
      order_id: order.id,

      handler: async function (response) {

        await api.post("verify/", {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          address_id: addressId
        });

        setCart([]);
        fetchCart();

        toast.success("Payment Successful");

        navigate("/OrederHistory");
      },

      theme: {
        color: "#4f46e5"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (error) {
    console.log(error.response?.data);
    toast.error("Payment failed");
  }
};

  return (
    <Cartcontext.Provider value={{
      cart,
      cartlength,
      setCart,
      addtocart,
      removecart,
      increaseQty,
      decreaseQty,
      fetchCart,
      handleCheckout
    }}>
      {children}
    </Cartcontext.Provider>
  );
}

export default Cartprovider;
