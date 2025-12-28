import React, { useEffect } from 'react';
import { PolicyLayout } from "@/components/PolicyLayout";

export default function ShippingPolicy() {
    useEffect(() => {
        document.title = "Shipping Policy | Loot Drop";
    }, []);

    return (
        <PolicyLayout title="Shipping Policy">
            <section>
                <h3>Shipping Coverage</h3>
                <p>
                    Loot Drop currently ships to serviceable pin codes across <strong>India</strong>. We partner with
                    <strong>ShipRocket</strong> to ensure reliable and trackable delivery for your gear.
                </p>
            </section>

            <section>
                <h3>Processing & Delivery Timelines</h3>
                <p>
                    <strong>Processing Time:</strong> All orders are processed within {"{{ 1-2 business days }}"}. Orders are not
                    shipped or delivered on weekends or holidays.
                </p>
                <p>
                    <strong>Estimated Delivery Time:</strong> Standard delivery usually takes {"{{ 5-7 business days }}"} depending
                    on your location. You will receive a tracking link via email/SMS once your order is dispatched.
                </p>
            </section>

            <section>
                <h3>Shipping Charges</h3>
                <ul>
                    <li><strong>Free Shipping:</strong> On all prepaid orders or orders with a total value of <strong>₹1000</strong> or more.</li>
                    <li><strong>Standard Charges:</strong> A nominal shipping fee may apply for orders below ₹1000 or for Cash on Delivery (COD) orders, calculated at checkout.</li>
                </ul>
            </section>

            <section>
                <h3>RTO (Return to Origin) Policy</h3>
                <p>
                    If a package is undeliverable due to incorrect address, failed delivery attempts, or refused delivery (RTO):
                </p>
                <ul>
                    <li>
                        <strong>Prepaid Orders:</strong> The package will be returned to us. We will initiate a refund
                        to your original payment source after deducting any applicable shipping handling charges and
                        inspecting the returned shipment.
                    </li>
                    <li>
                        <strong>COD Orders:</strong> The order will be effectively cancelled and closed. No refunds are applicable
                        since no payment was made. Future COD privileges may be restricted for accounts with repeated refusals.
                    </li>
                </ul>
            </section>
        </PolicyLayout>
    );
}
