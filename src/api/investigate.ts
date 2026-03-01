export async function investigateTransaction(id: string) {

  const res = await fetch(`http://localhost:5000/api/investigate/${id}`, {
    method: "POST"
  });

  return res.json();
}