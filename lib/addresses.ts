import { db } from "./db";
import { str } from "./auth";

export type Address = {
  id: string; userId: string; name: string; phone: string; line1: string; line2: string;
  city: string; state: string; postalCode: string; country: string; isDefault: boolean;
};

export function parseAddress(b: any): { value?: Omit<Address, "id" | "userId" | "isDefault">; error?: string } {
  const v = {
    name: str(b?.name, 80), phone: str(b?.phone, 20), line1: str(b?.line1, 150), line2: str(b?.line2, 150),
    city: str(b?.city, 80), state: str(b?.state, 80), postalCode: str(b?.postalCode, 12), country: str(b?.country, 60) || "India",
  };
  if (v.name.length < 2) return { error: "Please enter the recipient's name." };
  if (!/^[0-9+\-\s]{7,20}$/.test(v.phone)) return { error: "Please enter a valid phone number." };
  if (v.line1.length < 3) return { error: "Please enter the street address." };
  if (!v.city) return { error: "Please enter the city." };
  if (!v.state) return { error: "Please enter the state." };
  if (!/^[A-Za-z0-9\- ]{3,12}$/.test(v.postalCode)) return { error: "Please enter a valid postal code." };
  return { value: v };
}

export const mine = async (userId: string) => (await db.list<Address>("addresses")).filter((a) => a.userId === userId);
