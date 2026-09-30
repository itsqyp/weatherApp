function Login() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8">
      <div className="login-enter w-full max-w-md rounded-2xl border border-foreground/15 bg-muted p-8 shadow-lg sm:p-10">
        <div className="mb-8 text-center">
          <h1 className="font-anton text-5xl tracking-wide">Login</h1>

          <p className="mt-2 text-sm text-foreground/70">Welcome back</p>
        </div>

        <form className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium"
            >
              Username
            </label>

            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 text-sm outline-none transition placeholder:text-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 text-sm outline-none transition placeholder:text-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="text-right">
            <a
              href="#"
              className="text-sm font-medium text-foreground underline-offset-4 transition hover:text-primary hover:underline"
            >
              Create an Account
            </a>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-foreground transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}

export default Login;
