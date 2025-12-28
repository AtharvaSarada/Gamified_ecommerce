import React, { useEffect } from 'react';
import { PolicyLayout } from "@/components/PolicyLayout";

export default function ContactPage() {
    useEffect(() => {
        document.title = "Contact Us | Loot Drop";
    }, []);

    return (
        <PolicyLayout title="Contact Us">
            <div className="space-y-6">
                <p className="text-lg">
                    Have questions or need assistance? We're here to help!
                </p>

                <div className="bg-card border border-border p-6 rounded-lg angular-card">
                    <h3 className="mt-0 text-primary">Get In Touch</h3>

                    <p><strong>Business Name:</strong> Loot Drop</p>

                    <p>
                        <strong>Email:</strong> <a href="mailto:support@lootdrop.in" className="text-primary hover:underline">{"{{ support@lootdrop.in }}"}</a>
                    </p>

                    <p>
                        <strong>Phone:</strong> {"{{ +91-XXXXXXXXXX }}"}
                    </p>

                    <p>
                        <strong>Registered Address:</strong><br />
                        {"{{ Business Address, City, State, India }}"}
                    </p>

                    <p>
                        <strong>Operating Hours:</strong><br />
                        Monday - Friday: 10:00 AM - 6:00 PM (IST)
                    </p>

                    <p><strong>Country:</strong> India</p>
                </div>

                <p className="text-muted-foreground text-sm">
                    For order related queries, please include your Order ID in the subject line.
                </p>
            </div>
        </PolicyLayout>
    );
}
