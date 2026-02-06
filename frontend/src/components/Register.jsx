import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "camp",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage("Registration successful!");
        setForm({ name: "", email: "", password: "", role: "camp" });
      } else {
        const data = await res.json();
        setMessage(data.detail || "Something went wrong");
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto" }}>
      <h2>Register</h2>

      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <select name="role" value={form.role} onChange={handleChange}>
          <option value="camp">Camp</option>
          <option value="restaurant">Restaurant</option>
        </select>

        <button type="submit">Register</button>
      </form>

      <hr />

      <p>Already have an account?</p>
      <button onClick={() => navigate("/login")}>
        Go to Login
      </button>
    </div>
  );
}
