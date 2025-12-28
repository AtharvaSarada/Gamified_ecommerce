import React, { useEffect } from 'react';
import { PolicyLayout } from "@/components/PolicyLayout";

export default function PrivacyPolicy() {
    useEffect(() => {
        document.title = "Privacy Policy | Loot Drop";
    }, []);

    return (
        <PolicyLayout title="Privacy Policy">
            <section>
                <h3>1. Information We Collect</h3>
                <p>
                    We collect information you provide directly to us when you make a purchase, create an account, or
                    communicate with us. This may include your name, email address, phone number, shipping address,
                    and order details.
                </p>
            </section>

            <section>
                <h3>2. How We Use Your Data</h3>
                <p>
                    We use the collected information to:
                </p>
                <ul>
                    <li>Process and fulfill your orders.</li>
                    <li>Communicate with you regarding your order status.</li>
                    <li>Improve our store functionality and customer service.</li>
                    <li>Prevent fraud and ensure transaction security.</li>
                </ul>
            </section>

            <section>
                <h3>3. Payment Information</h3>
                <p>
                    <strong>We do not store your credit card or payment information on our servers.</strong> All payments are
                    processed securely through our payment gateway partner, <strong>Razorpay</strong>. Your payment data
                    is encrypted and handled directly by Razorpay in compliance with PCI-DSS standards.
                </p>
            </section>

            <section>
                <h3>4. Data Sharing</h3>
                <p>
                    We value your privacy and do not sell your personal data. However, we share necessary information with
                    trusted third parties to fulfill your services:
                </p>
                <ul>
                    <li><strong>Logistics Partners (e.g., ShipRocket):</strong> Name, address, and phone number for delivery purposes.</li>
                    <li><strong>Payment Gateways:</strong> For processing secure transactions.</li>
                </ul>
            </section>

            <section>
                <h3>5. Data Security</h3>
                <p>
                    We implement appropriate security measures to protect your personal information against unauthorized
                    access, alteration, disclosure, or destruction.
                </p>
            </section>
        </PolicyLayout>
    );
}
