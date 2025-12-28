import React, { useEffect } from 'react';
import { PolicyLayout } from "@/components/PolicyLayout";

export default function TermsAndConditions() {
    useEffect(() => {
        document.title = "Terms & Conditions | Loot Drop";
    }, []);

    return (
        <PolicyLayout title="Terms & Conditions">
            <section>
                <h3>1. Introduction</h3>
                <p>
                    Welcome to Loot Drop. By accessing or using our website, you agree to be bound by these Terms and Conditions.
                    Please read them carefully before using our services.
                </p>
            </section>

            <section>
                <h3>2. Usage of Website</h3>
                <p>
                    You agree to use this website only for lawful purposes. You must not use this site for any fraudulent
                    activity or to conduct any activity that violates the laws of India. We reserve the right to
                    terminate access to users who violate these terms.
                </p>
            </section>

            <section>
                <h3>3. Order Acceptance & Pricing</h3>
                <p>
                    We reserve the right to refuse or cancel any order for any reason, including but not limited to
                    product availability, errors in pricing or product information, or issues identified by our fraud
                    detection department.
                </p>
                <p>
                    Prices for our products are subject to change without notice. We shall not be liable to you or to
                    any third-party for any modification, price change, suspension, or discontinuance of the Service.
                </p>
            </section>

            <section>
                <h3>4. Limitation of Liability</h3>
                <p>
                    Loot Drop shall not be liable for any special or consequential damages that result from the use of,
                    or the inability to use, the materials on this site or the performance of the products, even if
                    Loot Drop has been advised of the possibility of such damages.
                </p>
            </section>

            <section>
                <h3>5. Fraud & Misuse</h3>
                <p>
                    We actively monitor for fraudulent transactions. If we detect suspicious activity, we reserve
                    the right to cancel the order and report the activity to relevant authorities. Attempts to abuse
                    our return policy or promotion systems will result in a permanent ban.
                </p>
            </section>

            <section>
                <h3>6. Governing Law</h3>
                <p>
                    These Terms & Conditions shall be governed by and construed in accordance with the laws of <strong>India</strong>.
                    Any disputes arising out of or in connection with these terms shall be subject to the exclusive
                    jurisdiction of the courts in <strong>{"{{ City, State }}"}</strong>.
                </p>
            </section>

            <section>
                <h3>7. Contact Information</h3>
                <p>
                    Questions about the Terms of Service should be sent to us at <strong>{"{{ support@lootdrop.in }}"}</strong>.
                </p>
            </section>
        </PolicyLayout>
    );
}
