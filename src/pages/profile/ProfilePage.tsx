import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { ProfileTab } from './tabs/ProfileTab';
import { OrdersTab } from './tabs/OrdersTab';
import { AddressesTab } from './tabs/AddressesTab';
import { WishlistTab } from './tabs/WishlistTab';
import { SettingsTab } from './tabs/SettingsTab';

export const ProfilePage: React.FC = () => {
    return (
        <ProfileLayout>
            <Routes>
                <Route index element={<ProfileTab />} />
                <Route path="orders" element={<OrdersTab />} />
                <Route path="addresses" element={<AddressesTab />} />
                <Route path="wishlist" element={<WishlistTab />} />
                <Route path="settings" element={<SettingsTab />} />
                <Route path="*" element={<Navigate to="/profile" replace />} />
            </Routes>
        </ProfileLayout>
    );
};
