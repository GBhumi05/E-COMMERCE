'use client'
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

// Create context
export const AppContext = createContext();

// Custom hook to access context
export const useAppContext = () => {
    return useContext(AppContext);
}

export const AppContextProvider = (props) => {
    const currency = "₹";
    const router = useRouter();

    const { user } = useUser();
    const { getToken } = useAuth();

    const [products, setProducts] = useState([]);
    const [userData, setUserData] = useState(false);
    const [isSeller, setIsSeller] = useState(false);
    const [cartItems, setCartItems] = useState({});

    // Fetch product data
    const fetchProductData = async () => {
        try {
            const { data } = await axios.get('/api/product/list');

            if (data.success) {
                setProducts(data.products);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Fetch user data and cart
    const fetchUserData = async () => {
        try {
            if (user?.publicMetadata?.role === 'seller') {
                setIsSeller(true);
            }

            const token = await getToken();
            const { data } = await axios.get('/api/user/data', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setUserData(data.user);
                setCartItems(data.user.cartItems || {}); // ✅ Safe fallback
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Add item to cart
    const addToCart = async (itemId) => {
        if (!user) {
            return toast('Please login', { icon: '⚠️' });
        }

        let cartData = structuredClone(cartItems || {});
        if (cartData[itemId]) {
            cartData[itemId] += 1;
        } else {
            cartData[itemId] = 1;
        }

        setCartItems(cartData);

        try {
            const token = await getToken();
            await axios.post('/api/cart/update', { cartData }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Item added to cart');
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Update item quantity in cart
    const updateCartQuantity = async (itemId, quantity) => {
        let cartData = structuredClone(cartItems || {});

        if (quantity === 0) {
            delete cartData[itemId];
        } else {
            cartData[itemId] = quantity;
        }

        setCartItems(cartData);

        try {
            const token = await getToken();
            await axios.post('/api/cart/update', { cartData }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Cart updated');
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Count total items in cart
    const getCartCount = () => {
        let totalCount = 0;
        for (const itemId in cartItems) {
            if (cartItems[itemId] > 0) {
                totalCount += cartItems[itemId];
            }
        }
        return totalCount;
    };

    // Calculate total cart amount
    const getCartAmount = () => {
        let totalAmount = 0;
        for (const itemId in cartItems) {
            let itemInfo = products.find((product) => product._id === itemId);
            if (itemInfo && cartItems[itemId] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[itemId];
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    };

    // Fetch products once on load
    useEffect(() => {
        fetchProductData();
    }, []);

    // Fetch user data when user is available
    useEffect(() => {
        if (user) {
            fetchUserData();
        } else {
            setCartItems({}); // Reset cart if user logs out
            setUserData(false);
            setIsSeller(false);
        }
    }, [user]);

    // Expose context values
    const value = {
        user,
        getToken,
        currency,
        router,
        isSeller,
        setIsSeller,
        userData,
        fetchUserData,
        products,
        fetchProductData,
        cartItems,
        setCartItems,
        addToCart,
        updateCartQuantity,
        getCartCount,
        getCartAmount,
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};
