 // Se hai Node 18+ puoi usare fetch nativo

async function testLogin() {
  const res = await fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "123456" })
  });
  const data = await res.json();
  console.log(data);
}

testLogin();
