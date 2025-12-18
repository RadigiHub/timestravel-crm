import { loginAction } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { message?: string };
}) {
  const message = searchParams?.message;

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div
        style={{
          width: 420,
          border: "1px solid #ddd",
          borderRadius: 14,
          padding: 22,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        <h2 style={{ margin: 0 }}>Times Travel CRM</h2>
        <p style={{ marginTop: 6, color: "#666" }}>Login to continue</p>

        {message ? (
          <div
            style={{
              marginTop: 10,
              marginBottom: 10,
              padding: 10,
              borderRadius: 10,
              border: "1px solid #f5c2c2",
              background: "#fff5f5",
              color: "#b10000",
              fontSize: 14,
            }}
          >
            {message}
          </div>
        ) : null}

        <form action={loginAction} style={{ marginTop: 12 }}>
          <div style={{ display: "grid", gap: 10 }}>
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              style={{
                height: 44,
                borderRadius: 10,
                border: "1px solid #ccc",
                padding: "0 12px",
                outline: "none",
              }}
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              style={{
                height: 44,
                borderRadius: 10,
                border: "1px solid #ccc",
                padding: "0 12px",
                outline: "none",
              }}
            />

            <button
              type="submit"
              style={{
                height: 46,
                borderRadius: 12,
                border: "1px solid #111",
                background: "#000",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
