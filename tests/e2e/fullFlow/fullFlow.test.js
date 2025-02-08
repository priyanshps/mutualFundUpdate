import request from "supertest";
import app from "../../../server"; // Adjust path as needed
import User from "../../../models/User";
import Portfolio from "../../../models/Portfolio";
import bcrypt from "bcryptjs";

import mongoose from "mongoose";

let token;
const testUser = {
  email: "test@example.com",
  password: "StrongPass123!",
};

describe("🔹🔹🔹🔹 Application E2E Tests 🔹🔹🔹🔹", () => {
  afterAll(async () => {
    await User.deleteMany({});
    // await mongoose.connection.close();
  });

  it(" Should register a user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      password: "Test@1234",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "User registered");
  });
  it(" Should return 400 if email or password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@example.com" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Email and password are required");
  });

  

  it(" Should reject invalid email formats", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "invalid-email",
      password: "ValidPass123!",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid email format");
  });

  it(" Should return 400 if email is missing", async () => {
    const res = await request(app).post("/api/auth/register").send({
      password: "ValidPass123!",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Email and password are required");
  });

  it(" Should return 400 if password is missing", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "user@example.com",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Email and password are required");
  });


  it(" Should return 400 if password is missing uppercase letter", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "user@example.com",
      password: "lowercase1!",
    });

    expect(res.statusCode).toBe(400);
  });

  it(" Should return 400 if password is missing lowercase letter", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "user@example.com",
      password: "UPPERCASE1!",
    });

    expect(res.statusCode).toBe(400);
  });

  it(" Should return 400 if password is missing a number", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "user@example.com",
      password: "NoNumbers@!",
    });

    expect(res.statusCode).toBe(400);
  });

  it(" Should return 400 if password is missing a special character", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "user@example.com",
      password: "NoSpecial1",
    });

    expect(res.statusCode).toBe(400);
  });

  it(" Should reject invalid email formats", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "invalid-email",
      password: "ValidPass123!",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid email format");
  });

  

  it(" Should login a user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "Test@1234",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");

    token = res.body.token; // Use global variable instead of process.env
  });
  it(" Should return 500 if email or password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Email and password are required");
  });

  it(" Should return 401 for incorrect password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: "WrongPass123",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials");
  });
  it(" Should return 400 if password is too short", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "user@example.com",
      password: "Short1!",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "error",
      "Password must be at least 8 characters long, with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
    );
  });

  it(" Should return 400 if password is missing uppercase letter", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "user@example.com",
      password: "lowercase1!",
    });

    expect(res.statusCode).toBe(400);
  });

  it(" Should return 400 if password is missing lowercase letter", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "user@example.com",
      password: "UPPERCASE1!",
    });

    expect(res.statusCode).toBe(400);
  });

  it(" Should return 400 if password is missing a number", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "user@example.com",
      password: "NoNumbers@!",
    });

    expect(res.statusCode).toBe(400);
  });

  it(" Should return 400 if password is missing a special character", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "user@example.com",
      password: "NoSpecial1",
    });

    expect(res.statusCode).toBe(400);
  });

  it(" Should return 401 for non-existing user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nonexist@example.com",
      password: "Test@1234",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials");
  });

  it(" Should return 500 on server error", async () => {
    jest.spyOn(User, "aggregate").mockRejectedValue(new Error("DB error"));

    const res = await request(app).post("/api/auth/login").send(testUser);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Internal Server Error");
  });

  it(" Should block unauthorized access", async () => {
    const res = await request(app).get("/api/portfolio");
    expect(res.statusCode).toBe(401);
  });

  it(" Should allow access to a protected route with valid token", async () => {
    const res = await request(app)
      .post("/api/portfolio/add")
      .send({
        scheme: "Sundaram Mutual Fund",
        scheme_code: "119552",
        units: 17,
        purchasePrice: 115,
      })
      .set("Authorization", `Bearer ${token}`); // Ensure token is correctly set

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message"); // Add better assertion
  });

  it(" Should update portfolio", async () => {
    const res = await request(app)
      .post("/api/portfolio/add")
      .send({
        scheme: "Sundaram Mutual Fund",
        scheme_code: "119552",
        units: 17,
        purchasePrice: 115,
      })
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
  it(" Should return 404 if portfolio not found", async () => {
    const res = await request(app)
      .get("/api/portfolio")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "Portfolio not found");
  });

  it(" Should return 401 if no token provided", async () => {
    const res = await request(app).get("/api/portfolio");

    expect(res.statusCode).toBe(401);
  });

  it(" Should return 500 on server error", async () => {
    jest.spyOn(Portfolio, "aggregate").mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/portfolio")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Error fetching portfolio");
  });
});
