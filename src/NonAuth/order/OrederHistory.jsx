import React, { useContext, useEffect, useState } from "react";
import { Authcontext } from "../../Context/Authcontext";
import { api } from "../../service/api";
import toast from "react-hot-toast";

export default function OrderHistory() {
  const { user } = useContext(Authcontext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================================ fetch orders =======================

  const fetchOrders = async () => {
    if (!user?.id) return;

    try {
      const { data } = await api.get("orders/");
      setOrders(data);
      console.log(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id]);

  // ======================================== remove order ================================

  const handleRemoveOrder = async (orderId) => {
    try {
      await api.patch(`orders/${orderId}/cancel/`);

      toast.success("Order canceled successfully!");

      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel order");
    }
  };

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Order History</h2>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border rounded-xl shadow-sm p-6 flex flex-col gap-4"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-semibold text-gray-800">
                    Order #{order.id}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-white text-sm
                ${order.status === "pending" && "bg-yellow-500"}
                ${order.status === "shipped" && "bg-blue-500"}
                ${order.status === "delivered" && "bg-green-600"}
                ${order.status === "cancelled" && "bg-red-500"}
                `}
                >
                  {order.status}
                </span>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">Items</p>
                <ul className="text-gray-600 text-sm list-disc ml-5">
                  {order.items?.map((item) => (
                    <li key={item.id}>
                      {item.product_name} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-semibold text-gray-800">Shipping Address</p>
                <p>{order.address?.full_name}</p>
                <p>{order.address?.phone_number}</p>
                <p>{order.address?.address_line_1}</p>
                {order.address?.address_line_2 && (
                  <p>{order.address.address_line_2}</p>
                )}
                <p>
                  {order.address?.city}, {order.address?.state}
                </p>
                <p>
                  {order.address?.country} - {order.address?.postal_code}
                </p>
              </div>

              {order.status !== "cancelled" && order.status !== "delivered" && (
                <div className="flex justify-end">
                  <button
                    onClick={() => handleRemoveOrder(order.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
