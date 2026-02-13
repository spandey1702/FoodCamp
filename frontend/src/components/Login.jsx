import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
     const res=await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data=await res.json();
      if(!res.ok){
        alert(data.detail || "Login failed");
        return;
      }
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);
      if(data.role==="camp") navigate("/camp/dashboard");
      else if(data.role==="restaurant") navigate("/restaurant/dashboard");
      if (data.role === "restaurant") {
        localStorage.setItem("restaurant_id", data.restaurant_id);
      }
      else navigate("/");
    }
      catch(err){
        alert(err.message);
      }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto" }}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>

      <hr />

      <button onClick={() => navigate("/register")}>
        Back to Register
      </button>
    </div>
  );
}
