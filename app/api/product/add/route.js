import { v2 as cloudinary } from "cloudinary";
import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";


// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


export async function POST(request) {
  try {
    console.log("🔐 Authenticating user...");
    const { userId } = getAuth(request);
    console.log("✅ userId:", userId);

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      console.log("❌ Not a seller");
      return NextResponse.json({ success: false, message: "Not authorized" });
    }

    console.log("📦 Reading form data...");
    const formData = await request.formData();
    const name = formData.get("name");
    const description = formData.get("description");
    const category = formData.get("category");
    const price = formData.get("price");
    const offerPrice = formData.get("offerPrice");
    const files = formData.getAll("images");

    if (!files || files.length === 0) {
      console.log("❌ No files found in request");
      return NextResponse.json({ success: false, message: "No files uploaded" });
    }

    console.log("☁️ Uploading to Cloudinary...");
    const result = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
              if (error) {
                console.error("❌ Cloudinary error:", error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          stream.end(buffer);
        });
      })
    );

    const image = result.map((r) => r.secure_url);
    console.log("✅ Image upload successful:", image);

    await connectDB();
    console.log("✅ Connected to DB");

    const newProduct = await Product.create({
      userId,
      name,
      description,
      category,
      price: Number(price),
      offerPrice: Number(offerPrice),
      image,
      date: Date.now(),
    });

    console.log("✅ Product saved:", newProduct);

    return NextResponse.json({ success: true, message: "Upload successful", newProduct });
  } catch (error) {
    console.error("🔥 Server error:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}

