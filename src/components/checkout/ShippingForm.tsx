import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDIAN_STATES } from "@/data/indianStates";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const phoneRegex = new RegExp(/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/);

const shippingSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().refine((val) => {
        // Basic India phone validation
        const phoneNumber = parsePhoneNumberFromString(val, 'IN');
        return phoneNumber?.isValid() && phoneNumber?.country === 'IN';
    }, "Invalid Indian phone number"),
    addressLine1: z.string().min(5, "Address must be at least 5 characters"),
    addressLine2: z.string().optional(),
    city: z.string().min(2, "City is required"),
    state: z.enum([...INDIAN_STATES], {
        required_error: "Please select a state",
    }),
    pinCode: z.string().regex(/^[1-9][0-9]{5}$/, "Invalid PIN code (6 digits)"),
});

export type ShippingFormData = z.infer<typeof shippingSchema>;

interface ShippingFormProps {
    defaultValues?: Partial<ShippingFormData>;
    onSubmit: (data: ShippingFormData) => void;
    onPinCodeChange?: (pinCode: string) => void;
    isLoading?: boolean;
    isServiceable?: boolean | null;
}

export function ShippingForm({
    defaultValues,
    onSubmit,
    onPinCodeChange,
    isLoading = false,
    isServiceable = null
}: ShippingFormProps) {
    const form = useForm<ShippingFormData>({
        resolver: zodResolver(shippingSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: undefined,
            pinCode: "",
            ...defaultValues,
        },
        mode: "onBlur"
    });

    const { register, handleSubmit, formState: { errors }, watch, setValue } = form;
    const pinCode = watch("pinCode");

    // Watch for PIN code changes
    useEffect(() => {
        if (pinCode && pinCode.length === 6 && /^[1-9][0-9]{5}$/.test(pinCode)) {
            onPinCodeChange?.(pinCode);
        }
    }, [pinCode, onPinCodeChange]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" {...register("fullName")} placeholder="John Doe" />
                    {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register("email")} placeholder="john@example.com" />
                    {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" {...register("phone")} placeholder="9876543210" />
                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                </div>

                {/* Address Line 1 */}
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="addressLine1">Address Line 1</Label>
                    <Input id="addressLine1" {...register("addressLine1")} placeholder="Flat No, Building, Street" />
                    {errors.addressLine1 && <p className="text-red-500 text-xs">{errors.addressLine1.message}</p>}
                </div>

                {/* Address Line 2 */}
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input id="addressLine2" {...register("addressLine2")} placeholder="Landmark, Area" />
                </div>

                {/* City */}
                <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register("city")} placeholder="Mumbai" />
                    {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
                </div>

                {/* State */}
                <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select
                        onValueChange={(val) => setValue("state", val as any)}
                        defaultValue={defaultValues?.state}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                            {INDIAN_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                    {state}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
                </div>

                {/* PIN Code */}
                <div className="space-y-2">
                    <Label htmlFor="pinCode">PIN Code</Label>
                    <Input id="pinCode" type="number" maxLength={6} {...register("pinCode")} placeholder="400001" />
                    {errors.pinCode && <p className="text-red-500 text-xs">{errors.pinCode.message}</p>}

                    {/* Serviceability Status */}
                    {pinCode?.length === 6 && isServiceable === false && (
                        <p className="text-red-500 text-xs">❌ Not serviceable yet</p>
                    )}
                    {pinCode?.length === 6 && isServiceable === true && (
                        <p className="text-green-500 text-xs">✅ Delivery available</p>
                    )}
                </div>
            </div>

            {/* Submit Button is handled by parent or explicit button? 
          Usually we want the "Confirm Order" button to be outside, or inside.
          If outside, we need to expose form ref or use context.
          For simplicity, let's keep it handled by parent triggering submit via ref, 
          OR put the button inside. 
          The CheckoutPage design has "Confirm Order" at the bottom right.
          I'll export the form ID so we can trigger it from outside, OR use a hidden submit button.
      */}
            <button type="submit" className="hidden" id="shipping-form-submit" />
        </form>
    );
}
