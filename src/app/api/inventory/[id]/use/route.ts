import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";

export async function POST(req: Request, context: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const { quantityUsed, userId, notes } = await req.json();
    const params = await context.params;
    const id = params.id;

    const item = await db.collection("inventory").findOne({ _id: new ObjectId(id) });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (typeof quantityUsed !== "number" || quantityUsed <= 0 || quantityUsed > item.quantity) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    const updated = await db.collection("inventory").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { quantity: -quantityUsed } },
      { returnDocument: "after" }
    );

    await db.collection("usageHistory").insertOne({
      itemId: id,
      date: new Date(),
      quantityUsed,
      notes,
      userId,
    });
    if (!updated) {
      return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }
    const updatedItem = updated.value || updated; // Soporta ambos casos

    if (!updatedItem) {
      return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }   
    
    updatedItem.id = updatedItem._id.toString();
    delete updatedItem._id;

    revalidatePath(`/inventory/${id}`);
    revalidatePath("/dashboard");

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}