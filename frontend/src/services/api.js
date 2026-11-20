export async function chat(prompt) {
  const response = await fetch("/api/v1/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  return response.json();
}
