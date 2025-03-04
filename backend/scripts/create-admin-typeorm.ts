import { AppDataSource } from "../src/config/database";
import { Admin } from "../src/models/Admin";
import bcrypt from "bcrypt";

async function createAdmin() {
  try {
    await AppDataSource.initialize();
    console.log("Database connection established");

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables");
    }

    // Check if admin already exists
    const adminRepository = AppDataSource.getRepository(Admin);
    const existingAdmin = await adminRepository.findOne({ where: { email } });

    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create new admin
    const admin = new Admin();
    admin.email = email;
    admin.password = await bcrypt.hash(password, 10);

    // Save admin
    const savedAdmin = await adminRepository.save(admin);
    console.log("Admin user created successfully:", {
      id: savedAdmin.id,
      email: savedAdmin.email,
      createdAt: savedAdmin.createdAt
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

createAdmin(); 