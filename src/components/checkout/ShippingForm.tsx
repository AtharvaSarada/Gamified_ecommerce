import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { INDIAN_STATES } from "@/data/indianStates";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
    saveAddress: z.boolean().optional(),
});

export type ShippingFormData = z.infer<typeof shippingSchema>;

interface ShippingFormProps {
    defaultValues?: Partial<ShippingFormData>;
    onSubmit: (data: ShippingFormData) => void;
    onPinCodeChange?: (pinCode: string) => void;
    isLoading?: boolean;
    isServiceable?: boolean | null;
    mode?: 'checkout' | 'address_book';
}

export function ShippingForm({
    defaultValues,
    onSubmit,
    onPinCodeChange,
    isLoading = false,
    isServiceable = null,
    mode = 'checkout'
}: ShippingFormProps) {
    const { user } = useAuth();

    // Reset form when defaultValues change
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
            saveAddress: false,
            ...defaultValues,
        },
        mode: "onBlur"
    });

    const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = form;
    const pinCode = watch("pinCode");

    // Watch for defaultValues changes to update form
    useEffect(() => {
        if (defaultValues) {
            reset({
                fullName: defaultValues.fullName || "",
                email: defaultValues.email || "",
                phone: defaultValues.phone || "",
                addressLine1: defaultValues.addressLine1 || "",
                addressLine2: defaultValues.addressLine2 || "",
                city: defaultValues.city || "",
                state: defaultValues.state,
                pinCode: defaultValues.pinCode || "",
                saveAddress: false,
            });
        }
    }, [defaultValues, reset]);

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
                        onValueChange={(val) => setValue("state", val as any, { shouldValidate: true })}
                        value={watch("state")}
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
                    <div className="relative">
                        <Input
                            id="pinCode"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            {...register("pinCode")}
                            placeholder="400001"
                        />
                        {isLoading && (
                            <div className="absolute right-3 top-2.5">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>


                    {errors.pinCode && <p className="text-red-500 text-xs">{errors.pinCode.message}</p>}

                    {/* Serviceability Status */}
                    {pinCode?.length === 6 && !isLoading && isServiceable === false && (
                        <p className="text-red-500 text-xs font-bold mt-1">❌ Not serviceable yet</p>
                    )}
                    {pinCode?.length === 6 && !isLoading && isServiceable === true && (
                        <p className="text-green-500 text-xs font-bold mt-1">✅ Delivery available</p>
                    )}
                </div>
            </div>

            {/* Save Address Option (Checkout Mode + Logged In) */}
            {mode === 'checkout' && user && (
                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                        id="saveAddress"
                        onCheckedChange={(checked) => setValue("saveAddress", checked as boolean)}
                    />
                    <label
                        htmlFor="saveAddress"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Save this address for future drops
                    </label>
                </div>
            )}

            {/* Address Book Mode Action Button */}
            {mode === 'address_book' && (
                <div className="pt-4">
                    <Button type="submit" className="w-full font-bold uppercase tracking-widest" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Address
                    </Button>
                </div>
            )}

            {/* Hidden Submit for Checkout Integration */}
            {mode === 'checkout' && (
                <button type="submit" className="hidden" id="shipping-form-submit" />
            )}

        </form>
    );
}
