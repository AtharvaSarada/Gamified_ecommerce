import React, { useEffect } from 'react';
import { PolicyLayout } from "@/components/PolicyLayout";

export default function CancellationRefundPolicy() {
    useEffect(() => {
        document.title = "Cancellation & Refund Policy | Loot Drop";
    }, []);

    return (
        <PolicyLayout title="Cancellation & Refund Policy">
            <section>
                <h3>Cancellation Policy</h3>
                <p>
                    At Loot Drop, we strive to fulfill your orders as quickly as possible. You may request a cancellation
                    of your order only before it has been shipped. Once the order is handed over to our logistics partner
                    (ShipRocket), it cannot be cancelled.
                </p>
                <p>
                    If you wish to cancel an order, please contact our support team immediately at <strong>{"{{ support@lootdrop.in }}"}</strong>
                    with your Order ID.
                </p>
            </section>

            <section>
                <h3>Return & Refund Policy</h3>
                <p>
                    We offer a <strong>7-day return window</strong> from the date of delivery. If 7 days have passed since
                    your purchase has been delivered, we cannot offer you a refund or exchange.
                </p>

                <h4>Eligibility for Returns</h4>
                <p>
                    To be eligible for a return, your item must be strictly unused and in the same condition that you received it.
                    It must also be in the original packaging with all tags intact.
                </p>
                <p>
                    Create a return request only if:
                </p>
                <ul>
                    <li>The product is damaged or defective upon arrival.</li>
                    <li>You received the wrong product or size.</li>
                </ul>
                <p>
                    <strong>Note:</strong> We require unboxing video or photo proof for claims regarding damaged or missing items.
                </p>

                <h4>Non-returnable Items</h4>
                <p>
                    Certain types of items cannot be returned, including but not limited to custom-made products or
                    items marked as "Final Sale".
                </p>
            </section>

            <section>
                <h3>Refund Process</h3>
                <p>
                    Once your return is received and inspected at our warehouse, we will notify you of the approval or
                    rejection of your refund.
                </p>
                <p>
                    If approved, your refund will be processed promptly. The amount will automatically be credited back to your
                    <strong>original method of payment</strong> (Credit Card, Debit Card, UPI, etc.).
                </p>
                <p>
                    <strong>We do not offer store credits.</strong> All valid refunds are processed directly to the source account.
                </p>

                <h4>Refund Timeline</h4>
                <p>
                    Please allow <strong>5-10 business days</strong> for the refund to reflect in your bank account after we approve it.
                    Processing times may vary depending on your bank or payment provider.
                </p>
            </section>

            <section>
                <h3>Late or Missing Refunds</h3>
                <p>
                    If you haven’t received a refund yet, first check your bank account again. Then contact your credit card
                    company or bank, as there is often some processing time before a refund is officially posted.
                </p>
                <p>
                    If you’ve done all of this and you still have not received your refund yet, please contact us at
                    <strong>{"{{ support@lootdrop.in }}"}</strong>.
                </p>
            </section>
        </PolicyLayout>
    );
}
