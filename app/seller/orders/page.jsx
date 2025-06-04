'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const Orders = () => {

    const { currency, getToken, user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSellerOrders = async () => {
        try {
            const token = await getToken();

            const { data } = await axios.get(
                '/api/order/seller-orders',
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setOrders(data.orders);
                setLoading(false);
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(error.message || "Failed to fetch orders");
        }
    };

    useEffect(() => {
        if (user) {
            fetchSellerOrders();
        }
    }, [user]);

    return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
            {loading ? (
                <Loading />
            ) : (
                <div className="md:p-10 p-4 space-y-5">
                    <h2 className="text-lg font-medium">Orders</h2>
                    <div className="max-w-4xl rounded-md">
                        {orders.map((order, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-t border-gray-300">
                                {/* Product Summary */}
                                <div className="flex-1 flex gap-5 max-w-80">
                                    <Image
                                        className="max-w-16 max-h-16 object-cover"
                                        src={assets.box_icon}
                                        alt="box_icon"
                                    />
                                    <p className="flex flex-col gap-3">
                                        <span className="font-medium">
                                            {Array.isArray(order.items) &&
                                                order.items
                                                    .map((item) =>
                                                        item?.product?.name
                                                            ? `${item.product.name} x ${item.quantity}`
                                                            : "Unknown product"
                                                    )
                                                    .join(", ")
                                            }
                                        </span>
                                        <span>Items: {order.items?.length || 0}</span>
                                    </p>
                                </div>

                                {/* Address */}
                                <div>
                                    {order.address ? (
                                        <p>
                                            <span className="font-medium">{order.address.fullName}</span><br />
                                            <span>{order.address.area}</span><br />
                                            <span>{`${order.address.city}, ${order.address.state}`}</span><br />
                                            <span>{order.address.phoneNumber}</span>
                                        </p>
                                    ) : (
                                        <p><span className="text-red-500">Address not available</span></p>
                                    )}
                                </div>

                                {/* Amount */}
                                <p className="font-medium my-auto">
                                    {currency}{order.amount ?? "0.00"}
                                </p>

                                {/* Payment Info */}
                                <div>
                                    <p className="flex flex-col">
                                        <span>Method: COD</span>
                                        <span>Date: {order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</span>
                                        <span>Payment: Pending</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default Orders;
